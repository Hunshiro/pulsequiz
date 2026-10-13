import React from 'react';
import { Users, Clock, Award, Shield, CheckCircle2 } from 'lucide-react';
import { QuizRoomState, Participant } from '../../types/quiz';

interface ParticipantLobbyProps {
  roomState: QuizRoomState;
  currentParticipant: Participant;
  participants: Participant[];
}

export const ParticipantLobby: React.FC<ParticipantLobbyProps> = ({
  roomState,
  currentParticipant,
  participants
}) => {
  const activeCount = participants.filter(p => p.connected).length;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6 animate-in fade-in duration-300">
      {/* Player Card */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-6 sm:p-8 text-center shadow-2xl space-y-4">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600/20 text-3xl border border-indigo-500/40 shadow-inner">
          {currentParticipant.avatar}
        </div>

        <div>
          <span className="text-xs font-semibold text-emerald-400 flex items-center justify-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            Connected & Ready
          </span>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Welcome, {currentParticipant.name}!
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Joined Room <span className="font-mono font-bold text-indigo-400">{roomState.roomCode}</span> · "{roomState.title}"
          </p>
        </div>

        {/* Waiting Pulse Box */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-center gap-3">
          <div className="w-3 h-3 rounded-full bg-indigo-500 animate-ping" />
          <span className="text-sm font-semibold text-slate-200">
            Waiting for host to launch the quiz...
          </span>
        </div>

        {/* Rules Card */}
        <div className="grid grid-cols-3 gap-2 pt-2 text-left">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Correct</span>
            <span className="text-sm font-bold text-emerald-400 font-mono">
              +{roomState.settings.correctMarks} pts
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Negative</span>
            <span className="text-sm font-bold text-rose-400 font-mono">
              -{roomState.settings.negativeMarks} pts
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Timer</span>
            <span className="text-sm font-bold text-amber-400 font-mono">
              {roomState.settings.timePerQuestion}s / Q
            </span>
          </div>
        </div>
      </div>

      {/* Roster Strip */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            Participants in Lobby
          </span>
          <span className="font-mono text-indigo-400 font-bold">{activeCount} Players</span>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {participants.filter(p => p.connected).map((p) => (
            <div
              key={p.id}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border ${
                p.id === currentParticipant.id
                  ? 'bg-indigo-600/20 border-indigo-500/50 text-white font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-300'
              }`}
            >
              <span>{p.avatar}</span>
              <span className="truncate max-w-[120px]">{p.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
