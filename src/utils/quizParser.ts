import { QuizQuestion, QuizOption } from '../types/quiz';

// Regex to detect right tick emojis and equivalents
export const TICK_EMOJI_REGEX = /[\u2705\u2714\u2611\u2713]|\[x\]|\[X\]|\(correct\)/i;

export interface ParseResult {
  questions: QuizQuestion[];
  warnings: string[];
  totalParsed: number;
  validCount: number;
}

export function parseQuizText(content: string): ParseResult {
  const warnings: string[] = [];
  const questions: QuizQuestion[] = [];

  if (!content || !content.trim()) {
    return { questions: [], warnings: ['The file is empty.'], totalParsed: 0, validCount: 0 };
  }

  // Normalize line endings
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Split into raw question blocks by double linebreaks or clear question prefixes
  // We can scan line by line to support both spaced and dense formats
  const lines = normalized.split('\n');
  
  interface TempQuestion {
    text: string;
    options: { text: string; isCorrect: boolean }[];
  }

  const rawBlocks: TempQuestion[] = [];
  let currentQ: TempQuestion | null = null;

  // Patterns that indicate an option line: e.g. "A)", "a.", "1.", "-", "*", or starting with tick
  const optionPrefixRegex = /^\s*(?:[A-Ha-h][\.\)\:]|\d+[\.\)\:]|[-*•])\s+/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      continue;
    }

    const hasTick = TICK_EMOJI_REGEX.test(line);
    const isOptionStyle = optionPrefixRegex.test(line) || hasTick;

    // Check if line looks like a new question header (e.g. "1. What is...", "Q2: ...", "Question 3:")
    const questionHeaderMatch = line.match(/^\s*(?:(?:Q|Question)\s*\d+[\.\:\)]|\d+[\.\:\)])\s*(.+)/i);

    if (questionHeaderMatch && !hasTick) {
      // Definitely a new question
      if (currentQ && currentQ.text && currentQ.options.length > 0) {
        rawBlocks.push(currentQ);
      }
      currentQ = {
        text: questionHeaderMatch[1].trim() || line,
        options: []
      };
      continue;
    }

    // If we have an active question
    if (currentQ) {
      if (isOptionStyle || currentQ.options.length > 0) {
        // It's an option for the current question
        // Clean option text by removing prefix (e.g. "A) " or "- ") and the tick mark
        const isCorrect = hasTick;
        let cleanText = line;
        
        // Remove option prefix like A) or 1.
        cleanText = cleanText.replace(optionPrefixRegex, '');
        // Remove tick marks and bracket marks
        cleanText = cleanText.replace(TICK_EMOJI_REGEX, '').trim();

        if (cleanText.length > 0) {
          currentQ.options.push({
            text: cleanText,
            isCorrect
          });
        }
      } else {
        // Line might be continuation of question text
        currentQ.text += ' ' + line;
      }
    } else {
      // First question started without a "1." prefix
      currentQ = {
        text: line,
        options: []
      };
    }
  }

  // Push final question
  if (currentQ && currentQ.text && currentQ.options.length > 0) {
    rawBlocks.push(currentQ);
  }

  // Validate and format questions
  rawBlocks.forEach((block, idx) => {
    const qNum = idx + 1;
    const options: QuizOption[] = block.options.map((opt, optIdx) => ({
      id: `opt_${optIdx}`,
      text: opt.text,
      isCorrect: opt.isCorrect
    }));

    const correctCount = options.filter(o => o.isCorrect).length;

    if (options.length < 2) {
      warnings.push(`Question #${qNum} ("${block.text.slice(0, 30)}...") has fewer than 2 options.`);
    } else if (correctCount === 0) {
      warnings.push(`Question #${qNum} has no option marked with ✅ (one will need to be selected manually).`);
    } else if (correctCount > 1) {
      warnings.push(`Question #${qNum} has multiple options marked with ✅.`);
    }

    questions.push({
      id: `q_${qNum}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      questionNumber: qNum,
      text: block.text,
      options
    });
  });

  return {
    questions,
    warnings,
    totalParsed: rawBlocks.length,
    validCount: questions.filter(q => q.options.length >= 2 && q.options.some(o => o.isCorrect)).length
  };
}

// Sample quizzes to preload or test with 1-click
export const SAMPLE_QUIZZES = [
  {
    name: 'General Knowledge & Science (15 Questions - Milestone Test)',
    description: '15 diverse questions designed to showcase the round 10 leaderboard milestone and final summary report.',
    text: `1. What is the chemical symbol for Gold?
A) Ag
B) Au ✅
C) Fe
D) Pb

2. Which planet in our solar system is known as the Red Planet?
A) Venus
B) Mars ✅
C) Jupiter
D) Mercury

3. What is the capital city of Australia?
A) Sydney
B) Melbourne
C) Canberra ✅
D) Brisbane

4. In computer science, what does "HTTP" stand for?
A) HyperText Transfer Protocol ✅
B) High Transfer Text Process
C) Hyperlink Text Transmission Program
D) Home Tool Tech Platform

5. How many chambers are in the human heart?
A) Two
B) Three
C) Four ✅
D) Six

6. Which element has the atomic number 1?
A) Helium
B) Carbon
C) Hydrogen ✅
D) Oxygen

7. What year did the Apollo 11 mission land the first humans on the Moon?
A) 1965
B) 1969 ✅
C) 1972
D) 1961

8. Which ocean is the largest and deepest on Earth?
A) Atlantic Ocean
B) Indian Ocean
C) Arctic Ocean
D) Pacific Ocean ✅

9. What is the hardest naturally occurring substance on Earth?
A) Titanium
B) Quartz
C) Diamond ✅
D) Graphene

10. Which programming language is primarily used for styling web pages?
A) HTML
B) CSS ✅
C) JavaScript
D) Python

11. Who painted the ceiling of the Sistine Chapel?
A) Leonardo da Vinci
B) Michelangelo ✅
C) Raphael
D) Donatello

12. What is the speed of light in a vacuum (approximate)?
A) 150,000 km/s
B) 300,000 km/s ✅
C) 500,000 km/s
D) 1,000,000 km/s

13. Which mammal is known to be capable of true sustained flight?
A) Flying Squirrel
B) Bat ✅
C) Sugar Glider
D) Colugo

14. What gas do plants primarily absorb during photosynthesis?
A) Oxygen
B) Carbon Dioxide ✅
C) Nitrogen
D) Hydrogen

15. What is the smallest prime number?
A) 0
B) 1
C) 2 ✅
D) 3`
  },
  {
    name: 'Tech & Programming Trivia (5 Questions - Quick Test)',
    description: 'A swift 5-question quiz for rapid verification of scoring and real-time syncing.',
    text: `1. What does the "TS" in TypeScript stand for?
A) Type Source
B) TypeScript ✅
C) Terminal Script
D) Total Syntax

2. Which data structure operates on a Last-In, First-Out (LIFO) basis?
A) Queue
B) Stack ✅
C) Linked List
D) Binary Heap

3. What status code represents "Not Found" in HTTP responses?
A) 200
B) 301
C) 404 ✅
D) 500

4. Which company originally created React?
A) Google
B) Meta (Facebook) ✅
C) Microsoft
D) Twitter

5. What does SQL stand for?
A) Simple Query Language
B) Structured Query Language ✅
C) Standard Quick Lookup
D) System Question Link`
  }
];
