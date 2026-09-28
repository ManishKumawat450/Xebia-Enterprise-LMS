import React, { useState, useMemo } from "react";
import { useLMS } from "../context/LMSContext";
import { toast } from "../components/Toast";
import Editor from "@monaco-editor/react";
import {
  Plus,
  Trash2,
  Copy,
  Send,
  Settings,
  HelpCircle,
  FileEdit,
  Check,
  X,
  Search,
  Filter,
  LayoutGrid,
  List,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { EnterpriseBuilderLayout } from "../components/assessment-builder/EnterpriseBuilderLayout";

export const AssessmentBuilder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    assessments,
    batches,
    currentUser,
    createAssessment,
    editAssessment,
    deleteAssessment,
    duplicateAssessment,
    archiveAssessment,
    publishAssessment,
  } = useLMS();

  // Top-level Navigation and View Modes
  const [activeTab, setActiveTab] = useState("list"); // 'list', 'create', 'edit'
  const [editingAssessmentId, setEditingAssessmentId] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // 'grid', 'table'

  // Listing / Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [difficultyFilter, setDifficultyFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");

  // Form States
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [selectedBatches, setSelectedBatches] = useState([]);
  const [difficulty, setDifficulty] = useState("Medium");
  const [duration, setDuration] = useState(30);
  const [passingMarks, setPassingMarks] = useState(12);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("23:59");
  const [attemptsAllowed, setAttemptsAllowed] = useState(1);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [randomizeOptions, setRandomizeOptions] = useState(false);
  const [asType, setAsType] = useState("mcq");
  const [status, setStatus] = useState("draft");
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [negativeMarksValue, setNegativeMarksValue] = useState(25); // percentage

  // Question Builder States
  const [questions, setQuestions] = useState([]);

  // Individual Question Temporary State
  const [currentQText, setCurrentQText] = useState("");
  const [currentQType, setCurrentQType] = useState("mcq");

  // Coding challenge builder states
  const [codingDifficulty, setCodingDifficulty] = useState("Easy");
  const [codingTimeLimit, setCodingTimeLimit] = useState(1000);
  const [codingMemoryLimit, setCodingMemoryLimit] = useState(256);
  const [codingLanguagesAllowed, setCodingLanguagesAllowed] = useState(["javascript", "python"]);
  const [codingTagsText, setCodingTagsText] = useState("");
  const [codingConstraints, setCodingConstraints] = useState("1 <= N <= 10^5");
  const [codingInputFormat, setCodingInputFormat] = useState("");
  const [codingOutputFormat, setCodingOutputFormat] = useState("");
  const [codingSampleInput, setCodingSampleInput] = useState("");
  const [codingSampleOutput, setCodingSampleOutput] = useState("");
  const [codingExplanation, setCodingExplanation] = useState("");
  const [codingNotes, setCodingNotes] = useState("");
  const [codingHintsList, setCodingHintsList] = useState([]);
  const [newHintText, setNewHintText] = useState("");

  // Templates state
  const [codingTemplates, setCodingTemplates] = useState({
    javascript: "// Write your javascript solution here\nfunction solve(n) {\n  \n}",
    python: "# Write your python solution here\ndef solve(n):\n    pass",
    java: "// Write your java solution here\npublic class Solution {\n    public static void main(String[] args) {\n        \n    }\n}",
    cpp: "// Write your C++ solution here\n#include <iostream>\nusing namespace std;\nint main() {\n    return 0;\n}",
  });
  const [templateEditLang, setTemplateEditLang] = useState("javascript");

  // Test cases state
  const [codingTestCasesList, setCodingTestCasesList] = useState([]);
  const [newTcInput, setNewTcInput] = useState("");
  const [newTcExpected, setNewTcExpected] = useState("");
  const [newTcWeight, setNewTcWeight] = useState(10);
  const [newTcVisibility, setNewTcVisibility] = useState("public");
  const [currentQMarks, setCurrentQMarks] = useState(5);
  const [currentQRequired, setCurrentQRequired] = useState(true);
  const [currentQExplanation, setCurrentQExplanation] = useState("");
  const [currentQOptions, setCurrentQOptions] = useState([
    "Option 1",
    "Option 2",
    "Option 3",
    "Option 4",
  ]);
  const [currentQCorrectIndex, setCurrentQCorrectIndex] = useState("0");
  const [currentQCorrectIndices, setCurrentQCorrectIndices] = useState(["0"]);

  // Reset form
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setInstructions("");
    setSelectedBatches([]);
    setDifficulty("Medium");
    setDuration(30);
    setPassingMarks(12);

    const now = new Date();
    const pad = (n) => n.toString().padStart(2, "0");
    const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    setStartDate(today);
    setEndDate(today);

    setAttemptsAllowed(1);
    setShuffleQuestions(false);
    setRandomizeOptions(false);
    setAsType("mcq");
    setStatus("draft");
    setNegativeMarking(false);
    setNegativeMarksValue(25);
    setQuestions([]);

    // reset single q
    resetSingleQuestionFields();
  };

  const resetSingleQuestionFields = () => {
    setCurrentQText("");
    setCurrentQType("mcq");
    setCurrentQMarks(5);
    setCurrentQRequired(true);
    setCurrentQExplanation("");
    setCurrentQOptions(["Option A", "Option B", "Option C", "Option D"]);
    setCurrentQCorrectIndex("0");
    setCurrentQCorrectIndices(["0"]);

    // Reset coding states
    setCodingDifficulty("Easy");
    setCodingTimeLimit(1000);
    setCodingMemoryLimit(256);
    setCodingLanguagesAllowed(["javascript", "python"]);
    setCodingTagsText("");
    setCodingConstraints("1 <= N <= 10^5");
    setCodingInputFormat("");
    setCodingOutputFormat("");
    setCodingSampleInput("");
    setCodingSampleOutput("");
    setCodingExplanation("");
    setCodingNotes("");
    setCodingHintsList([]);
    setNewHintText("");
    setCodingTestCasesList([]);
    setNewTcInput("");
    setNewTcExpected("");
    setNewTcWeight(10);
    setNewTcVisibility("public");
    setCodingTemplates({
      javascript: "// Write your javascript solution here\nfunction solve(n) {\n  \n}",
      python: "# Write your python solution here\ndef solve(n):\n    pass",
      java: "// Write your java solution here\npublic class Solution {\n    public static void main(String[] args) {\n        \n    }\n}",
      cpp: "// Write your C++ solution here\n#include <iostream>\nusing namespace std;\nint main() {\n    return 0;\n}",
    });
  };

  // Open Create Mode
  const handleOpenCreate = () => {
    resetForm();
    setActiveTab("create");
  };

  // Open Edit Mode
  const handleOpenEdit = (as) => {
    setEditingAssessmentId(as.id);
    setTitle(as.title);
    setDescription(as.description);
    setInstructions(as.instructions);
    setSelectedBatches(as.batches);
    setDifficulty(as.difficulty);
    setDuration(as.duration);
    setPassingMarks(as.passingMarks);
    setStartDate(as.startDate);
    setStartTime(as.startTime);
    setEndDate(as.endDate);
    setEndTime(as.endTime);
    setAttemptsAllowed(as.attemptsAllowed);
    setShuffleQuestions(as.shuffleQuestions);
    setRandomizeOptions(as.randomizeOptions);
    setAsType(as.type);
    setStatus(as.status === "archived" ? "draft" : as.status);
    setNegativeMarking(as.negativeMarking || false);
    setNegativeMarksValue(as.negativeMarksValue || 25);
    setQuestions(as.questions);

    setActiveTab("edit");
  };

  React.useEffect(() => {
    if (location.state?.editAssessmentId) {
      const assessmentToEdit = assessments.find((a) => a.id === location.state.editAssessmentId);
      if (assessmentToEdit) {
        handleOpenEdit(assessmentToEdit);
      }
      // Clear the state so it doesn't re-trigger on reload
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, assessments, navigate]);

  // Question adding
  const handleAddQuestionToDraft = () => {
    if (!currentQText.trim()) {
      toast.add("Please enter question description", "warning");
      return;
    }

    if (currentQType === "coding" && codingTestCasesList.length === 0) {
      toast.add("Please add at least one test case for the coding question.", "warning");
      return;
    }

    const calculatedMarks =
      currentQType === "coding"
        ? codingTestCasesList.reduce((sum, tc) => sum + tc.weight, 0)
        : currentQMarks;

    const newQ = {
      id: `Q-${Date.now()}`,
      type: currentQType,
      question: currentQText.trim(),
      marks: calculatedMarks,
      required: currentQRequired,
      explanation: currentQExplanation.trim(),
    };

    if (currentQType === "mcq" || currentQType === "true_false") {
      newQ.options = currentQOptions.filter((o) => o.trim() !== "");
      newQ.correctAnswer = currentQCorrectIndex;
    } else if (currentQType === "multi_select") {
      newQ.options = currentQOptions.filter((o) => o.trim() !== "");
      newQ.correctAnswer = currentQCorrectIndices;
    } else if (currentQType === "coding") {
      newQ.correctAnswer = "";
      newQ.codingDifficulty = codingDifficulty;
      newQ.codingTimeLimit = codingTimeLimit;
      newQ.codingMemoryLimit = codingMemoryLimit;
      newQ.codingLanguagesAllowed = codingLanguagesAllowed;
      newQ.codingTags = codingTagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      newQ.codingConstraints = codingConstraints;
      newQ.codingInputFormat = codingInputFormat;
      newQ.codingOutputFormat = codingOutputFormat;
      newQ.codingSampleInput = codingSampleInput;
      newQ.codingSampleOutput = codingSampleOutput;
      newQ.codingExplanation = codingExplanation.trim() || currentQText.trim();
      newQ.codingNotes = codingNotes;
      newQ.codingHints = codingHintsList;
      newQ.codingTemplates = codingTemplates;
      newQ.codingTestCases = codingTestCasesList;
    } else {
      newQ.correctAnswer = "";
    }

    setQuestions((prev) => [...prev, newQ]);
    resetSingleQuestionFields();
    toast.add("Question appended successfully!", "success");
  };

  const handleDeleteQuestionFromDraft = (qId) => {
    setQuestions((prev) => prev.filter((q) => q.id !== qId));
    toast.add("Question removed", "info");
  };

  const handleDuplicateQuestionInDraft = (q) => {
    const dup = {
      ...q,
      id: `Q-${Date.now()}-${Math.random()}`,
      question: `${q.question} (Copy)`,
    };
    setQuestions((prev) => [...prev, dup]);
    toast.add("Question duplicated", "success");
  };

  const handleOptionChange = (idx, val) => {
    const updated = [...currentQOptions];
    updated[idx] = val;
    setCurrentQOptions(updated);
  };

  const addOptionField = () => {
    setCurrentQOptions((prev) => [...prev, `Option ${prev.length + 1}`]);
  };

  const removeOptionField = (idx) => {
    if (currentQOptions.length <= 2) {
      toast.add("At least two options are required", "warning");
      return;
    }
    setCurrentQOptions((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleMultiCorrectIndex = (idxStr) => {
    setCurrentQCorrectIndices((prev) =>
      prev.includes(idxStr) ? prev.filter((i) => i !== idxStr) : [...prev, idxStr],
    );
  };

  // Submit full form
  const handleSaveAssessment = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.add("Please supply assessment title", "warning");
      return;
    }
    if (selectedBatches.length === 0) {
      toast.add("Please assign to at least one batch", "warning");
      return;
    }
    if (questions.length === 0) {
      toast.add("Please add at least one question to the assessment", "warning");
      return;
    }

    const calculatedTotalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

    const assessmentPayload = {
      title: title.trim(),
      description: description.trim(),
      instructions: instructions.trim(),
      batches: selectedBatches,
      difficulty,
      marks: calculatedTotalMarks,
      passingMarks: Math.min(passingMarks, calculatedTotalMarks),
      duration,
      startDate,
      startTime,
      endDate,
      endTime,
      attemptsAllowed,
      shuffleQuestions,
      randomizeOptions,
      autoGrade: asType === "mcq" || asType === "true_false" || asType === "multi_select",
      manualGrade:
        asType === "short_answer" ||
        asType === "file_upload" ||
        asType === "assignment" ||
        asType === "mixed",
      status,
      negativeMarking,
      negativeMarksValue,
      type: asType,
      questions: questions.map(({ id, ...q }) => {
        // Strip temporary frontend IDs
        if (id && (id.startsWith("Q-") || id.startsWith("q_"))) return q;
        return { id, ...q };
      }),
      createdBy: currentUser?.id || "T1",
    };

    if (activeTab === "create") {
      try {
        await createAssessment(assessmentPayload);
        toast.add(`Assessment "${title}" created successfully!`, "success");
        setActiveTab("list");
        resetForm();
      } catch (err) {
        toast.add("Failed to create assessment.", "error");
      }
    } else if (activeTab === "edit" && editingAssessmentId) {
      editAssessment(editingAssessmentId, assessmentPayload);
      toast.add(`Assessment updated!`, "success");
    }

    setActiveTab("list");
    resetForm();
  };

  // Duplicate assessment action
  const handleDuplicate = async (e, id, label) => {
    e.stopPropagation();
    toast.add(`Duplicating "${label}"...`, "info");
    try {
      await duplicateAssessment(id);
      toast.add(`Duplicated "${label}" successfully! Copy is set to Draft.`, "success");
    } catch (err) {
      toast.add(err?.message || `Failed to duplicate "${label}"`, "error");
    }
  };

  // Delete assessment
  const handleDelete = async (e, id, label) => {
    e.stopPropagation();
    if (
      confirm(`Delete assessment "${label}"? This will delete all associated student submissions!`)
    ) {
      try {
        await deleteAssessment(id);
        toast.add(`Deleted "${label}".`, "error");
      } catch (err) {
        toast.add("Failed to delete assessment", "error");
      }
    }
  };

  const handlePublishNow = (e, id, label) => {
    e.stopPropagation();
    publishAssessment(id);
    toast.add(`Published "${label}" successfully! Assigned batches notified.`, "success");
  };

  const filteredAssessments = useMemo(() => {
    let result = [...assessments];

    if (currentUser?.id) {
      result = result.filter((a) => a.createdBy === currentUser.id);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) => a.title.toLowerCase().includes(q) || a.type.toLowerCase().includes(q),
      );
    }

    if (statusFilter !== "All") {
      result = result.filter((a) => a.status === statusFilter);
    } else {
      result = result.filter((a) => a.status !== "archived"); // Hide archived by default
    }

    if (typeFilter !== "All") {
      result = result.filter((a) => a.type === typeFilter);
    }

    if (difficultyFilter !== "All") {
      result = result.filter((a) => a.difficulty === difficultyFilter);
    }

    // Sort logic
    result.sort((a, b) => {
      // Assuming IDs are generated chronologically or we use a date property if one existed.
      // Since dummy data IDs might be standard, we'll sort based on ID alphabetically as fallback or by marks for testing.
      if (sortBy === "Newest") return b.id.localeCompare(a.id);
      if (sortBy === "Oldest") return a.id.localeCompare(b.id);
      if (sortBy === "A-Z") return a.title.localeCompare(b.title);
      if (sortBy === "Z-A") return b.title.localeCompare(a.title);
      return 0;
    });

    return result;
  }, [assessments, searchQuery, statusFilter, typeFilter, difficultyFilter, sortBy]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("All");
    setTypeFilter("All");
    setDifficultyFilter("All");
    setSortBy("Newest");
  };

  return (
    <div className="space-y-6">
      {/* Header section removed as requested */}

      <AnimatePresence mode="wait">
        {activeTab === "list" ? (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Toolbar — flat single row */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleOpenCreate}
                className="py-2 px-4 bg-gradient-to-r from-[#6C1D5F] to-[#84117C] hover:from-[#84117C] hover:to-[#4A1E47] text-white rounded-lg text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Create Assessment</span>
              </button>

              <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-700 mx-1 hidden sm:block" />

              <Filter className="w-4 h-4 text-neutral-400 shrink-0 hidden sm:block" />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white text-xs font-semibold rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-[#6C1D5F] cursor-pointer"
              >
                <option value="All">Status</option>
                <option value="published">Published</option>
                <option value="draft">Drafts</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white text-xs font-semibold rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-[#6C1D5F] cursor-pointer"
              >
                <option value="All">Type</option>
                <option value="mcq">MCQ</option>
                <option value="coding">Coding</option>
                <option value="true_false">True / False</option>
                <option value="multi_select">Multi Select</option>
                <option value="short_answer">Short Answer</option>
                <option value="file_upload">File Upload</option>
              </select>

              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white text-xs font-semibold rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-[#6C1D5F] cursor-pointer"
              >
                <option value="All">Difficulty</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white text-xs font-semibold rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-[#6C1D5F] cursor-pointer"
              >
                <option value="Newest">Newest</option>
                <option value="Oldest">Oldest</option>
                <option value="A-Z">A-Z</option>
                <option value="Z-A">Z-A</option>
              </select>

              {(statusFilter !== "All" || typeFilter !== "All" || difficultyFilter !== "All" || sortBy !== "Newest") && (
                <button
                  onClick={handleClearFilters}
                  className="text-[11px] font-bold text-[#6C1D5F] dark:text-[#D4A0D0] hover:underline cursor-pointer flex items-center gap-1 bg-[#6C1D5F]/10 dark:bg-[#84117C]/20 px-2 py-1.5 rounded-md"
                >
                  <X className="w-3 h-3" /> Clear
                </button>
              )}

              <div className="ml-auto flex items-center gap-3">
                <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-1.5 rounded-md transition-all ${viewMode === "grid" ? "bg-white dark:bg-neutral-700 shadow-sm text-neutral-800 dark:text-white" : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"}`}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={`p-1.5 rounded-md transition-all ${viewMode === "table" ? "bg-white dark:bg-neutral-700 shadow-sm text-neutral-800 dark:text-white" : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"}`}
                    title="Table View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-xs text-neutral-400 font-medium hidden sm:block">
                  <span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-600 dark:text-neutral-300 font-bold">{filteredAssessments.length}</span> found
                </span>
              </div>
            </div>

            {/* Content Display based on ViewMode */}
            {filteredAssessments.length === 0 ? (
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-16 text-center text-neutral-500 shadow-sm flex flex-col items-center justify-center space-y-4">
                <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-full">
                  <Search className="w-8 h-8 text-neutral-400" />
                </div>
                <div>
                  <p className="font-bold text-lg text-neutral-700 dark:text-neutral-300">
                    No assessments found
                  </p>
                  <p className="text-sm mt-1">Try adjusting your filters or search terms.</p>
                </div>
              </div>
            ) : viewMode === "table" ? (
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden shadow-sm">
                <div className="overflow-x-auto max-h-[60vh]">
                  <table className="w-full text-sm border-collapse">
                    <thead className="sticky top-0 z-10 bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 shadow-sm">
                      <tr className="text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-6 text-left whitespace-nowrap">Title & Batches</th>
                        <th className="py-3 px-4 text-left whitespace-nowrap">Type</th>
                        <th className="py-3 px-4 text-left whitespace-nowrap">Difficulty</th>
                        <th className="py-3 px-4 text-left whitespace-nowrap">Marks / Duration</th>
                        <th className="py-3 px-4 text-left whitespace-nowrap">Status</th>
                        <th className="py-3 px-4 text-left whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 bg-white dark:bg-neutral-900">
                      {filteredAssessments.map((as) => {
                        const batchInfo = (as.batches || [])
                          .map((bId) => {
                            const batch = batches.find((b) => b.id === bId);
                            if (!batch) return bId;
                            const course = batch.course || batch.courseName || "—";
                            return `${batch.name} (${course})`;
                          })
                          .join(", ");

                        const statusColor = {
                          published:
                            "bg-accent-2/10 text-accent-2 dark:bg-[#01AC9F]/20 dark:text-[#5EDED4] border-accent-2/20 dark:border-[#01AC9F]/40",
                          draft:
                            "bg-destructive/10 text-destructive dark:bg-[#FF6200]/20 dark:text-[#FFB380] border-destructive/20 dark:border-[#FF6200]/40",
                          archived:
                            "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700",
                        }[as.status];

                        const difficultyColor = {
                          Easy: "text-[#01AC9F] dark:text-[#5EDED4] bg-[#01AC9F]/10 dark:bg-[#01AC9F]/20 border-[#01AC9F]/20 dark:border-[#01AC9F]/40",
                          Medium:
                            "text-[#FF6200] dark:text-[#FFB380] bg-[#FF6200]/10 dark:bg-[#FF6200]/20 border-[#FF6200]/20 dark:border-[#FF6200]/40",
                          Hard: "text-[#FF6200] dark:text-[#FFB380] bg-[#FF6200]/10 dark:bg-[#FF6200]/20 border-[#FF6200]/20 dark:border-[#FF6200]/40",
                        }[as.difficulty];

                        return (
                          <tr
                            key={as.id}
                            onClick={() => navigate(`/trainer/assessment-builder/${as.id}`)}
                            className="even:bg-neutral-50/50 dark:even:bg-neutral-800/20 hover:bg-neutral-100 dark:hover:bg-neutral-800/40 transition-colors group cursor-pointer"
                          >
                            <td className="py-3 px-6">
                              <div className="font-bold text-neutral-900 dark:text-white truncate max-w-[250px]">
                                {as.title}
                              </div>
                              <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mt-1 truncate max-w-[250px]">
                                {batchInfo ? batchInfo : "Not assigned"}
                              </div>
                            </td>
                            <td className="py-3 px-4 capitalize font-semibold text-neutral-600 dark:text-neutral-300">
                              {as.type.replace("_", " ")}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${difficultyColor}`}>
                                {as.difficulty}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-[#6C1D5F] dark:text-[#D4A0D0] text-xs">{as.marks} pts</span>
                                <span className="text-neutral-300 dark:text-neutral-600">·</span>
                                <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{as.duration} min</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border shadow-sm ${statusColor}`}>
                                {as.status}
                              </span>
                            </td>
                            <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-1">
                                {as.status === "draft" && (
                                  <button
                                    onClick={(e) => handlePublishNow(e, as.id, as.title)}
                                    className="p-1.5 text-[#01AC9F] dark:text-[#5EDED4] hover:bg-[#01AC9F]/10 rounded-lg transition-colors cursor-pointer"
                                    title="Publish Now"
                                  >
                                    <Send className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleOpenEdit(as); }}
                                  className="p-1.5 text-[#01AC9F] dark:text-[#5EDED4] hover:bg-[#01AC9F]/10 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Assessment"
                                >
                                  <FileEdit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => handleDuplicate(e, as.id, as.title)}
                                  className="p-1.5 text-[#01AC9F] dark:text-[#5EDED4] hover:bg-[#01AC9F]/10 rounded-lg transition-colors cursor-pointer"
                                  title="Duplicate"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => handleDelete(e, as.id, as.title)}
                                  className="p-1.5 text-[#FF6200] dark:text-[#FFB380] hover:bg-[#FF6200]/10 rounded-lg transition-colors cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredAssessments.map((as) => {
                  const batchInfo = (as.batches || [])
                    .map((bId) => {
                      const batch = batches.find((b) => b.id === bId);
                      if (!batch) return bId;
                      const course = batch.course || batch.courseName || "—";
                      return `${batch.name} (${course})`;
                    })
                    .join(", ");

                  const statusColor = {
                    published:
                      "bg-accent-2/10 text-accent-2 dark:bg-[#01AC9F]/20 dark:text-[#5EDED4] border-accent-2/20 dark:border-[#01AC9F]/40",
                    draft:
                      "bg-destructive/10 text-destructive dark:bg-[#FF6200]/20 dark:text-[#FFB380] border-destructive/20 dark:border-[#FF6200]/40",
                    archived:
                      "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700",
                  }[as.status];

                  const difficultyColor = {
                    Easy: "text-[#01AC9F] dark:text-[#5EDED4] bg-[#01AC9F]/10 dark:bg-[#01AC9F]/20 border-[#01AC9F]/20 dark:border-[#01AC9F]/40",
                    Medium:
                      "text-[#FF6200] dark:text-[#FFB380] bg-[#FF6200]/10 dark:bg-[#FF6200]/20 border-[#FF6200]/20 dark:border-[#FF6200]/40",
                    Hard: "text-[#FF6200] dark:text-[#FFB380] bg-[#FF6200]/10 dark:bg-[#FF6200]/20 border-[#FF6200]/20 dark:border-[#FF6200]/40",
                  }[as.difficulty];

                  return (
                    <motion.div
                      key={as.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => navigate(`/trainer/assessment-builder/${as.id}`)}
                      className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col group cursor-pointer"
                    >
                      {/* Header */}
                      <div className="flex justify-between items-start gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display font-black text-sm md:text-base text-neutral-800 dark:text-white leading-tight truncate">
                            {as.title}
                          </h3>
                          <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mt-1 truncate">
                            {batchInfo ? batchInfo : "Not assigned"}
                          </div>
                        </div>
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide border shadow-sm ${statusColor} shrink-0`}>
                          {as.status}
                        </span>
                      </div>

                      {/* Info Chips */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-4">
                        <span className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded text-[10px] font-bold capitalize">
                          {(as.type || "").replace("_", " ")}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${difficultyColor}`}>
                          {as.difficulty}
                        </span>
                        <span className="px-1.5 py-0.5 bg-primary/10 dark:bg-[#84117C]/20 text-[#6C1D5F] dark:text-[#D4A0D0] rounded text-[10px] font-bold font-mono">
                          {as.marks} pts
                        </span>
                        <span className="px-1.5 py-0.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-500 rounded text-[10px] font-bold">
                          {as.duration} min
                        </span>
                      </div>

                      {/* Spacer */}
                      <div className="flex-1" />

                      {/* Actions */}
                      <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                        <div className="flex items-center gap-2">
                          {as.status === "draft" && (
                            <button
                              onClick={(e) => handlePublishNow(e, as.id, as.title)}
                              className="p-2 text-[#01AC9F] dark:text-[#5EDED4] hover:bg-[#01AC9F]/10 rounded-lg transition-colors"
                              title="Publish Now"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenEdit(as); }}
                            className="p-2 text-[#01AC9F] dark:text-[#5EDED4] hover:bg-[#01AC9F]/10 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <FileEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDuplicate(e, as.id, as.title)}
                            className="p-2 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                            title="Duplicate"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, as.id, as.title)}
                            className="p-2 text-[#FF6200] dark:text-[#FFB380] hover:bg-[#FF6200]/10 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : (
          <EnterpriseBuilderLayout
            key={editingAssessmentId || "wizard"}
            onBack={() => {
              setActiveTab("list");
              setEditingAssessmentId(null);
            }}
            initialAssessment={
              editingAssessmentId ? assessments.find((a) => a.id === editingAssessmentId) : null
            }
          />
        )}
      </AnimatePresence>
    </div>
  );
};
