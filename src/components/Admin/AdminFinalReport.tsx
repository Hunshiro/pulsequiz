import React from 'react';
import { 
  Trophy, 
  Download, 
  Printer, 
  RotateCcw, 
  Award, 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  Flame, 
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import { Participant, QuestionStats } from '../../types/quiz';
import { FinalReportData } from '../../hooks/useQuizSocket';

interface AdminFinalReportProps {
  finalReport: FinalReportData;
  onReset: () => void;
}

export const AdminFinalReport: React.FC<AdminFinalReportProps> = ({
  finalReport,
  onReset
}) => {
  const { leaderboard, summary } = finalReport;

  // Identify hardest and easiest questions
  const qStats = summary.questionStats || [];
  const sortedByCorrectRate = [...qStats].sort((a, b) => {
    const rateA = a.totalAnswered > 0 ? a.correctCount / a.totalAnswered : 0;
    const rateB = b.totalAnswered > 0 ? b.correctCount / b.totalAnswered : 0;
    return rateA - rateB;
  });

  const hardestQ = sortedByCorrectRate.length > 0 ? sortedByCorrectRate[0] : null;
  const easiestQ = sortedByCorrectRate.length > 0 ? sortedByCorrectRate[sortedByCorrectRate.length - 1] : null;

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Rank',
      'Name',
      'Final Score',
      'Correct Answers',
      'Wrong Answers',
      'Accuracy %',
      'Total Questions'
    ];

    const rows = leaderboard.map((p, idx) => {
      const answers = Object.values(p.answers);
      const correct = answers.filter(a => a.isCorrect === true).length;
      const wrong = answers.filter(a => a.isCorrect === false).length;
      const accuracy = (correct + wrong) > 0 ? Math.round((correct / (correct + wrong)) * 100) : 0;

      return [
        idx + 1,
        `"${p.name.replace(/"/g, '""')}"`,
        p.score,
        correct,
        wrong,
        `${accuracy}%`,
        summary.totalQuestions
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Quiz_Summary_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-8 animate-in fade-in duration-300 print:p-0 print:m-0">
      {/* Report Hero */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-6 sm:p-8 shadow-2xl text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold">
          <Trophy className="w-3.5 h-3.5" />
          <span>Final Official Summary Report</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Quiz Championship Complete
        </h1>
        <p className="text-sm text-slate-400 max-w-lg mx-auto">
          Comprehensive participant rankings, score breakdown, and question difficulty analytics.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2 print:hidden">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-md shadow-indigo-600/20"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV Report</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Host Another Quiz</span>
          </button>
        </div>
      </div>

      {/* High-Level Overview Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">
            Total Participants
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-1 block">
            {summary.totalParticipants}
          </span>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">
            Total Questions
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-indigo-400 font-mono mt-1 block">
            {summary.totalQuestions}
          </span>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">
            Highest Score
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono mt-1 block">
            {summary.highestScore > 0 ? `+${summary.highestScore}` : summary.highestScore} pts
          </span>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">
            Class Average
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-sky-400 font-mono mt-1 block">
            {summary.averageScore} pts
          </span>
        </div>
      </div>

      {/* Question Analytics Strip */}
      {hardestQ && easiestQ && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-rose-500/20 shadow-md space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-rose-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Flame className="w-4 h-4" />
                Hardest Question
              </span>
              <span className="font-mono">Question #{hardestQ.questionNumber}</span>
            </div>
            <p className="text-xs text-slate-300">
              Only {hardestQ.totalAnswered > 0 ? Math.round((hardestQ.correctCount / hardestQ.totalAnswered) * 100) : 0}% of players answered correctly ({hardestQ.wrongCount} wrong).
            </p>
            <div className="text-xs font-medium text-emerald-400 pt-1">
              Correct Answer: {hardestQ.correctOptionText}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/20 shadow-md space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Easiest Question
              </span>
              <span className="font-mono">Question #{easiestQ.questionNumber}</span>
            </div>
            <p className="text-xs text-slate-300">
              {easiestQ.totalAnswered > 0 ? Math.round((easiestQ.correctCount / easiestQ.totalAnswered) * 100) : 0}% of players answered correctly ({easiestQ.correctCount} correct).
            </p>
            <div className="text-xs font-medium text-emerald-400 pt-1">
              Correct Answer: {easiestQ.correctOptionText}
            </div>
          </div>
        </div>
      )}

      {/* Participant Rankings Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            Complete Participant Roster & Performance
          </h2>
          <span className="text-xs text-slate-400">
            {leaderboard.length} Total Ranked
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-3">Rank</th>
                <th className="py-3 px-3">Participant</th>
                <th className="py-3 px-3 text-right">Score</th>
                <th className="py-3 px-3 text-right">Correct</th>
                <th className="py-3 px-3 text-right">Wrong</th>
                <th className="py-3 px-3 text-right">Accuracy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {leaderboard.map((p, idx) => {
                const answers = Object.values(p.answers);
                const correctCount = answers.filter(a => a.isCorrect === true).length;
                const wrongCount = answers.filter(a => a.isCorrect === false).length;
                const accuracy = (correctCount + wrongCount) > 0 
                  ? Math.round((correctCount / (correctCount + wrongCount)) * 100) 
                  : 0;

                const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;

                return (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-3 font-mono font-bold text-slate-300">
                      {medal ? <span className="text-base mr-1">{medal}</span> : `#${idx + 1}`}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{p.avatar}</span>
                        <span className="font-bold text-white">{p.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-extrabold text-amber-400 text-sm">
                      {p.score > 0 ? `+${p.score}` : p.score}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-emerald-400 font-bold">
                      {correctCount}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-rose-400 font-bold">
                      {wrongCount}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-slate-200">
                      {accuracy}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
