import React from 'react';
import { Trophy, ArrowRight, Medal, Award, Star, Clock, Pause, Play } from 'lucide-react';
import { QuizRoomState } from '../../types/quiz';

interface AdminIntervalLeaderboardProps {
  roomState: QuizRoomState;
  onContinue: () => void;
  onToggleAutoAdvance?: () => void;
}

export const AdminIntervalLeaderboard: React.FC<AdminIntervalLeaderboardProps> = ({
  roomState,
  onContinue,
  onToggleAutoAdvance
}) => {
  const leaderboard = roomState.leaderboard || [];
  const nextQNum = roomState.currentQuestionIndex + 2; // next question index
  const isFinished = roomState.currentQuestionIndex + 1 >= roomState.totalQuestions;
  const autoSeconds = roomState.autoAdvanceSeconds ?? 0;
  const isAutoPaused = roomState.autoAdvancePaused;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6 animate-in fade-in duration-300">
      {/* Milestone Header */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-6 sm:p-8 shadow-2xl text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Milestone Leaderboard (Round {roomState.currentQuestionIndex + 1})</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Current Standings
        </h1>
        <p className="text-xs text-slate-400">
          Rankings updated after Question {roomState.currentQuestionIndex + 1} of {roomState.totalQuestions}
        </p>

        {/* Auto Advance Bar */}
        {autoSeconds > 0 && !isAutoPaused && (
          <div className="pt-2 max-w-sm mx-auto space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Automatically continuing in</span>
              <span className="font-bold text-amber-400">{autoSeconds}s</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-indigo-500 transition-all duration-1000 ease-linear"
                style={{ width: `${Math.min(100, (autoSeconds / 7) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Leaderboard Table / Cards */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-3">
        {leaderboard.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            No participants scored yet.
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((item, idx) => {
              const medalEmoji = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;

              return (
                <div
                  key={item.participantId}
                  className={`flex items-center justify-between p-3.5 rounded-xl border text-sm transition-all ${
                    idx === 0
                      ? 'border-amber-500/40 bg-amber-500/10 text-white shadow-sm'
                      : idx === 1
                      ? 'border-slate-400/30 bg-slate-800/60 text-white'
                      : idx === 2
                      ? 'border-amber-700/30 bg-slate-900 text-white'
                      : 'border-slate-800 bg-slate-950/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3.5 overflow-hidden">
                    {/* Rank Badge */}
                    <div className="flex h-8 w-8 items-center justify-center font-mono font-bold text-xs shrink-0">
                      {medalEmoji ? (
                        <span className="text-xl">{medalEmoji}</span>
                      ) : (
                        <span className="text-slate-400">#{item.rank}</span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 border border-slate-700/80 text-lg shrink-0">
                      {item.avatar}
                    </div>

                    {/* Name */}
                    <div className="truncate">
                      <div className="font-bold truncate text-white">{item.name}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span>{item.correctCount} Correct</span>
                        <span>·</span>
                        <span>{item.accuracy}% Accuracy</span>
                      </div>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right shrink-0">
                    <span className="font-mono text-base font-extrabold text-amber-400">
                      {item.score > 0 ? `+${item.score}` : item.score} pts
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Continue Action */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
          {onToggleAutoAdvance && (
            <button
              onClick={onToggleAutoAdvance}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              {isAutoPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
              <span>{isAutoPaused ? 'Resume Auto-Timer' : 'Pause Timer'}</span>
            </button>
          )}

          <button
            onClick={onContinue}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/30 ml-auto"
          >
            <span>
              {isFinished ? 'View Final Summary Report Now' : `Continue to Question ${nextQNum} Now`}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
