import React, { useState, useRef } from "react";
import {
  Plus,
  Wand2,
  Trash2,
  Code2,
  Text,
  FileText,
  CheckCircle,
  Brain,
  Library,
  Loader2,
  ListChecks,
  GripVertical,
  Edit,
  Upload,
  Download,
  ChevronUp,
  ChevronDown,
  X,
  Check,
  Circle,
} from "lucide-react";
import * as XLSX from "xlsx";
import { motion, AnimatePresence } from "framer-motion";
import { generateQuestions, parseExcelToQuestions } from "../../utils/aiService";
import { toast } from "../Toast";

export const QuestionBuilderPanel = ({
  questions,
  setQuestions,
  config,
  isDesktopConfigOpen,
  setIsDesktopConfigOpen,
}) => {
  const [addingManual, setAddingManual] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const fileInputRef = useRef(null);

  // Inline draft for new/editing question
  const [draftText, setDraftText] = useState("");
  const [draftType, setDraftType] = useState("mcq");
  const [draftCodingCases, setDraftCodingCases] = useState('[{"input":"","expected":"","weight":1,"visibility":"public"}]');
  const [draftCodingLanguages, setDraftCodingLanguages] = useState("javascript, python");
  const [draftOptions, setDraftOptions] = useState(["", "", "", ""]);
  const [draftCorrectAnswer, setDraftCorrectAnswer] = useState("");
  const [draftMarks, setDraftMarks] = useState(1);

  const isConfigComplete =
    config && config.title && config.topic && config.type && config.difficulty && config.duration && config.marks;

  const questionTypes = [
    { id: "mcq", label: "Single Choice (MCQ)", icon: CheckCircle },
    { id: "true_false", label: "True / False", icon: CheckCircle },
    { id: "multiple_select", label: "Multiple Choice (Multiple Select)", icon: ListChecks },
    { id: "short_answer", label: "Short Answer", icon: Text },
    { id: "paragraph", label: "Paragraph", icon: Text },
    { id: "file_upload", label: "File Upload", icon: FileText },
    { id: "coding", label: "Coding Challenge", icon: Code2 },
  ];

  const availableQuestionTypes =
    config?.type === "Mixed Types (All)" || !config?.type
      ? questionTypes
      : questionTypes.filter((t) => t.id === config.type);

  // ── Helpers ──────────────────────────────────────────────

  const getQuestionText = (q) => q.text || q.question || q.questionText || q["Question Text"] || "";

  const getQuestionType = (q) => q.type || config?.type || "mcq";

  const isOptionType = (q) => ["mcq", "multiple_select", "true_false"].includes(getQuestionType(q));

  // ── Add New (opens inline form at top) ───────────────────

  const startAddNew = () => {
    setEditingId(null);
    setDraftText("");
    setDraftType(config?.type === "mixed" || config?.type === "Mixed Types (All)" ? "mcq" : config?.type || "mcq");
    setDraftCodingCases('[{"input":"","expected":"","weight":1,"visibility":"public"}]');
    setDraftCodingLanguages("javascript, python");
    setDraftOptions(config?.type === "true_false" ? ["True", "False"] : ["", "", "", ""]);
    setDraftCorrectAnswer("");
    setDraftMarks(1);
    setAddingManual(true);
  };

  const startEdit = (q, idx) => {
    const text = getQuestionText(q);
    const opts = q.options ? [...q.options] : ["", "", "", ""];
    while (opts.length < 4) opts.push("");
    setEditingId(q.id || `idx_${idx}`);
    setDraftText(text);
    setDraftType(q.type || config?.type || "mcq");
    setDraftCodingCases(JSON.stringify(q.codingTestCases || [{ input: "", expected: "", weight: 1, visibility: "public" }], null, 2));
    setDraftCodingLanguages((q.codingLanguagesAllowed || ["javascript", "python"]).join(", "));
    setDraftOptions(q.type === "true_false" ? ["True", "False"] : opts.slice(0, 8));
    setDraftCorrectAnswer(
      Array.isArray(q.correctAnswer) ? q.correctAnswer.join(", ") : (q.correctAnswer || "")
    );
    setDraftMarks(q.marks || 1);
    setAddingManual(false);
  };

  const cancelForm = () => {
    setAddingManual(false);
    setEditingId(null);
    setDraftText("");
    setDraftType(config?.type === "mixed" || config?.type === "Mixed Types (All)" ? "mcq" : config?.type || "mcq");
    setDraftOptions(["", "", "", ""]);
    setDraftCorrectAnswer("");
    setDraftMarks(1);
  };

  const saveForm = () => {
    if (!draftText.trim()) {
      toast.add("Question text cannot be empty", "error");
      return;
    }

    const trimmedOptions = draftType === "true_false" ? ["True", "False"] : draftOptions.filter((o) => o.trim() !== "");
    let codingCases = [];
    if (draftType === "coding") {
      try { codingCases = JSON.parse(draftCodingCases); } catch { toast.add("Coding test cases must be valid JSON", "error"); return; }
      if (!Array.isArray(codingCases) || codingCases.length === 0 || codingCases.some((tc) => !tc || typeof tc !== "object" || tc.input == null || tc.expected == null)) { toast.add("Add at least one valid coding test case with input and expected output", "error"); return; }
    }
    if (["mcq", "multiple_select", "true_false"].includes(draftType)) {
      if (trimmedOptions.length < 2) { toast.add("Add at least two options", "error"); return; }
      if (!draftCorrectAnswer.trim()) { toast.add("Mark the correct answer", "error"); return; }
    }

    if (editingId !== null) {
      // Update existing question in-place
      const idx = questions.findIndex((q) => (q.id || `idx_${questions.indexOf(q)})`) === editingId);
      if (idx >= 0) {
        const updated = [...questions];
        updated[idx] = {
          ...updated[idx],
          type: draftType,
          codingTestCases: draftType === "coding" ? codingCases : undefined,
          codingLanguagesAllowed: draftType === "coding" ? draftCodingLanguages.split(",").map((v) => v.trim()).filter(Boolean) : undefined,
          text: draftText,
          question: draftText,
          questionText: draftText,
          options: ["mcq", "multiple_select", "true_false"].includes(draftType) ? trimmedOptions : undefined,
          correctAnswer: ["mcq", "multiple_select", "true_false"].includes(draftType) ? (draftCorrectAnswer.trim() || undefined) : undefined,
          marks: draftMarks || updated[idx].marks,
        };
        setQuestions(updated);
        toast.add("Question updated", "success");
      }
    } else {
      // Create new
      const newQuestion = {
        id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: draftType,
        ...(draftType === "coding" ? { codingTestCases: codingCases, codingLanguagesAllowed: draftCodingLanguages.split(",").map((v) => v.trim()).filter(Boolean) } : {}),
        question: draftText,
        text: draftText,
        marks: draftMarks || 1,
        options: ["mcq", "multiple_select", "true_false"].includes(draftType) ? trimmedOptions : undefined,
        correctAnswer: draftCorrectAnswer.trim() || undefined,
      };
      setQuestions([newQuestion, ...questions]);
      toast.add("Question added", "success");
    }
    cancelForm();
  };

  // ── Delete ───────────────────────────────────────────────

  const handleDelete = (index) => {
    const newQs = [...questions];
    newQs.splice(index, 1);
    setQuestions(newQs);
    if (editingId === questions[index]?.id) cancelForm();
  };

  // ── Reorder options (in draft) ───────────────────────────

  const moveOption = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= draftOptions.length) return;
    const newOpts = [...draftOptions];
    const [item] = newOpts.splice(fromIdx, 1);
    newOpts.splice(toIdx, 0, item);
    setDraftOptions(newOpts);
  };

  // ── Reorder questions ────────────────────────────────────

  const moveQuestion = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= questions.length) return;
    const newQs = [...questions];
    const [item] = newQs.splice(fromIdx, 1);
    newQs.splice(toIdx, 0, item);
    setQuestions(newQs);
  };

  // ── AI Generation ────────────────────────────────────────

  const handleGenerateQuestions = async () => {
    if (!config?.topic) {
      toast.add("Please enter a topic in the configuration panel first.", "error");
      return;
    }
    const targetCount = Number(config?.aiCount) || 5;
    const remainingToGenerate = Math.max(0, targetCount - questions.length);
    if (remainingToGenerate === 0) {
      toast.add(`You already have ${questions.length} questions. Remove some to generate more.`, "info");
      return;
    }
    const taxonomy = config?.aiTaxonomy || "Understanding";
    const type = config?.type || "mcq";
    setIsGeneratingAi(true);
    toast.add(`Generating ${remainingToGenerate} questions...`, "info");
    try {
      const generated = await generateQuestions(config.topic, remainingToGenerate, taxonomy, type);
      if (generated && generated.length > 0) {
        const totalMarksTarget = Number(config.marks) || targetCount;
        const currentTotal = questions.reduce((s, q) => s + (q.marks || 0), 0);
        const marksToDistribute = Math.max(generated.length, totalMarksTarget - currentTotal);
        const baseMark = Math.floor(marksToDistribute / generated.length);
        const remainder = marksToDistribute % generated.length;
        const mappedQuestions = generated.map((q, idx) => ({
          ...q,
          marks: baseMark + (idx < remainder ? 1 : 0),
        }));
        setQuestions([...questions, ...mappedQuestions]);
        toast.add(`Generated ${generated.length} questions!`, "success");
      } else {
        toast.add("Failed to generate questions.", "error");
      }
    } catch (err) {
      toast.add("Error generating questions.", "error");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // ── Excel ────────────────────────────────────────────────

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        setIsGeneratingAi(true);
        toast.add("Parsing Excel file...", "info");
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);
        if (data.length === 0) { toast.add("No data found.", "error"); setIsGeneratingAi(false); return; }
        const parsed = await parseExcelToQuestions(data);
        setQuestions([...questions, ...parsed]);
        toast.add(`Imported ${parsed.length} questions!`, "success");
      } catch (error) {
        toast.add("Failed to parse Excel file.", "error");
      } finally {
        setIsGeneratingAi(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { Type: "mcq", "Question Text": "What is the capital of France?", "Option 1": "London", "Option 2": "Berlin", "Option 3": "Paris", "Option 4": "Madrid", "Correct Answer": "Paris", Marks: 2 },
      { Type: "true_false", "Question Text": "The earth is flat.", "Option 1": "True", "Option 2": "False", "Correct Answer": "False", Marks: 1 },
    ]);
    XLSX.writeFile(XLSX.utils.book_append_sheet(XLSX.utils.book_new(), ws, "Template"), "Assessment_Template.xlsx");
  };

  const handleExportQuestions = () => {
    if (!questions.length) { toast.add("No questions to export.", "info"); return; }
    const exportData = questions.map((q) => {
      const row = { Type: q.type || "mcq", "Question Text": getQuestionText(q) };
      if (q.options) q.options.forEach((opt, i) => { row[`Option ${i + 1}`] = opt; });
      row["Correct Answer"] = Array.isArray(q.correctAnswer) ? q.correctAnswer.join(", ") : (q.correctAnswer || "");
      row["Marks"] = q.marks || 1;
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.writeFile(XLSX.utils.book_append_sheet(XLSX.utils.book_new(), ws, "Questions"), `${config?.title?.replace(/[^a-z0-9]/gi, "_") || "Assessment"}_Questions.xlsx`);
    toast.add("Exported!", "success");
  };

  // ── Render Inline Form ───────────────────────────────────

  const renderInlineForm = (isEdit) => {
    const qType = isEdit ? (questions.find((q) => q.id === editingId)?.type || config?.type) : draftType;
    const showOptions = ["mcq", "multiple_select", "true_false"].includes(qType);

    return (
      <motion.div
        initial={{ opacity: 0, y: -10, height: 0 }}
        animate={{ opacity: 1, y: 0, height: "auto" }}
        exit={{ opacity: 0, y: -10, height: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white dark:bg-neutral-900 border-2 border-[#6C1D5F]/30 rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6C1D5F] bg-[#6C1D5F]/10 px-2.5 py-1 rounded-lg">
              {isEdit ? "Edit Question" : "New Question"}
            </span>
            <button onClick={cancelForm} className="p-1 text-neutral-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {(config?.type === "mixed" || config?.type === "Mixed Types (All)") && (
            <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Question type
              <select value={draftType} onChange={(e) => { setDraftType(e.target.value); setDraftCorrectAnswer(""); setDraftOptions(e.target.value === "true_false" ? ["True", "False"] : ["", "", "", ""]); }} className="block w-full mt-1 px-3 py-2 rounded-lg border bg-white dark:bg-neutral-950 dark:text-white">
                {questionTypes.filter((type) => type.id !== "coding").map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}
              </select>
            </label>
          )}

          {/* Question Text */}
          <textarea
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            rows={2}
            placeholder="Type your question here..."
            className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6C1D5F]/30 dark:text-white resize-none"
          />

          {qType === "coding" && <div className="space-y-2">
            <label className="block text-[10px] font-bold text-neutral-500 uppercase">Coding test cases (JSON: input, expected, weight, visibility)</label>
            <textarea value={draftCodingCases} onChange={(e) => setDraftCodingCases(e.target.value)} rows={5} className="w-full rounded-lg border bg-neutral-50 dark:bg-neutral-950 dark:text-white p-2 font-mono text-xs" />
            <label className="block text-[10px] font-bold text-neutral-500 uppercase">Allowed languages (comma separated)</label>
            <input value={draftCodingLanguages} onChange={(e) => setDraftCodingLanguages(e.target.value)} className="w-full rounded-lg border bg-neutral-50 dark:bg-neutral-950 dark:text-white p-2 text-xs" />
          </div>}

          {/* Options (with reorder + correct answer) */}
          {showOptions && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Options</label>
              {draftOptions.map((opt, i) => {
                if (i >= 2 && opt.trim() === "" && draftOptions.slice(i).every((o) => o.trim() === "")) return null;
                const isCorrect = draftCorrectAnswer.trim().toLowerCase() === opt.trim().toLowerCase()
                  || draftCorrectAnswer.split(",").map((s) => s.trim().toLowerCase()).includes(opt.trim().toLowerCase());
                return (
                  <div key={i} className="flex items-center gap-1.5">
                    {/* Correct Answer Toggle */}
                    <button
                      onClick={() => {
                        if (qType === "multiple_select") {
                          const current = draftCorrectAnswer.split(",").map((s) => s.trim()).filter(Boolean);
                          if (current.includes(opt)) {
                            setDraftCorrectAnswer(current.filter((c) => c !== opt).join(", "));
                          } else {
                            setDraftCorrectAnswer([...current, opt].join(", "));
                          }
                        } else {
                          setDraftCorrectAnswer(opt);
                        }
                      }}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        isCorrect && opt.trim()
                          ? "bg-[#01AC9F] border-[#01AC9F] text-white"
                          : "border-neutral-300 dark:border-neutral-600 hover:border-[#01AC9F]"
                      }`}
                      title="Mark as correct answer"
                    >
                      {isCorrect && opt.trim() && <Check className="w-3 h-3" />}
                    </button>

                    <input
                      type="text"
                      value={opt}
                      disabled={qType === "true_false"}
                      onChange={(e) => {
                        const newOpts = [...draftOptions];
                        newOpts[i] = e.target.value;
                        setDraftOptions(newOpts);
                      }}
                      placeholder={`Option ${i + 1}`}
                      className="flex-1 px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#6C1D5F]/30 dark:text-white"
                    />

                    {/* Reorder */}
                    {qType !== "true_false" && <div className="flex flex-col -space-y-0.5 shrink-0">
                      <button onClick={() => moveOption(i, i - 1)} disabled={i === 0} className="p-0.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 disabled:opacity-20">
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button onClick={() => moveOption(i, i + 1)} disabled={i === draftOptions.length - 1 || (i >= draftOptions.findIndex((o) => o.trim() === "") && draftOptions[i + 1]?.trim() === "")} className="p-0.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 disabled:opacity-20">
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>}

                    {/* Remove option */}
                    {qType !== "true_false" && <button
                      onClick={() => {
                        const newOpts = [...draftOptions];
                        newOpts.splice(i, 1);
                        newOpts.push("");
                        setDraftOptions(newOpts);
                      }}
                      className="p-0.5 text-neutral-400 hover:text-red-500 shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </button>}
                  </div>
                );
              })}
              {qType !== "true_false" && draftOptions.filter((o) => o.trim() !== "").length < draftOptions.length && (
                <button
                  onClick={() => {
                    const firstEmpty = draftOptions.findIndex((o) => o.trim() === "");
                    if (firstEmpty >= 0) {
                      const newOpts = [...draftOptions];
                      newOpts[firstEmpty] = "";
                      setDraftOptions(newOpts);
                    } else {
                      setDraftOptions([...draftOptions, ""]);
                    }
                  }}
                  className="text-[10px] font-bold text-[#6C1D5F] hover:underline"
                >
                  + Add Option
                </button>
              )}
            </div>
          )}

          {/* Non-option: Correct Answer text */}
          {!showOptions && (
            <div>
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Correct Answer</label>
              <input
                type="text"
                value={draftCorrectAnswer}
                onChange={(e) => setDraftCorrectAnswer(e.target.value)}
                placeholder="Expected answer..."
                className="w-full px-2.5 py-1.5 mt-1 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#6C1D5F]/30 dark:text-white"
              />
            </div>
          )}

          {/* Footer: Marks + Save/Cancel */}
          <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <label className="text-[10px] font-bold text-neutral-500 flex items-center gap-1.5">
              Marks:
              <input
                type="number"
                min="1"
                value={draftMarks}
                onChange={(e) => setDraftMarks(parseInt(e.target.value) || 1)}
                className="w-12 px-1.5 py-0.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded text-xs text-center focus:outline-none focus:ring-1 focus:ring-[#6C1D5F]/30 dark:text-white"
              />
            </label>
            <div className="flex gap-1.5">
              <button onClick={cancelForm} className="px-3 py-1.5 text-[11px] font-bold text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={saveForm} className="px-3 py-1.5 bg-[#6C1D5F] hover:bg-[#84117C] text-white text-[11px] font-bold rounded-lg shadow-sm transition-colors">
                {isEdit ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // ── Render Question Card ─────────────────────────────────

  const renderQuestionCard = (q, idx) => {
    const isEditing = editingId === (q.id || `idx_${idx}`);
    const qType = getQuestionType(q);
    const qText = getQuestionText(q);
    const opts = q.options || [];
    const correct = q.correctAnswer;

    if (isEditing) return <div key={q.id || idx}>{renderInlineForm(true)}</div>;

    return (
      <motion.div
        key={q.id || idx}
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.15 }}
        className="group bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 hover:shadow-md transition-all"
      >
        {/* Top row: number + text + actions */}
        <div className="flex items-start gap-2">
          {/* Reorder buttons */}
          <div className="flex flex-col gap-0.5 pt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => moveQuestion(idx, idx - 1)} disabled={idx === 0} className="p-0.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 disabled:opacity-20">
              <ChevronUp className="w-3 h-3" />
            </button>
            <button onClick={() => moveQuestion(idx, idx + 1)} disabled={idx === questions.length - 1} className="p-0.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 disabled:opacity-20">
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          <span className="text-[11px] font-bold text-[#6C1D5F] bg-[#6C1D5F]/10 w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5">
            {idx + 1}
          </span>

          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-neutral-900 dark:text-white leading-snug">
              {qText || "Untitled"}
            </p>

            {/* Options preview */}
            {isOptionType(q) && opts.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {opts.map((opt, oi) => {
                  const isCorrect = correct === opt || (Array.isArray(correct) && correct.includes(opt));
                  return (
                    <span key={oi} className={`text-[11px] px-2 py-0.5 rounded-md border ${
                      isCorrect
                        ? "border-[#01AC9F] bg-[#01AC9F]/10 text-[#01AC9F] font-bold"
                        : "border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400"
                    }`}>
                      {isCorrect && <Check className="w-2.5 h-2.5 inline -mt-0.5 mr-0.5" />}
                      {opt}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Tags row */}
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[9px] font-bold uppercase text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                {qType.replace("_", " ")}
              </span>
              <span className="text-[9px] font-bold text-[#6C1D5F] bg-[#6C1D5F]/10 px-1.5 py-0.5 rounded">
                {q.marks || 1} pt{(q.marks || 1) !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => startEdit(q, idx)}
              className="p-1.5 text-neutral-400 hover:text-[#6C1D5F] hover:bg-[#6C1D5F]/10 rounded-lg transition-colors"
              title="Edit"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleDelete(idx)}
              className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  // ── Main Return ──────────────────────────────────────────

  return (
    <div className="h-full w-full flex flex-col bg-neutral-50 dark:bg-[#0a0a0a] overflow-hidden relative">
      {/* Header */}
      <div className="px-4 xl:px-6 py-3 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur shrink-0 z-10">
        <div className="shrink-0">
          <h2 className="font-display font-black text-base text-neutral-900 dark:text-white flex items-center gap-2">
            <Library className="w-4 h-4 text-[#6C1D5F]" /> Questions
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[9px] uppercase font-bold text-neutral-400 bg-white dark:bg-neutral-800 px-2 py-1 rounded border border-neutral-200 dark:border-neutral-700">
              {questions.reduce((a, q) => a + (q.marks || 0), 0)} pts
            </span>
            <span className="text-[9px] uppercase font-bold text-neutral-400 bg-white dark:bg-neutral-800 px-2 py-1 rounded border border-neutral-200 dark:border-neutral-700">
              {questions.length} Qs
            </span>
          </div>

          <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800 hidden sm:block" />

          <button onClick={startAddNew} disabled={!isConfigComplete}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-[11px] font-bold transition-colors">
            <Plus className="w-3 h-3" /> Add
          </button>
          <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" ref={fileInputRef} />
          <button onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-[11px] font-bold transition-colors">
            <Upload className="w-3 h-3" /> Import
          </button>
          <button onClick={handleDownloadTemplate}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-[11px] font-bold transition-colors">
            <Download className="w-3 h-3" /> Template
          </button>
          <button onClick={handleExportQuestions} disabled={questions.length === 0}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-[11px] font-bold transition-colors">
            <Download className="w-3 h-3" /> Export
          </button>
          <button onClick={() => setQuestions([])} disabled={questions.length === 0}
            className="flex items-center justify-center p-1.5 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            title="Remove All">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleGenerateQuestions} disabled={!isConfigComplete || isGeneratingAi}
            className={`flex items-center justify-center p-1.5 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all ${isGeneratingAi ? "bg-[#6C1D5F] scale-110" : "bg-[#6C1D5F] hover:bg-[#84117C] hover:-translate-y-0.5 hover:shadow-lg"}`}
            title="Generate with AI">
            <Wand2 className={`w-3.5 h-3.5 ${isGeneratingAi ? "animate-bounce" : ""}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-2 py-3 bg-neutral-100/50 dark:bg-[#050505] relative">
        {!isConfigComplete && (
          <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-[2px] z-20 flex items-center justify-center">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 rounded-2xl shadow-xl max-w-sm text-center space-y-2">
              <div className="w-10 h-10 bg-[#6C1D5F]/10 rounded-full flex items-center justify-center mx-auto">
                <Library className="w-5 h-5 text-[#6C1D5F]" />
              </div>
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Configuration Required</h3>
              <p className="text-xs text-neutral-500">Complete all fields in the Configuration panel before adding questions.</p>
            </div>
          </div>
        )}

        <div className="w-full space-y-2 pb-16">
          {questions.length === 0 && !addingManual && (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <Brain className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mb-3" />
              <h3 className="text-sm font-bold text-neutral-400">No questions yet</h3>
              <p className="text-[11px] text-neutral-500 mt-1">Add, import, or generate questions with AI.</p>
            </div>
          )}

          {/* Inline add form at top */}
          <AnimatePresence>
            {addingManual && renderInlineForm(false)}
          </AnimatePresence>

          {/* Question list */}
          <AnimatePresence mode="popLayout">
            {questions.map((q, idx) => renderQuestionCard(q, idx))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
