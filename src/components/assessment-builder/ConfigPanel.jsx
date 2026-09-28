import React, { useState, useEffect } from "react";
import {
  Settings,
  Calendar,
  Clock,
  Wand2,
  Sparkles,
  BookOpen,
  Layers,
  Loader2,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "../Toast";
import { generateAssessmentDescription } from "../../utils/aiService";
import { DateTimePicker } from "../ui/DateTimePicker";
import { useLMS } from "../../context/LMSContext";
import { AllocationService, CourseService } from "../../services/api";

export const ConfigPanel = ({ config, setConfig }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBatchDropdownOpen, setIsBatchDropdownOpen] = useState(false);
  const [allocatedBatches, setAllocatedBatches] = useState([]);
  const [courseMap, setCourseMap] = useState({});
  const [loadingAllocations, setLoadingAllocations] = useState(true);

  const { batches, currentUser } = useLMS();

  useEffect(() => {
    const fetchAllocations = async () => {
      if (!currentUser?.id) { setLoadingAllocations(false); return; }
      try {
        const [allocs, courses] = await Promise.all([
          AllocationService.getTrainerAllocations(currentUser.id).catch(() => []),
          CourseService.getCourses().catch(() => []),
        ]);
        const courseLookup = {};
        (courses || []).forEach((c) => { courseLookup[c.id] = c.title; });
        setCourseMap(courseLookup);

        // Get unique batchIds from allocations
        const allocatedBatchIds = [...new Set((allocs || []).map((a) => a.batchId))];
        // Build a map of batchId -> allocated course names
        const batchCourseMap = {};
        (allocs || []).forEach((a) => {
          if (!batchCourseMap[a.batchId]) batchCourseMap[a.batchId] = [];
          const courseName = courseLookup[a.courseId] || a.courseId;
          if (!batchCourseMap[a.batchId].includes(courseName)) {
            batchCourseMap[a.batchId].push(courseName);
          }
        });

        // Filter batches to only allocated ones and attach course info
        const myBatches = (batches || [])
          .filter((b) => allocatedBatchIds.includes(b.id))
          .map((b) => ({ ...b, allocatedCourses: batchCourseMap[b.id] || [] }));

        setAllocatedBatches(myBatches);
      } catch (e) {
        console.error("Failed to fetch allocations:", e);
      } finally {
        setLoadingAllocations(false);
      }
    };
    fetchAllocations();
  }, [currentUser?.id, batches]);

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
      const generated = await generateAssessmentDescription(
        config.title || "General",
        "General",
        "Medium",
      );
      setConfig((prev) => ({ ...prev, description: generated }));
      toast.add("Description generated successfully!", "success");
    } catch (err) {
      toast.add("Failed to generate description. Check API key.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const displayBatches = allocatedBatches.length > 0 ? allocatedBatches : batches;

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-neutral-900 overflow-y-auto shrink-0 z-10">
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 bg-white/95 dark:bg-neutral-900/95 backdrop-blur z-10">
        <h2 className="font-display font-black text-lg text-neutral-900 dark:text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#6C1D5F]" /> Assessment Details
        </h2>
        <p className="text-xs text-neutral-500 mt-1">
          Define the core properties and parameters for this assessment.
        </p>
      </div>

      <div className="p-5 space-y-6">
        {/* Core Settings */}
        <section className="space-y-4">
          <div>
            <label className="flex items-center gap-1 text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Assessment Title <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={config.title}
              onChange={(e) => setConfig((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Midterm React Evaluation"
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6C1D5F] focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="flex items-center gap-1 text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Topic Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={config.topic}
              onChange={(e) => setConfig((prev) => ({ ...prev, topic: e.target.value }))}
              placeholder="e.g., React Context API"
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6C1D5F] focus:border-transparent transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1 text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Course <span className="text-destructive">*</span>
              </label>
              <select
                value={config.course}
                onChange={(e) => {
                  setConfig((prev) => ({ ...prev, course: e.target.value }));
                }}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6C1D5F] text-neutral-900 dark:text-neutral-100"
              >
                <option value="">Select Course...</option>
                {allocatedBatches.length > 0 ? (
                  [...new Set(allocatedBatches.flatMap((b) => b.allocatedCourses || []))].map((c, i) => (
                    <option key={i} value={c}>{c}</option>
                  ))
                ) : (
                  [...new Set(batches.map((b) => b.course).filter(Boolean))].map((c, i) => (
                    <option key={i} value={c}>{c}</option>
                  ))
                )}
              </select>
            </div>
            <div className="relative">
              <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider mb-2">
                Batches {allocatedBatches.length > 0 && <span className="text-[#01AC9F] font-normal ml-1">(Allocated)</span>}
                {allocatedBatches.length === 0 && <span className="text-neutral-400 font-normal ml-1">(All)</span>}
              </label>

              <div
                onClick={() => setIsBatchDropdownOpen(!isBatchDropdownOpen)}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm flex justify-between items-center cursor-pointer transition-all hover:border-[#6C1D5F]"
              >
                <span className="text-neutral-700 dark:text-neutral-300 truncate">
                  {config.batches && config.batches.length > 0
                    ? `${config.batches.length} batch(es) selected`
                    : "Select Batches..."}
                </span>
                {isBatchDropdownOpen ? (
                  <ChevronUp className="w-4 h-4 text-neutral-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-neutral-500" />
                )}
              </div>

              {isBatchDropdownOpen && (
                <div className="absolute z-20 top-full left-0 mt-1 w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg max-h-48 overflow-y-auto p-2">
                  {loadingAllocations ? (
                    <div className="flex items-center justify-center py-3">
                      <Loader2 className="w-4 h-4 animate-spin text-[#6C1D5F]" />
                      <span className="ml-2 text-xs text-neutral-500">Loading allocations...</span>
                    </div>
                  ) : (
                    <>
                      {displayBatches.length > 0 && (
                        <label className="flex items-center gap-2 px-2 py-1.5 mb-1 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg cursor-pointer border-b border-neutral-100 dark:border-neutral-800">
                          <input
                            type="checkbox"
                            checked={config.batches?.length === displayBatches.length && displayBatches.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setConfig((prev) => ({ ...prev, batches: displayBatches.map((b) => b.id) }));
                              } else {
                                setConfig((prev) => ({ ...prev, batches: [] }));
                              }
                            }}
                            className="w-4 h-4 text-[#6C1D5F] rounded"
                          />
                          <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                            Select All
                          </span>
                        </label>
                      )}
                      {displayBatches.map((b, i) => (
                        <label
                          key={i}
                          className="flex items-center gap-2 px-2 py-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={config.batches?.includes(b.id) || false}
                            onChange={(e) => {
                              const current = config.batches || [];
                              if (e.target.checked) {
                                setConfig((prev) => ({ ...prev, batches: [...current, b.id] }));
                              } else {
                                setConfig((prev) => ({
                                  ...prev,
                                  batches: current.filter((id) => id !== b.id),
                                }));
                              }
                            }}
                            className="w-4 h-4 text-[#6C1D5F] rounded"
                          />
                          <span className="text-sm text-neutral-700 dark:text-neutral-300">
                            {b.name}
                            {b.allocatedCourses && b.allocatedCourses.length > 0 && (
                              <span className="text-[#01AC9F] text-xs ml-1">({b.allocatedCourses.join(", ")})</span>
                            )}
                            {!b.allocatedCourses && b.course && (
                              <span className="text-neutral-400 text-xs ml-1">({b.course})</span>
                            )}
                          </span>
                        </label>
                      ))}
                      {displayBatches.length === 0 && (
                        <p className="text-xs text-neutral-500 text-center py-2">
                          {currentUser?.role === "teacher"
                            ? "No batches allocated to you. Ask admin to allocate courses."
                            : "No batches found."}
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1 text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Type <span className="text-destructive">*</span>
            </label>
            <select
              value={config.type}
              onChange={(e) => setConfig((prev) => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6C1D5F]"
            >
              <option value="" disabled>
                Select Type...
              </option>
              <option value="mcq">Single Choice (MCQ)</option>
              <option value="mixed">Mixed question types</option>
              <option value="true_false">True / False</option>
              <option value="multiple_select">Multiple Choice (Multiple Select)</option>
              <option value="short_answer">Short Answer / Plain text</option>
              <option value="paragraph">Paragraph response</option>
              <option value="file_upload">File Upload submission</option>
              <option value="coding">Coding Challenge Question</option>
            </select>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-neutral-500 mb-1.5">
                Difficulty <span className="text-destructive">*</span>
              </label>
              <select
                value={config.difficulty}
                onChange={(e) => setConfig((prev) => ({ ...prev, difficulty: e.target.value }))}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-bold focus:outline-none"
              >
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>
            <div>
              <label className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-neutral-500 mb-1.5">
                Duration <span className="text-destructive">*</span>
              </label>
              <input
                type="number"
                placeholder="Min"
                value={config.duration}
                onChange={(e) => setConfig((prev) => ({ ...prev, duration: e.target.value }))}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-neutral-500 mb-1.5">
                Total Marks <span className="text-destructive">*</span>
              </label>
              <input
                type="number"
                placeholder="Total Pts"
                value={config.marks}
                onChange={(e) => {
                  const val = e.target.value;
                  setConfig((prev) => ({ ...prev, marks: val, passingMarks: 75 }));
                }}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-neutral-500 mb-1.5">
                Attempts <span className="text-destructive">*</span>
              </label>
              <input
                type="number"
                placeholder="Limit"
                value={config.maxAttempts || 1}
                onChange={(e) => setConfig((prev) => ({ ...prev, maxAttempts: e.target.value }))}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none"
                min={1}
              />
            </div>
          </div>
        </section>

        {/* AI Settings Section */}
        <section className="space-y-4">
          <h3 className="font-display font-black text-sm text-neutral-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#6C1D5F]" /> AI Generation Settings
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-bold text-neutral-500 mb-1.5">
                Number of Questions
              </label>
              <input
                type="number"
                value={config.aiCount}
                onChange={(e) => setConfig((prev) => ({ ...prev, aiCount: e.target.value }))}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6C1D5F]"
                min={1}
                max={20}
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-bold text-neutral-500 mb-1.5">
                Taxonomy Level
              </label>
              <select
                value={config.aiTaxonomy}
                onChange={(e) => setConfig((prev) => ({ ...prev, aiTaxonomy: e.target.value }))}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6C1D5F]"
              >
                <option value="Remembering">Remembering</option>
                <option value="Understanding">Understanding</option>
                <option value="Applying">Applying</option>
                <option value="Analyzing">Analyzing</option>
                <option value="Evaluating">Evaluating</option>
                <option value="Creating">Creating</option>
              </select>
            </div>
          </div>
        </section>

        {/* Schedule */}
        <section className="p-3 bg-neutral-50 dark:bg-neutral-950/50 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-3">
          <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#6C1D5F]" /> Schedule{" "}
            <span className="text-destructive">*</span>
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-500 pl-1">Start Date</label>
              <DateTimePicker
                type="date"
                value={config.startDate}
                onChange={(val) => setConfig((prev) => ({ ...prev, startDate: val }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-500 pl-1">Start Time</label>
              <DateTimePicker
                type="time"
                value={config.startTime}
                onChange={(val) => setConfig((prev) => ({ ...prev, startTime: val }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-500 pl-1">End Date</label>
              <DateTimePicker
                type="date"
                value={config.endDate}
                onChange={(val) => setConfig((prev) => ({ ...prev, endDate: val }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-500 pl-1">End Time</label>
              <DateTimePicker
                type="time"
                value={config.endTime}
                onChange={(val) => setConfig((prev) => ({ ...prev, endTime: val }))}
              />
            </div>
          </div>
        </section>

        {/* Description Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1 text-xs font-bold text-neutral-700 dark:text-neutral-300">
              Description <span className="text-destructive">*</span>
            </label>
            <div className="flex bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg">
              <button
                type="button"
                className="px-3 py-1 text-[10px] font-bold rounded-md transition-colors bg-white dark:bg-neutral-700 shadow-sm text-neutral-800 dark:text-white"
              >
                Manual
              </button>
              <button
                type="button"
                onClick={handleGenerateAI}
                disabled={isGenerating}
                className={`flex items-center justify-center p-1.5 rounded-md transition-all duration-300 text-white disabled:opacity-50 ${isGenerating ? "bg-primary-glow scale-110" : "bg-[#6C1D5F] hover:bg-primary-glow hover:shadow-lg hover:shadow-fuchsia-900/30"}`}
                title="Generate with AI"
              >
                <Wand2
                  className={`w-3.5 h-3.5 ${isGenerating ? "animate-bounce text-primary-glow" : ""}`}
                />
              </button>
            </div>
          </div>

          <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
            <div className="flex gap-1 p-2 bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800">
              {["B", "I", "U", "•", "1.", "{}", "🔗"].map((tool, i) => (
                <button
                  key={i}
                  className="w-6 h-6 flex items-center justify-center text-xs font-bold text-neutral-600 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded"
                >
                  {tool}
                </button>
              ))}
            </div>
            <textarea
              rows={5}
              value={config.description}
              onChange={(e) => setConfig((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full p-3 text-sm focus:outline-none dark:bg-neutral-900 dark:text-white"
              placeholder="Enter assessment guidelines, rules, or instructions..."
            ></textarea>
          </div>
        </section>

        {/* Quick Settings Accordion */}
        <section className="border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full p-4 flex items-center justify-between bg-neutral-50 dark:bg-neutral-950/50 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
          >
            <span className="text-xs font-bold flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
              <SlidersHorizontal className="w-4 h-4 text-[#6C1D5F]" /> Quick Settings & Proctoring
            </span>
            {showAdvanced ? (
              <ChevronUp className="w-4 h-4 text-neutral-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-neutral-500" />
            )}
          </button>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 bg-white dark:bg-neutral-900 space-y-4 border-t border-neutral-200 dark:border-neutral-800">
                  {/* Toggles */}
                  {[
                    { id: "shuffleQuestions", label: "Shuffle Questions" },
                    { id: "negativeMarking", label: "Negative Marking" },
                    { id: "autoSubmit", label: "Auto Submit" },
                  ].map((setting, idx) => (
                    <label
                      key={idx}
                      className="flex items-center justify-between cursor-pointer group"
                      onClick={(e) => e.preventDefault()}
                    >
                      <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 group-hover:text-[#6C1D5F] transition-colors">
                        {setting.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setConfig((prev) => ({
                            ...prev,
                            quickSettings: {
                              ...(prev.quickSettings || {}),
                              [setting.id]: !prev.quickSettings?.[setting.id],
                            },
                          }));
                        }}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${config.quickSettings?.[setting.id] ? "bg-[#6C1D5F]" : "bg-neutral-200 dark:bg-neutral-700"}`}
                      >
                        <span
                          className={`inline-block h-3 w-3 rounded-full bg-white transition-transform ${config.quickSettings?.[setting.id] ? "translate-x-5" : "translate-x-1"}`}
                        />
                      </button>
                    </label>
                  ))}

                  {config.quickSettings?.negativeMarking && (
                    <div className="pt-2 flex items-center justify-between">
                      <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                        Negative Penalty (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={config.quickSettings?.negativeMarksValue || 25}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            quickSettings: {
                              ...(prev.quickSettings || {}),
                              negativeMarksValue: parseInt(e.target.value) || 0,
                            },
                          }))
                        }
                        className="w-16 px-2 py-1 text-xs border border-neutral-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:border-[#6C1D5F]"
                      />
                    </div>
                  )}

                  <div className="pt-2">
                    <label className="flex items-center gap-1 text-[10px] font-bold text-neutral-500 mb-1">
                      Passing Marks (%)
                    </label>
                    <input
                      type="number"
                      value={config.passingMarks || ""}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, passingMarks: e.target.value }))
                      }
                      className="w-full px-2 py-1.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#6C1D5F]"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </div>
  );
};
