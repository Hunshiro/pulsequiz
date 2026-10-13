import React from 'react';
import { CheckCircle2, XCircle, Clock, Trophy, Award, ArrowUp, ArrowDown } from 'lucide-react';
import { QuizRoomState, Participant, ParticipantAnswer, QuizQuestion, QuestionStats } from '../../types/quiz';

interface ParticipantQuestionRevealProps {
  roomState: QuizRoomState;
  currentParticipant: Participant;
  userAnswerResult: ParticipantAnswer | null;
  lastQuestionResult: {
    question: QuizQuestion;
    stats: QuestionStats;
    score: number;
    rank: number;
  } | null;
}

export const ParticipantQuestionReveal: React.FC<ParticipantQuestionRevealProps> = ({
  roomState,
  currentParticipant,
  userAnswerResult,
  lastQuestionResult
}) => {
  const currentQ = lastQuestionResult?.question || roomState.revealedQuestion;
  const isCorrect = userAnswerResult?.isCorrect;
  const wasAttempted = Boolean(userAnswerResult?.selectedOptionId);
  const correctOption = currentQ?.options.find(o => o.isCorrect);

  if (!currentQ) {
    return <div className="text-center py-12 text-slate-400">Loading result...</div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-5 animate-in fade-in duration-300">
      {/* Big Outcome Banner */}
      {isCorrect === true ? (
        <div className="p-6 rounded-3xl bg-emerald-950/50 border border-emerald-500/50 text-center shadow-xl space-y-2 animate-in zoom-in-95">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 text-2xl mb-1">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white">Correct Answer!</h2>
          <p className="text-base font-extrabold text-emerald-400 font-mono">
            +{roomState.settings.correctMarks} Points Earned
          </p>
        </div>
      ) : isCorrect === false ? (
        <div className="p-6 rounded-3xl bg-rose-950/50 border border-rose-500/50 text-center shadow-xl space-y-2 animate-in zoom-in-95">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 text-2xl mb-1">
            <XCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white">Incorrect Answer</h2>
          <p className="text-base font-extrabold text-rose-400 font-mono">
            -{roomState.settings.negativeMarks} Points Deducted
          </p>
          {correctOption && (
            <p className="text-xs text-slate-300 pt-1">
              Correct answer was: <strong className="text-emerald-300">{correctOption.text}</strong>
            </p>
          )}
        </div>
      ) : (
        <div className="p-6 rounded-3xl bg-amber-950/40 border border-amber-500/40 text-center shadow-xl space-y-2 animate-in zoom-in-95">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 text-2xl mb-1">
            <Clock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white">Time Expired!</h2>
          <p className="text-base font-extrabold text-amber-400 font-mono">
            0 Points (No Answer Submitted)
          </p>
          {correctOption && (
            <p className="text-xs text-slate-300 pt-1">
              Correct answer was: <strong className="text-emerald-300">{correctOption.text}</strong>
            </p>
          )}
        </div>
      )}

      {/* Current Standing Card */}
      <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
        <div>
          <span className="text-[11px] text-slate-400 uppercase font-semibold block">Your Total Score</span>
          <span className="font-mono text-xl sm:text-2xl font-black text-amber-400">
            {currentParticipant.score > 0 ? `+${currentParticipant.score}` : currentParticipant.score} pts
          </span>
        </div>
        <div>
          <span className="text-[11px] text-slate-400 uppercase font-semibold block">Current Rank</span>
          <span className="font-mono text-xl sm:text-2xl font-black text-white">
            #{currentParticipant.rank || 1}
          </span>
        </div>
      </div>

      {/* Options Review List */}
      <div className="space-y-2.5">
        <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
          Options Breakdown
        </span>
        {currentQ.options.map((opt, i) => {
          const letter = String.fromCharCode(65 + i);
          const isCorrectOpt = opt.isCorrect;
          const wasPickedByMe = userAnswerResult?.selectedOptionId === opt.id;

          let cardStyle = 'border-slate-800 bg-slate-950/70 text-slate-400';
          if (isCorrectOpt) {
            cardStyle = 'border-emerald-500/60 bg-emerald-950/40 text-emerald-200 font-bold';
          } else if (wasPickedByMe && !isCorrectOpt) {
            cardStyle = 'border-rose-500/60 bg-rose-950/40 text-rose-200';
          }

          return (
            <div
              key={opt.id}
              className={`flex items-center justify-between p-4 rounded-2xl border text-sm transition-all ${cardStyle}`}
            >
              <div className="flex items-center gap-3 overflow-hidden pr-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-xl font-mono font-bold text-xs shrink-0 ${
                    isCorrectOpt
                      ? 'bg-emerald-500 text-slate-950'
                      : wasPickedByMe
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {letter}
                </div>
                <span className="truncate">{opt.text}</span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {wasPickedByMe && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    Your Choice
                  </span>
                )}
                {isCorrectOpt && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Auto-Advance Waiting Indicator */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-center text-xs text-slate-300 space-y-2">
        <div className="flex items-center justify-center gap-2 font-medium">
          <Clock className="w-4 h-4 text-indigo-400 animate-pulse" />
          <span>
            {roomState.autoAdvanceSeconds && roomState.autoAdvanceSeconds > 0
              ? `Next question starting automatically in ${roomState.autoAdvanceSeconds}s...`
              : 'Preparing next round...'}
          </span>
        </div>
        {Boolean(roomState.autoAdvanceSeconds && roomState.autoAdvanceSeconds > 0) && (
          <div className="h-1.5 w-full max-w-xs mx-auto rounded-full bg-slate-950 overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-1000 ease-linear"
              style={{ width: `${Math.min(100, ((roomState.autoAdvanceSeconds || 1) / 4) * 100)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
