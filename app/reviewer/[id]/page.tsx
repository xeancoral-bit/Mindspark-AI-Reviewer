"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "../../../components/dashboard-layout";
import { useAuth } from "../../../components/auth-context";
import confetti from "canvas-confetti";
import {
  BookOpen,
  Brain,
  ArrowLeft,
  ChevronRight,
  Clock,
  Sparkles,
  CheckCircle,
  XCircle,
  RotateCcw,
  Award,
  Search,
  Loader2,
} from "lucide-react";

interface AssessmentProgress {
  score: number;
  maxScore: number;
  completedAt: string;
}

interface Assessment {
  id: string;
  type: string;
  title: string;
  questions: string; // JSON String
  progress: AssessmentProgress[];
}

interface Reviewer {
  id: string;
  title: string;
  summary: string;
  notesJson: string; // JSON String
  assessments: Assessment[];
}

export default function ReviewerWorkspace() {
  const params = useParams();
  const router = useRouter();
  const { refreshUser } = useAuth();
  
  const [reviewer, setReviewer] = useState<Reviewer | null>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"notes" | "assessments">("notes");
  
  // Search state inside study notes
  const [searchQuery, setSearchQuery] = useState("");
  
  // Game states
  const [activeAssessment, setActiveAssessment] = useState<Assessment | null>(null);
  const [gameState, setGameState] = useState<"idle" | "playing" | "summary">("idle");
  const [score, setScore] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  
  // Answer selection tracking
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  
  // Flashcard states
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);
  const [masteredFlashcards, setMasteredFlashcards] = useState<number[]>([]);

  // Matching type states
  const [matchingPairs, setMatchingPairs] = useState<{ left: string; right: string }[]>([]);
  const [shuffledLeft, setShuffledLeft] = useState<string[]>([]);
  const [shuffledRight, setShuffledRight] = useState<string[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [completedMatches, setCompletedMatches] = useState<string[]>([]); // Keys are left items
  const [failedMatch, setFailedMatch] = useState<boolean>(false);
  
  // Fill in the blanks states
  const [blankAnswers, setBlankAnswers] = useState<string[]>([]);
  const [checkedBlanks, setCheckedBlanks] = useState<boolean>(false);

  // Identification states
  const [identInput, setIdentInput] = useState("");
  const [checkedIdent, setCheckedIdent] = useState(false);

  // Timed Quiz states
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Performance analytics tracking
  const [startTime, setStartTime] = useState<number>(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [unlockedBadges, setUnlockedBadges] = useState<any[]>([]);
  const [leveledUp, setLeveledUp] = useState(false);
  const [earnedPerfectToken, setEarnedPerfectToken] = useState(false);

  const fetchReviewer = useCallback(async () => {
    try {
      const reviewerId = params.id as string;
      const res = await fetch(`/api/reviewers/${reviewerId}`);
      if (!res.ok) {
        router.push("/dashboard");
        return;
      }
      const data = await res.json();
      setReviewer(data.reviewer);
      if (data.reviewer?.notesJson) {
        setNotes(JSON.parse(data.reviewer.notesJson));
      }
    } catch (err) {
      console.error("Failed to load reviewer:", err);
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    fetchReviewer();
  }, [fetchReviewer]);

  // Handle assessment play click
  const startAssessment = (assessment: Assessment) => {
    setActiveAssessment(assessment);
    setGameState("playing");
    setScore(0);
    setCurrentQuestionIdx(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setFlashcardFlipped(false);
    setMasteredFlashcards([]);
    setBlankAnswers([]);
    setCheckedBlanks(false);
    setIdentInput("");
    setCheckedIdent(false);
    setStartTime(Date.now());
    setEarnedPerfectToken(false);
    
    // Set up specific assessment structures
    const questions = JSON.parse(assessment.questions);
    
    if (assessment.type === "MATCHING") {
      const pairs = questions.pairs || [];
      setMatchingPairs(pairs);
      
      // Shuffle columns
      setShuffledLeft([...pairs.map((p: any) => p.left)].sort(() => Math.random() - 0.5));
      setShuffledRight([...pairs.map((p: any) => p.right)].sort(() => Math.random() - 0.5));
      setCompletedMatches([]);
      setSelectedLeft(null);
      setSelectedRight(null);
    }

    if (assessment.type === "FILL_IN_THE_BLANK") {
      const q = questions.questions?.[0];
      if (q) {
        setBlankAnswers(new Array(q.answers.length).fill(""));
      }
    }

    if (assessment.type === "TIMED") {
      const firstQ = questions.questions?.[0];
      if (firstQ) {
        startTimer(firstQ.timeLimit || 15);
      }
    }
  };

  // Timed Quiz countdown timer
  const startTimer = (seconds: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(seconds);
    
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          // Auto submit incorrect answer
          handleTimedOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimedOut = () => {
    setIsAnswerSubmitted(true);
    // Move to next automatically after 2 seconds
    setTimeout(() => {
      const questions = JSON.parse(activeAssessment!.questions).questions;
      if (currentQuestionIdx + 1 < questions.length) {
        setCurrentQuestionIdx((prev) => prev + 1);
        setIsAnswerSubmitted(false);
        setSelectedOption(null);
        startTimer(questions[currentQuestionIdx + 1].timeLimit || 15);
      } else {
        submitAssessment();
      }
    }, 2000);
  };

  // Multiple Choice / Timed Option Select
  const handleOptionClick = (idx: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(idx);
  };

  const submitOptionAnswer = () => {
    if (selectedOption === null || isAnswerSubmitted) return;
    
    if (timerRef.current) clearInterval(timerRef.current);
    
    const questions = JSON.parse(activeAssessment!.questions).questions;
    const correctIdx = questions[currentQuestionIdx].correctIndex;
    
    const isCorrect = selectedOption === correctIdx;
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }
    
    setIsAnswerSubmitted(true);
  };

  const nextQuestion = () => {
    const questions = JSON.parse(activeAssessment!.questions).questions;
    
    if (currentQuestionIdx + 1 < questions.length) {
      setCurrentQuestionIdx((prev) => prev + 1);
      setIsAnswerSubmitted(false);
      setSelectedOption(null);
      
      if (activeAssessment?.type === "TIMED") {
        startTimer(questions[currentQuestionIdx + 1].timeLimit || 15);
      }
    } else {
      submitAssessment();
    }
  };

  // True / False Check
  const handleTrueFalseClick = (answer: boolean) => {
    if (isAnswerSubmitted) return;
    const questions = JSON.parse(activeAssessment!.questions).questions;
    const correctVal = questions[currentQuestionIdx].correctAnswer;
    
    const isCorrect = answer === correctVal;
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }
    
    setSelectedOption(answer ? 1 : 0); // 1 = true, 0 = false for highlighting
    setIsAnswerSubmitted(true);
  };

  // Fill in the blanks inline input changes
  const handleBlankChange = (val: string, idx: number) => {
    setBlankAnswers((prev) => {
      const updated = [...prev];
      updated[idx] = val;
      return updated;
    });
  };

  const checkBlankAnswers = () => {
    const questions = JSON.parse(activeAssessment!.questions).questions;
    const q = questions[currentQuestionIdx];
    
    let correctCount = 0;
    q.answers.forEach((ans: string, i: number) => {
      if (blankAnswers[i]?.trim().toLowerCase() === ans.toLowerCase()) {
        correctCount++;
      }
    });

    if (correctCount === q.answers.length) {
      setScore((prev) => prev + 1);
    }
    
    setCheckedBlanks(true);
  };

  const nextBlankQuestion = () => {
    const questions = JSON.parse(activeAssessment!.questions).questions;
    if (currentQuestionIdx + 1 < questions.length) {
      setCurrentQuestionIdx((prev) => prev + 1);
      setCheckedBlanks(false);
      const nextQ = questions[currentQuestionIdx + 1];
      setBlankAnswers(new Array(nextQ.answers.length).fill(""));
    } else {
      submitAssessment();
    }
  };

  // Identification answers checking
  const checkIdentAnswer = () => {
    const questions = JSON.parse(activeAssessment!.questions).questions;
    const q = questions[currentQuestionIdx];
    
    const inputCleaned = identInput.trim().toLowerCase();
    const isMainCorrect = inputCleaned === q.answer.toLowerCase();
    const isVariationCorrect = q.acceptedVariations?.some(
      (v: string) => inputCleaned === v.toLowerCase()
    );

    if (isMainCorrect || isVariationCorrect) {
      setScore((prev) => prev + 1);
    }
    
    setCheckedIdent(true);
  };

  const nextIdentQuestion = () => {
    const questions = JSON.parse(activeAssessment!.questions).questions;
    if (currentQuestionIdx + 1 < questions.length) {
      setCurrentQuestionIdx((prev) => prev + 1);
      setCheckedIdent(false);
      setIdentInput("");
    } else {
      submitAssessment();
    }
  };

  // Matching type click actions
  const handleMatchingClick = (val: string, isLeftColumn: boolean) => {
    if (isLeftColumn) {
      if (completedMatches.includes(val)) return;
      setSelectedLeft(val);
      
      // If a right item was selected, try matching
      if (selectedRight) {
        checkMatch(val, selectedRight);
      }
    } else {
      // Find left match
      const leftKey = matchingPairs.find((p) => p.right === val)?.left;
      if (leftKey && completedMatches.includes(leftKey)) return;
      setSelectedRight(val);
      
      // If a left item was selected, try matching
      if (selectedLeft) {
        checkMatch(selectedLeft, val);
      }
    }
  };

  const checkMatch = (leftVal: string, rightVal: string) => {
    const pair = matchingPairs.find((p) => p.left === leftVal);
    const isMatch = pair?.right === rightVal;
    
    if (isMatch) {
      setCompletedMatches((prev) => [...prev, leftVal]);
      setScore((prev) => prev + 1);
      setSelectedLeft(null);
      setSelectedRight(null);
      
      // Check if all matches completed
      if (completedMatches.length + 1 === matchingPairs.length) {
        setTimeout(() => submitAssessment(), 1000);
      }
    } else {
      setFailedMatch(true);
      setTimeout(() => {
        setFailedMatch(false);
        setSelectedLeft(null);
        setSelectedRight(null);
      }, 1000);
    }
  };

  // Flashcards navigation
  const nextFlashcard = () => {
    const flashcards = JSON.parse(activeAssessment!.questions).flashcards;
    if (currentQuestionIdx + 1 < flashcards.length) {
      setCurrentQuestionIdx((prev) => prev + 1);
      setFlashcardFlipped(false);
    } else {
      // For flashcards, score is items marked as mastered
      setScore(masteredFlashcards.length);
      submitAssessment(masteredFlashcards.length, flashcards.length);
    }
  };

  const prevFlashcard = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx((prev) => prev - 1);
      setFlashcardFlipped(false);
    }
  };

  const markFlashcardMastered = () => {
    if (!masteredFlashcards.includes(currentQuestionIdx)) {
      setMasteredFlashcards((prev) => [...prev, currentQuestionIdx]);
    } else {
      setMasteredFlashcards((prev) => prev.filter((i) => i !== currentQuestionIdx));
    }
  };

  // Final submit score to DB
  const submitAssessment = async (overrideScore?: number, overrideMax?: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    const timeSpentSeconds = Math.round((Date.now() - startTime) / 1000);
    
    // Calculate final scores
    let finalScore = score;
    let finalMaxScore = 0;
    
    const questions = JSON.parse(activeAssessment!.questions);
    if (activeAssessment?.type === "MATCHING") {
      finalMaxScore = questions.pairs.length;
    } else if (activeAssessment?.type === "FLASHCARD") {
      finalMaxScore = questions.flashcards.length;
      finalScore = overrideScore !== undefined ? overrideScore : score;
    } else {
      finalMaxScore = questions.questions.length;
    }

    if (overrideMax !== undefined) {
      finalMaxScore = overrideMax;
    }

    try {
      const res = await fetch(`/api/assessments/${activeAssessment!.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score: finalScore,
          maxScore: finalMaxScore,
          timeSpentSeconds,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setXpEarned(data.xpEarned);
        setUnlockedBadges(data.unlockedBadges || []);
        setLeveledUp(data.leveledUp);
        setEarnedPerfectToken(!!data.earnedPerfectToken);
        
        // Trigger confetti for a perfect score!
        if (finalScore === finalMaxScore && finalMaxScore > 0) {
          confetti({
            particleCount: 120,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
        
        await refreshUser();
        fetchReviewer(); // Refresh scores on page
      }
    } catch (err) {
      console.error("Submitting quiz failed:", err);
    } finally {
      setGameState("summary");
    }
  };

  // Close workspace and return to assessments dashboard
  const exitAssessmentWorkspace = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setActiveAssessment(null);
    setGameState("idle");
  };

  // Search filter helper for notes
  const filteredNotes = notes.filter((section) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    
    const inTitle = section.sectionTitle.toLowerCase().includes(query);
    const inBullets = section.bullets.some((b: string) => b.toLowerCase().includes(query));
    const inTerms = section.keyTerms?.some(
      (kt: any) => kt.term.toLowerCase().includes(query) || kt.definition.toLowerCase().includes(query)
    );
    
    return inTitle || inBullets || inTerms;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
            <p className="text-zinc-500 text-sm font-medium animate-pulse">Loading study guide workspace...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!reviewer) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-rose-500">Reviewer not found.</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col select-none">
        {/* Game Workspace overlay */}
        {gameState !== "idle" && activeAssessment && (
          <div className="fixed inset-0 bg-zinc-950/95 z-40 flex flex-col p-6 overflow-y-auto">
            {/* Header: Exit Button */}
            <div className="flex justify-between items-center max-w-4xl mx-auto w-full mb-8">
              <button
                onClick={exitAssessmentWorkspace}
                className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors cursor-pointer font-semibold"
              >
                <ArrowLeft className="h-4 w-4" /> Quit Study Mode
              </button>
              
              <div className="flex items-center gap-2">
                <span className="text-xs bg-indigo-500/10 text-indigo-400 px-3 py-1.5 rounded-full font-bold border border-indigo-500/20 uppercase tracking-wide">
                  {activeAssessment.type.replace(/_/g, " ")}
                </span>
              </div>
            </div>

            {/* Assessment Workspace Card */}
            <div className="flex-1 max-w-3xl mx-auto w-full flex flex-col justify-center items-center">
              {gameState === "playing" && (
                <div className="w-full space-y-6 animate-fade-in-scale">
                  {/* MULTIPLE CHOICE & TIMED & TRUE_FALSE */}
                  {(activeAssessment.type === "MULTIPLE_CHOICE" ||
                    activeAssessment.type === "TIMED" ||
                    activeAssessment.type === "TRUE_FALSE") && (() => {
                      const questions = JSON.parse(activeAssessment.questions).questions;
                      const q = questions[currentQuestionIdx];
                      
                      return (
                        <div className="space-y-6 w-full text-left">
                          {/* Progress Header */}
                          <div className="flex justify-between items-center text-xs text-zinc-400">
                            <span>Question {currentQuestionIdx + 1} of {questions.length}</span>
                            {activeAssessment.type === "TIMED" && (
                              <span className={`font-bold flex items-center gap-1.5 ${timeLeft <= 5 ? "text-rose-500 animate-pulse" : "text-amber-500"}`}>
                                <Clock className="h-4 w-4" /> {timeLeft}s remaining
                              </span>
                            )}
                          </div>

                          {/* Timer Progress Bar */}
                          {activeAssessment.type === "TIMED" && (
                            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-1000 ${
                                  timeLeft <= 5 ? "bg-rose-500" : "bg-indigo-500"
                                }`}
                                style={{ width: `${(timeLeft / (q.timeLimit || 15)) * 100}%` }}
                              />
                            </div>
                          )}

                          {/* Question Card */}
                          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-md">
                            <h3 className="text-lg font-bold text-white leading-relaxed">{q.question || q.statement}</h3>
                          </div>

                          {/* Option Lists */}
                          {activeAssessment.type === "TRUE_FALSE" ? (
                            <div className="grid grid-cols-2 gap-4">
                              {[true, false].map((val) => {
                                const idx = val ? 1 : 0;
                                const isSelected = selectedOption === idx;
                                const isCorrect = q.correctAnswer === val;
                                
                                let btnStyle = "border-zinc-800 bg-zinc-900/40 text-white hover:border-zinc-700";
                                if (isAnswerSubmitted) {
                                  if (isCorrect) {
                                    btnStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-400";
                                  } else if (isSelected) {
                                    btnStyle = "border-rose-500 bg-rose-500/10 text-rose-400";
                                  } else {
                                    btnStyle = "border-zinc-850 bg-zinc-950 text-zinc-600 opacity-60";
                                  }
                                }
                                
                                return (
                                  <button
                                    key={val ? "true" : "false"}
                                    onClick={() => handleTrueFalseClick(val)}
                                    disabled={isAnswerSubmitted}
                                    className={`p-4 sm:p-6 rounded-xl border font-bold text-xs sm:text-sm text-center transition-all ${btnStyle} cursor-pointer`}
                                  >
                                    {val ? "TRUE" : "FALSE"}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="grid gap-3">
                              {q.options.map((option: string, idx: number) => {
                                const isSelected = selectedOption === idx;
                                const isCorrect = q.correctIndex === idx;

                                let optionStyle = "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 text-white";
                                if (isAnswerSubmitted) {
                                  if (isCorrect) {
                                    optionStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-400";
                                  } else if (isSelected) {
                                    optionStyle = "border-rose-500 bg-rose-500/10 text-rose-400";
                                  } else {
                                    optionStyle = "border-zinc-850 bg-zinc-950 text-zinc-600 opacity-60";
                                  }
                                } else if (isSelected) {
                                  optionStyle = "border-indigo-500 bg-indigo-500/5 text-indigo-400";
                                }

                                return (
                                  <button
                                    key={idx}
                                    onClick={() => handleOptionClick(idx)}
                                    disabled={isAnswerSubmitted}
                                    className={`w-full text-left p-3 sm:p-4.5 rounded-xl border flex items-center gap-2.5 sm:gap-3 text-xs sm:text-sm font-semibold transition-all ${optionStyle} cursor-pointer`}
                                  >
                                    <span className={`h-5 w-5 sm:h-6 sm:w-6 rounded-lg flex items-center justify-center text-[10px] sm:text-xs font-black shrink-0 ${
                                      isSelected ? "bg-indigo-500 text-white" : "bg-zinc-800 text-zinc-400"
                                    }`}>
                                      {String.fromCharCode(65 + idx)}
                                    </span>
                                    <span>{option}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {/* Submit / Next Actions */}
                          {selectedOption !== null && !isAnswerSubmitted && activeAssessment.type !== "TRUE_FALSE" && (
                            <button
                              onClick={submitOptionAnswer}
                              className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl font-bold text-sm shadow-md hover:shadow-indigo-500/20 text-white cursor-pointer"
                            >
                              Check Answer
                            </button>
                          )}

                          {isAnswerSubmitted && (
                            <div className="space-y-4">
                              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-850 text-xs text-zinc-400 leading-relaxed">
                                <strong className="text-white block mb-1">Explanation:</strong>
                                {q.explanation}
                              </div>
                              <button
                                onClick={nextQuestion}
                                className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 rounded-xl font-bold text-sm text-white cursor-pointer"
                              >
                                {currentQuestionIdx + 1 < questions.length ? "Continue Study" : "Submit Study Set"}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                  {/* 3D FLASHCARDS */}
                  {activeAssessment.type === "FLASHCARD" && (() => {
                    const flashcards = JSON.parse(activeAssessment.questions).flashcards;
                    const card = flashcards[currentQuestionIdx];
                    const isMastered = masteredFlashcards.includes(currentQuestionIdx);

                    return (
                      <div className="space-y-8 w-full max-w-md mx-auto">
                        <div className="flex justify-between items-center text-xs text-zinc-400">
                          <span>Card {currentQuestionIdx + 1} of {flashcards.length}</span>
                          <span className="text-indigo-400 font-semibold">{masteredFlashcards.length} Mastered</span>
                        </div>

                        {/* 3D Card Structure */}
                        <div
                          onClick={() => setFlashcardFlipped(!flashcardFlipped)}
                          className="perspective-1000 w-full h-[320px] cursor-pointer"
                        >
                          <div className={`relative w-full h-full transform-style-3d duration-500 select-none ${
                            flashcardFlipped ? "rotate-y-180" : ""
                          }`}>
                            {/* Front Side */}
                            <div className="absolute inset-0 backface-hidden p-6 rounded-3xl bg-zinc-900 border border-zinc-800 flex flex-col justify-center items-center text-center shadow-lg">
                              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-4">Question / Term</span>
                              <h3 className="text-xl font-bold text-white leading-relaxed px-4">{card.front}</h3>
                              <span className="text-xs text-zinc-500 mt-8 font-semibold animate-pulse">Click card to reveal definition</span>
                            </div>

                            {/* Back Side */}
                            <div className="absolute inset-0 backface-hidden rotate-y-180 p-6 rounded-3xl bg-zinc-900 border border-indigo-500/30 flex flex-col justify-center items-center text-center shadow-lg bg-gradient-to-tr from-zinc-900 to-indigo-950/10">
                              <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-4">Definition / Answer</span>
                              <p className="text-base font-semibold text-zinc-200 leading-relaxed px-4">{card.back}</p>
                              <span className="text-xs text-zinc-500 mt-8 font-semibold">Click to flip back</span>
                            </div>
                          </div>
                        </div>

                        {/* Mastery toggle */}
                        <button
                          onClick={markFlashcardMastered}
                          className={`w-full py-3 border rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            isMastered
                              ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                              : "bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-700"
                          }`}
                        >
                          <CheckCircle className={`h-4 w-4 ${isMastered ? "fill-current" : ""}`} />
                          {isMastered ? "Mastered" : "Mark as Mastered"}
                        </button>

                        {/* Navigation controls */}
                        <div className="flex gap-4">
                          <button
                            onClick={prevFlashcard}
                            disabled={currentQuestionIdx === 0}
                            className="flex-1 py-3 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-bold transition-all disabled:opacity-30 cursor-pointer"
                          >
                            Previous Card
                          </button>
                          
                          <button
                            onClick={nextFlashcard}
                            className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                          >
                            {currentQuestionIdx + 1 < flashcards.length ? "Next Card" : "Submit Flashcards"}
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* IDENTIFICATION */}
                  {activeAssessment.type === "IDENTIFICATION" && (() => {
                    const questions = JSON.parse(activeAssessment.questions).questions;
                    const q = questions[currentQuestionIdx];

                    return (
                      <div className="space-y-6 w-full text-left">
                        <div className="text-xs text-zinc-400">
                          Question {currentQuestionIdx + 1} of {questions.length}
                        </div>

                        {/* Prompt Card */}
                        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-md">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-2">Identification Prompt</span>
                          <h3 className="text-lg font-bold text-white leading-relaxed">{q.question}</h3>
                        </div>

                        {/* Text Input */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide block">Your Answer</label>
                          <input
                            type="text"
                            disabled={checkedIdent}
                            value={identInput}
                            onChange={(e) => setIdentInput(e.target.value)}
                            placeholder="Type definition keyword here..."
                            className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-indigo-500 rounded-xl p-4 text-sm placeholder-zinc-700 text-white focus:outline-none transition-colors"
                          />
                        </div>

                        {/* Actions */}
                        {!checkedIdent ? (
                          <button
                            onClick={checkIdentAnswer}
                            disabled={!identInput.trim()}
                            className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl font-bold text-sm text-white cursor-pointer disabled:opacity-50"
                          >
                            Check Answer
                          </button>
                        ) : (
                          <div className="space-y-6">
                            {/* Validation Result */}
                            {(() => {
                              const inputCleaned = identInput.trim().toLowerCase();
                              const isCorrect = inputCleaned === q.answer.toLowerCase() ||
                                q.acceptedVariations?.some((v: string) => inputCleaned === v.toLowerCase());
                              
                              return (
                                <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                                  isCorrect
                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                    : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                                }`}>
                                  {isCorrect ? (
                                    <CheckCircle className="h-5 w-5 shrink-0" />
                                  ) : (
                                    <XCircle className="h-5 w-5 shrink-0" />
                                  )}
                                  <div>
                                    <p className="font-bold text-sm leading-none">{isCorrect ? "Correct!" : "Incorrect"}</p>
                                    <p className="text-xs mt-1">Correct Answer: <strong className="underline">{q.answer}</strong></p>
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Explanation */}
                            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-850 text-xs text-zinc-400 leading-relaxed">
                              <strong className="text-white block mb-1">Explanation:</strong>
                              {q.explanation}
                            </div>

                            <button
                              onClick={nextIdentQuestion}
                              className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 rounded-xl font-bold text-sm text-white cursor-pointer"
                            >
                              {currentQuestionIdx + 1 < questions.length ? "Continue Study" : "Submit Quiz"}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* MATCHING TYPE */}
                  {activeAssessment.type === "MATCHING" && (
                    <div className="space-y-8 w-full text-left">
                      <div className="flex justify-between items-center text-xs text-zinc-400">
                        <span>Match all pairs. Correct matches: {completedMatches.length} / {matchingPairs.length}</span>
                        <span className="text-indigo-400 font-bold">{score} Matches Snapped</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 md:gap-8 items-stretch">
                        {/* Terms Left */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest pl-1">Terms</h4>
                          {shuffledLeft.map((leftItem) => {
                            const isSelected = selectedLeft === leftItem;
                            const isMatched = completedMatches.includes(leftItem);
                            
                            let btnStyle = "border-zinc-800 bg-zinc-900/30 text-white hover:border-zinc-700";
                            if (isMatched) {
                              btnStyle = "border-emerald-500/20 bg-emerald-500/5 text-zinc-500 opacity-50 cursor-not-allowed";
                            } else if (isSelected) {
                              btnStyle = failedMatch
                                ? "border-rose-500 bg-rose-500/10 text-rose-400"
                                : "border-indigo-500 bg-indigo-500/5 text-indigo-400";
                            }

                            return (
                              <button
                                key={leftItem}
                                disabled={isMatched}
                                onClick={() => handleMatchingClick(leftItem, true)}
                                className={`w-full text-left p-2.5 sm:p-4.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all ${btnStyle} cursor-pointer`}
                              >
                                {leftItem}
                              </button>
                            );
                          })}
                        </div>

                        {/* Definitions Right */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest pl-1">Descriptions</h4>
                          {shuffledRight.map((rightItem) => {
                            const isSelected = selectedRight === rightItem;
                            // Check if this right item is completed
                            const leftKey = matchingPairs.find((p) => p.right === rightItem)?.left || "";
                            const isMatched = completedMatches.includes(leftKey);
                            
                            let btnStyle = "border-zinc-800 bg-zinc-900/30 text-white hover:border-zinc-700";
                            if (isMatched) {
                              btnStyle = "border-emerald-500/20 bg-emerald-500/5 text-zinc-500 opacity-50 cursor-not-allowed";
                            } else if (isSelected) {
                              btnStyle = failedMatch
                                ? "border-rose-500 bg-rose-500/10 text-rose-400"
                                : "border-indigo-500 bg-indigo-500/5 text-indigo-400";
                            }

                            return (
                              <button
                                key={rightItem}
                                disabled={isMatched}
                                onClick={() => handleMatchingClick(rightItem, false)}
                                className={`w-full text-left p-2.5 sm:p-4.5 rounded-xl border text-[10px] sm:text-xs leading-relaxed font-semibold transition-all ${btnStyle} cursor-pointer`}
                              >
                                {rightItem}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* FILL IN THE BLANKS */}
                  {activeAssessment.type === "FILL_IN_THE_BLANK" && (() => {
                    const questions = JSON.parse(activeAssessment.questions).questions;
                    const q = questions[currentQuestionIdx];
                    
                    // Parse text structure to replace '[blank]' with interactive input elements
                    const segments = q.text.split("[blank]");

                    return (
                      <div className="space-y-6 w-full text-left">
                        <div className="text-xs text-zinc-400">
                          Question {currentQuestionIdx + 1} of {questions.length}
                        </div>

                        {/* Blank Sentence Box */}
                        <div className="p-4 sm:p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-md">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-4">Complete the Blanks</span>
                          <div className="text-sm sm:text-base text-zinc-200 leading-loose">
                            {segments.map((seg: string, i: number) => (
                              <React.Fragment key={i}>
                                <span>{seg}</span>
                                {i < segments.length - 1 && (
                                  <input
                                    type="text"
                                    required
                                    disabled={checkedBlanks}
                                    value={blankAnswers[i] || ""}
                                    onChange={(e) => handleBlankChange(e.target.value, i)}
                                    placeholder={`[blank ${i + 1}]`}
                                    className={`mx-1 sm:mx-2 bg-zinc-950 border focus:border-indigo-500 rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-xs text-center text-white focus:outline-none transition-colors w-24 sm:w-28 ${
                                      checkedBlanks
                                        ? blankAnswers[i]?.trim().toLowerCase() === q.answers[i].toLowerCase()
                                          ? "border-emerald-500 text-emerald-400"
                                          : "border-rose-500 text-rose-400"
                                        : "border-zinc-800"
                                    }`}
                                  />
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        {!checkedBlanks ? (
                          <button
                            onClick={checkBlankAnswers}
                            className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl font-bold text-sm text-white cursor-pointer"
                          >
                            Check Blanks
                          </button>
                        ) : (
                          <div className="space-y-6">
                            {/* Validation results summary */}
                            {(() => {
                              let count = 0;
                              q.answers.forEach((ans: string, i: number) => {
                                if (blankAnswers[i]?.trim().toLowerCase() === ans.toLowerCase()) count++;
                              });
                              const allCorrect = count === q.answers.length;

                              return (
                                <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                                  allCorrect
                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                    : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                                }`}>
                                  {allCorrect ? (
                                    <CheckCircle className="h-5 w-5 shrink-0" />
                                  ) : (
                                    <XCircle className="h-5 w-5 shrink-0" />
                                  )}
                                  <div>
                                    <p className="font-bold text-sm leading-none">{allCorrect ? "All Blanks Correct!" : "Some Blanks Incorrect"}</p>
                                    <p className="text-xs mt-1">Answers: <strong className="underline">{q.answers.join(", ")}</strong></p>
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Explanation */}
                            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-850 text-xs text-zinc-400 leading-relaxed">
                              <strong className="text-white block mb-1">Explanation:</strong>
                              {q.explanation}
                            </div>

                            <button
                              onClick={nextBlankQuestion}
                              className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 rounded-xl font-bold text-sm text-white cursor-pointer"
                            >
                              {currentQuestionIdx + 1 < questions.length ? "Continue Study" : "Submit Assessment"}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Completion summary overlay */}
              {gameState === "summary" && (
                <div className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800 text-center w-full max-w-md shadow-2xl relative animate-fade-in-scale">
                  {/* Icon */}
                  <div className="p-4 bg-indigo-500/10 text-indigo-400 rounded-2xl w-fit mx-auto mb-6 animate-float">
                    <Award className="h-10 w-10" />
                  </div>

                  <h3 className="text-2xl font-black text-white">Study Set Completed!</h3>
                  <p className="text-zinc-500 text-xs mt-1 uppercase tracking-wider font-semibold">
                    {activeAssessment.type.replace(/_/g, " ")} Mode
                  </p>

                  {/* Perfect token banner */}
                  {earnedPerfectToken && (
                    <div className="mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-400 text-sm font-bold flex flex-col items-center justify-center gap-1.5 animate-pulse-glow">
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 fill-current text-amber-500 animate-float" />
                        <span>FLAWLESS GOLDEN TOKEN!</span>
                      </div>
                      <span className="text-[10px] text-amber-300 font-semibold normal-case text-center">
                        You scored 100% on your very first try with no retakes!
                      </span>
                    </div>
                  )}

                  {/* Score */}
                  <div className="my-8">
                    <span className="text-5xl font-black bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
                      {score}
                    </span>
                    <span className="text-2xl font-bold text-zinc-500">
                      {" "}
                      / {(() => {
                        const questions = JSON.parse(activeAssessment.questions);
                        if (activeAssessment.type === "MATCHING") return questions.pairs.length;
                        if (activeAssessment.type === "FLASHCARD") return questions.flashcards.length;
                        return questions.questions.length;
                      })()}
                    </span>
                  </div>

                  {/* Level Up Banner */}
                  {leveledUp && (
                    <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-400 text-sm font-bold flex items-center justify-center gap-2 animate-bounce">
                      <Sparkles className="h-5 w-5 fill-current" /> LEVELED UP!
                    </div>
                  )}

                  {/* Badges unlocked */}
                  {unlockedBadges.length > 0 && (
                    <div className="mb-6 space-y-2 text-left">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block mb-1">Unlocks Unlocked</span>
                      {unlockedBadges.map((badge) => (
                        <div key={badge.id} className="p-3 bg-indigo-500/5 border border-indigo-500/20 text-indigo-400 rounded-xl text-xs font-semibold flex items-center gap-2.5">
                          <Award className="h-4 w-4" />
                          <span>Unlocked Badge: <strong>{badge.name}</strong></span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Score details */}
                  <div className="grid grid-cols-2 gap-3 mb-8">
                    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-850">
                      <span className="text-[10px] text-zinc-500 font-semibold block uppercase">XP Earned</span>
                      <span className="text-lg font-extrabold text-indigo-400">+{xpEarned} XP</span>
                    </div>
                    
                    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-850">
                      <span className="text-[10px] text-zinc-500 font-semibold block uppercase">Completion</span>
                      <span className="text-lg font-extrabold text-zinc-200">
                        {(() => {
                          const questions = JSON.parse(activeAssessment.questions);
                          const total = activeAssessment.type === "MATCHING"
                            ? questions.pairs.length
                            : activeAssessment.type === "FLASHCARD"
                            ? questions.flashcards.length
                            : questions.questions.length;
                          return total > 0 ? Math.round((score / total) * 100) : 0;
                        })()}%
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => startAssessment(activeAssessment)}
                      className="flex-1 py-3.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Replay
                    </button>
                    
                    <button
                      onClick={exitAssessmentWorkspace}
                      className="flex-1 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-indigo-500/20 cursor-pointer"
                    >
                      Done studying
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Regular Layout */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <Link
              href="/dashboard"
              className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0c0c12] hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors shrink-0"
            >
              <ArrowLeft className="h-4.5 w-4.5" />
            </Link>
            
            <div className="min-w-0 flex-1">
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight truncate max-w-full sm:max-w-md">{reviewer.title}</h2>
              <span className="text-xs text-zinc-400 font-semibold mt-1 block">Reviewer Classroom Workspace</span>
            </div>
          </div>

          {/* Tab Selection */}
          <div className="flex bg-zinc-200/50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-900 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("notes")}
              className={`flex items-center gap-2 px-4.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "notes"
                  ? "bg-white dark:bg-zinc-900 text-indigo-500 dark:text-indigo-400 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
              }`}
            >
              <BookOpen className="h-4 w-4" /> Study Notes
            </button>
            
            <button
              onClick={() => setActiveTab("assessments")}
              className={`flex items-center gap-2 px-4.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "assessments"
                  ? "bg-white dark:bg-zinc-900 text-indigo-500 dark:text-indigo-400 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
              }`}
            >
              <Brain className="h-4 w-4" /> Assessments
            </button>
          </div>
        </div>

        {/* Notes Tab Content */}
        {activeTab === "notes" && (
          <div className="grid lg:grid-cols-12 gap-8 items-start flex-1 min-h-0">
            {/* Outline list */}
            <div className="lg:col-span-3 space-y-4 lg:sticky lg:top-20">
              {/* Mobile Collapsible TOC */}
              <details className="lg:hidden group p-4 rounded-2xl bg-white dark:bg-[#0c0c12] border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm cursor-pointer [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex justify-between items-center text-xs font-black text-zinc-500 uppercase tracking-widest list-none">
                  <span>Table of Contents</span>
                  <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90 text-zinc-400" />
                </summary>
                <nav className="space-y-1 mt-3">
                  {notes.map((section, idx) => (
                    <a
                      key={idx}
                      href={`#section-${idx}`}
                      className="flex items-center gap-2 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors group"
                    >
                      <ChevronRight className="h-3.5 w-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                      <span className="truncate">{section.sectionTitle}</span>
                    </a>
                  ))}
                </nav>
              </details>

              {/* Desktop Sticky TOC */}
              <div className="hidden lg:block p-5 rounded-2xl bg-white dark:bg-[#0c0c12] border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm">
                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4">Table of Contents</h3>
                <nav className="space-y-1">
                  {notes.map((section, idx) => (
                    <a
                      key={idx}
                      href={`#section-${idx}`}
                      className="flex items-center gap-2 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors group"
                    >
                      <ChevronRight className="h-3.5 w-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                      <span className="truncate">{section.sectionTitle}</span>
                    </a>
                  ))}
                </nav>
              </div>
            </div>

            {/* Structured Content Notes */}
            <div className="lg:col-span-6 space-y-6">
              {/* Search Box */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-650" />
                <input
                  type="text"
                  placeholder="Search concepts or definitions in notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-[#0c0c12] border border-zinc-200 dark:border-zinc-800 focus:border-indigo-500 rounded-2xl py-3.5 pl-11 pr-4 text-sm placeholder-zinc-400 focus:outline-none transition-colors shadow-sm"
                />
              </div>

              {/* Summary Overview */}
              {!searchQuery && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/5 to-purple-600/5 border border-indigo-500/10 shadow-sm">
                  <h3 className="text-sm font-black text-indigo-500 uppercase tracking-widest mb-3">Core Executive Summary</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium">
                    {reviewer.summary}
                  </p>
                </div>
              )}

              {/* Categorized Sections */}
              <div className="space-y-6">
                {filteredNotes.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500">No matching concepts found.</div>
                ) : (
                  filteredNotes.map((section, sIdx) => (
                    <div
                      key={sIdx}
                      id={`section-${sIdx}`}
                      className="p-6 rounded-2xl bg-white dark:bg-[#0c0c12] border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm space-y-4 scroll-mt-20"
                    >
                      <h3 className="font-extrabold text-lg text-zinc-850 dark:text-zinc-50 border-b border-zinc-100 dark:border-zinc-950 pb-2">
                        {section.sectionTitle}
                      </h3>
                      
                      <ul className="space-y-3 pl-1 text-zinc-600 dark:text-zinc-300">
                        {section.bullets.map((bullet: string, bIdx: number) => (
                          <li key={bIdx} className="text-sm leading-relaxed flex gap-2.5 items-start">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-2 shrink-0 animate-pulse" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Key Terms Side Card */}
            <div className="lg:col-span-3 space-y-4 lg:sticky lg:top-20">
              {/* Mobile Collapsible Key Terms */}
              <details className="lg:hidden group p-4 rounded-2xl bg-white dark:bg-[#0c0c12] border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm cursor-pointer [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex justify-between items-center text-xs font-black text-zinc-500 uppercase tracking-widest list-none">
                  <span>Key Terms ({notes.reduce((acc, curr) => acc + (curr.keyTerms?.length || 0), 0)})</span>
                  <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90 text-zinc-400" />
                </summary>
                <div className="space-y-3.5 max-h-[50vh] overflow-y-auto pr-1 mt-3">
                  {notes.flatMap((s) => s.keyTerms || []).length === 0 ? (
                    <p className="text-xs text-zinc-500 italic">No key definitions available.</p>
                  ) : (
                    notes
                      .flatMap((s) => s.keyTerms || [])
                      .filter((kt) => {
                        if (!searchQuery) return true;
                        const q = searchQuery.toLowerCase();
                        return kt.term.toLowerCase().includes(q) || kt.definition.toLowerCase().includes(q);
                      })
                      .map((kt, ktIdx) => (
                        <div
                          key={ktIdx}
                          className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-950 text-left transition-colors hover:border-indigo-500/20"
                        >
                          <strong className="text-xs font-bold text-indigo-400 block mb-1">{kt.term}</strong>
                          <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">{kt.definition}</p>
                        </div>
                      ))
                  )}
                </div>
              </details>

              {/* Desktop Sticky Key Terms */}
              <div className="hidden lg:block p-5 rounded-2xl bg-white dark:bg-[#0c0c12] border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm space-y-4">
                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-950 pb-2">
                  Key Terms ({notes.reduce((acc, curr) => acc + (curr.keyTerms?.length || 0), 0)})
                </h3>
                
                <div className="space-y-3.5 max-h-[70vh] overflow-y-auto pr-1">
                  {notes.flatMap((s) => s.keyTerms || []).length === 0 ? (
                    <p className="text-xs text-zinc-500 italic">No key definitions available.</p>
                  ) : (
                    notes
                      .flatMap((s) => s.keyTerms || [])
                      .filter((kt) => {
                        if (!searchQuery) return true;
                        const q = searchQuery.toLowerCase();
                        return kt.term.toLowerCase().includes(q) || kt.definition.toLowerCase().includes(q);
                      })
                      .map((kt, ktIdx) => (
                        <div
                          key={ktIdx}
                          className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-950 text-left transition-colors hover:border-indigo-500/20"
                        >
                          <strong className="text-xs font-bold text-indigo-400 block mb-1">{kt.term}</strong>
                          <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">{kt.definition}</p>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Assessments Tab Content */}
        {activeTab === "assessments" && (
          <div className="space-y-6 flex-1">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500/5 to-purple-600/5 border border-indigo-500/10 shadow-sm text-left">
              <h3 className="font-extrabold text-base flex items-center gap-1.5 mb-1.5">
                <Brain className="h-5 w-5 text-indigo-500" /> Assessment Center
              </h3>
              <p className="text-sm text-zinc-500">
                Choose any game mode below. Complete assessment questions to gain study XP, level up, and earn badge achievements.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviewer.assessments.map((assessment) => {
                const latestProgress = assessment.progress[0];
                const percentAccuracy = latestProgress
                  ? Math.round((latestProgress.score / latestProgress.maxScore) * 100)
                  : null;

                return (
                  <div
                    key={assessment.id}
                    className="p-6 rounded-2xl bg-white dark:bg-[#0c0c12] border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex flex-col transition-all hover:translate-y-[-2px] hover:border-zinc-300 dark:hover:border-zinc-800/80 group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full font-black uppercase tracking-wider border border-indigo-500/20">
                        {assessment.type.replace(/_/g, " ")}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-base mb-1 text-zinc-800 dark:text-zinc-50 group-hover:text-indigo-400 transition-colors">
                      {assessment.title}
                    </h4>
                    
                    <p className="text-xs text-zinc-400 mt-1">
                      {(() => {
                        const q = JSON.parse(assessment.questions);
                        if (assessment.type === "MATCHING") return `${q.pairs.length} terms to match`;
                        if (assessment.type === "FLASHCARD") return `${q.flashcards.length} cards to master`;
                        return `${q.questions.length} questions`;
                      })()}
                    </p>

                    {/* Progress Info */}
                    <div className="mt-8 pt-4 border-t border-zinc-100 dark:border-zinc-950 flex items-center justify-between">
                      {latestProgress ? (
                        <div className="text-xs flex flex-col text-left">
                          <span className="text-[10px] text-zinc-400 uppercase font-semibold">Latest Attempt</span>
                          <span className="font-extrabold text-zinc-700 dark:text-zinc-300 mt-0.5">
                            {latestProgress.score}/{latestProgress.maxScore} ({percentAccuracy}%)
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-400 font-semibold italic">Not attempted yet</span>
                      )}

                      <button
                        onClick={() => startAssessment(assessment)}
                        className="px-5 py-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl font-bold text-xs shadow-sm text-white transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                      >
                        Play Set
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
