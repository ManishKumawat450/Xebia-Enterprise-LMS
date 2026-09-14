import React, { createContext, useContext, useState, useEffect } from "react";

import {
  UserService,
  BatchService,
  AssessmentService,
  SubmissionService,
  AllocationService,
  NotificationService,
} from "../services/api";

const LMSContext = createContext(undefined);

export const LMSProvider = ({ children }) => {
  // Initialize states as [] to match SSR output (no localStorage on server).
  // Hydrate from localStorage in useEffect after first paint.
  const [teachers, setTeachers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [codingSubmissions, setCodingSubmissions] = useState([]);
  const [codingLeaderboard, setCodingLeaderboard] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Assessments are cached per viewer role: students receive an answer-key-
  // stripped view, so a shared cache key would leak a student's stripped copy
  // into a trainer/admin session (breaking grading) or vice versa.
  const assessmentCacheKey = () => {
    try {
      const s = JSON.parse(localStorage.getItem("session") || "null");
      return s?.role ? `lms_assessments_${s.role}` : "lms_assessments";
    } catch {
      return "lms_assessments";
    }
  };

  // Hydrate from localStorage after mount to avoid SSR hydration mismatch
  useEffect(() => {
    const load = (key) => {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : [];
      } catch { return []; }
    };
    setTeachers(load("lms_teachers"));
    setBatches(load("lms_batches"));
    setStudents(load("lms_students"));
    setAssessments(load(assessmentCacheKey()));
    setSubmissions(load("lms_submissions"));
    setCodingSubmissions(load("codingSubmissions"));
    setCodingLeaderboard(load("codingLeaderboard"));
    setNotifications(load("notifications"));
  }, []);

  useEffect(() => {
    const fetchBackendData = async () => {
      try {
        let users = await UserService.getUsers();
        if (!Array.isArray(users)) users = [];

        let b = await BatchService.getBatches();
        if (!Array.isArray(b)) b = [];

        const enrichedUsers = users.map((u) => {
          if (u.role === "student") {
            const studentBatches = b
              .filter((batch) => (batch.students || []).includes(u.id))
              .map((batch) => batch.id);
            return { ...u, batches: studentBatches };
          }
          return u;
        });

        const teacherList = enrichedUsers.filter((u) => u.role === "teacher");
        const studentList = enrichedUsers.filter((u) => u.role === "student");
        setTeachers(teacherList);
        setStudents(studentList);
        setBatches(b);

        // Load notifications from the backend (falls back to the local cache
        // copy below if the service is unreachable).
        try {
          const n = await NotificationService.getAll();
          if (Array.isArray(n)) setNotifications(n);
        } catch (e) {
          console.error("Failed to load notifications from backend:", e);
        }

        // Cache to localStorage for instant login page load
        try {
          localStorage.setItem("lms_teachers", JSON.stringify(teacherList));
          localStorage.setItem("lms_students", JSON.stringify(studentList));
          localStorage.setItem("lms_batches", JSON.stringify(b));
        } catch (e) { /* quota exceeded is fine */ }

        setCurrentUser((prev) => {
          if (!prev) return prev;
          const updated = enrichedUsers.find((u) => u.id === prev.id);
          // If the cached user is not in the DB (e.g., after a DB wipe), clear the session
          return updated || null;
        });

        // Students load the answer-key-stripped view; trainers/admins keep the
        // full payload (builder editing + evaluation need correctAnswer).
        const viewerRole = currentUser?.role;
        let a =
          viewerRole === "student"
            ? await AssessmentService.getAssessmentsForStudents()
            : await AssessmentService.getAssessments();
        if (!Array.isArray(a)) a = [];
        setAssessments(a);

        let s = await SubmissionService.getSubmissions();
        if (!Array.isArray(s)) s = [];
        setSubmissions((current) => {
          const localInProgress = current.filter(
            (sub) => sub.status === "in_progress" && !s.some((fetched) => fetched.id === sub.id),
          );
          const merged = [...s, ...localInProgress];
          try {
            localStorage.setItem(assessmentCacheKey(), JSON.stringify(a));
            localStorage.setItem("lms_submissions", JSON.stringify(merged));
          } catch (e) { /* quota exceeded is fine */ }
          return merged;
        });
      } catch (err) {
        console.error("Backend connection failed.", err);
      }
    };
    fetchBackendData();
  }, []);

  const [currentUser, setCurrentUser] = useState(() => {
    const data = typeof window !== "undefined" ? localStorage.getItem("session") : null;
    return data ? JSON.parse(data) : null;
  });

  const [theme, setTheme] = useState(() => {
    const data = typeof window !== "undefined" ? localStorage.getItem("settings") : null;
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed.theme) return parsed.theme;
    }
    return "light";
  });

  // Write updates to LocalStorage when states change
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("session", JSON.stringify(currentUser));
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem("teachers", JSON.stringify(teachers));

    // Sync currentUser if they are a teacher
    if (currentUser?.role === "teacher") {
      const updated = teachers.find((t) => t.id === currentUser.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(currentUser)) {
        setCurrentUser(updated);
      }
    }
  }, [teachers]);

  useEffect(() => {
    localStorage.setItem("batches", JSON.stringify(batches));
  }, [batches]);

  useEffect(() => {
    localStorage.setItem("students", JSON.stringify(students));

    // Sync currentUser if they are a student
    if (currentUser?.role === "student") {
      const updated = students.find((s) => s.id === currentUser.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(currentUser)) {
        setCurrentUser(updated);
      }
    }
  }, [students]);

  useEffect(() => {
    localStorage.setItem("assessments", JSON.stringify(assessments));

    // Synchronize codingAssessments, codingProblems, codingTemplates, codingTestCases
    const codAs = assessments.filter((a) => a.type === "coding");
    localStorage.setItem("codingAssessments", JSON.stringify(codAs));

    const problems = [];
    const templates = {};
    const testCases = {};

    codAs.forEach((a) => {
      if (Array.isArray(a.questions)) {
        a.questions.forEach((q) => {
          if (q.type === "coding") {
            problems.push(q);
            if (q.codingTemplates) {
              templates[q.id] = q.codingTemplates;
            }
            if (q.codingTestCases) {
              testCases[q.id] = q.codingTestCases;
            }
          }
        });
      }
    });

    localStorage.setItem("codingProblems", JSON.stringify(problems));
    localStorage.setItem("codingTemplates", JSON.stringify(templates));
    localStorage.setItem("codingTestCases", JSON.stringify(testCases));
  }, [assessments]);

  useEffect(() => {
    localStorage.setItem("submissions", JSON.stringify(submissions));
  }, [submissions]);

  useEffect(() => {
    localStorage.setItem("codingSubmissions", JSON.stringify(codingSubmissions));

    // Sync codingResults
    const codingResults = codingSubmissions.map((sub) => ({
      submissionId: sub.id,
      problemId: sub.problemId,
      studentId: sub.studentId,
      score: sub.score,
      status: sub.status,
      submittedAt: sub.submittedAt,
      testCasesResult: [
        {
          input: "Sample Case",
          expected: "Output",
          actual: "Output",
          passed: sub.status === "Accepted" || sub.status === "Partially Accepted",
          timeTaken: sub.timeTaken / 1000 || 0.05,
          memoryUsed: sub.memoryUsed || 15.2,
          visibility: "public",
        },
      ],
    }));
    localStorage.setItem("codingResults", JSON.stringify(codingResults));
  }, [codingSubmissions]);

  useEffect(() => {
    localStorage.setItem("codingLeaderboard", JSON.stringify(codingLeaderboard));
  }, [codingLeaderboard]);

  useEffect(() => {
    localStorage.setItem("notifications", JSON.stringify(notifications));
  }, [notifications]);

  // Mirror the notifications list to the backend so read state and new
  // notifications survive across browsers/devices. Skipped on mount (the
  // initial load above is authoritative); failures fall back to the
  // localStorage cache without blocking the UI.
  const notificationsSyncedOnce = React.useRef(false);
  useEffect(() => {
    if (!notificationsSyncedOnce.current) {
      notificationsSyncedOnce.current = true;
      return;
    }
    NotificationService.sync(notifications).catch((e) =>
      console.error("Failed to sync notifications to backend:", e),
    );
  }, [notifications]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("session", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("session");
    }
  }, [currentUser]);

  // Apply theme class to document
  useEffect(() => {
    const html = document.documentElement;
    if (theme === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
    localStorage.setItem("settings", JSON.stringify({ theme }));
  }, [theme]);

  // Helpers
  const addNotification = (title, message, type, recipientId) => {
    const newNotif = {
      id: `NOTIF-${Date.now()}`,
      title,
      message,
      type,
      createdAt: new Date().toISOString(),
      isRead: false,
      recipientId,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Fake Auth
  const login = (email, role) => {
    const cleanEmail = email.trim().toLowerCase();
    if (role === "teacher") {
      const match = teachers.find((t) => t.email.toLowerCase() === cleanEmail);
      if (match) {
        setCurrentUser(match);
        return true;
      }
    } else {
      const match = students.find((s) => s.email.toLowerCase() === cleanEmail);
      if (match) {
        setCurrentUser(match);
        return true;
      }
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // Batch Operations
  const createBatch = async (name, course, icon = "📦", status = "active", courseId = null, studentIds = []) => {
    // Check for duplicates
    if (batches.some((b) => b.name.toLowerCase() === name.toLowerCase())) {
      throw new Error(`A batch with the name "${name}" already exists.`);
    }

    const newBatch = {
      name,
      course,
      icon,
      studentCount: studentIds.length,
      students: studentIds,
      status,
      createdAt: new Date().toISOString().split("T")[0],
      createdBy: currentUser?.id || null,
      createdByName: currentUser?.name || null,
      courseId: courseId || null,
    };

    try {
      const savedBatch = await BatchService.createBatch(newBatch);
      setBatches((prev) => [...prev, savedBatch]);
      addNotification(
        "New Batch Created",
        `Batch ${name} for course "${course}" has been established.`,
        "system",
        "all_teachers",
      );
      return savedBatch;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const editBatch = async (id, name, course, studentIds, icon, status) => {
    const updatedBatch = {
      name,
      course,
      icon: icon || "📦",
      status: status || "active",
      students: studentIds,
      studentCount: studentIds.length,
    };

    // Optimistically update local state immediately
    setBatches((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          // Update student states in memory
          setStudents((currentStudents) =>
            currentStudents.map((s) => {
              const isSelected = studentIds.includes(s.id);
              const hadBatch = (s.batches || []).includes(id);
              if (isSelected && !hadBatch) {
                return { ...s, batches: [...(s.batches || []), id] };
              } else if (!isSelected && hadBatch) {
                return { ...s, batches: (s.batches || []).filter((bid) => bid !== id) };
              }
              return s;
            }),
          );
          return { ...b, ...updatedBatch };
        }
        return b;
      }),
    );

    // Persist to backend so it survives page refresh
    try {
      await BatchService.updateBatch(id, updatedBatch);
    } catch (err) {
      console.error("Failed to persist batch update to backend:", err);
    }
  };

  const deleteBatch = async (id) => {
    // Remove batch from students in local state
    setStudents((prev) =>
      prev.map((s) => ({
        ...s,
        batches: s.batches ? s.batches.filter((bid) => bid !== id) : [],
      })),
    );
    // Delete from local state
    setBatches((prev) => prev.filter((b) => b.id !== id));
    // Persist to backend
    try {
      await BatchService.deleteBatch(id);
    } catch (err) {
      console.error("Failed to delete batch from backend:", err);
    }
  };

  const deleteBatchCascade = async (id) => {
    const batch = batches.find((b) => b.id === id);
    if (!batch) return;

    // 1. Delete allocations for this batch
    try {
      await AllocationService.deleteAllocationsByBatch(id);
    } catch (err) {
      console.error("Failed to delete allocations:", err);
    }

    // 2. Delete assessments and submissions for this batch
    try {
      await AssessmentService.deleteByBatch(id);
    } catch (err) {
      console.error("Failed to delete assessments:", err);
    }

    // 3. Remove batch from all students in local state
    setStudents((prev) =>
      prev.map((s) => ({
        ...s,
        batches: s.batches ? s.batches.filter((bid) => bid !== id) : [],
      })),
    );

    // 4. Remove assessments that reference this batch from local state
    setAssessments((prev) =>
      prev.filter((a) => !(a.batches || []).includes(id)),
    );

    // 5. Remove submissions for assessments that referenced this batch
    const removedAssessIds = assessments
      .filter((a) => (a.batches || []).includes(id))
      .map((a) => a.id);
    setSubmissions((prev) =>
      prev.filter((s) => !removedAssessIds.includes(s.assessmentId)),
    );

    // 6. Delete the batch itself
    setBatches((prev) => prev.filter((b) => b.id !== id));
    try {
      await BatchService.deleteBatch(id);
    } catch (err) {
      console.error("Failed to delete batch from backend:", err);
    }
  };

  const getBatchProgress = (batchId) => {
    const batch = batches.find((b) => b.id === batchId);
    if (!batch || !batch.students || batch.students.length === 0) return 0;

    // Find all assessments assigned to this batch
    const batchAssessments = assessments.filter((a) => a.batches && a.batches.includes(batchId));
    if (batchAssessments.length === 0) return 0;

    // Find all submitted submissions by these students for these assessments
    const batchAssIds = batchAssessments.map((a) => a.id);
    const validSubs = submissions.filter(
      (s) =>
        batchAssIds.includes(s.assessmentId) &&
        batch.students.includes(s.studentId) &&
        (s.status === "submitted" || s.isEvaluated),
    );

    const maxPossible = batchAssessments.length * batch.students.length;
    if (maxPossible === 0) return 0;
    return Math.round((validSubs.length / maxPossible) * 100);
  };

  // Assessment Operations
  const createAssessment = async (newAs) => {
    // Backend generates the ID
    const newAssessment = {
      ...newAs,
      createdAt: new Date().toISOString().split("T")[0],
    };

    try {
      const savedAssessment = await AssessmentService.createAssessment(newAssessment);
      setAssessments((prev) => [savedAssessment, ...prev]);

      if (savedAssessment.status === "published") {
        savedAssessment.batches.forEach((bId) => {
          addNotification(
            "Assessment Published",
            `New assessment "${savedAssessment.title}" published for your batch. Duration: ${savedAssessment.duration}m.`,
            "publish",
            bId,
          );
        });
      }
      return savedAssessment;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const editAssessment = async (id, updated) => {
    try {
      const targetAs = assessments.find((a) => a.id === id);
      if (!targetAs) return;

      const merged = { ...targetAs, ...updated };
      const res = await AssessmentService.updateAssessment(id, merged);

      setAssessments((prev) =>
        prev.map((a) => {
          if (a.id === id) {
            // If changing status from draft to published, send notification
            if (a.status !== "published" && updated.status === "published") {
              merged.batches.forEach((bId) => {
                addNotification(
                  "Assessment Published",
                  `New assessment "${merged.title}" is now available. Complete it soon!`,
                  "publish",
                  bId,
                );
              });
            } else if (updated.status === "published") {
              merged.batches.forEach((bId) => {
                addNotification(
                  "Assessment Updated",
                  `Assessment "${merged.title}" has been updated by the trainer.`,
                  "update",
                  bId,
                );
              });
            }
            return res;
          }
          return a;
        }),
      );
      return res;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const deleteAssessment = async (id) => {
    try {
      await AssessmentService.deleteAssessment(id);
      setAssessments((prev) => prev.filter((a) => a.id !== id));
      setSubmissions((prev) => prev.filter((s) => s.assessmentId !== id));
    } catch (err) {
      console.error("Failed to delete assessment", err);
      throw err;
    }
  };

  const duplicateAssessment = (id) => {
    const original = assessments.find((a) => a.id === id);
    if (!original) return;

    const duplicated = {
      ...original,
      id: `A-${Date.now()}`,
      title: `${original.title} (Copy)`,
      status: "draft", // defaults to draft
      createdAt: new Date().toISOString().split("T")[0],
    };
    setAssessments((prev) => [duplicated, ...prev]);
  };

  const archiveAssessment = (id) => {
    editAssessment(id, { status: "archived" });
  };

  const publishAssessment = (id) => {
    editAssessment(id, { status: "published" });
  };

  // Student Assessment Taking
  const startAssessment = async (assessmentId, studentId) => {
    // Check if there is already an in_progress submission
    const existing = submissions.find(
      (s) => s.assessmentId === assessmentId && s.studentId === studentId,
    );
    if (existing) {
      if (existing.status === "in_progress") return existing;
    }

    const asObj = assessments.find((a) => a.id === assessmentId);
    const newSub = {
      id: `SUB-${Date.now()}`,
      assessmentId,
      studentId,
      status: "in_progress",
      startedAt: new Date().toISOString(),
      answers: [],
      score: 0,
      percentage: 0,
      timeTaken: 0,
      isEvaluated: false,
    };

    // Await the in_progress row so a later submit PUT always finds it;
    // surface failures instead of silently continuing (caller can retry).
    try {
      const created = await SubmissionService.createSubmission(newSub);
      const finalSub =
        created && created.id
          ? { ...newSub, ...created, answers: created.answers || newSub.answers }
          : newSub;
      setSubmissions((prev) => [finalSub, ...prev]);
      return finalSub;
    } catch (err) {
      console.error("Failed to create submission record:", err);
      throw new Error("Could not start the attempt — the server is unreachable. Please retry.");
    }
  };

  const submitAssessment = async (submissionId, answers) => {
    const index = submissions.findIndex((s) => s.id === submissionId);
    if (index === -1) return null;

    const sub = submissions[index];
    const asObj = assessments.find((a) => a.id === sub.assessmentId);
    if (!asObj) return null;

    // Map answers
    const submissionAnswers = answers.map((ans) => {
      return {
        questionId: ans.questionId,
        answer: ans.answer,
        marksAwarded: 0,
        remarks: "",
      };
    });

    // Calculate score if autoGrade
    let score = 0;
    let isEvaluated = false;

    // Force auto-evaluation for all assessments/quizzes
    asObj.questions.forEach((q, qidx) => {
      const ansObj = submissionAnswers.find((sa) => sa.questionId === q.id);
      if (ansObj) {
        const hasAnswered =
          ansObj.answer !== undefined &&
          ansObj.answer !== "" &&
          (!Array.isArray(ansObj.answer) || ansObj.answer.length > 0);

        if (q.type === "mcq" || q.type === "true_false") {
          const studentAnsStr = String(ansObj.answer);
          const resolvedStudentAns =
            q.options && !isNaN(studentAnsStr) && studentAnsStr.trim() !== ""
              ? q.options[Number(studentAnsStr)]
              : studentAnsStr;

          if (
            String(resolvedStudentAns).trim().toLowerCase() ===
            String(q.correctAnswer).trim().toLowerCase()
          ) {
            ansObj.marksAwarded = q.marks;
            score += q.marks;
          } else if (hasAnswered && asObj.negativeMarking) {
            const penalty = (q.marks * (asObj.negativeMarksValue || 0)) / 100;
            ansObj.marksAwarded = -penalty;
            score -= penalty;
          }
        } else if (q.type === "multi_select") {
          const correctSet = new Set(
            (q.correctAnswer || []).map((s) => String(s).trim().toLowerCase()),
          );
          const providedSet = new Set(
            (ansObj.answer || []).map((s) => {
              const sStr = String(s);
              const resolved =
                q.options && !isNaN(sStr) && sStr.trim() !== "" ? q.options[Number(sStr)] : sStr;
              return String(resolved).trim().toLowerCase();
            }),
          );
          const match =
            correctSet.size === providedSet.size &&
            [...correctSet].every((val) => providedSet.has(val));
          if (match) {
            ansObj.marksAwarded = q.marks;
            score += q.marks;
          } else if (hasAnswered && asObj.negativeMarking) {
            const penalty = (q.marks * (asObj.negativeMarksValue || 0)) / 100;
            ansObj.marksAwarded = -penalty;
            score -= penalty;
          }
        }
      }
    });

    const needsManualGrading =
      asObj.manualGrade ||
      asObj.questions.some((q) =>
        ["short_answer", "paragraph", "file_upload", "coding", "assignment"].includes(q.type),
      );
    isEvaluated = !needsManualGrading;

    // Floor matches the backend's integer percentage semantics (int division),
    // so the score shown right after submit equals the score after refresh.
    const percentage =
      asObj.marks > 0 ? Math.floor((score / asObj.marks) * 100) : 0;
    const startedTime = sub.startedAt ? new Date(sub.startedAt).getTime() : Date.now();
    const timeTakenSecs = Math.max(1, Math.round((Date.now() - startedTime) / 1000));

    const finalSubmission = {
      ...sub,
      status: "submitted",
      submittedAt: new Date().toISOString(),
      answers: submissionAnswers,
      score,
      percentage,
      timeTaken: timeTakenSecs,
      isEvaluated,
    };

    // Persist FIRST — the caller only reports success when the server has it.
    // If the PUT fails (e.g. the in_progress row never got created), fall back
    // to creating the full submission so the student's answers are not lost.
    try {
      await SubmissionService.updateSubmission(finalSubmission.id, finalSubmission);
    } catch (err) {
      console.error("Submission PUT failed, attempting create fallback:", err);
      try {
        await SubmissionService.createSubmission(finalSubmission);
      } catch (err2) {
        throw new Error(
          "Your answers are kept on this page, but the server could not save them. Use Retry to submit again.",
        );
      }
    }

    setSubmissions((currentSubs) => {
      const idx = currentSubs.findIndex((s) => s.id === submissionId);
      if (idx === -1) return [finalSubmission, ...currentSubs];
      const newSubs = [...currentSubs];
      newSubs[idx] = finalSubmission;
      return newSubs;
    });

    // Notify teacher of a new submission
    if (asObj) {
      const stud = students.find((s) => s.id === finalSubmission?.studentId);
      addNotification(
        "Assessment Submitted",
        `${stud?.name || "A student"} completed "${asObj.title}". ${asObj.manualGrade ? "Requires manual evaluation." : `Score: ${finalSubmission?.score}/${asObj.marks}`}`,
        "system",
        asObj.createdBy,
      );
    }

    // Sync individual student stats if autoGraded
    if (asObj?.autoGrade && finalSubmission) {
      setStudents((prevStudents) =>
        prevStudents.map((s) => {
          if (s.id === finalSubmission?.studentId) {
            const completedCount = (s.assessmentsCompleted || 0) + 1;
            const currentAvg = s.averageScore || 80;
            const newAvg = Math.round(
              (currentAvg * (completedCount - 1) + (finalSubmission?.percentage || 0)) /
                completedCount,
            );
            return {
              ...s,
              assessmentsCompleted: completedCount,
              averageScore: newAvg,
            };
          }
          return s;
        }),
      );
    }

    return finalSubmission || {};
  };

  // Teacher manual evaluation
  const evaluateSubmission = async (submissionId, questionMarks, questionRemarks, overallRemarks) => {
    let finalStudentId = "";
    let finalPercentage = 0;
    let asTitle = "";
    let updatedSubmission = null;

    const updatedSubmissions = submissions.map((sub) => {
      if (sub.id !== submissionId) return sub;

      const asObj = assessments.find((a) => a.id === sub.assessmentId);
      asTitle = asObj?.title || "Assessment";
      if (!asObj) return sub;

      const updatedAnswers = sub.answers.map((ans) => {
        const qId = ans.questionId;
        return {
          ...ans,
          marksAwarded:
            questionMarks[qId] !== undefined ? questionMarks[qId] : ans.marksAwarded || 0,
          remarks:
            questionRemarks[qId] !== undefined ? questionRemarks[qId] : ans.remarks || "",
          isReviewed: true,
        };
      });

      // Sum total manual + auto scores
      const totalScore = updatedAnswers.reduce((sum, ans) => sum + (ans.marksAwarded || 0), 0);
      const percentage = asObj.marks > 0 ? Math.round((totalScore / asObj.marks) * 100) : 0;

      finalStudentId = sub.studentId;
      finalPercentage = percentage;

      updatedSubmission = {
        ...sub,
        answers: updatedAnswers,
        score: totalScore,
        percentage,
        isEvaluated: true,
        remarks: overallRemarks,
        evaluatedBy: currentUser?.id || "T1",
      };
      return updatedSubmission;
    });

    setSubmissions(updatedSubmissions);

    // Persist the grading to the backend so it survives a page refresh
    if (updatedSubmission) {
      try {
        const saved = await SubmissionService.updateSubmission(
          updatedSubmission.id,
          updatedSubmission,
        );
        if (saved && saved.id) {
          setSubmissions((prev) =>
            prev.map((s) => (s.id === saved.id ? { ...s, ...saved } : s)),
          );
        }
      } catch (err) {
        console.error("Failed to save grading to backend:", err);
        throw err;
      }
    }

    // Update student performance averages
    if (finalStudentId) {
      setStudents((prevStudents) =>
        prevStudents.map((s) => {
          if (s.id === finalStudentId) {
            const completedCount = (s.assessmentsCompleted || 0) + 1;
            const currentAvg = s.averageScore || 80;
            const newAvg = Math.round(
              (currentAvg * (completedCount - 1) + finalPercentage) / completedCount,
            );
            return {
              ...s,
              assessmentsCompleted: completedCount,
              averageScore: newAvg,
            };
          }
          return s;
        }),
      );

      // Notify the student
      addNotification(
        "Assessment Evaluated",
        `Your submission for "${asTitle}" has been graded by the trainer. Remarks: "${overallRemarks.substring(0, 35)}..."`,
        "evaluation",
        finalStudentId,
      );
    }
  };

  const markNotificationAsRead = (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const updateProfile = async (updatedUser) => {
    if (!currentUser) return;
    const merged = { ...currentUser, ...updatedUser };

    // Persist to the users table first — no more localStorage-only edits.
    if (merged.id) {
      try {
        await UserService.updateUser(merged.id, {
          name: merged.name,
          email: merged.email,
          avatar: merged.avatar,
          department: merged.department,
        });
      } catch (err) {
        console.error("Failed to persist profile update to backend:", err);
        throw new Error("Profile could not be saved to the server. Please try again.");
      }
    }

    setCurrentUser(merged);

    if (merged.role === "teacher") {
      setTeachers((prev) => prev.map((t) => (t.id === merged.id ? { ...t, ...updatedUser } : t)));
    } else {
      setStudents((prev) => prev.map((s) => (s.id === merged.id ? { ...s, ...updatedUser } : s)));
    }
  };

  // Fetch compiled Leaderboard
  const getLeaderboard = () => {
    // Generate leaderboard based on student avgScore and completed count
    const entries = students.map((s) => {
      const studentSubs = submissions.filter(
        (sub) => sub.studentId === s.id && sub.status === "submitted",
      );
      const totalPoints = studentSubs.reduce((sum, sub) => sum + (sub.score || 0), 0);
      const evaluatedSubs = studentSubs.filter((sub) => sub.isEvaluated);
      const avg = evaluatedSubs.length > 0
        ? Math.round(evaluatedSubs.reduce((sum, sub) => sum + (sub.percentage || 0), 0) / evaluatedSubs.length)
        : 0;

      return {
        rank: 1,
        studentId: s.id,
        studentName: s.name,
        avatar: s.avatar,
        score: totalPoints,
        average: avg,
        completedAssessments: studentSubs.length,
        topPerformer: false,
      };
    });

    // Sort by score first, then average percentage
    entries.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.average - a.average;
    });

    // Assign Ranks and top performer flag
    return entries.map((entry, idx) => {
      return {
        ...entry,
        rank: idx + 1,
        topPerformer: idx < 3, // Top 3 are top performers
      };
    });
  };

  const submitCodingSubmission = (submission) => {
    setCodingSubmissions((prev) => {
      // Remove any duplicate submission for same student-problem-attempt to avoid keys duplicates
      const filtered = prev.filter((s) => s.id !== submission.id);
      return [submission, ...filtered];
    });

    // Update Coding Leaderboard dynamically based on student submission
    setCodingLeaderboard((prev) => {
      const existsIdx = prev.findIndex((item) => item.studentId === submission.studentId);
      if (existsIdx !== -1) {
        const updated = [...prev];
        const entry = updated[existsIdx];

        const passedIncrement = submission.status === "Accepted" ? 1 : 0;
        const scoreIncrement = submission.score;

        updated[existsIdx] = {
          ...entry,
          score: entry.score + scoreIncrement,
          problemsSolved: entry.problemsSolved + passedIncrement,
          totalAttempts: entry.totalAttempts + 1,
          averageTime: Math.round((entry.averageTime + submission.timeTaken) / 2),
          highestScore: Math.max(entry.highestScore, submission.score),
          badge:
            entry.score + scoreIncrement >= 300
              ? "Gold"
              : entry.score + scoreIncrement >= 200
                ? "Silver"
                : "Bronze",
        };
        updated.sort((a, b) => b.score - a.score);
        return updated.map((item, idx) => ({ ...item, rank: idx + 1 }));
      } else {
        const newEntry = {
          id: `CL-${Date.now()}`,
          rank: prev.length + 1,
          studentId: submission.studentId,
          studentName: submission.studentName,
          score: submission.score,
          problemsSolved: submission.status === "Accepted" ? 1 : 0,
          totalAttempts: 1,
          averageTime: submission.timeTaken,
          highestScore: submission.score,
          badge: submission.score >= 40 ? "Bronze" : "Rising Star",
        };
        const updated = [...prev, newEntry];
        updated.sort((a, b) => b.score - a.score);
        return updated.map((item, idx) => ({ ...item, rank: idx + 1 }));
      }
    });
  };

  return (
    <LMSContext.Provider
      value={{
        teachers,
        students,
        batches,
        assessments,
        submissions,
        notifications,
        setNotifications,
        currentUser,
        theme,
        login,
        logout,
        createBatch,
        editBatch,
        deleteBatch,
        deleteBatchCascade,
        getBatchProgress,
        createAssessment,
        editAssessment,
        deleteAssessment,
        duplicateAssessment,
        archiveAssessment,
        publishAssessment,
        startAssessment,
        submitAssessment,
        evaluateSubmission,
        toggleTheme,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        addNotification,
        updateProfile,
        getLeaderboard,

        // Coding exports
        codingSubmissions,
        setCodingSubmissions,
        codingLeaderboard,
        setCodingLeaderboard,
        submitCodingSubmission,
      }}
    >
      {children}
    </LMSContext.Provider>
  );
};

export const useLMS = () => {
  const context = useContext(LMSContext);
  if (!context) {
    throw new Error("useLMS must be used within an LMSProvider");
  }
  return context;
};
