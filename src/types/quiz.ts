export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string;
  questionNumber: number;
  text: string;
  options: QuizOption[];
  explanation?: string;
}

export interface QuizSettings {
  correctMarks: number;       // e.g. +4
  negativeMarks: number;      // e.g. 1 (deducted, so -1)
  timePerQuestion: number;    // seconds, e.g. 20
  leaderboardFrequency: number; // e.g. 10 (every 10 questions)
}

export interface ParticipantAnswer {
  questionId: string;
  questionNumber: number;
  selectedOptionId: string | null;
  selectedOptionText: string | null;
  isCorrect: boolean | null; // null if unattempted
  timeTakenMs: number;
  scoreChange: number;
}

export interface Participant {
  id: string;
  name: string;
  avatar: string;
  score: number;
  rank?: number;
  connected: boolean;
  joinedAt: number;
  answers: Record<string, ParticipantAnswer>; // keyed by questionId
  currentAnswer?: string | null; // selectedOptionId for current question
  currentAnswerTimeMs?: number;
}

export type RoomPhase = 
  | 'LOBBY' 
  | 'COUNTDOWN' 
  | 'QUESTION_ACTIVE' 
  | 'QUESTION_REVEAL' 
  | 'INTERVAL_LEADERBOARD' 
  | 'FINISHED';

export interface QuestionStats {
  questionId: string;
  questionNumber: number;
  totalAnswered: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  optionCounts: Record<string, number>;
  averageTimeMs: number;
  correctOptionId: string;
  correctOptionText: string;
}

export interface QuizRoomState {
  roomCode: string;
  title: string;
  phase: RoomPhase;
  settings: QuizSettings;
  currentQuestionIndex: number;
  totalQuestions: number;
  timeRemaining: number;
  countdownSeconds?: number;
  autoAdvanceSeconds?: number;
  autoAdvancePaused?: boolean;
  totalParticipants: number;
  answeredCount: number;
  currentQuestion?: {
    id: string;
    questionNumber: number;
    text: string;
    options: { id: string; text: string }[];
  } | null;
  revealedQuestion?: QuizQuestion | null;
  questionStats?: QuestionStats | null;
  leaderboard?: {
    participantId: string;
    name: string;
    avatar: string;
    score: number;
    rank: number;
    correctCount: number;
    wrongCount: number;
    accuracy: number;
  }[];
}

// Client to Server Messages
export type ClientMessage =
  | { type: 'HOST_CREATE_ROOM'; payload: { title: string; questions: QuizQuestion[]; settings: QuizSettings; adminJoinAsPlayer?: boolean; adminName?: string; adminAvatar?: string } }
  | { type: 'HOST_JOIN_AS_PLAYER'; payload: { roomCode: string; name: string; avatar: string } }
  | { type: 'HOST_START_QUIZ'; payload: { roomCode: string } }
  | { type: 'HOST_NEXT_QUESTION'; payload: { roomCode: string } }
  | { type: 'HOST_REVEAL_ANSWER'; payload: { roomCode: string } }
  | { type: 'HOST_SHOW_LEADERBOARD'; payload: { roomCode: string } }
  | { type: 'HOST_TOGGLE_AUTO_ADVANCE'; payload: { roomCode: string } }
  | { type: 'HOST_END_QUIZ'; payload: { roomCode: string } }
  | { type: 'HOST_RECONNECT'; payload: { roomCode: string; hostToken: string } }
  | { type: 'PARTICIPANT_JOIN'; payload: { roomCode: string; name: string; avatar: string; participantId?: string } }
  | { type: 'PARTICIPANT_SUBMIT_ANSWER'; payload: { roomCode: string; participantId: string; questionId: string; optionId: string; timeTakenMs: number } }
  | { type: 'PING' };

// Server to Client Messages
export type ServerMessage =
  | { type: 'ROOM_CREATED'; payload: { roomCode: string; hostToken: string; state: QuizRoomState; adminParticipant?: Participant } }
  | { type: 'JOIN_SUCCESS'; payload: { roomCode: string; participantId: string; state: QuizRoomState; participant: Participant } }
  | { type: 'JOIN_ERROR'; payload: { message: string } }
  | { type: 'STATE_UPDATE'; payload: QuizRoomState }
  | { type: 'TIME_TICK'; payload: { timeRemaining: number } }
  | { type: 'AUTO_ADVANCE_TICK'; payload: { secondsRemaining: number } }
  | { type: 'ANSWER_ACCEPTED'; payload: { questionId: string; optionId: string } }
  | { type: 'QUESTION_RESULT'; payload: { 
      question: QuizQuestion; 
      userAnswer: ParticipantAnswer | null; 
      stats: QuestionStats; 
      score: number;
      rank: number;
    } }
  | { type: 'PARTICIPANT_LIST_UPDATE'; payload: { participants: Participant[] } }
  | { type: 'FINAL_REPORT'; payload: { 
      leaderboard: Participant[]; 
      summary: {
        totalQuestions: number;
        averageScore: number;
        highestScore: number;
        totalParticipants: number;
        questionStats: QuestionStats[];
      }
    } }
  | { type: 'ERROR'; payload: { message: string } }
  | { type: 'PONG' };
