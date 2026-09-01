import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare, Star, Send, BookOpen, User } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { useLMS } from "@/context/LMSContext";
import { AllocationService, UserService, FeedbackService } from "@/services/api";
import { useAppStore } from "@/admin/store/useAppStore";

export const Route = createFileRoute("/student/feedback")({
  component: FeedbackPage,
});

function FeedbackPage() {
  const { currentUser, batches } = useLMS();
  const { addToast } = useAppStore();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [selectedTrainer, setSelectedTrainer] = useState("");
  const [selectedTrainerId, setSelectedTrainerId] = useState("");
  const [feedbackText, setFeedbackText] = useState("");

  const [allocations, setAllocations] = useState([]);
  const [trainers, setTrainers] = useState([]);

  // Fetch allocations + trainers
  useEffect(() => {
    const loadData = async () => {
      try {
        const [allocs, users] = await Promise.all([
          AllocationService.getAllocations().catch(() => []),
          UserService.getUsers("teacher").catch(() => []),
        ]);
        setAllocations(allocs);
        setTrainers(users);
      } catch (e) { /* silent */ }
    };
    loadData();
  }, []);

  const myBatches = useMemo(() => {
    if (!currentUser?.id) return [];
    return batches.filter((b) => (b.students || []).includes(currentUser.id));
  }, [batches, currentUser?.id]);

  // When batch is selected, auto-fill trainer from allocation
  useEffect(() => {
    if (!selectedBatchId) {
      setSelectedTrainer("");
      setSelectedTrainerId("");
      return;
    }
    const batchAlloc = allocations.find((a) => a.batchId === selectedBatchId);
    if (batchAlloc) {
      const trainer = trainers.find((t) => t.id === batchAlloc.trainerId);
      if (trainer) {
        setSelectedTrainer(trainer.name);
        setSelectedTrainerId(trainer.id);
        return;
      }
    }
    setSelectedTrainer("");
    setSelectedTrainerId("");
  }, [selectedBatchId, allocations, trainers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      addToast("Please select a rating", "warning");
      return;
    }
    setIsSubmitting(true);
    try {
      const batch = batches.find((b) => b.id === selectedBatchId);
      await FeedbackService.submitFeedback({
        studentId: currentUser?.id,
        studentName: currentUser?.name,
        trainerId: selectedTrainerId,
        trainerName: selectedTrainer,
        batchId: selectedBatchId,
        batchName: batch?.name || "",
        rating,
        comment: feedbackText.trim(),
      });
      addToast("Feedback submitted successfully! Thank you.", "success");
      setRating(0);
      setFeedbackText("");
      setSelectedBatchId("");
      setSelectedTrainer("");
      setSelectedTrainerId("");
    } catch (err) {
      console.error("Feedback submission failed:", err);
      addToast(err.message || "Failed to submit feedback. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const trainersMap = useMemo(() => {
    const map = {};
    trainers.forEach((t) => { map[t.id] = t.name; });
    return map;
  }, [trainers]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#6C1D5F] via-[#84117C] to-[#01AC9F] p-6 sm:p-8 text-white shadow-lg"
      >
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-black/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Submit Feedback</h1>
          <p className="mt-2 text-white/80 text-sm font-medium">Help us improve by sharing your learning experience</p>
        </div>
      </motion.div>

      {/* Feedback Form */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-[#15151f] rounded-2xl border border-gray-200 dark:border-[#2e2e3e] shadow-sm overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-gray-100 dark:border-[#2e2e3e]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#6C1D5F]/10">
              <MessageSquare className="w-4 h-4 text-[#6C1D5F]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Course & Trainer Feedback</h2>
              <p className="text-[10px] text-gray-400 mt-0.5">All feedback is anonymous and used solely for improvement</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Batch/Course Select */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3 h-3" /> Select Batch
              </label>
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#1a1a2e] border border-gray-200 dark:border-[#2e2e3e] rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#6C1D5F]/30 cursor-pointer"
              >
                <option value="">Choose a batch...</option>
                {myBatches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}{b.course ? ` — ${b.course}` : ""}</option>
                ))}
              </select>
            </div>

            {/* Trainer Name (auto-filled) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3 h-3" /> Trainer Name
              </label>
              <input
                type="text"
                value={selectedTrainer}
                readOnly={!!selectedTrainer}
                placeholder={selectedBatchId ? "No trainer allocated" : "Select a batch first"}
                className={clsx(
                  "w-full px-3 py-2.5 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#6C1D5F]/30 transition-all",
                  selectedTrainer
                    ? "bg-[#01AC9F]/5 dark:bg-[#01AC9F]/10 border-[#01AC9F]/20 text-[#01AC9F]"
                    : "bg-gray-50 dark:bg-[#1a1a2e] border-gray-200 dark:border-[#2e2e3e] text-gray-400 dark:text-gray-500"
                )}
              />
            </div>
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Overall Rating</label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                  key={star}
                  type="button"
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="p-0.5 focus:outline-none"
                >
                  <Star
                    className={clsx(
                      "w-8 h-8 transition-colors duration-200",
                      star <= (hoverRating || rating)
                        ? "fill-[#FF6200] text-[#FF6200]"
                        : "text-gray-200 dark:text-[#2e2e3e]"
                    )}
                  />
                </motion.button>
              ))}
              <span className="ml-3 text-xs font-bold text-gray-400">
                {rating === 5 ? "Excellent!" : rating === 4 ? "Very Good" : rating === 3 ? "Average" : rating === 2 ? "Poor" : rating === 1 ? "Terrible" : "Rate the course"}
              </span>
            </div>
          </div>

          {/* Feedback Text */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Detailed Feedback</label>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="What did you like? What could be improved?"
              required
              rows={5}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#1a1a2e] border border-gray-200 dark:border-[#2e2e3e] rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6C1D5F]/30 resize-none"
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={rating === 0 || isSubmitting || !feedbackText.trim()}
              className={clsx(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white transition-all",
                rating === 0 || !feedbackText.trim()
                  ? "bg-gray-300 dark:bg-gray-700 cursor-not-allowed"
                  : "bg-[#6C1D5F] hover:bg-[#84117C] shadow-md hover:shadow-lg hover:-translate-y-0.5",
                isSubmitting && "opacity-80 pointer-events-none",
              )}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Submitting...
                </span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Submit Feedback
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
