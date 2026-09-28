import React from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { useLMS } from "../context/LMSContext";
import { motion } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  ArrowLeft,
  CornerDownRight,
  MessageSquare,
  FileText,
} from "lucide-react";

export const Results = () => {
  const { id } = useParams({ strict: false });
  const { submissions, assessments, students } = useLMS();
  const navigate = useNavigate();

  const submission = submissions.find((s) => s.id === id);
  if (!submission) {
    return (
      <div className="p-8 text-center bg-white dark:bg-[#15151f] rounded-2xl border border-gray-200 dark:border-[#2e2e3e]">
        <p className="text-sm font-semibold text-gray-500">Submission record not found.</p>
      </div>
    );
  }

  const assessment = assessments.find((a) => a.id === submission.assessmentId);
  const student = students.find((s) => s.id === submission.studentId);
  const passingMarks = assessment?.passingMarks ?? 75;

  if (!assessment) {
    return (
      <div className="p-8 text-center bg-white dark:bg-[#15151f] rounded-2xl border border-gray-200 dark:border-[#2e2e3e]">
        <p className="text-sm font-semibold text-gray-500">Associated assessment template has been removed.</p>
      </div>
    );
  }

  const isPassed = submission.percentage >= passingMarks;

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.04 } } };
  const itemVariants = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

  return (
    <div className="space-y-5 pb-6 animate-in fade-in duration-500">
      {/* Back + Certificate */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigate({ to: "/student/results" })}
          className="text-xs font-bold text-gray-500 hover:text-gray-700 flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Results
        </button>
        {submission.isEvaluated && isPassed && (
          <button
            onClick={() => navigate({ to: `/student/certificate/${submission.id}` })}
            className="text-xs font-bold text-white bg-[#6C1D5F] hover:bg-[#84117C] px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
          >
            View Certificate
          </button>
        )}
      </div>

      {/* Score Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-[#15151f] border border-gray-200 dark:border-[#2e2e3e] rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4"
      >
        <div className="text-center md:text-left">
          <div className="flex flex-wrap gap-2 items-center justify-center md:justify-start mb-2">
            <span className="px-2.5 py-0.5 bg-[#6C1D5F]/10 text-[#6C1D5F] font-bold rounded-lg text-[10px] uppercase">
              Exam Closed
            </span>
            {submission.isEvaluated ? (
              isPassed ? (
                <span className="px-2.5 py-0.5 bg-[#01AC9F]/10 text-[#01AC9F] font-bold rounded-lg text-[10px] uppercase">
                  Passed
                </span>
              ) : (
                <span className="px-2.5 py-0.5 bg-rose-500/10 text-rose-500 font-bold rounded-lg text-[10px] uppercase">
                  Failed
                </span>
              )
            ) : (
              <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-500 font-bold rounded-lg text-[10px] uppercase animate-pulse">
                Evaluating
              </span>
            )}
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white leading-tight">{assessment.title}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Student: {student?.name || "—"}</p>
          {submission.remarks && (
            <div className="mt-3 p-3 bg-[#6C1D5F]/5 rounded-xl flex items-start gap-2.5 text-left max-w-lg">
              <MessageSquare className="w-4 h-4 text-[#6C1D5F] shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Trainer Feedback</p>
                <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5 leading-relaxed">"{submission.remarks}"</p>
              </div>
            </div>
          )}
        </div>

        {/* Score Circle */}
        <div className="flex flex-col items-center shrink-0">
          <div className={`w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center shadow-md ${
            submission.isEvaluated
              ? isPassed ? "border-[#01AC9F] bg-[#01AC9F]/5" : "border-rose-500 bg-rose-500/5"
              : "border-amber-500 bg-amber-500/5"
          }`}>
            <span className="text-[8px] text-gray-400 font-bold uppercase">Score</span>
            <span className="text-2xl font-extrabold text-gray-900 dark:text-white mt-0.5">
              {submission.isEvaluated ? `${submission.percentage}%` : "—"}
            </span>
            <span className="text-[9px] text-gray-400 font-mono">
              {submission.isEvaluated ? `${submission.score}/${assessment.marks}` : "--/--"}
            </span>
          </div>
          <p className="text-[9px] text-gray-400 font-bold mt-2 uppercase">
            Pass: {passingMarks}%
          </p>
        </div>
      </motion.div>

      {/* Questions */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Answers</h3>
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-3">
          {assessment.questions.map((q, idx) => {
            const ansObj = submission.answers?.find((sa) => sa.questionId === q.id);
            const studentAns = ansObj?.answer;
            const parseSelections = (value) => {
              if (Array.isArray(value)) return value;
              if (typeof value !== "string") return [];
              try {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed)) return parsed;
              } catch { /* legacy comma-separated answer */ }
              return value.split(",").map((part) => part.trim()).filter(Boolean);
            };
            const selectedOptions = parseSelections(studentAns);
            const correctOptions = parseSelections(q.correctAnswer);
            let uploadedFile = studentAns;
            if (typeof studentAns === "string" && studentAns.startsWith("{\"name\":")) {
              try { uploadedFile = JSON.parse(studentAns); } catch { uploadedFile = null; }
            }
            const marksAwarded = ansObj?.marksAwarded !== undefined ? ansObj.marksAwarded : 0;
            const isCorrect = marksAwarded > 0 || ansObj?.isCorrect;
            const isEvaluated = submission.isEvaluated;

            return (
              <motion.div
                key={q.id}
                variants={itemVariants}
                className={`bg-white dark:bg-[#15151f] border rounded-2xl p-4 space-y-3 shadow-sm ${
                  isEvaluated
                    ? isCorrect ? "border-[#01AC9F]/20" : "border-rose-500/20"
                    : "border-gray-200 dark:border-[#2e2e3e]"
                }`}
              >
                {/* Header */}
                <div className="flex justify-between items-center border-b border-gray-100 dark:border-[#2e2e3e] pb-2">
                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-[#1a1a2e] text-gray-500 font-bold rounded text-[10px]">
                    Q{idx + 1} • {q.type.toUpperCase()}
                  </span>
                  <span className="font-mono font-bold text-xs text-gray-500">
                    <span className={isCorrect ? "text-[#01AC9F]" : "text-gray-500"}>{marksAwarded}</span> / {q.marks} pts
                  </span>
                </div>

                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-relaxed">{q.question}</p>

                {/* Answers Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-2.5 bg-gray-50 dark:bg-[#1a1a2e] rounded-xl border border-gray-100 dark:border-[#2e2e3e]">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide flex items-center gap-1 mb-1">
                      Your Answer
                      {isEvaluated && (isCorrect ? <CheckCircle className="w-3 h-3 text-[#01AC9F]" /> : <XCircle className="w-3 h-3 text-rose-500" />)}
                    </p>
                    <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {q.type === "mcq" || q.type === "true_false" ? (
                        <span>{q.options?.[Number(studentAns)] || studentAns}</span>
                      ) : (q.type === "multiple_select" || q.type === "multi_select") && selectedOptions.length > 0 ? (
                        <ul className="list-disc pl-4 space-y-0.5">{selectedOptions.map((s, i) => <li key={i}>{q.options?.[Number(s)] || s}</li>)}</ul>
                      ) : q.type === "file_upload" ? (
                        <span>{uploadedFile?.name || (studentAns ? "File attached" : "No file submitted")}</span>
                      ) : (
                        <p className="whitespace-pre-wrap italic">"{studentAns || 'No response.'}"</p>
                      )}
                    </div>
                  </div>

                  {isEvaluated && (
                    <div className="p-2.5 bg-[#01AC9F]/5 rounded-xl border border-[#01AC9F]/20">
                      <p className="text-[10px] text-[#01AC9F] font-bold uppercase tracking-wide mb-1">Correct Answer</p>
                      <div className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        {q.type === "mcq" || q.type === "true_false" ? (
                          <span className="text-[#01AC9F]">{q.options?.[Number(q.correctAnswer)] || q.correctAnswer}</span>
                        ) : (q.type === "multiple_select" || q.type === "multi_select") && correctOptions.length > 0 ? (
                          <ul className="list-disc pl-4 space-y-0.5 text-[#01AC9F]">{correctOptions.map((s, i) => <li key={i}>{q.options?.[Number(s)] || s}</li>)}</ul>
                        ) : (
                          <span className="text-gray-400 font-medium">Manual review required</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Remarks / Explanation */}
                {(ansObj?.remarks || (isEvaluated && q.explanation)) && (
                  <div className="pt-2 border-t border-dashed border-gray-100 dark:border-[#2e2e3e] space-y-1">
                    {ansObj?.remarks && (
                      <p className="text-[11px] text-[#6C1D5F] font-medium flex items-start gap-1">
                        <CornerDownRight className="w-3 h-3 shrink-0 mt-0.5" />
                        Remarks: "{ansObj.remarks}"
                      </p>
                    )}
                    {isEvaluated && q.explanation && (
                      <p className="text-[11px] text-[#01AC9F] font-medium flex items-start gap-1">
                        <CornerDownRight className="w-3 h-3 shrink-0 mt-0.5" />
                        Explanation: {q.explanation}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};
