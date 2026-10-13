import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Award, 
  MinusCircle, 
  Trophy, 
  Play, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  Check
} from 'lucide-react';
import { QuizQuestion, QuizSettings } from '../../types/quiz';
import { parseQuizText, SAMPLE_QUIZZES } from '../../utils/quizParser';

interface QuizCreatorProps {
  onCreateRoom: (
    title: string, 
    questions: QuizQuestion[], 
    settings: QuizSettings,
    adminJoinAsPlayer: boolean,
    adminName: string,
    adminAvatar: string
  ) => void;
  isConnecting: boolean;
}

export const QuizCreator: React.FC<QuizCreatorProps> = ({ onCreateRoom, isConnecting }) => {
  const [title, setTitle] = useState('Live Championship Quiz');
  const [rawText, setRawText] = useState(SAMPLE_QUIZZES[0].text);
  const [parsedQuestions, setParsedQuestions] = useState<QuizQuestion[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  // Admin player participation state (default true: admin joins the room too)
  const [adminJoinAsPlayer, setAdminJoinAsPlayer] = useState(true);
  const [adminName, setAdminName] = useState('Admin (Host)');
  const [adminAvatar, setAdminAvatar] = useState('👑');

  // Quiz Settings
  const [correctMarks, setCorrectMarks] = useState<number>(4);
  const [negativeMarks, setNegativeMarks] = useState<number>(1);
  const [timePerQuestion, setTimePerQuestion] = useState<number>(20);
  const [leaderboardFrequency, setLeaderboardFrequency] = useState<number>(10);

  // Re-parse when rawText changes
  useEffect(() => {
    const res = parseQuizText(rawText);
    setParsedQuestions(res.questions);
    setWarnings(res.warnings);
  }, [rawText]);

  const handleFileUpload = (file: File) => {
    if (!file.name.endsWith('.txt')) {
      alert('Please upload a .txt file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setRawText(content);
        // Default title to filename without .txt
        setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleOptionCorrectToggle = (qIdx: number, optId: string) => {
    setParsedQuestions((prev) => {
      const updated = [...prev];
      const q = { ...updated[qIdx] };
      q.options = q.options.map((opt) => ({
        ...opt,
        isCorrect: opt.id === optId
      }));
      updated[qIdx] = q;
      return updated;
    });
  };

  const handleLoadSample = (sampleText: string, sampleName: string) => {
    setRawText(sampleText);
    setTitle(sampleName.split('(')[0].trim());
  };

  const handleCreate = () => {
    if (parsedQuestions.length === 0) {
      alert('Please provide at least 1 question.');
      return;
    }

    const unassigned = parsedQuestions.find((q) => !q.options.some((o) => o.isCorrect));
    if (unassigned) {
      alert(`Question #${unassigned.questionNumber} does not have a correct answer marked. Please click an option to mark it correct or add ✅.`);
      return;
    }

    onCreateRoom(
      title, 
      parsedQuestions, 
      {
        correctMarks,
        negativeMarks,
        timePerQuestion,
        leaderboardFrequency
      },
      adminJoinAsPlayer,
      adminName,
      adminAvatar
    );
  };

  const validQuestionsCount = parsedQuestions.filter((q) => q.options.some((o) => o.isCorrect)).length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Hero Intro */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
          Host a Real-Time Live Quiz
        </h1>
        <p className="text-sm text-slate-400">
          Upload a <code className="text-indigo-400 font-mono">.txt</code> file with questions and options marked with <span className="text-emerald-400 font-bold">✅</span>, set marking rules and launch your room.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Upload & Raw Editor (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Room Title */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-4">
            <div>
              <label htmlFor="quiz-title-input" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Quiz Title
              </label>
              <input
                id="quiz-title-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Science Olympiad Round 1"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* File Upload Zone */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Import .txt Quiz File
              </label>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-slate-700/80 bg-slate-950/60 hover:border-slate-600'
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-200">
                  Drag and drop your .txt file here, or{' '}
                  <label htmlFor="file-input" className="text-indigo-400 hover:text-indigo-300 cursor-pointer underline underline-offset-2">
                    browse
                  </label>
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Options marked with right tick emoji (✅, ✔️) are automatically set as correct.
                </p>
                <input
                  id="file-input"
                  type="file"
                  accept=".txt"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />
              </div>
            </div>

            {/* Quick Sample Presets */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[11px] font-medium text-slate-400 block mb-2">
                Or quickly load sample quizzes to test:
              </span>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_QUIZZES.map((sample, i) => (
                  <button
                    key={i}
                    onClick={() => handleLoadSample(sample.text, sample.name)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700/80 text-slate-200 transition-colors border border-slate-700/60"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{i === 0 ? '15 Questions (Milestone Test)' : '5 Questions (Quick Test)'}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Raw Text Editor */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="raw-quiz-textarea" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Raw Text / Edit Questions
                </label>
                <span className="text-xs text-slate-400 font-mono">
                  {rawText.split('\n').filter(Boolean).length} lines
                </span>
              </div>
              <textarea
                id="raw-quiz-textarea"
                rows={8}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="1. Question here?&#10;A) Option 1&#10;B) Option 2 ✅"
                className="w-full font-mono text-xs text-slate-200 rounded-xl border border-slate-700 bg-slate-950 p-3 leading-relaxed focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Quiz Rules & Parsed Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Admin Player Participation Card */}
          <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 to-slate-900/90 p-5 shadow-lg space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">👑</span>
                <div>
                  <h3 className="text-sm font-bold text-white">Join Room as Admin Player</h3>
                  <p className="text-[11px] text-slate-400">Play along, answer questions & rank on the leaderboard</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={adminJoinAsPlayer}
                  onChange={(e) => setAdminJoinAsPlayer(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {adminJoinAsPlayer && (
              <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-indigo-500/20">
                <div className="col-span-2">
                  <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Your Player Nickname
                  </label>
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="Admin (Host)"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Avatar
                  </label>
                  <select
                    value={adminAvatar}
                    onChange={(e) => setAdminAvatar(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  >
                    {['👑', '⚡', '🚀', '🦊', '🦁', '🦉', '🎯', '💡', '💎', '🐉', '🐼', '🔥'].map((emoji) => (
                      <option key={emoji} value={emoji}>{emoji}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Rules / Marking Scheme Configuration */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-400" />
                Scoring & Timing Scheme
              </h3>
              <span className="text-[10px] text-emerald-400 font-medium px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                Auto-Progression ON
              </span>
            </div>

            {/* Correct Marks */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Correct Marks (+marks)</span>
                <span className="font-bold text-emerald-400 font-mono">+{correctMarks} pts</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setCorrectMarks(val)}
                    className={`py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                      correctMarks === val
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    +{val}
                  </button>
                ))}
              </div>
            </div>

            {/* Negative Marking */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Negative Marking (-deduction)</span>
                <span className="font-bold text-rose-400 font-mono">
                  {negativeMarks === 0 ? '0 (None)' : `-${negativeMarks} pts`}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {[0, 0.25, 0.5, 1, 2].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setNegativeMarks(val)}
                    className={`py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                      negativeMarks === val
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {val === 0 ? '0' : `-${val}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Per Question */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Time Per Question</span>
                <span className="font-bold text-amber-400 font-mono">{timePerQuestion}s</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[10, 15, 20, 30].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setTimePerQuestion(val)}
                    className={`py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                      timePerQuestion === val
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {val}s
                  </button>
                ))}
              </div>
            </div>

            {/* Leaderboard Frequency */}
            <div className="pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Milestone Leaderboard</span>
                <span className="font-bold text-indigo-400 font-mono">Every {leaderboardFrequency} Questions</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2">
                Automatically shows leaderboard ranking after question 10, 20, etc., plus final report at the end.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[5, 10, 15].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setLeaderboardFrequency(val)}
                    className={`py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                      leaderboardFrequency === val
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Every {val} Qs
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Parsed Questions Inspection Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Parsed Questions ({validQuestionsCount}/{parsedQuestions.length})
                </h3>
                <p className="text-[11px] text-slate-400">Click any option to change the correct answer</p>
              </div>
              {parsedQuestions.length > 0 && (
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Ready
                </span>
              )}
            </div>

            {warnings.length > 0 && (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-300 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Validation Notes</span>
                </div>
                {warnings.slice(0, 2).map((w, i) => (
                  <p key={i} className="text-[11px] text-amber-400/90 pl-5">{w}</p>
                ))}
              </div>
            )}

            {/* Questions Accordion List */}
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-800/60">
              {parsedQuestions.map((q, qIdx) => {
                const isExpanded = expandedIndex === qIdx;
                const hasCorrect = q.options.some((o) => o.isCorrect);

                return (
                  <div key={q.id} className="pt-2 first:pt-0">
                    <button
                      type="button"
                      onClick={() => setExpandedIndex(isExpanded ? null : qIdx)}
                      className="w-full flex items-center justify-between text-left py-1.5 hover:text-indigo-400 transition-colors"
                    >
                      <div className="flex items-center gap-2 overflow-hidden pr-2">
                        <span className="font-mono text-xs font-bold text-slate-500 shrink-0">
                          #{q.questionNumber}
                        </span>
                        <span className="text-xs text-slate-200 truncate">
                          {q.text}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {hasCorrect ? (
                          <span className="text-emerald-400 text-xs">✅</span>
                        ) : (
                          <span className="text-rose-400 text-[10px] font-bold uppercase">No ✅</span>
                        )}
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="mt-2 pl-6 space-y-1.5 pb-2">
                        {q.options.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleOptionCorrectToggle(qIdx, opt.id)}
                            className={`w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-lg border text-left transition-colors ${
                              opt.isCorrect
                                ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200 font-semibold'
                                : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <span className="truncate pr-2">{opt.text}</span>
                            {opt.isCorrect && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Launch CTA */}
            <div className="pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={handleCreate}
                disabled={isConnecting || parsedQuestions.length === 0}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none transition-all shadow-lg shadow-indigo-600/30"
              >
                <Play className="w-4 h-4 fill-white" />
                Launch Live Room ({parsedQuestions.length} Questions)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
