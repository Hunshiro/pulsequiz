import { useEffect, useRef, useState, useCallback } from 'react';
import { 
  QuizRoomState, 
  Participant, 
  ParticipantAnswer, 
  QuizQuestion, 
  QuestionStats,
  ClientMessage, 
  ServerMessage,
  QuizSettings
} from '../types/quiz';
import { sounds } from '../utils/soundEffects';

export interface FinalReportData {
  leaderboard: Participant[];
  summary: {
    totalQuestions: number;
    averageScore: number;
    highestScore: number;
    totalParticipants: number;
    questionStats: QuestionStats[];
  };
}

export function useQuizSocket() {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Room state
  const [roomState, setRoomState] = useState<QuizRoomState | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  
  // Host credentials
  const [hostToken, setHostToken] = useState<string | null>(() => {
    return sessionStorage.getItem('pulse_quiz_host_token');
  });

  // Participant info
  const [currentParticipant, setCurrentParticipant] = useState<Participant | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [userAnswerResult, setUserAnswerResult] = useState<ParticipantAnswer | null>(null);
  const [lastQuestionResult, setLastQuestionResult] = useState<{
    question: QuizQuestion;
    stats: QuestionStats;
    score: number;
    rank: number;
  } | null>(null);

  // Final summary report
  const [finalReport, setFinalReport] = useState<FinalReportData | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize and connect socket
  const connect = useCallback(() => {
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setConnectionError(null);

      // Start ping heartbeat
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'PING' }));
        }
      }, 25000);

      // Attempt host reconnect if token exists
      const savedCode = sessionStorage.getItem('pulse_quiz_room_code');
      const savedToken = sessionStorage.getItem('pulse_quiz_host_token');
      if (savedCode && savedToken) {
        ws.send(JSON.stringify({
          type: 'HOST_RECONNECT',
          payload: { roomCode: savedCode, hostToken: savedToken }
        }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg: ServerMessage = JSON.parse(event.data);

        switch (msg.type) {
          case 'ROOM_CREATED': {
            const { roomCode, hostToken: token, state, adminParticipant } = msg.payload;
            setHostToken(token);
            sessionStorage.setItem('pulse_quiz_host_token', token);
            sessionStorage.setItem('pulse_quiz_room_code', roomCode);
            if (adminParticipant) {
              setCurrentParticipant(adminParticipant);
              sessionStorage.setItem('pulse_quiz_participant_id', adminParticipant.id);
            }
            setRoomState(state);
            setConnectionError(null);
            break;
          }

          case 'JOIN_SUCCESS': {
            const { roomCode, participantId, state, participant } = msg.payload;
            sessionStorage.setItem('pulse_quiz_room_code', roomCode);
            sessionStorage.setItem('pulse_quiz_participant_id', participantId);
            setRoomState(state);
            setCurrentParticipant(participant);
            setConnectionError(null);
            break;
          }

          case 'JOIN_ERROR': {
            setConnectionError(msg.payload.message);
            break;
          }

          case 'STATE_UPDATE': {
            const newState = msg.payload;
            setRoomState(newState);

            // Reset selected option when a new question becomes active
            if (newState.phase === 'QUESTION_ACTIVE') {
              setSelectedOptionId(null);
              setUserAnswerResult(null);
              setLastQuestionResult(null);
            }
            break;
          }

          case 'TIME_TICK': {
            setRoomState((prev) => prev ? { ...prev, timeRemaining: msg.payload.timeRemaining } : null);
            if (msg.payload.timeRemaining <= 3 && msg.payload.timeRemaining > 0) {
              sounds.playCountdownTick();
            }
            break;
          }

          case 'AUTO_ADVANCE_TICK': {
            setRoomState((prev) => prev ? { ...prev, autoAdvanceSeconds: msg.payload.secondsRemaining } : null);
            break;
          }

          case 'ANSWER_ACCEPTED': {
            setSelectedOptionId(msg.payload.optionId);
            sounds.playSelect();
            break;
          }

          case 'QUESTION_RESULT': {
            const { question, userAnswer, stats, score, rank } = msg.payload;
            setUserAnswerResult(userAnswer);
            setLastQuestionResult({ question, stats, score, rank });
            setCurrentParticipant((prev) => prev ? { ...prev, score, rank } : null);

            if (userAnswer && userAnswer.isCorrect === true) {
              sounds.playCorrect();
            } else if (userAnswer && userAnswer.isCorrect === false) {
              sounds.playWrong();
            }
            break;
          }

          case 'PARTICIPANT_LIST_UPDATE': {
            setParticipants(msg.payload.participants);
            break;
          }

          case 'FINAL_REPORT': {
            setFinalReport(msg.payload);
            sounds.playFanfare();
            break;
          }

          case 'ERROR': {
            setConnectionError(msg.payload.message);
            break;
          }

          case 'PONG':
            break;

          default:
            break;
        }
      } catch (err) {
        console.error('Error handling WS message:', err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      // Auto-reconnect after 2 seconds
      setTimeout(() => {
        connect();
      }, 2000);
    };

    ws.onerror = (err) => {
      console.error('WebSocket connection error:', err);
      setIsConnected(false);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  // Actions
  const sendMessage = useCallback((msg: ClientMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    } else {
      console.warn('Socket not open, message queued or dropped:', msg.type);
    }
  }, []);

  const createRoom = useCallback((
    title: string, 
    questions: QuizQuestion[], 
    settings: QuizSettings,
    adminJoinAsPlayer: boolean = true,
    adminName: string = 'Admin (Host)',
    adminAvatar: string = '👑'
  ) => {
    sendMessage({
      type: 'HOST_CREATE_ROOM',
      payload: { title, questions, settings, adminJoinAsPlayer, adminName, adminAvatar }
    });
  }, [sendMessage]);

  const joinHostAsPlayer = useCallback((roomCode: string, name: string = 'Admin (Host)', avatar: string = '👑') => {
    sendMessage({
      type: 'HOST_JOIN_AS_PLAYER',
      payload: { roomCode, name, avatar }
    });
  }, [sendMessage]);

  const toggleAutoAdvance = useCallback((roomCode: string) => {
    sendMessage({
      type: 'HOST_TOGGLE_AUTO_ADVANCE',
      payload: { roomCode }
    });
  }, [sendMessage]);

  const startQuiz = useCallback((roomCode: string) => {
    sendMessage({
      type: 'HOST_START_QUIZ',
      payload: { roomCode }
    });
  }, [sendMessage]);

  const nextQuestion = useCallback((roomCode: string) => {
    sendMessage({
      type: 'HOST_NEXT_QUESTION',
      payload: { roomCode }
    });
  }, [sendMessage]);

  const revealAnswer = useCallback((roomCode: string) => {
    sendMessage({
      type: 'HOST_REVEAL_ANSWER',
      payload: { roomCode }
    });
  }, [sendMessage]);

  const showLeaderboard = useCallback((roomCode: string) => {
    sendMessage({
      type: 'HOST_SHOW_LEADERBOARD',
      payload: { roomCode }
    });
  }, [sendMessage]);

  const endQuiz = useCallback((roomCode: string) => {
    sendMessage({
      type: 'HOST_END_QUIZ',
      payload: { roomCode }
    });
  }, [sendMessage]);

  const joinRoom = useCallback((roomCode: string, name: string, avatar: string) => {
    const participantId = sessionStorage.getItem('pulse_quiz_participant_id') || undefined;
    sendMessage({
      type: 'PARTICIPANT_JOIN',
      payload: { roomCode: roomCode.toUpperCase().trim(), name, avatar, participantId }
    });
  }, [sendMessage]);

  const submitAnswer = useCallback((roomCode: string, participantId: string, questionId: string, optionId: string, timeTakenMs: number) => {
    sendMessage({
      type: 'PARTICIPANT_SUBMIT_ANSWER',
      payload: { roomCode, participantId, questionId, optionId, timeTakenMs }
    });
  }, [sendMessage]);

  const resetSession = useCallback(() => {
    sessionStorage.removeItem('pulse_quiz_room_code');
    sessionStorage.removeItem('pulse_quiz_host_token');
    sessionStorage.removeItem('pulse_quiz_participant_id');
    setRoomState(null);
    setCurrentParticipant(null);
    setHostToken(null);
    setFinalReport(null);
    setSelectedOptionId(null);
    setUserAnswerResult(null);
    setLastQuestionResult(null);
  }, []);

  return {
    isConnected,
    connectionError,
    roomState,
    participants,
    hostToken,
    currentParticipant,
    selectedOptionId,
    userAnswerResult,
    lastQuestionResult,
    finalReport,
    createRoom,
    joinHostAsPlayer,
    toggleAutoAdvance,
    startQuiz,
    nextQuestion,
    revealAnswer,
    showLeaderboard,
    endQuiz,
    joinRoom,
    submitAnswer,
    resetSession,
    clearError: () => setConnectionError(null)
  };
}
