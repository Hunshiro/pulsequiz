import React, { useEffect, useRef } from 'react';
import { Clock, Check, Lock, Award, Flame } from 'lucide-react';
import { QuizRoomState, Participant } from '../../types/quiz';

interface ParticipantActiveQuestionProps {
  roomState: QuizRoomState;
  currentParticipant: Participant;
  selectedOptionId: string | null;
  onSubmitAnswer: (questionId: string, optionId: string, timeTakenMs: number) => void;
}

export const ParticipantActiveQuestion: React.FC<ParticipantActiveQuestionProps> = ({
  roomState,
  currentParticipant,
  selectedOptionId,
  onSubmitAnswer
}) => {
  const currentQ = roomState.currentQuestion;
  const timeTotal = roomState.settings.timePerQuestion || 20;
  const timeRemaining = roomState.timeRemaining;
  const timePercent = Math.max(0, Math.min(100, (timeRemaining / timeTotal) * 100));

  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    startTimeRef.current = Date.now();
  }, [currentQ?.id]);

  // Keyboard shortcut listener (A, B, C, D or 1, 2, 3, 4)
  useEffect(() => {
    if (!currentQ || selectedOptionId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      let optIndex = -1;

      if (key === 'A' || key === '1') optIndex = 0;
      else if (key === 'B' || key === '2') optIndex = 1;
      else if (key === 'C' || key === '3') optIndex = 2;
      else if (key === 'D' || key === '4') optIndex = 3;

      if (optIndex >= 0 && optIndex < currentQ.options.length) {
        const opt = currentQ.options[optIndex];
        const elapsed = Date.now() - startTimeRef.current;
        onSubmitAnswer(currentQ.id, opt.id, elapsed);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQ, selectedOptionId, onSubmitAnswer]);

  if (!currentQ) {
    return <div className="text-center py-12 text-slate-400">Loading question...</div>;
  }

  const handleSelect = (optionId: string) => {
    if (selectedOptionId) return; // already locked
    const elapsed = Date.now() - startTimeRef.current;
    onSubmitAnswer(currentQ.id, optionId, elapsed);
  };

  const timerColor =
    timeRemaining <= 5
      ? 'text-rose-400 border-rose-500/40 bg-rose-500/10 animate-pulse'
      : timeRemaining <= 10
      ? 'text-amber-400 border-amber-500/40 bg-amber-500/10'
      : 'text-indigo-400 border-indigo-500/40 bg-indigo-500/10';

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-5 animate-in fade-in duration-200">
      {/* Player Stats & Round Header */}
      <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <span className="text-lg">{currentParticipant.avatar}</span>
          <div className="truncate">
            <span className="font-bold text-white block truncate">{currentParticipant.name}</span>
            <span className="text-slate-400 text-[11px]">
              Q{roomState.currentQuestionIndex + 1} of {roomState.totalQuestions}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Score</span>
            <span className="font-mono font-extrabold text-amber-400 text-sm">
              {currentParticipant.score > 0 ? `+${currentParticipant.score}` : currentParticipant.score} pts
            </span>
          </div>

          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono font-bold text-base ${timerColor}`}>
            <Clock className="w-4 h-4" />
            <span>{timeRemaining}s</span>
          </div>
        </div>
      </div>

      {/* Synchronized Timer Bar */}
      <div className="h-2.5 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800/80">
        <div
          className={`h-full transition-all duration-1000 ease-linear ${
            timeRemaining <= 5 ? 'bg-rose-500' : timeRemaining <= 10 ? 'bg-amber-500' : 'bg-indigo-500'
          }`}
          style={{ width: `${timePercent}%` }}
        />
      </div>

      {/* Question Statement */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-xl">
        <div className="text-xs uppercase font-bold text-indigo-400 tracking-wider mb-2">
          Question {roomState.currentQuestionIndex + 1}
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white leading-relaxed">
          {currentQ.text}
        </h2>
      </div>

      {/* Interactive Options List */}
      <div className="space-y-3">
        {currentQ.options.map((opt, i) => {
          const letter = String.fromCharCode(65 + i);
          const isSelected = selectedOptionId === opt.id;
          const isLocked = Boolean(selectedOptionId);

          return (
            <button
              key={opt.id}
              type="button"
              disabled={isLocked}
              onClick={() => handleSelect(opt.id)}
              className={`w-full group text-left relative flex items-center justify-between p-4 sm:p-5 rounded-2xl border text-sm font-semibold transition-all ${
                isSelected
                  ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/30 scale-[1.01]'
                  : isLocked
                  ? 'bg-slate-950/40 border-slate-800/60 text-slate-500 opacity-60'
                  : 'bg-slate-950 border-slate-800 text-slate-200 hover:border-indigo-500 hover:bg-slate-900/90 active:scale-[0.99]'
              }`}
            >
              <div className="flex items-center gap-3.5 overflow-hidden pr-2">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl font-mono font-bold text-xs shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-white text-indigo-600'
                      : 'bg-slate-800 text-indigo-300 group-hover:bg-indigo-500/20 group-hover:text-indigo-200'
                  }`}
                >
                  {letter}
                </div>
                <span className="leading-snug break-words">{opt.text}</span>
              </div>

              {isSelected && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-white shrink-0 bg-indigo-700/80 px-2.5 py-1 rounded-lg">
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span className="hidden sm:inline">Locked</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Status indicator footer */}
      {selectedOptionId && (
        <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 animate-in fade-in">
          <Lock className="w-3.5 h-3.5 text-indigo-400" />
          <span>Answer locked in! Waiting for round countdown to finish...</span>
        </div>
      )}
    </div>
  );
};
