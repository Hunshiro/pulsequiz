import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  Award, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RotateCcw, 
  TrendingUp,
  Medal,
  Check
} from 'lucide-react';
import { Participant, QuizQuestion } from '../../types/quiz';
import { FinalReportData } from '../../hooks/useQuizSocket';

interface ParticipantFinalReportProps {
  finalReport: FinalReportData;
  currentParticipant: Participant;
  onLeave: () => void;
}

export const ParticipantFinalReport: React.FC<ParticipantFinalReportProps> = ({
  finalReport,
  currentParticipant,
  onLeave
}) => {
  const { leaderboard, summary } = finalReport;

  // Trigger celebratory confetti on mount
  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      const timeout = setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }, 500);
      return () => clearTimeout(timeout);
    } catch {
      // confetti fallback
    }
  }, []);

  // Find updated participant data from final leaderboard
  const myData = leaderboard.find(p => p.id === currentParticipant.id) || currentParticipant;
  const myAnswers = Object.values(myData.answers || {});
  const correctCount = myAnswers.filter(a => a.isCorrect === true).length;
  const wrongCount = myAnswers.filter(a => a.isCorrect === false).length;
  const unattemptedCount = Math.max(0, summary.totalQuestions - (correctCount + wrongCount));
  const accuracy = (correctCount + wrongCount) > 0 ? Math.round((correctCount / (correctCount + wrongCount)) * 100) : 0;
  const myRank = myData.rank || leaderboard.findIndex(p => p.id === currentParticipant.id) + 1;

  // Top 3 Podium players
  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Celebration Header */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-6 sm:p-8 shadow-2xl text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>Final Championship Results</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Quiz Completed!
        </h1>
        <p className="text-sm text-slate-400">
          Great effort, <strong className="text-white">{myData.name}</strong>! Here is your official performance scorecard.
        </p>

        {/* Podium Display (if at least 2 players) */}
        {leaderboard.length >= 2 && (
          <div className="pt-4 flex items-end justify-center gap-2 sm:gap-4 max-w-md mx-auto">
            {/* 2nd Place */}
            {top2 && (
              <div className="flex-1 text-center space-y-1.5">
                <div className="text-2xl">{top2.avatar}</div>
                <div className="text-xs font-bold text-slate-200 truncate">{top2.name}</div>
                <div className="h-20 rounded-t-xl bg-slate-800 border-t-2 border-slate-400 flex flex-col items-center justify-center p-1">
                  <span className="text-lg">🥈</span>
                  <span className="text-xs font-mono font-bold text-slate-300">{top2.score} pts</span>
                </div>
              </div>
            )}

            {/* 1st Place */}
            {top1 && (
              <div className="flex-1 text-center space-y-1.5">
                <div className="text-3xl animate-bounce">{top1.avatar}</div>
                <div className="text-xs font-bold text-amber-300 truncate">{top1.name}</div>
                <div className="h-28 rounded-t-xl bg-gradient-to-t from-amber-600/40 to-amber-500/20 border-t-2 border-amber-400 flex flex-col items-center justify-center p-1 shadow-lg shadow-amber-500/10">
                  <span className="text-2xl">🥇</span>
                  <span className="text-sm font-mono font-extrabold text-amber-300">{top1.score} pts</span>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {top3 && (
              <div className="flex-1 text-center space-y-1.5">
                <div className="text-2xl">{top3.avatar}</div>
                <div className="text-xs font-bold text-slate-200 truncate">{top3.name}</div>
                <div className="h-16 rounded-t-xl bg-slate-800/80 border-t-2 border-amber-700 flex flex-col items-center justify-center p-1">
                  <span className="text-base">🥉</span>
                  <span className="text-xs font-mono font-bold text-slate-300">{top3.score} pts</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Personal Scorecard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
          <span className="text-[10px] text-slate-400 font-semibold block uppercase">Your Rank</span>
          <span className="font-mono text-2xl font-black text-white mt-1 block">
            #{myRank}
            <span className="text-xs text-slate-500 font-normal ml-1">/ {leaderboard.length}</span>
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
          <span className="text-[10px] text-slate-400 font-semibold block uppercase">Total Points</span>
          <span className="font-mono text-2xl font-black text-amber-400 mt-1 block">
            {myData.score > 0 ? `+${myData.score}` : myData.score} pts
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
          <span className="text-[10px] text-slate-400 font-semibold block uppercase">Accuracy</span>
          <span className="font-mono text-2xl font-black text-emerald-400 mt-1 block">
            {accuracy}%
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
          <span className="text-[10px] text-slate-400 font-semibold block uppercase">Correct / Wrong</span>
          <span className="font-mono text-xl font-black text-slate-200 mt-1 block">
            <span className="text-emerald-400">{correctCount}</span> / <span className="text-rose-400">{wrongCount}</span>
          </span>
        </div>
      </div>

      {/* Question by Question Review */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Award className="w-4 h-4 text-indigo-400" />
          Question Review Breakdown
        </h2>

        <div className="space-y-2.5">
          {summary.questionStats?.map((qStat) => {
            const answer = myData.answers?.[qStat.questionId];
            const isCorrect = answer?.isCorrect;
            const chosen = answer?.selectedOptionText;

            return (
              <div
                key={qStat.questionId}
                className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-indigo-400">
                    Question #{qStat.questionNumber}
                  </span>
                  <div className="flex items-center gap-2">
                    {isCorrect === true ? (
                      <span className="flex items-center gap-1 font-bold text-emerald-400 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Correct (+{answer?.scoreChange})
                      </span>
                    ) : isCorrect === false ? (
                      <span className="flex items-center gap-1 font-bold text-rose-400 font-mono">
                        <XCircle className="w-3.5 h-3.5" /> Wrong ({answer?.scoreChange})
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 font-bold text-amber-400 font-mono">
                        <Clock className="w-3.5 h-3.5" /> Unattempted (0)
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-slate-300">
                  <span className="text-slate-500 font-medium">Your answer: </span>
                  <span className={isCorrect ? 'text-emerald-300 font-medium' : isCorrect === false ? 'text-rose-300 line-through' : 'text-slate-400'}>
                    {chosen || 'None (timed out)'}
                  </span>
                </div>

                {!isCorrect && (
                  <div className="text-slate-300">
                    <span className="text-slate-500 font-medium">Correct answer: </span>
                    <span className="text-emerald-400 font-semibold">{qStat.correctOptionText}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Leave CTA */}
      <div className="flex justify-center pt-2">
        <button
          onClick={onLeave}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-slate-200 bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Exit to Main Menu</span>
        </button>
      </div>
    </div>
  );
};
