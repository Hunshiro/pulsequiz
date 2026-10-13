import React from 'react';
import { Trophy, Star, Award, Medal } from 'lucide-react';
import { QuizRoomState, Participant } from '../../types/quiz';

interface ParticipantIntervalLeaderboardProps {
  roomState: QuizRoomState;
  currentParticipant: Participant;
}

export const ParticipantIntervalLeaderboard: React.FC<ParticipantIntervalLeaderboardProps> = ({
  roomState,
  currentParticipant
}) => {
  const leaderboard = roomState.leaderboard || [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-6 sm:p-8 shadow-2xl text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Milestone Leaderboard (Round {roomState.currentQuestionIndex + 1})</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Current Standings
        </h1>
        <p className="text-xs text-slate-400">
          Question {roomState.currentQuestionIndex + 1} of {roomState.totalQuestions}
        </p>
      </div>

      {/* Leaderboard List */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-5 shadow-lg space-y-2">
        {leaderboard.map((item, idx) => {
          const isMe = item.participantId === currentParticipant.id;
          const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;

          return (
            <div
              key={item.participantId}
              className={`flex items-center justify-between p-3.5 rounded-xl border text-sm transition-all ${
                isMe
                  ? 'border-indigo-500 bg-indigo-950/40 text-white shadow-md shadow-indigo-950/30 scale-[1.01]'
                  : 'border-slate-800/80 bg-slate-950/60 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3.5 overflow-hidden">
                <div className="flex h-8 w-8 items-center justify-center font-mono font-bold text-xs shrink-0">
                  {medal ? (
                    <span className="text-xl">{medal}</span>
                  ) : (
                    <span className={isMe ? 'text-indigo-400 font-extrabold' : 'text-slate-400'}>
                      #{item.rank}
                    </span>
                  )}
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 border border-slate-700/80 text-lg shrink-0">
                  {item.avatar}
                </div>

                <div className="truncate">
                  <div className="font-bold truncate text-white flex items-center gap-2">
                    <span>{item.name}</span>
                    {isMe && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                        You
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    <span>{item.correctCount} Correct</span>
                    <span>·</span>
                    <span>{item.accuracy}% Accuracy</span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className={`font-mono text-base font-extrabold ${isMe ? 'text-indigo-300' : 'text-amber-400'}`}>
                  {item.score > 0 ? `+${item.score}` : item.score} pts
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Host Pending / Auto-Advance Message */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-center text-xs text-slate-300 space-y-2">
        <div className="flex items-center justify-center gap-2 font-medium">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>
            {roomState.autoAdvanceSeconds && roomState.autoAdvanceSeconds > 0
              ? `Next question loading automatically in ${roomState.autoAdvanceSeconds}s...`
              : 'Preparing next question round...'}
          </span>
        </div>
        {Boolean(roomState.autoAdvanceSeconds && roomState.autoAdvanceSeconds > 0) && (
          <div className="h-1.5 w-full max-w-xs mx-auto rounded-full bg-slate-950 overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-indigo-500 transition-all duration-1000 ease-linear"
              style={{ width: `${Math.min(100, ((roomState.autoAdvanceSeconds || 1) / 7) * 100)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
