import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { FormatGuideModal } from './components/FormatGuideModal';
import { QuizCreator } from './components/Admin/QuizCreator';
import { AdminLobby } from './components/Admin/AdminLobby';
import { AdminActiveQuestion } from './components/Admin/AdminActiveQuestion';
import { AdminQuestionReveal } from './components/Admin/AdminQuestionReveal';
import { AdminIntervalLeaderboard } from './components/Admin/AdminIntervalLeaderboard';
import { AdminFinalReport } from './components/Admin/AdminFinalReport';
import { JoinRoomView } from './components/Participant/JoinRoomView';
import { ParticipantLobby } from './components/Participant/ParticipantLobby';
import { ParticipantActiveQuestion } from './components/Participant/ParticipantActiveQuestion';
import { ParticipantQuestionReveal } from './components/Participant/ParticipantQuestionReveal';
import { ParticipantIntervalLeaderboard } from './components/Participant/ParticipantIntervalLeaderboard';
import { ParticipantFinalReport } from './components/Participant/ParticipantFinalReport';
import { useQuizSocket } from './hooks/useQuizSocket';
import { sounds } from './utils/soundEffects';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'host' | 'player' | 'split'>('host');
  const [isFormatGuideOpen, setIsFormatGuideOpen] = useState(false);
  const [urlRoomCode, setUrlRoomCode] = useState<string>('');

  const {
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
    clearError
  } = useQuizSocket();

  // Read URL params (e.g. ?room=XYZ123)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setUrlRoomCode(roomParam.toUpperCase());
      setCurrentTab('player');
    }
  }, []);

  // Countdown sound cue
  useEffect(() => {
    if (roomState?.phase === 'COUNTDOWN') {
      sounds.playCountdownTick();
    }
  }, [roomState?.countdownSeconds, roomState?.phase]);

  // Host View Rendering
  const renderHostContent = () => {
    if (!roomState || !hostToken) {
      return (
        <QuizCreator
          onCreateRoom={(title, questions, settings, adminJoinAsPlayer, adminName, adminAvatar) => {
            createRoom(title, questions, settings, adminJoinAsPlayer, adminName, adminAvatar);
          }}
          isConnecting={!isConnected}
        />
      );
    }

    switch (roomState.phase) {
      case 'LOBBY':
        return (
          <AdminLobby
            roomState={roomState}
            participants={participants}
            currentParticipant={currentParticipant}
            onStartQuiz={() => startQuiz(roomState.roomCode)}
            onJoinAsPlayer={(name, avatar) => joinHostAsPlayer(roomState.roomCode, name, avatar)}
          />
        );

      case 'COUNTDOWN':
        return (
          <div className="mx-auto max-w-lg py-24 text-center space-y-6 animate-in zoom-in-95">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-xs uppercase tracking-wider">
              Get Ready
            </div>
            <h2 className="text-3xl font-extrabold text-white">Quiz Starting In...</h2>
            <div className="font-mono text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-400 to-indigo-400 animate-pulse">
              {roomState.countdownSeconds ?? 3}
            </div>
          </div>
        );

      case 'QUESTION_ACTIVE':
        return (
          <AdminActiveQuestion
            roomState={roomState}
            currentParticipant={currentParticipant}
            selectedOptionId={selectedOptionId}
            onSubmitAnswer={(qId, optId, timeMs) => {
              if (currentParticipant) {
                submitAnswer(roomState.roomCode, currentParticipant.id, qId, optId, timeMs);
              }
            }}
            onRevealAnswer={() => revealAnswer(roomState.roomCode)}
            onSkipQuestion={() => nextQuestion(roomState.roomCode)}
          />
        );

      case 'QUESTION_REVEAL':
        return (
          <AdminQuestionReveal
            roomState={roomState}
            onNextQuestion={() => nextQuestion(roomState.roomCode)}
            onShowLeaderboard={() => showLeaderboard(roomState.roomCode)}
            onToggleAutoAdvance={() => toggleAutoAdvance(roomState.roomCode)}
          />
        );

      case 'INTERVAL_LEADERBOARD':
        return (
          <AdminIntervalLeaderboard
            roomState={roomState}
            onContinue={() => nextQuestion(roomState.roomCode)}
            onToggleAutoAdvance={() => toggleAutoAdvance(roomState.roomCode)}
          />
        );

      case 'FINISHED':
        if (finalReport) {
          return (
            <AdminFinalReport
              finalReport={finalReport}
              onReset={() => resetSession()}
            />
          );
        }
        return <div className="text-center py-12 text-slate-400">Loading final summary...</div>;

      default:
        return null;
    }
  };

  // Player View Rendering
  const renderPlayerContent = () => {
    if (!currentParticipant || !roomState) {
      return (
        <JoinRoomView
          defaultRoomCode={urlRoomCode || roomState?.roomCode || ''}
          error={connectionError}
          onClearError={clearError}
          onJoin={(code, name, avatar) => {
            joinRoom(code, name, avatar);
          }}
        />
      );
    }

    switch (roomState.phase) {
      case 'LOBBY':
        return (
          <ParticipantLobby
            roomState={roomState}
            currentParticipant={currentParticipant}
            participants={participants}
          />
        );

      case 'COUNTDOWN':
        return (
          <div className="mx-auto max-w-lg py-24 text-center space-y-6 animate-in zoom-in-95">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-xs uppercase tracking-wider">
              Round 1 Imminent
            </div>
            <h2 className="text-3xl font-extrabold text-white">Starting In...</h2>
            <div className="font-mono text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-400 to-indigo-400 animate-pulse">
              {roomState.countdownSeconds ?? 3}
            </div>
            <p className="text-xs text-slate-400">Lock in your answers quickly for maximum score!</p>
          </div>
        );

      case 'QUESTION_ACTIVE':
        return (
          <ParticipantActiveQuestion
            roomState={roomState}
            currentParticipant={currentParticipant}
            selectedOptionId={selectedOptionId}
            onSubmitAnswer={(qId, optId, timeMs) => {
              submitAnswer(roomState.roomCode, currentParticipant.id, qId, optId, timeMs);
            }}
          />
        );

      case 'QUESTION_REVEAL':
        return (
          <ParticipantQuestionReveal
            roomState={roomState}
            currentParticipant={currentParticipant}
            userAnswerResult={userAnswerResult}
            lastQuestionResult={lastQuestionResult}
          />
        );

      case 'INTERVAL_LEADERBOARD':
        return (
          <ParticipantIntervalLeaderboard
            roomState={roomState}
            currentParticipant={currentParticipant}
          />
        );

      case 'FINISHED':
        if (finalReport) {
          return (
            <ParticipantFinalReport
              finalReport={finalReport}
              currentParticipant={currentParticipant}
              onLeave={() => resetSession()}
            />
          );
        }
        return <div className="text-center py-12 text-slate-400">Loading final report...</div>;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        onOpenFormatGuide={() => setIsFormatGuideOpen(true)}
        roomCode={roomState?.roomCode}
        isConnected={isConnected}
      />

      <main className="flex-1 pb-16">
        {currentTab === 'host' && renderHostContent()}

        {currentTab === 'player' && renderPlayerContent()}

        {currentTab === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800 min-h-[calc(100vh-4rem)]">
            {/* Host Side */}
            <div className="p-4 sm:p-6 overflow-y-auto">
              <div className="mb-4 pb-2 border-b border-slate-800 flex items-center justify-between text-xs">
                <span className="font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  Host Control Screen
                </span>
                <span className="text-slate-500 font-mono">Screen 1</span>
              </div>
              {renderHostContent()}
            </div>

            {/* Player Side */}
            <div className="p-4 sm:p-6 overflow-y-auto bg-slate-950/70">
              <div className="mb-4 pb-2 border-b border-slate-800 flex items-center justify-between text-xs">
                <span className="font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  Player View Screen
                </span>
                <span className="text-slate-500 font-mono">Screen 2</span>
              </div>
              {renderPlayerContent()}
            </div>
          </div>
        )}
      </main>

      <FormatGuideModal
        isOpen={isFormatGuideOpen}
        onClose={() => setIsFormatGuideOpen(false)}
      />
    </div>
  );
}
