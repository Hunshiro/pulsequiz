import React from 'react';
import { CheckCircle2, XCircle, ArrowRight, Trophy, Users, Clock, Award, Pause, Play } from 'lucide-react';
import { QuizRoomState } from '../../types/quiz';

interface AdminQuestionRevealProps {
  roomState: QuizRoomState;
  onNextQuestion: () => void;
  onShowLeaderboard: () => void;
  onToggleAutoAdvance?: () => void;
}

export const AdminQuestionReveal: React.FC<AdminQuestionRevealProps> = ({
  roomState,
  onNextQuestion,
  onShowLeaderboard,
  onToggleAutoAdvance
}) => {
  const currentQ = roomState.revealedQuestion;
  const stats = roomState.questionStats;
  const qNum = roomState.currentQuestionIndex + 1;
  const isLastQuestion = qNum >= roomState.totalQuestions;
  const isIntervalMilestone = qNum % roomState.settings.leaderboardFrequency === 0;

  if (!currentQ || !stats) {
    return <div className="text-center py-12 text-slate-400">Loading question results...</div>;
  }

  const totalAnswered = stats.totalAnswered || 0;
  const correctPercent = totalAnswered > 0 ? Math.round((stats.correctCount / totalAnswered) * 100) : 0;
  const autoSeconds = roomState.autoAdvanceSeconds ?? 0;
  const isAutoPaused = roomState.autoAdvancePaused;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6 animate-in fade-in duration-300">
      {/* Top Banner with Auto-Advance Progress */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Results Revealed
          </span>
          <h2 className="text-xl font-bold text-white">
            Question {qNum} of {roomState.totalQuestions}
          </h2>
        </div>

        {/* Auto Advance Countdown Indicator */}
        <div className="flex items-center gap-3">
          {autoSeconds > 0 && !isAutoPaused ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
              <Clock className="w-4 h-4 animate-spin text-indigo-400" />
              <span>
                {isIntervalMilestone
                  ? `Leaderboard in ${autoSeconds}s...`
                  : isLastQuestion
                  ? `Final report in ${autoSeconds}s...`
                  : `Next question in ${autoSeconds}s...`}
              </span>
            </div>
          ) : isAutoPaused ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              <Pause className="w-3.5 h-3.5" />
              <span>Auto-advance paused</span>
            </div>
          ) : null}

          {/* Milestone Indicator */}
          {isIntervalMilestone && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold animate-pulse">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Round {qNum} Milestone</span>
            </div>
          )}
        </div>
      </div>

      {/* Auto-Advance Synchronized Visual Bar */}
      {autoSeconds > 0 && !isAutoPaused && (
        <div className="h-1.5 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-1000 ease-linear"
            style={{ width: `${Math.min(100, (autoSeconds / 4) * 100)}%` }}
          />
        </div>
      )}

      {/* Question Text */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-xl space-y-6">
        <div className="text-lg sm:text-2xl font-bold text-white leading-relaxed">
          {currentQ.text}
        </div>

        {/* Options Distribution Grid */}
        <div className="space-y-3 pt-2">
          {currentQ.options.map((opt, i) => {
            const letter = String.fromCharCode(65 + i);
            const isCorrect = opt.isCorrect;
            const voteCount = stats.optionCounts[opt.id] || 0;
            const votePercent = totalAnswered > 0 ? Math.round((voteCount / totalAnswered) * 100) : 0;

            return (
              <div
                key={opt.id}
                className={`relative overflow-hidden p-4 rounded-2xl border text-sm font-medium transition-all ${
                  isCorrect
                    ? 'border-emerald-500/60 bg-emerald-950/30 text-emerald-100 shadow-md shadow-emerald-950/20'
                    : 'border-slate-800 bg-slate-950/60 text-slate-300'
                }`}
              >
                {/* Background Fill Bar */}
                <div
                  className={`absolute inset-y-0 left-0 opacity-15 pointer-events-none transition-all duration-700 ${
                    isCorrect ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                  style={{ width: `${votePercent}%` }}
                />

                <div className="relative flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5 overflow-hidden">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-xl font-mono font-bold text-xs shrink-0 ${
                        isCorrect
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {letter}
                    </div>
                    <span className="truncate">{opt.text}</span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-xs font-bold text-slate-400">
                      {voteCount} {voteCount === 1 ? 'vote' : 'votes'} ({votePercent}%)
                    </span>
                    {isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Question Performance Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[11px] text-slate-400 block font-medium">Correct Rate</span>
            <span className="text-base font-bold text-emerald-400 font-mono">{correctPercent}%</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[11px] text-slate-400 block font-medium">Correct Players</span>
            <span className="text-base font-bold text-white font-mono">{stats.correctCount} players</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[11px] text-slate-400 block font-medium">Wrong Answers</span>
            <span className="text-base font-bold text-rose-400 font-mono">{stats.wrongCount} players</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[11px] text-slate-400 block font-medium">Avg Answer Speed</span>
            <span className="text-base font-bold text-sky-400 font-mono">
              {(stats.averageTimeMs / 1000).toFixed(1)}s
            </span>
          </div>
        </div>
      </div>

      {/* Host Navigation Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-2">
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
            onClick={onShowLeaderboard}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs text-slate-200 bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Leaderboard</span>
          </button>
        </div>

        <button
          onClick={onNextQuestion}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/30"
        >
          <span>
            {isLastQuestion
              ? 'Finish Quiz & View Summary Report'
              : isIntervalMilestone
              ? `Show Round ${qNum} Leaderboard Now`
              : `Proceed to Question ${qNum + 1} Now`}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
