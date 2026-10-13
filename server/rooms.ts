import { WebSocket } from 'ws';
import { 
  QuizQuestion, 
  QuizSettings, 
  Participant, 
  ParticipantAnswer, 
  QuizRoomState, 
  QuestionStats,
  ClientMessage, 
  ServerMessage 
} from '../src/types/quiz.js';

export interface RoomInstance {
  code: string;
  hostToken: string;
  hostWs: WebSocket | null;
  title: string;
  questions: QuizQuestion[];
  settings: QuizSettings;
  phase: QuizRoomState['phase'];
  currentQuestionIndex: number;
  timeRemaining: number;
  questionStartTime: number;
  timerInterval: NodeJS.Timeout | null;
  countdownTimer: NodeJS.Timeout | null;
  autoAdvanceTimer: NodeJS.Timeout | null;
  autoAdvanceSeconds: number;
  autoAdvancePaused: boolean;
  adminParticipantId: string | null;
  participants: Map<string, Participant & { ws?: WebSocket | null }>;
  createdAt: number;
}

export class QuizRoomManager {
  private rooms: Map<string, RoomInstance> = new Map();

  constructor() {
    // Periodically clean up old inactive rooms (older than 4 hours)
    setInterval(() => {
      const now = Date.now();
      for (const [code, room] of this.rooms.entries()) {
        if (now - room.createdAt > 4 * 60 * 60 * 1000) {
          if (room.timerInterval) clearInterval(room.timerInterval);
          if (room.countdownTimer) clearInterval(room.countdownTimer);
          if (room.autoAdvanceTimer) clearInterval(room.autoAdvanceTimer);
          this.rooms.delete(code);
        }
      }
    }, 15 * 60 * 1000);
  }

  public generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }

  public createRoom(
    hostWs: WebSocket, 
    title: string, 
    questions: QuizQuestion[], 
    settings: QuizSettings,
    adminJoinAsPlayer: boolean = true,
    adminName: string = 'Admin (Host)',
    adminAvatar: string = '👑'
  ): { roomCode: string; hostToken: string; state: QuizRoomState; adminParticipant?: Participant } {
    const code = this.generateRoomCode();
    const hostToken = 'host_' + Math.random().toString(36).substring(2) + Date.now();

    const room: RoomInstance = {
      code,
      hostToken,
      hostWs,
      title: title || 'Live Quiz Challenge',
      questions,
      settings: {
        correctMarks: Number(settings.correctMarks) || 4,
        negativeMarks: Math.abs(Number(settings.negativeMarks) || 1),
        timePerQuestion: Number(settings.timePerQuestion) || 20,
        leaderboardFrequency: Number(settings.leaderboardFrequency) || 10
      },
      phase: 'LOBBY',
      currentQuestionIndex: 0,
      timeRemaining: settings.timePerQuestion || 20,
      questionStartTime: 0,
      timerInterval: null,
      countdownTimer: null,
      autoAdvanceTimer: null,
      autoAdvanceSeconds: 0,
      autoAdvancePaused: false,
      adminParticipantId: null,
      participants: new Map(),
      createdAt: Date.now()
    };

    let adminParticipant: Participant | undefined;

    // Automatically join the admin in this room as requested
    if (adminJoinAsPlayer) {
      const pId = 'p_admin_' + Math.random().toString(36).substring(2, 9);
      room.adminParticipantId = pId;
      const pObj: Participant & { ws?: WebSocket | null } = {
        id: pId,
        name: adminName.trim() || 'Admin (Host)',
        avatar: adminAvatar || '👑',
        score: 0,
        connected: true,
        joinedAt: Date.now(),
        answers: {},
        ws: hostWs
      };
      room.participants.set(pId, pObj);
      adminParticipant = this.sanitizeParticipant(pObj);
    }

    this.rooms.set(code, room);

    return {
      roomCode: code,
      hostToken,
      state: this.getPublicRoomState(room),
      adminParticipant
    };
  }

  public joinHostAsPlayer(
    roomCode: string,
    name: string = 'Admin (Host)',
    avatar: string = '👑'
  ): Participant | null {
    const room = this.getRoom(roomCode);
    if (!room) return null;

    if (room.adminParticipantId && room.participants.has(room.adminParticipantId)) {
      const existing = room.participants.get(room.adminParticipantId)!;
      existing.connected = true;
      existing.name = name.trim() || existing.name;
      existing.avatar = avatar || existing.avatar;
      this.broadcastToRoom(room, {
        type: 'STATE_UPDATE',
        payload: this.getPublicRoomState(room)
      });
      this.broadcastParticipantList(room);
      return this.sanitizeParticipant(existing);
    }

    const pId = 'p_admin_' + Math.random().toString(36).substring(2, 9);
    room.adminParticipantId = pId;
    const pObj: Participant & { ws?: WebSocket | null } = {
      id: pId,
      name: name.trim() || 'Admin (Host)',
      avatar: avatar || '👑',
      score: 0,
      connected: true,
      joinedAt: Date.now(),
      answers: {},
      ws: room.hostWs
    };
    room.participants.set(pId, pObj);

    this.broadcastToRoom(room, {
      type: 'STATE_UPDATE',
      payload: this.getPublicRoomState(room)
    });
    this.broadcastParticipantList(room);
    return this.sanitizeParticipant(pObj);
  }

  public getRoom(code: string): RoomInstance | undefined {
    return this.rooms.get(code.toUpperCase().trim());
  }

  public joinRoom(
    ws: WebSocket, 
    roomCode: string, 
    name: string, 
    avatar: string, 
    existingParticipantId?: string
  ): { participantId: string; state: QuizRoomState; participant: Participant } | { error: string } {
    const room = this.getRoom(roomCode);
    if (!room) {
      return { error: 'Room not found. Please verify the 6-character room code.' };
    }

    let participantId = existingParticipantId;
    let participant: (Participant & { ws?: WebSocket | null }) | undefined;

    if (participantId && room.participants.has(participantId)) {
      // Reconnection
      participant = room.participants.get(participantId)!;
      participant.connected = true;
      participant.ws = ws;
      if (name) participant.name = name.trim();
      if (avatar) participant.avatar = avatar;
    } else {
      // New Participant
      participantId = 'p_' + Math.random().toString(36).substring(2, 9);
      participant = {
        id: participantId,
        name: name.trim() || 'Player ' + (room.participants.size + 1),
        avatar: avatar || '⚡',
        score: 0,
        connected: true,
        joinedAt: Date.now(),
        answers: {},
        ws
      };
      room.participants.set(participantId, participant);
    }

    // Broadcast updated state to room
    this.broadcastToRoom(room, {
      type: 'STATE_UPDATE',
      payload: this.getPublicRoomState(room)
    });
    this.broadcastParticipantList(room);

    return {
      participantId: participant.id,
      state: this.getPublicRoomState(room),
      participant: this.sanitizeParticipant(participant)
    };
  }

  public submitAnswer(
    roomCode: string, 
    participantId: string, 
    questionId: string, 
    optionId: string, 
    timeTakenMs: number
  ): boolean {
    const room = this.getRoom(roomCode);
    if (!room || room.phase !== 'QUESTION_ACTIVE') return false;

    const currentQ = room.questions[room.currentQuestionIndex];
    if (!currentQ || currentQ.id !== questionId) return false;

    const participant = room.participants.get(participantId);
    if (!participant) return false;

    // Check if already answered this question
    if (participant.currentAnswer !== undefined && participant.currentAnswer !== null) {
      return false; // single submission per question
    }

    participant.currentAnswer = optionId;
    participant.currentAnswerTimeMs = timeTakenMs;

    // Acknowledge submission to the participant
    const targetWs = participant.ws || (participantId === room.adminParticipantId ? room.hostWs : null);
    if (targetWs && targetWs.readyState === WebSocket.OPEN) {
      targetWs.send(JSON.stringify({
        type: 'ANSWER_ACCEPTED',
        payload: { questionId, optionId }
      }));
    }

    // Broadcast live answer count update
    this.broadcastToRoom(room, {
      type: 'STATE_UPDATE',
      payload: this.getPublicRoomState(room)
    });

    // Check if all connected participants have answered
    const activeParticipants = Array.from(room.participants.values()).filter(p => p.connected);
    const answeredCount = activeParticipants.filter(p => p.currentAnswer !== null && p.currentAnswer !== undefined).length;

    if (activeParticipants.length > 0 && answeredCount >= activeParticipants.length) {
      // Auto-reveal after short pause if everyone answered
      setTimeout(() => {
        if (room.phase === 'QUESTION_ACTIVE') {
          this.revealQuestion(room);
        }
      }, 500);
    }

    return true;
  }

  public startQuiz(room: RoomInstance): void {
    if (room.phase !== 'LOBBY') return;
    if (room.questions.length === 0) return;

    this.clearAllTimers(room);
    room.phase = 'COUNTDOWN';
    let countdown = 3;

    this.broadcastToRoom(room, {
      type: 'STATE_UPDATE',
      payload: {
        ...this.getPublicRoomState(room),
        countdownSeconds: countdown
      }
    });

    room.countdownTimer = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        this.broadcastToRoom(room, {
          type: 'STATE_UPDATE',
          payload: {
            ...this.getPublicRoomState(room),
            countdownSeconds: countdown
          }
        });
      } else {
        if (room.countdownTimer) clearInterval(room.countdownTimer);
        room.countdownTimer = null;
        this.activateQuestion(room, 0);
      }
    }, 1000);
  }

  public activateQuestion(room: RoomInstance, index: number): void {
    if (index >= room.questions.length) {
      this.finishQuiz(room);
      return;
    }

    this.clearAllTimers(room);

    room.currentQuestionIndex = index;
    room.phase = 'QUESTION_ACTIVE';
    room.timeRemaining = room.settings.timePerQuestion;
    room.questionStartTime = Date.now();

    // Reset current answers for all participants
    for (const p of room.participants.values()) {
      p.currentAnswer = null;
      p.currentAnswerTimeMs = 0;
    }

    // Broadcast active question
    this.broadcastToRoom(room, {
      type: 'STATE_UPDATE',
      payload: this.getPublicRoomState(room)
    });

    // Start server countdown timer for specified timer
    room.timerInterval = setInterval(() => {
      room.timeRemaining--;

      this.broadcastToRoom(room, {
        type: 'TIME_TICK',
        payload: { timeRemaining: Math.max(0, room.timeRemaining) }
      });

      if (room.timeRemaining <= 0) {
        if (room.timerInterval) clearInterval(room.timerInterval);
        room.timerInterval = null;
        // When specified timer expires, automatically reveal question!
        this.revealQuestion(room);
      }
    }, 1000);
  }

  public revealQuestion(room: RoomInstance): void {
    this.clearAllTimers(room);

    room.phase = 'QUESTION_REVEAL';

    const currentQ = room.questions[room.currentQuestionIndex];
    if (!currentQ) return;

    const correctOption = currentQ.options.find(o => o.isCorrect) || currentQ.options[0];
    const correctOptionId = correctOption.id;
    const correctOptionText = correctOption.text;

    const optionCounts: Record<string, number> = {};
    currentQ.options.forEach(o => { optionCounts[o.id] = 0; });

    let totalAnswered = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;
    let totalTimeTaken = 0;

    // Process scoring for all participants
    for (const participant of room.participants.values()) {
      const chosenOptId = participant.currentAnswer;
      const timeTaken = participant.currentAnswerTimeMs || room.settings.timePerQuestion * 1000;

      let scoreChange = 0;
      let isCorrect: boolean | null = null;
      let selectedOptionText: string | null = null;

      if (chosenOptId) {
        totalAnswered++;
        totalTimeTaken += timeTaken;
        optionCounts[chosenOptId] = (optionCounts[chosenOptId] || 0) + 1;
        const opt = currentQ.options.find(o => o.id === chosenOptId);
        selectedOptionText = opt ? opt.text : null;

        if (chosenOptId === correctOptionId) {
          scoreChange = room.settings.correctMarks;
          isCorrect = true;
          correctCount++;
        } else {
          scoreChange = -room.settings.negativeMarks;
          isCorrect = false;
          wrongCount++;
        }
      } else {
        // Skipped / timed out: 0 points
        skippedCount++;
        isCorrect = null;
        scoreChange = 0;
      }

      participant.score = Math.round((participant.score + scoreChange) * 100) / 100;

      const record: ParticipantAnswer = {
        questionId: currentQ.id,
        questionNumber: currentQ.questionNumber,
        selectedOptionId: chosenOptId || null,
        selectedOptionText,
        isCorrect,
        timeTakenMs: timeTaken,
        scoreChange: Math.round(scoreChange * 100) / 100
      };

      participant.answers[currentQ.id] = record;
    }

    // Sort participants to calculate real-time ranks
    const sorted = Array.from(room.participants.values()).sort((a, b) => b.score - a.score);
    sorted.forEach((p, rankIdx) => {
      p.rank = rankIdx + 1;
    });

    const stats: QuestionStats = {
      questionId: currentQ.id,
      questionNumber: currentQ.questionNumber,
      totalAnswered,
      correctCount,
      wrongCount,
      skippedCount,
      optionCounts,
      averageTimeMs: totalAnswered > 0 ? Math.round(totalTimeTaken / totalAnswered) : 0,
      correctOptionId,
      correctOptionText
    };

    // Send personalized results to each participant
    for (const participant of room.participants.values()) {
      const targetWs = participant.ws || (participant.id === room.adminParticipantId ? room.hostWs : null);
      if (targetWs && targetWs.readyState === WebSocket.OPEN) {
        const userAnswer = participant.answers[currentQ.id] || null;
        targetWs.send(JSON.stringify({
          type: 'QUESTION_RESULT',
          payload: {
            question: currentQ,
            userAnswer,
            stats,
            score: participant.score,
            rank: participant.rank || 1
          }
        }));
      }
    }

    // Broadcast room state to host & everyone
    const state = this.getPublicRoomState(room);
    state.revealedQuestion = currentQ;
    state.questionStats = stats;

    this.broadcastToRoom(room, {
      type: 'STATE_UPDATE',
      payload: state
    });

    this.broadcastParticipantList(room);

    // AUTOMATIC ADVANCE:
    // Give 4 seconds to view the revealed answer and points, then automatically advance!
    this.startAutoAdvance(room, 4, () => {
      this.nextAction(room);
    });
  }

  public nextAction(room: RoomInstance): void {
    this.clearAutoAdvance(room);

    const nextIndex = room.currentQuestionIndex + 1;
    const isFinished = nextIndex >= room.questions.length;

    if (isFinished) {
      this.finishQuiz(room);
      return;
    }

    // Requirement: "make the leaderboard come after 10 questions and let the question come automatically after specified timer"
    const justFinishedQNumber = room.currentQuestionIndex + 1;
    const isIntervalMilestone = 
      justFinishedQNumber % room.settings.leaderboardFrequency === 0 &&
      room.phase === 'QUESTION_REVEAL';

    if (isIntervalMilestone) {
      this.showIntervalLeaderboard(room);
    } else {
      this.activateQuestion(room, nextIndex);
    }
  }

  public showIntervalLeaderboard(room: RoomInstance): void {
    this.clearAllTimers(room);
    room.phase = 'INTERVAL_LEADERBOARD';

    const state = this.getPublicRoomState(room);
    this.broadcastToRoom(room, {
      type: 'STATE_UPDATE',
      payload: state
    });

    // AUTOMATIC ADVANCE FOR LEADERBOARD:
    // Show leaderboard for 7 seconds, then automatically continue to next question!
    this.startAutoAdvance(room, 7, () => {
      const nextIndex = room.currentQuestionIndex + 1;
      this.activateQuestion(room, nextIndex);
    });
  }

  public toggleAutoAdvance(room: RoomInstance): void {
    room.autoAdvancePaused = !room.autoAdvancePaused;
    this.broadcastToRoom(room, {
      type: 'STATE_UPDATE',
      payload: this.getPublicRoomState(room)
    });
  }

  private startAutoAdvance(room: RoomInstance, seconds: number, onComplete: () => void): void {
    this.clearAutoAdvance(room);
    room.autoAdvanceSeconds = seconds;
    room.autoAdvancePaused = false;

    this.broadcastToRoom(room, {
      type: 'AUTO_ADVANCE_TICK',
      payload: { secondsRemaining: room.autoAdvanceSeconds }
    });

    room.autoAdvanceTimer = setInterval(() => {
      if (room.autoAdvancePaused) return;

      room.autoAdvanceSeconds--;
      this.broadcastToRoom(room, {
        type: 'AUTO_ADVANCE_TICK',
        payload: { secondsRemaining: Math.max(0, room.autoAdvanceSeconds) }
      });

      if (room.autoAdvanceSeconds <= 0) {
        this.clearAutoAdvance(room);
        onComplete();
      }
    }, 1000);
  }

  private clearAutoAdvance(room: RoomInstance): void {
    if (room.autoAdvanceTimer) {
      clearInterval(room.autoAdvanceTimer);
      room.autoAdvanceTimer = null;
    }
    room.autoAdvanceSeconds = 0;
  }

  private clearAllTimers(room: RoomInstance): void {
    if (room.timerInterval) {
      clearInterval(room.timerInterval);
      room.timerInterval = null;
    }
    if (room.countdownTimer) {
      clearInterval(room.countdownTimer);
      room.countdownTimer = null;
    }
    this.clearAutoAdvance(room);
  }

  public finishQuiz(room: RoomInstance): void {
    this.clearAllTimers(room);
    room.phase = 'FINISHED';

    const sortedParticipants = Array.from(room.participants.values())
      .sort((a, b) => b.score - a.score)
      .map((p, idx) => {
        p.rank = idx + 1;
        return this.sanitizeParticipant(p);
      });

    const totalQuestions = room.questions.length;
    const totalParticipants = room.participants.size;
    const totalScores = Array.from(room.participants.values()).reduce((sum, p) => sum + p.score, 0);
    const averageScore = totalParticipants > 0 ? Math.round((totalScores / totalParticipants) * 10) / 10 : 0;
    const highestScore = sortedParticipants.length > 0 ? sortedParticipants[0].score : 0;

    // Calculate aggregated question stats
    const questionStatsList: QuestionStats[] = room.questions.map(q => {
      let correct = 0;
      let wrong = 0;
      let skipped = 0;
      let timeSum = 0;
      let answered = 0;
      const optCounts: Record<string, number> = {};
      q.options.forEach(o => { optCounts[o.id] = 0; });
      const correctOpt = q.options.find(o => o.isCorrect) || q.options[0];

      for (const p of room.participants.values()) {
        const a = p.answers[q.id];
        if (a && a.selectedOptionId) {
          answered++;
          timeSum += a.timeTakenMs || 0;
          optCounts[a.selectedOptionId] = (optCounts[a.selectedOptionId] || 0) + 1;
          if (a.isCorrect) correct++;
          else wrong++;
        } else {
          skipped++;
        }
      }

      return {
        questionId: q.id,
        questionNumber: q.questionNumber,
        totalAnswered: answered,
        correctCount: correct,
        wrongCount: wrong,
        skippedCount: skipped,
        optionCounts: optCounts,
        averageTimeMs: answered > 0 ? Math.round(timeSum / answered) : 0,
        correctOptionId: correctOpt.id,
        correctOptionText: correctOpt.text
      };
    });

    const reportPayload = {
      leaderboard: sortedParticipants,
      summary: {
        totalQuestions,
        averageScore,
        highestScore,
        totalParticipants,
        questionStats: questionStatsList
      }
    };

    this.broadcastToRoom(room, {
      type: 'STATE_UPDATE',
      payload: this.getPublicRoomState(room)
    });

    this.broadcastToRoom(room, {
      type: 'FINAL_REPORT',
      payload: reportPayload
    });
  }

  public handleDisconnect(ws: WebSocket): void {
    for (const room of this.rooms.values()) {
      if (room.hostWs === ws) {
        room.hostWs = null;
      }
      for (const p of room.participants.values()) {
        if (p.ws === ws) {
          p.connected = false;
          p.ws = null;
          this.broadcastParticipantList(room);
          break;
        }
      }
    }
  }

  public broadcastToRoom(room: RoomInstance, msg: ServerMessage): void {
    const raw = JSON.stringify(msg);
    if (room.hostWs && room.hostWs.readyState === WebSocket.OPEN) {
      room.hostWs.send(raw);
    }
    for (const p of room.participants.values()) {
      if (p.ws && p.ws !== room.hostWs && p.ws.readyState === WebSocket.OPEN) {
        p.ws.send(raw);
      }
    }
  }

  private broadcastParticipantList(room: RoomInstance): void {
    const list = Array.from(room.participants.values()).map(p => this.sanitizeParticipant(p));
    const msg = JSON.stringify({
      type: 'PARTICIPANT_LIST_UPDATE',
      payload: { participants: list }
    });

    if (room.hostWs && room.hostWs.readyState === WebSocket.OPEN) {
      room.hostWs.send(msg);
    }
    for (const p of room.participants.values()) {
      if (p.ws && p.ws !== room.hostWs && p.ws.readyState === WebSocket.OPEN) {
        p.ws.send(msg);
      }
    }
  }

  public getPublicRoomState(room: RoomInstance): QuizRoomState {
    const currentQ = room.questions[room.currentQuestionIndex];
    const activeParticipants = Array.from(room.participants.values()).filter(p => p.connected);
    const answeredCount = activeParticipants.filter(p => p.currentAnswer !== null && p.currentAnswer !== undefined).length;

    // Leaderboard sorted
    const sortedParticipants = Array.from(room.participants.values())
      .sort((a, b) => b.score - a.score)
      .map((p, idx) => {
        const answersList = Object.values(p.answers);
        const correctCount = answersList.filter(a => a.isCorrect === true).length;
        const wrongCount = answersList.filter(a => a.isCorrect === false).length;
        const total = correctCount + wrongCount;
        const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
        return {
          participantId: p.id,
          name: p.name,
          avatar: p.avatar,
          score: p.score,
          rank: idx + 1,
          correctCount,
          wrongCount,
          accuracy
        };
      });

    return {
      roomCode: room.code,
      title: room.title,
      phase: room.phase,
      settings: room.settings,
      currentQuestionIndex: room.currentQuestionIndex,
      totalQuestions: room.questions.length,
      timeRemaining: Math.max(0, room.timeRemaining),
      autoAdvanceSeconds: room.autoAdvanceSeconds,
      autoAdvancePaused: room.autoAdvancePaused,
      totalParticipants: room.participants.size,
      answeredCount,
      currentQuestion: (currentQ && (room.phase === 'QUESTION_ACTIVE' || room.phase === 'QUESTION_REVEAL')) ? {
        id: currentQ.id,
        questionNumber: currentQ.questionNumber,
        text: currentQ.text,
        options: currentQ.options.map(o => ({ id: o.id, text: o.text }))
      } : null,
      leaderboard: sortedParticipants
    };
  }

  private sanitizeParticipant(p: Participant & { ws?: WebSocket | null }): Participant {
    const answersList = Object.values(p.answers);
    const correctCount = answersList.filter(a => a.isCorrect === true).length;
    const wrongCount = answersList.filter(a => a.isCorrect === false).length;
    return {
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      score: p.score,
      rank: p.rank,
      connected: p.connected,
      joinedAt: p.joinedAt,
      answers: p.answers,
      currentAnswer: p.currentAnswer,
      currentAnswerTimeMs: p.currentAnswerTimeMs
    };
  }
}

export const roomManager = new QuizRoomManager();
