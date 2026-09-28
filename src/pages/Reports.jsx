import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useLMS } from "../context/LMSContext";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Award,
  Activity,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Search,
  BarChart3,
  Users,
  ClipboardCheck,
  Loader2,
  BookOpen,
} from "lucide-react";

const CHART_COLORS = {
  velvet: "#6C1D5F",
  teal: "#01AC9F",
  orange: "#FF6200",
  rose: "#E11D48",
  purple: "#84117C",
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-white dark:bg-[#15151f] border border-gray-200 dark:border-[#2e2e3e] rounded-xl shadow-lg px-3 py-2">
      <p className="text-xs font-bold text-gray-900 dark:text-white mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-[11px] text-gray-500 dark:text-gray-400">
          <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: entry.color }} />
          {entry.name}: <span className="font-bold text-gray-700 dark:text-gray-200">{entry.value}%</span>
        </p>
      ))}
    </div>
  );
};

export const Reports = () => {
  const { currentUser, students, batches, assessments, submissions } = useLMS();
  const [selectedBatchId, setSelectedBatchId] = useState("all");
  const [studentSearch, setStudentSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  // Keep trainer reporting restricted to batches they own or are assigned to.
  const trainerBatches = useMemo(() => {
    const trainerId = currentUser?.id;
    if (!trainerId) return [];
    return batches.filter((batch) => batch.createdBy === trainerId || batch.trainerId === trainerId);
  }, [batches, currentUser?.id]);
  const reportBatches = useMemo(
    () => selectedBatchId === "all" ? trainerBatches : trainerBatches.filter((batch) => batch.id === selectedBatchId),
    [trainerBatches, selectedBatchId],
  );
  const reportBatchIds = useMemo(() => new Set(reportBatches.map((batch) => batch.id)), [reportBatches]);
  const reportStudents = useMemo(
    () => students.filter((student) => (student.batches || []).some((batchId) => reportBatchIds.has(batchId))),
    [students, reportBatchIds],
  );
  const reportStudentIds = useMemo(() => new Set(reportStudents.map((student) => student.id)), [reportStudents]);
  const reportAssessments = useMemo(
    () => assessments.filter((assessment) =>
      (assessment.batches || []).some((batchId) => reportBatchIds.has(batchId)) ||
      (selectedBatchId === "all" && currentUser?.id && assessment.createdBy === currentUser.id && !(assessment.batches || []).length),
    ),
    [assessments, reportBatchIds, selectedBatchId, currentUser?.id],
  );
  const reportAssessmentIds = useMemo(() => new Set(reportAssessments.map((assessment) => assessment.id)), [reportAssessments]);
  const reportSubmissions = useMemo(
    () => submissions.filter((submission) => reportStudentIds.has(submission.studentId) && reportAssessmentIds.has(submission.assessmentId)),
    [submissions, reportStudentIds, reportAssessmentIds],
  );

  // Count one result per student per assessment: use their latest submitted attempt.
  const latestSubmittedByAssessment = (items) => {
    const latest = new Map();
    items.filter((item) => item.status === "submitted").forEach((item) => {
      const key = `${item.studentId}:${item.assessmentId}`;
      const date = Date.parse(item.submittedAt || item.startedAt || "") || 0;
      const previous = latest.get(key);
      if (!previous || date >= previous.date) latest.set(key, { item, date });
    });
    return [...latest.values()].map(({ item }) => item);
  };

  const latestSubmittedSubs = useMemo(
    () => latestSubmittedByAssessment(reportSubmissions),
    [reportSubmissions],
  );
  const evaluatedSubs = useMemo(
    () => latestSubmittedSubs.filter((submission) => submission.isEvaluated),
    [latestSubmittedSubs],
  );
  const totalEvaluatedCount = evaluatedSubs.length;

  const averageScore = useMemo(
    () => totalEvaluatedCount > 0 ? Math.round(evaluatedSubs.reduce((sum, submission) => sum + (submission.percentage || 0), 0) / totalEvaluatedCount) : 0,
    [evaluatedSubs, totalEvaluatedCount],
  );
  const highestScore = totalEvaluatedCount > 0 ? Math.max(...evaluatedSubs.map((submission) => submission.percentage || 0)) : 0;
  const lowestScore = totalEvaluatedCount > 0 ? Math.min(...evaluatedSubs.map((submission) => submission.percentage || 0)) : 0;
  const assessmentById = useMemo(
    () => new Map(reportAssessments.map((assessment) => [assessment.id, assessment])),
    [reportAssessments],
  );
  const passPercent = totalEvaluatedCount > 0
    ? Math.round((evaluatedSubs.filter((submission) => {
        const threshold = assessmentById.get(submission.assessmentId)?.passingMarks ?? 75;
        return (submission.percentage || 0) >= threshold;
      }).length / totalEvaluatedCount) * 100)
    : 0;
  const failPercent = totalEvaluatedCount > 0 ? 100 - passPercent : 0;

  const batchComparisonData = useMemo(() => reportBatches.map((batch) => {
    const batchStudents = reportStudents.filter((student) => (student.batches || []).includes(batch.id));
    const batchStudentIds = new Set(batchStudents.map((student) => student.id));
    const batchAssessmentIds = new Set(reportAssessments.filter((assessment) => assessment.status !== "draft" && (assessment.batches || []).includes(batch.id)).map((assessment) => assessment.id));
    const batchLatestSubs = latestSubmittedByAssessment(reportSubmissions.filter((submission) =>
      batchStudentIds.has(submission.studentId) && batchAssessmentIds.has(submission.assessmentId),
    ));
    const batchEvaluated = batchLatestSubs.filter((submission) => submission.isEvaluated);
    const average = batchEvaluated.length > 0
      ? Math.round(batchEvaluated.reduce((sum, submission) => sum + (submission.percentage || 0), 0) / batchEvaluated.length)
      : 0;
    const expected = batchAssessmentIds.size * batchStudentIds.size;
    const submissionRate = expected > 0 ? Math.round((batchLatestSubs.length / expected) * 100) : 0;
    return { name: batch.name, averageScore: average, submissionRate };
  }), [reportBatches, reportStudents, reportAssessments, reportSubmissions]);

  const scoreDistribution = useMemo(() => [
    { name: "Excellent (90-100)", value: evaluatedSubs.filter((submission) => (submission.percentage || 0) >= 90).length, color: CHART_COLORS.velvet },
    { name: "Above Avg (75-89)", value: evaluatedSubs.filter((submission) => (submission.percentage || 0) >= 75 && (submission.percentage || 0) < 90).length, color: CHART_COLORS.teal },
    { name: "Satisfactory (60-74)", value: evaluatedSubs.filter((submission) => (submission.percentage || 0) >= 60 && (submission.percentage || 0) < 75).length, color: CHART_COLORS.orange },
    { name: "Below 60", value: evaluatedSubs.filter((submission) => (submission.percentage || 0) < 60).length, color: CHART_COLORS.rose },
  ], [evaluatedSubs]);
  const hasScoreData = scoreDistribution.some((entry) => entry.value > 0);

  const filteredStudents = useMemo(() => reportStudents.filter((student) =>
    student.name?.toLowerCase().includes(studentSearch.toLowerCase()) || student.email?.toLowerCase().includes(studentSearch.toLowerCase()),
  ), [reportStudents, studentSearch]);

  // ── Animation Variants ──
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  // ── KPI Cards Config ──
  const kpis = [
    {
      label: "Average Score",
      value: totalEvaluatedCount > 0 ? `${averageScore}%` : "—",
      icon: Award,
      bg: "bg-[#6C1D5F]/10",
      color: "text-[#6C1D5F]",
      desc: totalEvaluatedCount > 0 ? `Based on ${totalEvaluatedCount} evaluated` : "No submissions yet",
    },
    {
      label: "Pass Rate",
      value: totalEvaluatedCount > 0 ? `${passPercent}%` : "—",
      icon: CheckCircle2,
      bg: "bg-[#01AC9F]/10",
      color: "text-[#01AC9F]",
      desc: "Uses each assessment’s passing score",
    },
    {
      label: "Fail Rate",
      value: totalEvaluatedCount > 0 ? `${failPercent}%` : "—",
      icon: AlertTriangle,
      bg: "bg-rose-500/10",
      color: "text-rose-500",
      desc: totalEvaluatedCount === 0
        ? "No evaluated submissions yet"
        : failPercent > 30 ? "Needs attention" : "Within acceptable range",
    },
    {
      label: "Score Range",
      value: totalEvaluatedCount > 0 ? `${highestScore}% / ${lowestScore}%` : "—",
      icon: Activity,
      bg: "bg-[#FF6200]/10",
      color: "text-[#FF6200]",
      desc: "Highest / Lowest",
    },
  ];

  // ── Loading Skeleton ──
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-gray-200 dark:bg-[#1a1a2e] rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-gray-200 dark:bg-[#1a1a2e] rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="h-64 bg-gray-200 dark:bg-[#1a1a2e] rounded-2xl lg:col-span-2" />
          <div className="h-64 bg-gray-200 dark:bg-[#1a1a2e] rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-6">
      {/* Gradient Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#6C1D5F] via-[#84117C] to-[#01AC9F] p-6 sm:p-8 text-white shadow-lg"
      >
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-black/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Performance Reports</h1>
          <p className="mt-2 text-white/80 text-sm font-medium">
            {totalEvaluatedCount > 0
              ? `Analytics from ${totalEvaluatedCount} evaluated submission${totalEvaluatedCount !== 1 ? "s" : ""} across ${reportBatches.length} batch${reportBatches.length !== 1 ? "es" : ""}`
              : "No evaluated submissions yet. Data will appear once students complete assessments."}
          </p>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            variants={itemVariants}
            className="bg-white dark:bg-[#15151f] rounded-2xl border border-gray-200 dark:border-[#2e2e3e] p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{kpi.label}</p>
                <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">{kpi.value}</h3>
              </div>
              <div className={`p-2.5 rounded-xl ${kpi.bg}`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
            </div>
            <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500">{kpi.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Batch Performance Bar Chart */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-[#15151f] rounded-2xl border border-gray-200 dark:border-[#2e2e3e] p-5 shadow-sm lg:col-span-2 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Batch Performance</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Average scores vs submission rates</p>
            </div>
            <div className="p-2 rounded-lg bg-[#6C1D5F]/10">
              <BarChart3 className="w-4 h-4 text-[#6C1D5F]" />
            </div>
          </div>
          {batchComparisonData.length > 0 ? (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={batchComparisonData} barGap={4}>
                  <XAxis dataKey="name" stroke="#A3A3A3" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#A3A3A3" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" height={28} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="averageScore" name="Avg Score (%)" fill={CHART_COLORS.velvet} barSize={14} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="submissionRate" name="Submission Rate (%)" fill={CHART_COLORS.teal} barSize={14} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 dark:text-gray-600 text-xs">
              <div className="text-center">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No batch data available</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Score Distribution Pie Chart */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-[#15151f] rounded-2xl border border-gray-200 dark:border-[#2e2e3e] p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Score Distribution</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Breakdown of all evaluations</p>
            </div>
          </div>
          {hasScoreData ? (
            <>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={scoreDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value">
                      {scoreDistribution.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-1.5 mt-3">
                {scoreDistribution.map((entry, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                    <span className="truncate">{entry.name}</span>
                    <span className="font-bold text-gray-700 dark:text-gray-300 ml-auto">{entry.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-gray-400 dark:text-gray-600 text-xs">
              <div className="text-center">
                <PieChart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No score data yet</p>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Student Diagnostics Table */}
      <motion.div variants={itemVariants} initial="hidden" animate="visible" className="bg-white dark:bg-[#15151f] rounded-2xl border border-gray-200 dark:border-[#2e2e3e] shadow-sm overflow-hidden hover:shadow-md transition-all duration-300">
        <div className="p-5 border-b border-gray-100 dark:border-[#2e2e3e]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#6C1D5F]/10">
                <Users className="w-4 h-4 text-[#6C1D5F]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Student Performance</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {filteredStudents.length} student{filteredStudents.length !== 1 ? "s" : ""} found
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full sm:w-48 pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-[#1a1a2e] border border-gray-200 dark:border-[#2e2e3e] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#6C1D5F]/30 dark:text-white"
                />
              </div>
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="py-1.5 px-3 bg-gray-50 dark:bg-[#1a1a2e] border border-gray-200 dark:border-[#2e2e3e] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#6C1D5F]/30 dark:text-white cursor-pointer"
              >
                <option value="all">All Batches</option>
                {reportBatches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-[#1a1a2e]/50 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="px-5 py-3">#</th>
                <th className="px-5 py-3">Student</th>
                <th className="px-5 py-3">Batch</th>
                <th className="px-5 py-3">Assessments Attempted</th>
                <th className="px-5 py-3">Avg Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#2e2e3e]/50">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <Users className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-xs font-semibold text-gray-400">No students found</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.slice(0, 15).map((stud, idx) => {
                  const bName = reportBatches.find((b) => (stud.batches || []).includes(b.id))?.name || "—";
                  const studSubs = latestSubmittedSubs.filter((submission) => submission.studentId === stud.id);
                  const studEvaluated = studSubs.filter((submission) => submission.isEvaluated);
                  const assessmentsDone = studSubs.length;
                  const score = studEvaluated.length > 0
                    ? Math.round(studEvaluated.reduce((sum, s) => sum + (s.percentage || 0), 0) / studEvaluated.length)
                    : 0;
                  return (
                    <tr key={stud.id} className="hover:bg-gray-50/50 dark:hover:bg-[#1a1a2e]/30 transition-colors">
                      <td className="px-5 py-3 font-mono text-gray-400">#{idx + 1}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <img src={stud.avatar} className="w-7 h-7 rounded-full border border-gray-200 dark:border-[#2e2e3e]" alt="" />
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white text-[13px]">{stud.name}</p>
                            <p className="text-[10px] text-gray-400">{stud.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400 font-medium">{bName}</td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400 font-mono">{assessmentsDone}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-bold ${
                          score >= 85 ? "bg-[#01AC9F]/10 text-[#01AC9F]"
                            : score >= 60 ? "bg-[#6C1D5F]/10 text-[#6C1D5F]"
                              : score > 0 ? "bg-rose-500/10 text-rose-500"
                                : "bg-gray-100 text-gray-400 dark:bg-[#1a1a2e] dark:text-gray-500"
                        }`}>
                          {score > 0 ? `${score}%` : "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};
