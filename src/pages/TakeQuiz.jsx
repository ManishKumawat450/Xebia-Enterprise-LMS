import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { useLMS } from "../context/LMSContext";
import { toast } from "../components/Toast";
import { DraftService } from "../services/api";
import {
  Clock,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  CheckSquare,
  Upload,
  Bot,
  Maximize2,
  Minimize2,
  Moon,
  Sun,
  LayoutGrid,
  List,
  LogOut,
  Flag,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const TakeQuiz = () => {
  const { slug } = useParams({ strict: false });
  const { assessments, currentUser, startAssessment, submitAssessment, theme, toggleTheme } =
    useLMS();
  const navigate = useNavigate();

  const assessment = assessments.find(
    (a) => (a.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "assessment") === slug,
  );

  // ---- ALL HOOKS MUST BE DECLARED BEFORE ANY CONDITIONAL RETURN ----

  // Active submission
  const [submission, setSubmission] = useState(null);

  // Question tracking
  const [currentQIndex, setCurrentQIndex] = useState(0);

  // Answers buffer state: questionId -> answerVal
  const [answers, setAnswers] = useState({});

  // Flagged questions for review
  const [flaggedQIds, setFlaggedQIds] = useState([]);

  // Timer State (in seconds)
  const [secondsLeft, setSecondsLeft] = useState(() => (assessment?.duration || 0) * 60);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Confirm submission modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // File uploading mock state: questionId -> loading boolean
  const [uploadingFiles, setUploadingFiles] = useState({});

  const containerRef = useRef(null);
  const initAttemptRef = useRef(false);

  // Server save status for the in_progress attempt ("ok" | "error" | "saving")
  const [startStatus, setStartStatus] = useState("saving");
  const startAttempt = () => {
    if (!assessment || !currentUser) return;
    setStartStatus("saving");
    startAssessment(assessment.id, currentUser.id)
      .then((attempt) => {
        setSubmission(attempt);
        setStartStatus("ok");

        // Hydrate existing draft answers if present
        const existingAnswers = {};
        (attempt.answers || []).forEach((ans) => {
          existingAnswers[ans.questionId] = ans.answer;
        });
        setAnswers(existingAnswers);

        // Restore a server draft (saved when the page was left mid-attempt)
        DraftService.getDraft(currentUser.id, assessment.id)
          .then((draft) => {
            if (draft?.answers?.length) {
              setAnswers((prev) => {
                const next = { ...prev };
                draft.answers.forEach((a) => {
                  if ((next[a.questionId] === undefined || next[a.questionId] === "") && a.answer) {
                    next[a.questionId] = a.answer;
                  }
                });
                return next;
              });
            }
          })
          .catch(() => {});

        // Calculate elapsed time from start if draft
        if (attempt.startedAt) {
          const elapsedSecs = Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);
          const totalSecs = (assessment.duration || 0) * 60;
          const remaining = Math.max(0, totalSecs - elapsedSecs);
          setSecondsLeft(remaining);
        }
      })
      .catch(() => setStartStatus("error"));
  };
  useEffect(() => {
    if (!assessment || !currentUser || initAttemptRef.current) return;
    initAttemptRef.current = true;
    startAttempt();
  }, [assessment?.id, currentUser?.id]);


  // Countdown timer clock ticks
  useEffect(() => {
    if (secondsLeft <= 0) {
      handleAutoSubmit();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft]);

  // Format Timer text
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Fullscreen Mode Toggle
  const toggleFullscreenMode = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current
        .requestFullscreen()
        .then(() => {
          setIsFullscreen(true);
        })
        .catch((err) => {
          toast.add("Fullscreen error: Blocked by iframe security settings", "warning");
        });
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Monitor escape from fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const isSubmittedRef = useRef(false);
  const autoSubmitTriedRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const answersRef = useRef(answers);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // Build the submission payload from current answers
  const buildAnswersPayload = (source) =>
    assessment.questions.map((q) => ({
      questionId: q.id,
      answer: source[q.id] !== undefined ? source[q.id] : "",
    }));

  // Monitor unmount / browser close: warn, and persist answers as a server
  // draft on teardown. (The old code force-submitted via an async fetch during
  // page teardown — browsers cancel those requests, so it silently did
  // nothing; a draft survives and is restored when the attempt resumes.)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!isSubmittedRef.current) {
        e.preventDefault();
        e.returnValue = ""; // Required for browser to show confirmation dialog
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (!isSubmittedRef.current && submission && assessment) {
        DraftService.saveDraft(currentUser.id, assessment.id, {
          answers: buildAnswersPayload(answersRef.current),
          savedAt: new Date().toISOString(),
        }).catch(() => {});
      }
    };
  }, [submission, assessment]);

  // Set response selection
  const handleSelectAnswer = (qId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: value,
    }));
  };

  // Toggle review flag
  const toggleFlagReview = (qId) => {
    setFlaggedQIds((prev) =>
      prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId],
    );
    toast.add("Question flagged for review", "info");
  };

  // Next / Prev Actions
  const handleNextQ = () => {
    if (currentQIndex < assessment.questions.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
    }
  };

  const handlePrevQ = () => {
    if (currentQIndex > 0) {
      setCurrentQIndex(currentQIndex - 1);
    }
  };

  // Mock File Drag-and-drop Upload handler
  const handleFileChange = (qId, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    simulateFileUpload(qId, file.name, file.size);
  };

  const simulateFileUpload = (qId, name, sizeBytes) => {
    setUploadingFiles((prev) => ({ ...prev, [qId]: true }));

    // Simulate uploading delay
    setTimeout(() => {
      const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(1) + " MB";
      const filePayload = {
        name,
        size: sizeMB,
        uploadedAt: new Date().toISOString(),
      };

      handleSelectAnswer(qId, filePayload);
      setUploadingFiles((prev) => ({ ...prev, [qId]: false }));
      toast.add(`File "${name}" uploaded and buffered.`, "success");
    }, 1500);
  };

  // Submission compilation
  const handleManualSubmitClick = () => {
    // Check if any required question is unanswered
    const unansweredRequired = assessment.questions.filter((q) => {
      const ans = answers[q.id];
      return (
        q.required && (ans === undefined || ans === "" || (Array.isArray(ans) && ans.length === 0))
      );
    });

    if (unansweredRequired.length > 0) {
      toast.add(`Please provide answers for all required questions before submitting.`, "warning");
      return;
    }

    setShowConfirmModal(true);
  };

  const executeFinalSubmission = async () => {
    if (!submission) return;

    // Convert answers state to proper submission array structure
    const answersPayload = buildAnswersPayload(answers);

    isSubmittedRef.current = true;
    setIsSubmitting(true);
    try {
      // Success is only claimed after the backend has persisted the answers.
      const completed = await submitAssessment(submission.id, answersPayload);
      // Clear the interim draft now that the real submission is persisted
      DraftService.deleteDraft(currentUser.id, assessment.id).catch(() => {});
      setShowConfirmModal(false);

      if (document.fullscreenElement) {
        document.exitFullscreen();
      }

      const slug = assessment.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "results";
      toast.add(`Assessment submitted successfully!`, "success");
      navigate({ to: `/student/results/${slug}/${completed.id}` });
    } catch (err) {
      isSubmittedRef.current = false;
      toast.add(err?.message || "Submission failed — your answers are kept, please retry.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutoSubmit = async () => {
    if (!submission || autoSubmitTriedRef.current) return;
    autoSubmitTriedRef.current = true;
    toast.add(`System is submitting your answers.`, "warning", 6000);

    const answersPayload = buildAnswersPayload(answersRef.current);
    isSubmittedRef.current = true;
    try {
      const completed = await submitAssessment(submission.id, answersPayload);
      DraftService.deleteDraft(currentUser.id, assessment.id).catch(() => {});
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
      const slug = assessment.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "results";
      navigate({ to: `/student/results/${slug}/${completed.id}` });
    } catch (err) {
      isSubmittedRef.current = false;
      autoSubmitTriedRef.current = false;
      // Keep the work: persist as a draft so a manual Submit can recover it
      DraftService.saveDraft(currentUser.id, assessment.id, {
        answers: answersPayload,
        savedAt: new Date().toISOString(),
      }).catch(() => {});
      toast.add(
        "Auto-submit failed. Your answers are saved as a draft — press Submit to retry.",
        "error",
      );
    }
  };

  const currentQ = assessment.questions[currentQIndex];
  const totalQuestions = assessment.questions.length;
  const progressPercentage = Math.round(((currentQIndex + 1) / totalQuestions) * 100);

  // Drag over styling
  const [isDragOver, setIsDragOver] = useState(false);

  if (!currentUser || !assessment) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border">
        Assessment not found or you are not logged in.
      </div>
    );
  }

  // Starting the attempt requires a persisted in_progress record; offer an
  // explicit retry instead of letting the student answer into the void.
  if (startStatus === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-[#2e2e3e] p-8 shadow-sm space-y-4">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <h2 className="text-lg font-bold">Couldn't start the attempt</h2>
          <p className="text-sm text-gray-500">
            The server could not record this attempt, so submitting wouldn't
            be possible yet. Check your connection and try again.
          </p>
          <button
            onClick={startAttempt}
            className="px-5 py-2.5 bg-[#6C1D5F] hover:bg-[#84117C] text-white text-sm font-bold rounded-xl transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`min-h-screen bg-brand-bg-light dark:bg-[#0a0a0a] p-4 md:p-8 flex flex-col justify-between transition-colors duration-300 w-full ${isFullscreen ? "fixed inset-0 z-50 overflow-y-auto" : ""}`}
    >
      {/* Quiz Top Action Bar */}
      <div className="flex justify-between items-center bg-white dark:bg-neutral-900 px-6 py-4 border border-gray-200 dark:border-[#2e2e3e] rounded-2xl shadow-sm mb-6">
        <div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wide">
            Ongoing Assessment Exam
          </span>
          <h3 className="font-display font-black text-lg md:text-xl text-neutral-900 dark:text-white truncate max-w-[200px] sm:max-w-xl">
            {assessment.title}
          </h3>
        </div>

        <div className="flex items-center gap-4">
          {/* Exit Assessment button */}
          <button
            onClick={() => {
              if (
                window.confirm(
                  "Are you sure you want to exit? Your attempt will be submitted automatically and consumed.",
                )
              ) {
                handleAutoSubmit();
              }
            }}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-transparent hover:border-neutral-300 dark:hover:border-neutral-600"
            title="Exit Assessment"
          >
            <LogOut className="w-3.5 h-3.5" /> Exit
          </button>

          {/* Theme Toggle button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-2xl text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 dark:text-neutral-500 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800 transition-all duration-150 cursor-pointer"
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {theme === "light" ? (
              <Moon className="w-5 h-5 text-[#6C1D5F]" />
            ) : (
              <Sun className="w-5 h-5 text-amber-500" />
            )}
          </button>

          {/* Fullscreen button */}
          <button
            onClick={toggleFullscreenMode}
            className="p-2 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 rounded-2xl text-neutral-500 cursor-pointer"
            title="Toggle fullscreen exam mode"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4.5 h-4.5" />
            ) : (
              <Maximize2 className="w-4.5 h-4.5" />
            )}
          </button>

          {/* Clock widget */}
          <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-100 dark:border-rose-900/50">
            <Clock className={`w-5 h-5 ${secondsLeft < 120 ? "animate-pulse" : ""}`} />
            <span className="font-mono font-bold text-base tracking-wider">
              {formatTime(secondsLeft)}
            </span>
          </div>
        </div>
      </div>

      {/* Progress indicators */}
      <div className="space-y-1.5 mb-6">
        <div className="flex justify-between items-center text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
          <span>Progress Timeline</span>
          <span>
            Question {currentQIndex + 1} of {totalQuestions} ({progressPercentage}%)
          </span>
        </div>
        <div className="bg-neutral-200 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-[#01AC9F] h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Main question canvas + Sidebar palette row */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 items-start w-full">
        {/* Active Question Canvas (Left) */}
        <div className="flex-1 w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-[#2e2e3e] rounded-2xl p-4 md:p-6 space-y-4 shadow-sm min-h-[450px] flex flex-col justify-between">
          <div>
            {/* Question ID indicator */}
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-[#2e2e3e]/20 dark:border-neutral-800 pb-4">
              <span className="px-3 py-1.5 bg-[#6C1D5F]/10 dark:bg-purple-900/30 text-[#6C1D5F] dark:text-purple-300 font-bold rounded-lg text-sm font-mono">
                QUESTION #{currentQIndex + 1} • {currentQ.marks} PTS
              </span>
              {currentQ.required && (
                <span className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-3 py-1 rounded-md uppercase font-mono">
                  Mandatory Question
                </span>
              )}
            </div>

            {/* Prompt description */}
            <p className="text-base md:text-lg font-semibold text-neutral-900 dark:text-neutral-100 mt-6 leading-relaxed">
              {currentQ.text ||
                currentQ.questionText ||
                currentQ["Question Text"] ||
                currentQ.question ||
                "Untitled Question"}
            </p>

            {/* Form Input fields depending on type */}
            <div className="mt-4">
              {currentQ.type === "mcq" || currentQ.type === "true_false" ? (
                <div className="space-y-3">
                  {currentQ.options?.map((opt, oIdx) => {
                    const isChecked = answers[currentQ.id] === oIdx.toString();
                    return (
                      <div
                        key={oIdx}
                        onClick={() => handleSelectAnswer(currentQ.id, oIdx.toString())}
                        className={`p-3 border rounded-2xl cursor-pointer flex items-center justify-between text-sm font-semibold transition-all ${isChecked ? "bg-purple-50/80 border-[#6C1D5F] text-[#6C1D5F] dark:bg-purple-900/20 dark:border-purple-500 dark:text-purple-300 shadow-sm" : "border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"}`}
                      >
                        <span>{opt}</span>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isChecked ? "border-[#6C1D5F] dark:border-purple-400 text-[#6C1D5F]" : "border-neutral-300 dark:border-neutral-700"}`}
                        >
                          {isChecked && (
                            <div className="w-2.5 h-2.5 rounded-full bg-[#6C1D5F] dark:bg-purple-400" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : currentQ.type === "multi_select" ? (
                <div className="space-y-3">
                  {currentQ.options?.map((opt, oIdx) => {
                    const activeSet = Array.isArray(answers[currentQ.id])
                      ? answers[currentQ.id]
                      : [];
                    const isChecked = activeSet.includes(oIdx.toString());

                    const handleToggleMulti = () => {
                      const updatedSet = isChecked
                        ? activeSet.filter((val) => val !== oIdx.toString())
                        : [...activeSet, oIdx.toString()];
                      handleSelectAnswer(currentQ.id, updatedSet);
                    };

                    return (
                      <div
                        key={oIdx}
                        onClick={handleToggleMulti}
                        className={`p-3 border rounded-2xl cursor-pointer flex items-center justify-between text-sm font-semibold transition-all ${isChecked ? "bg-emerald-50/80 border-[#01AC9F] text-[#01AC9F] dark:bg-emerald-900/20 dark:border-emerald-500 dark:text-emerald-300 shadow-sm" : "border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"}`}
                      >
                        <span>{opt}</span>
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isChecked ? "bg-[#01AC9F] border-[#01AC9F] dark:bg-emerald-500 dark:border-emerald-500 text-white" : "border-neutral-300 dark:border-neutral-700"}`}
                        >
                          {isChecked && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : currentQ.type === "short_answer" ? (
                <input
                  type="text"
                  value={answers[currentQ.id] || ""}
                  onChange={(e) => handleSelectAnswer(currentQ.id, e.target.value)}
                  placeholder="Type your brief answers response here..."
                  className="w-full px-5 py-4 bg-neutral-50 dark:bg-neutral-950 border border-gray-200 dark:border-[#2e2e3e] rounded-2xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6C1D5F]"
                />
              ) : currentQ.type === "paragraph" ? (
                <textarea
                  value={answers[currentQ.id] || ""}
                  onChange={(e) => handleSelectAnswer(currentQ.id, e.target.value)}
                  placeholder="Compose detailed explanatory response..."
                  className="w-full px-5 py-4 bg-neutral-50 dark:bg-neutral-950 border border-gray-200 dark:border-[#2e2e3e] rounded-2xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6C1D5F]"
                  rows={5}
                />
              ) : currentQ.type === "file_upload" ? (
                <div className="space-y-4">
                  {/* File Upload Zone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragOver(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) simulateFileUpload(currentQ.id, file.name, file.size);
                    }}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all flex flex-col items-center justify-center ${isDragOver ? "border-[#01AC9F] bg-[#01AC9F]/5" : "border-gray-200 dark:border-[#2e2e3e]/80 dark:border-neutral-800 hover:border-brand-velvet"}`}
                  >
                    <Upload className="w-8 h-8 text-neutral-500 dark:text-neutral-400 mb-2.5 animate-bounce" />
                    <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      Drag & drop your files archive
                    </p>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1 uppercase">
                      Supports: PDF, DOCX, ZIP, IMAGES up to 15MB
                    </p>

                    <label className="mt-4 px-4 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 font-bold rounded-lg text-[10px] cursor-pointer">
                      <span>Browse Files</span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => handleFileChange(currentQ.id, e)}
                      />
                    </label>
                  </div>

                  {/* File Uploading Spinner */}
                  {uploadingFiles[currentQ.id] && (
                    <div className="text-center py-2 text-xs text-[#01AC9F] font-bold animate-pulse">
                      Uploading & virus scanning files payload...
                    </div>
                  )}

                  {/* Uploaded File Detail Preview */}
                  {answers[currentQ.id] && typeof answers[currentQ.id] === "object" && (
                    <div className="flex items-center justify-between p-3.5 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200/40">
                      <div className="flex items-center gap-2 text-xs truncate">
                        <FileText className="w-5 h-5 text-emerald-500 shrink-0" />
                        <div className="truncate">
                          <p className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                            {answers[currentQ.id].name}
                          </p>
                          <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                            {answers[currentQ.id].size}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleSelectAnswer(currentQ.id, "")}
                        className="p-1 hover:bg-rose-100 rounded text-rose-500 transition-colors"
                        title="Remove uploaded file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          {/* Navigation Controls toolbar */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-[#2e2e3e]/20 dark:border-neutral-800 mt-8">
            <div className="flex gap-3">
              <button
                onClick={() => toggleFlagReview(currentQ.id)}
                className={`py-2 px-4 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${flaggedQIds.includes(currentQ.id) ? "bg-amber-500 text-white" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"}`}
              >
                <Flag className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {flaggedQIds.includes(currentQ.id) ? "Flagged for Review" : "Flag Question"}
                </span>
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handlePrevQ}
                disabled={currentQIndex === 0}
                className="py-2 px-3.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 rounded-2xl text-xs font-bold text-neutral-700 dark:text-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              {currentQIndex === totalQuestions - 1 ? (
                <button
                  onClick={handleManualSubmitClick}
                  className="py-2 px-5 bg-[#01AC9F] hover:bg-[#01AC9F]/90 text-white rounded-2xl text-xs font-black uppercase shadow cursor-pointer flex items-center gap-1"
                >
                  <CheckCircle className="w-4 h-4" /> Finish Exam
                </button>
              ) : (
                <button
                  onClick={handleNextQ}
                  className="py-2 px-3.5 bg-[#6C1D5F] hover:bg-[#84117C] rounded-2xl text-xs font-bold text-white cursor-pointer flex items-center gap-1"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Question Navigation Palette (Right) */}
        <div className="lg:w-80 shrink-0 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-[#2e2e3e] rounded-2xl p-6 shadow-sm min-h-[450px]">
          <div className="mb-6">
            <h4 className="font-display font-black text-neutral-800 dark:text-white text-base">
              Question Palette
            </h4>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
              Quick navigation grid of assessment blocks
            </p>
          </div>

          {/* Grid palette */}
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
            {assessment.questions.map((q, idx) => {
              const isCurrent = currentQIndex === idx;
              const hasAnswered =
                answers[q.id] !== undefined &&
                answers[q.id] !== "" &&
                (!Array.isArray(answers[q.id]) || answers[q.id].length > 0);
              const isFlagged = flaggedQIds.includes(q.id);

              let bgStyle =
                "bg-neutral-50 text-neutral-500 border-neutral-200 dark:bg-neutral-800/40 dark:border-neutral-800";
              if (isCurrent) {
                bgStyle =
                  "bg-[#6C1D5F] text-white border-transparent shadow ring-2 ring-brand-velvet/20";
              } else if (isFlagged) {
                bgStyle = "bg-amber-500 text-white border-transparent shadow-amber-500/10";
              } else if (hasAnswered) {
                bgStyle = "bg-emerald-500 text-white border-transparent";
              }

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQIndex(idx)}
                  className={`w-10 h-10 rounded-2xl border flex items-center justify-center font-mono font-bold text-xs transition-all cursor-pointer ${bgStyle}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Legend helper */}
          <div className="border-t border-gray-200 dark:border-[#2e2e3e]/80 dark:border-neutral-700/80 pt-3.5 space-y-2 text-[10px] font-semibold text-neutral-500">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-[#6C1D5F] shrink-0"></span>
              <span>Active Current Position</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-emerald-500 shrink-0"></span>
              <span>Saved & Confirmed Response</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-amber-500 shrink-0"></span>
              <span>Flagged for Later Review</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-neutral-100 dark:bg-neutral-800 border shrink-0"></span>
              <span>Not Visited / Empty Block</span>
            </div>
          </div>
        </div>
      </div>

      {/* CONFIRM EXAMINATION SUBMIT DIALOG */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-neutral-950/50 backdrop-blur-sm"
              onClick={() => setShowConfirmModal(false)}
            ></div>

            {/* Content Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-[#2e2e3e] rounded-2xl w-full max-w-md p-6 relative z-10 shadow-2xl text-center space-y-4"
            >
              <AlertTriangle className="w-12 h-12 text-brand-orange mx-auto animate-pulse" />

              <div className="space-y-1.5">
                <h3 className="font-display font-black text-lg text-neutral-800 dark:text-white">
                  Submit Examination?
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Are you absolutely certain you want to hand in your assessment paper? Your answers
                  will be compiled, graded, and committed. You cannot undo this request.
                </p>
              </div>

              {/* Status info bar */}
              <div className="p-3 bg-neutral-50 dark:bg-neutral-950 rounded-2xl text-xs font-semibold grid grid-cols-2 gap-2 text-center text-neutral-500">
                <div>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                    Questions answered
                  </p>
                  <p className="text-sm font-bold text-neutral-800 dark:text-white mt-0.5">
                    {
                      Object.keys(answers).filter(
                        (k) => answers[k] !== undefined && answers[k] !== "",
                      ).length
                    }{" "}
                    of {totalQuestions}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                    Time remaining
                  </p>
                  <p className="text-sm font-bold text-rose-500 mt-0.5">
                    {formatTime(secondsLeft)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="py-2.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 font-bold rounded-2xl text-xs cursor-pointer"
                >
                  Cancel & Review
                </button>
                <button
                  onClick={executeFinalSubmission}
                  disabled={isSubmitting}
                  className="py-2.5 bg-[#01AC9F] hover:bg-[#01AC9F]/90 disabled:opacity-60 disabled:cursor-wait text-white font-bold rounded-2xl text-xs shadow-md shadow-[#01AC9F]/20 cursor-pointer"
                >
                  {isSubmitting ? "Submitting…" : "Confirm and Hand In"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
