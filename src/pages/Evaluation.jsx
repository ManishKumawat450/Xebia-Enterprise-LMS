import React, { useState } from "react";
import { useLMS } from "../context/LMSContext";
import { toast } from "../components/Toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  CheckCircle,
  Clock,
  FileText,
  User,
  ChevronRight,
  Bot,
  AlertCircle,
  Award,
  MessageSquare,
  Send,
  CheckSquare,
  Layers,
  ChevronDown,
  Loader2,
  Download,
} from "lucide-react";
import * as XLSX from "xlsx";
import { evaluateSubmission as evaluateSubmissionAI } from "../utils/aiService";

export const Evaluation = () => {
  const { submissions, students, assessments, batches, evaluateSubmission } = useLMS();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterGraded, setFilterGraded] = useState("pending");
  const [selectedBatchId, setSelectedBatchId] = useState("all");
  const [selectedAssId, setSelectedAssId] = useState("all");
  const [selectedSubId, setSelectedSubId] = useState(null);
  const [isEvaluatingAi, setIsEvaluatingAi] = useState(false);

  // Form states for the selected submission
  const [questionMarks, setQuestionMarks] = useState({});
  const [questionRemarks, setQuestionRemarks] = useState({});
  const [overallRemarks, setOverallRemarks] = useState("");

  // Derived data
  const activeSubmissions = submissions.filter((s) => s.status === "submitted");

  const filteredSubs = activeSubmissions.filter((s) => {
    const student = students.find((stud) => stud.id === s.studentId);
    const assessment = assessments.find((a) => a.id === s.assessmentId);

    const matchesSearch =
      (student?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (assessment?.title || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBatch =
      selectedBatchId === "all" ||
      (student && student.batches && student.batches.includes(selectedBatchId));
    const matchesAssessment = selectedAssId === "all" || s.assessmentId === selectedAssId;

    const matchesGraded =
      filterGraded === "all" ||
      (filterGraded === "pending" && !s.isEvaluated) ||
      (filterGraded === "graded" && s.isEvaluated);

    return matchesSearch && matchesBatch && matchesAssessment && matchesGraded;
  });

  const handleSelectSubmission = (sub) => {
    setSelectedSubId(sub.id);
    setOverallRemarks(sub.remarks || "");

    // Prep state
    const marks = {};
    const remarks = {};
    sub.answers.forEach((ans) => {
      marks[ans.questionId] = ans.marksAwarded || 0;
      remarks[ans.questionId] = ans.remarks || "";
    });
    setQuestionMarks(marks);
    setQuestionRemarks(remarks);
  };

  const handleMarkChange = (qId, value, maxMarks) => {
    const val = Math.max(0, Math.min(maxMarks, value));
    setQuestionMarks((prev) => ({ ...prev, [qId]: val }));
  };

  const handleRemarkChange = (qId, value) => {
    setQuestionRemarks((prev) => ({ ...prev, [qId]: value }));
  };

  const handleSubmitEvaluation = async () => {
    if (!selectedSubId) return;
    try {
      await evaluateSubmission(
        selectedSubId,
        questionMarks,
        questionRemarks,
        overallRemarks.trim(),
      );
      toast.add("Evaluation Published! Student notified instantly.", "success");
      setSelectedSubId(null);
    } catch (err) {
      console.error("Evaluation save failed:", err);
      toast.add("Failed to save evaluation to server. Please try again.", "error");
    }
  };

  const handleAutoEvaluate = async () => {
    if (!currentSub || !currentAssessment) return;
    setIsEvaluatingAi(true);
    toast.add("AI is analyzing the submission...", "info");

    const newMarks = { ...questionMarks };
    const newRemarks = { ...questionRemarks };

    try {
      for (const q of currentAssessment.questions) {
        const answerObj = currentSub.answers.find((a) => a.questionId === q.id);
        const answerText = answerObj ? answerObj.answer : "";
        const formattedAnswerText = getAnswerString(q, answerText);

        let formattedCorrectAnswer = q.correctAnswer;
        if (Array.isArray(q.correctAnswer)) {
          formattedCorrectAnswer = q.correctAnswer.join(", ");
        }

        const aiResult = await evaluateSubmissionAI(
          q.text,
          formattedAnswerText,
          q.marks,
          currentAssessment.type,
          formattedCorrectAnswer,
        );

        newMarks[q.id] = aiResult.suggestedMarks;
        newRemarks[q.id] = `[AI Auto-Scored]: ${aiResult.remarks}`;
      }
      setQuestionMarks(newMarks);
      setQuestionRemarks(newRemarks);
      toast.add("Auto-evaluation complete! Review and publish.", "success");
    } catch (err) {
      toast.add("Auto-evaluation failed. Check API key.", "error");
    } finally {
      setIsEvaluatingAi(false);
    }
  };

  const currentSub = submissions.find((s) => s.id === selectedSubId);
  const currentStudent = currentSub ? students.find((s) => s.id === currentSub.studentId) : null;
  const currentAssessment = currentSub
    ? assessments.find((a) => a.id === currentSub.assessmentId)
    : null;

  const formatAnswerText = (q, answerVal) => {
    if (answerVal === undefined || answerVal === null || answerVal === "")
      return <span className="italic text-neutral-400">No answer provided</span>;
    if (typeof answerVal === "boolean") return answerVal ? "True" : "False";
    if (typeof answerVal === "object" && !Array.isArray(answerVal))
      return answerVal.name || "File Uploaded";

    if (q.type === "mcq" || q.type === "true_false") {
      const idx = Number(answerVal);
      if (!isNaN(idx) && q.options && q.options[idx]) return q.options[idx];
      return answerVal;
    }

    if (q.type === "multiple_select" || q.type === "multi_select") {
      if (Array.isArray(answerVal)) {
        return answerVal
          .map((idx) => (q.options && q.options[Number(idx)] ? q.options[Number(idx)] : idx))
          .join(", ");
      }
      return answerVal;
    }

    return answerVal;
  };

  const getAnswerString = (q, answerVal) => {
    if (answerVal === undefined || answerVal === null || answerVal === "")
      return "No answer provided";
    if (typeof answerVal === "boolean") return answerVal ? "True" : "False";
    if (typeof answerVal === "object" && !Array.isArray(answerVal))
      return answerVal.name || "File Uploaded";

    if (q.type === "mcq" || q.type === "true_false") {
      const idx = Number(answerVal);
      if (!isNaN(idx) && q.options && q.options[idx]) return q.options[idx];
      return String(answerVal);
    }

    if (q.type === "multiple_select" || q.type === "multi_select") {
      if (Array.isArray(answerVal)) {
        return answerVal
          .map((idx) => (q.options && q.options[Number(idx)] ? q.options[Number(idx)] : idx))
          .join(", ");
      }
      return String(answerVal);
    }

    return String(answerVal);
  };

  const handleExportAssessmentResults = () => {
    if (selectedAssId === "all") {
      toast.add("Please select a specific assessment to export bulk results.", "warning");
      return;
    }

    const currentAssessment = assessments.find((a) => a.id === selectedAssId);
    if (!currentAssessment) return;

    const subsToExport = filteredSubs.filter((s) => s.assessmentId === selectedAssId);

    if (subsToExport.length === 0) {
      toast.add("No submissions found for this assessment in the current filter.", "warning");
      return;
    }

    const rowData = subsToExport.map((sub) => {
      const student = students.find((s) => s.id === sub.studentId);
      const row = {
        "Student Name": student?.name || "Unknown",
        "Batch ID": student?.batches?.join(", ") || "N/A",
        "Email ID": student?.email || "N/A",
        Score: sub.score || 0,
        Percentage: sub.percentage || 0,
        Status: sub.isEvaluated ? "Evaluated" : "Pending",
        "Submitted At": sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : "N/A",
      };

      currentAssessment.questions.forEach((q, idx) => {
        const answerObj = sub.answers.find((a) => a.questionId === q.id);
        let answerText = "No answer provided";
        if (
          answerObj &&
          answerObj.answer !== undefined &&
          answerObj.answer !== null &&
          answerObj.answer !== ""
        ) {
          answerText = getAnswerString(q, answerObj.answer);
        }
        row[`Q${idx + 1}`] = answerText;
        row[`Q${idx + 1} Marks`] = answerObj?.marksAwarded || 0;
      });

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(rowData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Assessment Results");
    XLSX.writeFile(workbook, `${currentAssessment.title.replace(/\s+/g, "_")}_Bulk_Results.xlsx`);
  };

  const handleExportExcel = () => {
    if (!currentSub || !currentStudent || !currentAssessment) return;

    const rowData = [
      {
        "Student Name": currentStudent.name,
        "Batch ID": currentStudent.batches?.join(", ") || "N/A",
        "Student ID": currentStudent.id,
        "Email ID": currentStudent.email,
        "Assessment Score": `${currentSub.score || 0} / ${currentAssessment.marks}`,
        "Assessment Title": currentAssessment.title,
        "Submitted At": currentSub.submittedAt
          ? new Date(currentSub.submittedAt).toLocaleString()
          : "N/A",
      },
    ];

    currentAssessment.questions.forEach((q, idx) => {
      const answerObj = currentSub.answers.find((a) => a.questionId === q.id);
      let answerText = "No answer provided";
      if (
        answerObj &&
        answerObj.answer !== undefined &&
        answerObj.answer !== null &&
        answerObj.answer !== ""
      ) {
        answerText = getAnswerString(q, answerObj.answer);
      }
      rowData[0][`Q${idx + 1}: ${q.text || q.question || "Untitled"}`] = answerText;
      rowData[0][`Q${idx + 1} Marks Awarded`] = answerObj?.marksAwarded || 0;
    });

    const worksheet = XLSX.utils.json_to_sheet(rowData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Evaluation Data");
    XLSX.writeFile(
      workbook,
      `${currentStudent.name.replace(/\s+/g, "_")}_${currentAssessment.title.replace(/\s+/g, "_")}_Evaluation.xlsx`,
    );
  };

  return (
    <div className="h-[calc(100vh-6rem)] -mt-6 -mx-6 bg-neutral-100 dark:bg-[#0a0a0a] flex flex-col lg:flex-row overflow-hidden">
      {/* LEFT COLUMN: Queue */}
      <div className="w-full lg:w-[380px] h-1/3 lg:h-auto shrink-0 bg-white dark:bg-neutral-900 border-b lg:border-b-0 lg:border-r border-neutral-200 dark:border-neutral-800 flex flex-col z-10">
        {/* Header & Filters */}
        <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 space-y-4">
          <div>
            <h2 className="font-display font-black text-xl text-neutral-900 dark:text-white flex items-center gap-2">
              <CheckSquare className="w-6 h-6 text-[#6C1D5F]" /> Evaluation
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Review submissions and provide feedback.
            </p>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search student or assessment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6C1D5F] dark:text-white"
            />
          </div>

          <div className="flex flex-col gap-2">
            <select
              value={selectedBatchId}
              onChange={(e) => {
                setSelectedBatchId(e.target.value);
              }}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6C1D5F] dark:text-white"
            >
              <option value="all">All Batches</option>
              {batches?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            <select
              value={selectedAssId}
              onChange={(e) => setSelectedAssId(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6C1D5F] dark:text-white"
            >
              <option value="all">All Assessments</option>
              {assessments?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
          </div>

          {selectedAssId !== "all" && (
            <button
              onClick={handleExportAssessmentResults}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-accent-2/10 text-accent-2 hover:bg-accent-2/10 dark:bg-accent-2 dark:text-accent-2 dark:hover:bg-accent-2 rounded-xl text-sm font-bold border border-accent-2/20 dark:border-accent-2 transition-colors"
            >
              <Download className="w-4 h-4" /> Bulk Export Results
            </button>
          )}

          <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
            {["pending", "graded", "all"].map((mode) => (
              <button
                key={mode}
                onClick={() => setFilterGraded(mode)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${filterGraded === mode ? "bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white" : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"}`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Submission List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredSubs.length === 0 ? (
            <div className="p-8 text-center text-neutral-400">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">No submissions found in this queue.</p>
            </div>
          ) : (
            filteredSubs.map((sub) => {
              const student = students.find((s) => s.id === sub.studentId);
              const assessment = assessments.find((a) => a.id === sub.assessmentId);
              const isSelected = selectedSubId === sub.id;

              return (
                <button
                  key={sub.id}
                  onClick={() => handleSelectSubmission(sub)}
                  className={`w-full text-left p-4 rounded-2xl transition-all border ${isSelected ? "bg-primary/10 dark:bg-primary border-primary/20 dark:border-primary shadow-sm" : "bg-white dark:bg-neutral-900 border-transparent hover:border-neutral-200 dark:hover:border-neutral-700"}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6C1D5F] to-[#84117C] text-white flex items-center justify-center font-bold text-xs shadow-inner">
                        {student?.name?.charAt(0) || "?"}
                      </div>
                      <div>
                        <p
                          className={`text-sm font-bold ${isSelected ? "text-[#6C1D5F] dark:text-primary" : "text-neutral-900 dark:text-white"}`}
                        >
                          {student?.name || "Unknown Student"}
                        </p>
                        <p className="text-[10px] text-neutral-500 line-clamp-1">
                          {assessment?.title || "Unknown Assessment"}
                        </p>
                      </div>
                    </div>
                    {sub.isEvaluated ? (
                      <CheckCircle className="w-4 h-4 text-accent-2" />
                    ) : (
                      <Clock className="w-4 h-4 text-destructive" />
                    )}
                  </div>

                  <div className="flex justify-between items-center mt-3">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                      Submitted:{" "}
                      {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : "N/A"}
                    </span>
                    {!sub.isEvaluated && sub.aiConfidence && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-accent-2 bg-accent-2/10 dark:bg-accent-2 px-2 py-0.5 rounded-full border border-accent-2/20 dark:border-accent-2">
                        <Bot className="w-3 h-3" /> AI Scored
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* CENTER & RIGHT COLUMNS */}
      {selectedSubId && currentSub && currentStudent && currentAssessment ? (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* CENTER: Submission Content Viewer */}
          <div className="flex-1 overflow-y-auto bg-neutral-50 dark:bg-[#0a0a0a] relative">
            <div className="max-w-3xl mx-auto p-8 space-y-8">
              <div className="pb-6 border-b border-neutral-200 dark:border-neutral-800">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-full text-xs font-bold text-neutral-600 dark:text-neutral-300 mb-4 shadow-sm">
                  <FileText className="w-3.5 h-3.5" />
                  {currentAssessment.type.replace("_", " ").toUpperCase()} Assessment
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-3xl font-display font-black text-neutral-900 dark:text-white mb-2">
                      {currentAssessment.title}
                    </h1>
                    <p className="text-sm text-neutral-500">Submitted by {currentStudent.name}</p>
                  </div>
                  <button
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 px-4 py-2 bg-accent-2/10 text-accent-2 hover:bg-accent-2/10 dark:bg-accent-2 dark:text-accent-2 dark:hover:bg-accent-2 rounded-xl text-sm font-bold border border-accent-2/20 dark:border-accent-2 transition-colors"
                  >
                    <Download className="w-4 h-4" /> Export Report
                  </button>
                </div>
              </div>

              {/* Answers Map */}
              <div className="space-y-6">
                {currentAssessment.questions?.map((q, idx) => {
                  const answerObj = currentSub.answers.find((a) => a.questionId === q.id);
                  return (
                    <div
                      key={q.id}
                      className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden"
                    >
                      <div className="p-5 border-b border-neutral-100 dark:border-neutral-800">
                        <div className="flex justify-between items-start gap-4">
                          <h4 className="font-bold text-sm text-neutral-800 dark:text-neutral-200 flex-1">
                            <span className="text-neutral-400 mr-2">{idx + 1}.</span>
                            {q.text || q.question || "Untitled Question"}
                          </h4>
                          <div className="shrink-0 text-xs font-bold text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">
                            {q.marks} Marks
                          </div>
                        </div>
                      </div>

                      <div className="p-5 bg-neutral-50 dark:bg-[#0a0a0a]">
                        <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                          Student's Answer:
                        </p>
                        {currentAssessment.type === "coding" ? (
                          <div className="bg-[#1e1e1e] rounded-xl p-4 overflow-x-auto shadow-inner border border-neutral-800 text-neutral-300 font-mono text-xs whitespace-pre-wrap">
                            {answerObj?.answer
                              ? typeof answerObj.answer === "object" &&
                                !Array.isArray(answerObj.answer)
                                ? answerObj.answer.code
                                : answerObj.answer
                              : "No code submitted."}
                          </div>
                        ) : (
                          <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm text-sm text-neutral-700 dark:text-neutral-300">
                            {answerObj ? (
                              formatAnswerText(q, answerObj.answer)
                            ) : (
                              <span className="italic text-neutral-400">No answer provided</span>
                            )}
                          </div>
                        )}

                        <div className="mt-4">
                          <p className="text-xs font-bold text-[#01AC9F] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5" /> Expected Correct Answer:
                          </p>
                          <div className="bg-accent-2/10 dark:bg-accent-2 p-4 rounded-xl border border-accent-2/20 dark:border-accent-2 shadow-sm text-sm text-accent-2 dark:text-accent-2">
                            {(q.correctAnswer !== undefined &&
                              q.correctAnswer !== null &&
                              q.correctAnswer !== "") ||
                            (q.correctAnswers && q.correctAnswers.length > 0) ? (
                              formatAnswerText(
                                q,
                                q.correctAnswer !== undefined ? q.correctAnswer : q.correctAnswers,
                              )
                            ) : q.type === "coding" && (q.codingTestCases || q.testCases) ? (
                              <div className="space-y-1.5 mt-1">
                                <span className="text-xs font-bold text-accent-2 dark:text-accent-2">
                                  Code must pass {(q.codingTestCases || q.testCases).length} test
                                  cases
                                </span>
                                {(q.codingTestCases || q.testCases).map((tc, i) => (
                                  <div
                                    key={i}
                                    className="text-[10px] font-mono bg-accent-2/10 dark:bg-accent-2 p-1.5 rounded border border-accent-2/20 dark:border-accent-2 text-accent-2 dark:text-accent-2"
                                  >
                                    <span className="opacity-70">IN:</span> {tc.input}{" "}
                                    <span className="opacity-70 ml-2">OUT:</span> {tc.output}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="italic opacity-60">
                                Manual evaluation required / No strict rubric defined
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Grading Panel */}
          <div className="w-full lg:w-[400px] h-1/2 lg:h-auto shrink-0 bg-white dark:bg-neutral-900 border-t lg:border-t-0 lg:border-l border-neutral-200 dark:border-neutral-800 flex flex-col shadow-xl z-20">
            <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-neutral-900/95 backdrop-blur z-10">
              <h3 className="font-bold text-sm flex items-center gap-2 dark:text-white">
                <Award className="w-4 h-4 text-[#6C1D5F]" /> Grading Panel
              </h3>
              <button
                onClick={handleAutoEvaluate}
                disabled={isEvaluatingAi || currentSub.isEvaluated}
                className="text-[10px] font-bold flex items-center gap-1 text-white bg-[#6C1D5F] hover:bg-[#84117C] px-3 py-1.5 rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isEvaluatingAi ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Bot className="w-3 h-3" />
                )}
                {isEvaluatingAi ? "Analyzing..." : "Auto Evaluation Using AI"}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              <div className="space-y-4">
                {currentAssessment.questions?.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-4 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                        Q{idx + 1} Marks
                      </span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max={q.marks}
                          value={questionMarks[q.id] !== undefined ? questionMarks[q.id] : ""}
                          onChange={(e) => handleMarkChange(q.id, Number(e.target.value), q.marks)}
                          className="w-16 px-2 py-1 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded text-sm text-center font-bold focus:ring-2 focus:ring-[#6C1D5F] focus:outline-none dark:text-white"
                        />
                        <span className="text-xs text-neutral-500 font-bold">/ {q.marks}</span>
                      </div>
                    </div>

                    {!currentSub.isEvaluated && currentSub.aiConfidence && (
                      <div className="flex items-start gap-2 p-2 bg-accent-2/10 dark:bg-accent-2 rounded border border-accent-2/20 dark:border-accent-2">
                        <Bot className="w-3.5 h-3.5 text-accent-2 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-bold text-accent-2 dark:text-accent-2">
                            AI Suggestion: {Math.round(q.marks * 0.8)} / {q.marks}
                          </p>
                          <p className="text-[9px] text-accent-2/70 dark:text-accent-2/70">
                            "Answer covers most key points correctly."
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase">
                        Remarks
                      </label>
                      <input
                        type="text"
                        placeholder="Optional feedback..."
                        value={questionRemarks[q.id] || ""}
                        onChange={(e) => handleRemarkChange(q.id, e.target.value)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs focus:ring-2 focus:ring-[#6C1D5F] focus:outline-none dark:text-white"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <label className="flex items-center gap-1.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                  <MessageSquare className="w-3.5 h-3.5 text-neutral-400" /> Overall Feedback
                </label>
                <textarea
                  rows={4}
                  placeholder="Summarize the student's performance..."
                  value={overallRemarks}
                  onChange={(e) => setOverallRemarks(e.target.value)}
                  className="w-full p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:ring-2 focus:ring-[#6C1D5F] focus:outline-none resize-none dark:text-white shadow-sm"
                />
              </div>
            </div>

            <div className="p-5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold text-neutral-500">Total Score:</span>
                <span className="text-2xl font-black text-[#6C1D5F] dark:text-primary">
                  {Object.values(questionMarks).reduce((a, b) => a + b, 0)}{" "}
                  <span className="text-sm text-neutral-400">/ {currentAssessment.marks}</span>
                </span>
              </div>
              <button
                onClick={handleSubmitEvaluation}
                className="w-full py-3 bg-gradient-to-r from-[#6C1D5F] to-[#84117C] text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Publish Evaluation
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 bg-neutral-50/50 dark:bg-neutral-950/20">
          <Layers className="w-16 h-16 mb-4 opacity-20" />
          <p className="text-lg font-bold text-neutral-500 dark:text-neutral-400">
            Select a submission to evaluate
          </p>
          <p className="text-sm mt-1">Click on any student in the queue to begin grading.</p>
        </div>
      )}
    </div>
  );
};
