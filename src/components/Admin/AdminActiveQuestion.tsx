import React, { useRef, useEffect } from 'react';
import { Clock, Users, Eye, FastForward, CheckCircle2, Lock, Check } from 'lucide-react';
import { QuizRoomState, Participant } from '../../types/quiz';

interface AdminActiveQuestionProps {
  roomState: QuizRoomState;
  currentParticipant?: Participant | null;
  selectedOptionId?: string | null;
  onSubmitAnswer?: (questionId: string, optionId: string, timeTakenMs: number) => void;
  onRevealAnswer: () => void;
  onSkipQuestion: () => void;
}

export const AdminActiveQuestion: React.FC<AdminActiveQuestionProps> = ({
  roomState,
  currentParticipant,
  selectedOptionId,
  onSubmitAnswer,
  onRevealAnswer,
  onSkipQuestion
}) => {
  const currentQ = roomState.currentQuestion;
  const timeTotal = roomState.settings.timePerQuestion || 20;
  const timeRemaining = roomState.timeRemaining;
  const timePercent = Math.max(0, Math.min(100, (timeRemaining / timeTotal) * 100));

  const totalPlayers = roomState.totalParticipants || 0;
  const answeredCount = roomState.answeredCount || 0;
  const answeredPercent = totalPlayers > 0 ? Math.round((answeredCount / totalPlayers) * 100) : 0;

  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    startTimeRef.current = Date.now();
  }, [currentQ?.id]);

  if (!currentQ) {
    return (
      <div className="text-center py-12 text-slate-400">
        Loading active question...
      </div>
    );
  }

  const handleAdminSelect = (optId: string) => {
    if (!currentParticipant || !onSubmitAnswer || selectedOptionId) return;
    const elapsed = Date.now() - startTimeRef.current;
    onSubmitAnswer(currentQ.id, optId, elapsed);
  };

  // Timer color urgency
  const timerColor = 
    timeRemaining <= 5 
      ? 'text-rose-400 border-rose-500/40 bg-rose-500/10' 
      : timeRemaining <= 10 
      ? 'text-amber-400 border-amber-500/40 bg-amber-500/10' 
      : 'text-indigo-400 border-indigo-500/40 bg-indigo-500/10';

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6 animate-in fade-in duration-200">
      {/* Top Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            Live Round · Auto-Timer Active
          </span>
          <h2 className="text-xl font-bold text-white">
            Question {roomState.currentQuestionIndex + 1} of {roomState.totalQuestions}
          </h2>
        </div>

        {/* Live Timer Clock */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Auto-Advancing In</span>
            <span className="text-xs text-slate-300 font-mono">When timer reaches 0s</span>
          </div>
          <div className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border font-mono font-bold text-xl ${timerColor}`}>
            <Clock className="w-5 h-5 animate-pulse" />
            <span>{timeRemaining}s</span>
          </div>
        </div>
      </div>

      {/* Synchronized Timer Bar */}
      <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800/80">
        <div
          className={`h-full transition-all duration-1000 ease-linear ${
            timeRemaining <= 5 ? 'bg-rose-500' : timeRemaining <= 10 ? 'bg-amber-500' : 'bg-indigo-500'
          }`}
          style={{ width: `${timePercent}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-xl space-y-6">
        <div className="text-lg sm:text-2xl font-bold text-white leading-relaxed">
          {currentQ.text}
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
          {currentQ.options.map((opt, i) => {
            const letter = String.fromCharCode(65 + i);
            const isSelectedByAdmin = selectedOptionId === opt.id;

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleAdminSelect(opt.id)}
                disabled={Boolean(selectedOptionId) || !currentParticipant}
                className={`flex items-center justify-between p-4 rounded-2xl border text-sm font-medium transition-all text-left ${
                  isSelectedByAdmin
                    ? 'border-indigo-400 bg-indigo-600/30 text-white shadow-md shadow-indigo-600/20'
                    : currentParticipant && !selectedOptionId
                    ? 'border-slate-800 bg-slate-950/80 text-slate-200 hover:border-indigo-500/80 hover:bg-slate-900 cursor-pointer'
                    : 'border-slate-800 bg-slate-950/80 text-slate-200 cursor-default'
                }`}
              >
                <div className="flex items-center gap-3.5 overflow-hidden pr-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-xl font-mono font-bold text-xs shrink-0 ${
                      isSelectedByAdmin ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-indigo-300'
                    }`}
                  >
                    {letter}
                  </div>
                  <span className="truncate">{opt.text}</span>
                </div>

                {isSelectedByAdmin && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-300 bg-indigo-900/60 px-2 py-0.5 rounded">
                    <Check className="w-3.5 h-3.5" />
                    Locked
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Admin Player Interaction Feedback */}
        {currentParticipant && (
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className="text-base">{currentParticipant.avatar}</span>
              <span>
                Playing as <strong className="text-white">{currentParticipant.name}</strong>
              </span>
            </div>
            {selectedOptionId ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Your answer is locked! Points will calculate upon reveal.
              </span>
            ) : (
              <span className="text-indigo-400 font-medium">
                Click any option above to submit your answer!
              </span>
            )}
          </div>
        )}
      </div>

      {/* Answer Progress & Host Actions */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Users className="w-4 h-4 text-indigo-400" />
            <span>Participant Responses</span>
          </div>
          <span className="font-mono text-sm font-bold text-indigo-400">
            {answeredCount} / {totalPlayers} answered ({answeredPercent}%)
          </span>
        </div>

        {/* Response Progress Bar */}
        <div className="h-3 w-full rounded-full bg-slate-950 overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-300"
            style={{ width: `${answeredPercent}%` }}
          />
        </div>

        {/* Actions & Auto timer status */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          <span className="text-xs text-slate-400">
            ⏰ Automatic mode: advances to reveal automatically at 0s.
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onRevealAnswer}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-md shadow-indigo-600/30"
            >
              <Eye className="w-4 h-4" />
              <span>Reveal Now (Skip Wait)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
