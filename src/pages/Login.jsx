import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useLMS } from "../context/LMSContext";
import { toast } from "../components/Toast";
import { ShieldCheck, GraduationCap, ArrowRight, Sparkles, Moon, Sun, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const Login = () => {
  const { login, teachers, students, theme, toggleTheme } = useLMS();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("teacher");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.add("Enter both your email address and password", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await login(email, password);
      toast.add("Login successful. Welcome back.", "success");
      if (user.mustChangePassword) {
        navigate({ to: "/change-password" });
      } else {
        const actualRole = String(user.role).toLowerCase();
        navigate({
          to:
            actualRole === "admin" ? "/admin" : actualRole === "teacher" ? "/trainer" : "/student",
        });
      }
    } catch (error) {
      toast.add(error?.message || "Invalid email or password", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (quickEmail, quickRole) => {
    setEmail(quickEmail);
    setRole(quickRole);
    setPassword("");
    toast.add("Account selected. Enter its password to continue.", "warning");
  };

  const demoTeachers = teachers.slice(0, 3);
  const demoStudents = students.slice(0, 3);

  return (
    <div
      className={`min-h-screen w-full relative overflow-hidden transition-colors duration-500 ${theme === "dark" ? "dark bg-[#0a0510]" : "bg-[#f8f9fb]"}`}
    >
      {/* 3D Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-[#6C1D5F]/20 to-[#84117C]/30 dark:from-[#6C1D5F]/30 dark:to-primary blur-[100px]"
        />
        <motion.div
          animate={{ rotate: -360, scale: [1, 1.2, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tl from-[#01AC9F]/20 to-accent-2/20 dark:from-[#01AC9F]/20 dark:to-accent-2 blur-[120px]"
        />
      </div>

      {/* Theme Toggle - Fixed Visibility */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 15 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleTheme}
        className="absolute top-6 right-6 z-50 p-3.5 rounded-full bg-white/40 dark:bg-black/40 hover:bg-white/60 dark:hover:bg-black/60 text-neutral-800 dark:text-primary shadow-xl backdrop-blur-xl border border-white/50 dark:border-white/10 transition-colors cursor-pointer"
        title="Toggle Theme"
      >
        <AnimatePresence mode="wait">
          {theme === "dark" ? (
            <motion.div
              key="sun"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
            >
              <Sun className="w-5 h-5 text-destructive" />
            </motion.div>
          ) : (
            <motion.div
              key="moon"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
            >
              <Moon className="w-5 h-5 text-indigo-600" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <div className="container mx-auto min-h-screen flex items-center justify-center p-4 relative z-10 perspective-[1000px]">
        {/* Animated Border Light Layer */}
        <div
          className="absolute inset-[-3px] bg-gradient-to-r from-accent-2 via-primary to-[#01AC9F] rounded-[2.6rem] opacity-30 dark:opacity-50 blur-sm animate-spin"
          style={{
            clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
            zIndex: -1,
            animationDuration: "8s",
          }}
        />

        {/* Main Glassmorphism Card */}
        <motion.div
          initial={{ opacity: 0, y: 40, rotateX: 10 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.35, type: "spring", bounce: 0.3 }}
          className="w-full max-w-6xl flex flex-col md:flex-row bg-white/60 dark:bg-[#0d0815]/80 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl dark:shadow-purple-900/20 border border-white/60 dark:border-[#6C1D5F]/20 overflow-hidden transform-gpu relative z-10"
        >
          {/* Branding Column with 3D Depth */}
          <div className="md:w-5/12 bg-gradient-to-br from-[#4A1E47] via-[#6C1D5F] to-[#84117C] text-white p-6 sm:p-8 md:p-10 relative overflow-hidden flex flex-col justify-between shadow-[inset_-20px_0_40px_rgba(0,0,0,0.1)] gap-8 md:gap-0">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#01AC9F]/30 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

            <motion.div
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.05, duration: 0.25 }}
              className="flex items-center gap-3 relative z-10"
            >
              <img
                src="/logo-white.png"
                alt="Xebia"
                className="h-12 transform hover:scale-105 transition-transform"
              />
              <div>
                <h1 className="font-display font-extrabold text-2xl tracking-tight leading-none text-white drop-shadow-md">
                  Xebia LMS
                </h1>
              </div>
            </motion.div>

            <div className="relative z-10 flex flex-col justify-center flex-grow">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-black leading-[1.1] tracking-tight drop-shadow-xl mt-4">
                  Evaluate. Learn. <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#01AC9F] to-[#01AC9F] dark:from-white dark:to-white">
                    Excel.
                  </span>
                </h2>
                <p className="text-purple-200 mt-4 max-w-sm leading-relaxed text-sm md:text-base font-medium">
                  Deliver secure, scalable, and intelligent assessments with automated grading,
                  real-time analytics, and seamless learning experiences—all from one enterprise
                  platform.
                </p>
              </motion.div>
            </div>
          </div>

          {/* Login Interaction Column */}
          <div className="md:w-7/12 p-6 md:p-10 flex items-center justify-center relative">
            <div className="w-full max-w-md space-y-6 relative z-10">
              <div className="text-center md:text-left">
                <h3 className="text-3xl md:text-4xl font-display font-black text-neutral-900 dark:text-white tracking-tight">
                  Welcome Back
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2 font-medium">
                  Select your portal and enter your credentials to continue.
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-5">
                {/* Role Switcher */}
                <div className="grid grid-cols-3 gap-2 p-1.5 bg-neutral-200/50 dark:bg-[#1a1020]/60 backdrop-blur-md rounded-2xl border border-white/50 dark:border-[#6C1D5F]/30 shadow-inner">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={() => setRole("teacher")}
                    className={`flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-extrabold transition-all duration-300 cursor-pointer relative overflow-hidden ${role === "teacher" ? "text-[#6C1D5F] dark:text-[#D4A0D0] shadow-md ring-1 ring-neutral-300 dark:ring-[#6C1D5F]/50 bg-white dark:bg-[#2a1a2e]" : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-white/40 dark:hover:bg-[#2a1a2e]/40"}`}
                  >
                    <ShieldCheck className="w-5 h-5 relative z-10" />
                    <span className="relative z-10 hidden sm:inline">Trainer</span>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={() => setRole("student")}
                    className={`flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-extrabold transition-all duration-300 cursor-pointer relative overflow-hidden ${role === "student" ? "text-[#01AC9F] dark:text-[#5EDED4] shadow-md ring-1 ring-neutral-300 dark:ring-[#01AC9F]/50 bg-white dark:bg-[#1a2a28]" : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-white/40 dark:hover:bg-[#1a2a28]/40"}`}
                  >
                    <GraduationCap className="w-5 h-5 relative z-10" />
                    <span className="relative z-10 hidden sm:inline">Student</span>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={() => setRole("admin")}
                    className={`flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-extrabold transition-all duration-300 cursor-pointer relative overflow-hidden ${role === "admin" ? "text-[#84117C] dark:text-[#FFACE8] shadow-md ring-1 ring-neutral-300 dark:ring-[#84117C]/50 bg-white dark:bg-[#2a1a30]" : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-white/40 dark:hover:bg-[#2a1a30]/40"}`}
                  >
                    <Layers className="w-5 h-5 relative z-10" />
                    <span className="relative z-10 hidden sm:inline">Admin</span>
                  </motion.button>
                </div>

                {/* Email Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-200 ml-1">
                    Institutional Email
                  </label>
                  <div className="relative group">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={
                        role === "teacher"
                          ? "evelyn.stone@xebia-academy.com"
                          : role === "admin"
                            ? "admin@xebia.com"
                            : "student.name@xebia-student.com"
                      }
                      className="w-full px-5 py-4 bg-white/70 dark:bg-[#1a1020]/50 backdrop-blur-md border border-neutral-300/80 dark:border-[#6C1D5F]/30 rounded-2xl text-base focus:outline-none focus:ring-4 focus:ring-[#6C1D5F]/20 dark:focus:ring-[#84117C]/30 focus:border-[#6C1D5F] dark:focus:border-[#84117C] dark:text-white transition-all shadow-sm placeholder:text-neutral-400 dark:placeholder:text-neutral-500 font-medium"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <label
                    htmlFor="login-password"
                    className="block text-sm font-bold text-neutral-700 dark:text-neutral-200 ml-1"
                  >
                    Password
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    className="w-full px-5 py-4 bg-white/70 dark:bg-[#1a1020]/50 backdrop-blur-md border border-neutral-300/80 dark:border-[#6C1D5F]/30 rounded-2xl text-base focus:outline-none focus:ring-4 focus:ring-[#6C1D5F]/20 dark:focus:ring-[#84117C]/30 focus:border-[#6C1D5F] dark:focus:border-[#84117C] dark:text-white transition-all shadow-sm"
                  />
                </div>

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 bg-gradient-to-r from-[#6C1D5F] to-[#84117C] text-white rounded-2xl text-sm font-black uppercase tracking-wide transition-all shadow-[0_8px_30px_rgb(108,29,95,0.3)] flex items-center justify-center gap-2 cursor-pointer overflow-hidden relative group"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                  <span className="relative z-10">
                    {isSubmitting ? "Signing in…" : "Access Portal"}
                  </span>
                  <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1.5 transition-transform" />
                </motion.button>
              </form>

              {/* Demo Accounts Slider */}
              <div className="pt-6 space-y-3">
                <h4 className="text-[10px] font-black text-neutral-400 dark:text-neutral-400 flex items-center gap-3 uppercase tracking-[0.2em]">
                  <div className="h-px bg-neutral-300 dark:bg-[#6C1D5F]/40 flex-1"></div>
                  Quick Access
                  <div className="h-px bg-neutral-300 dark:bg-[#6C1D5F]/40 flex-1"></div>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Teachers Column */}
                  <div className="space-y-2">
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-extrabold uppercase tracking-wider ml-1">
                      Trainers
                    </p>
                    {demoTeachers.map((t, idx) => (
                      <motion.button
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 + idx * 0.05 }}
                        key={t.id}
                        type="button"
                        onClick={() => handleQuickLogin(t.email, "teacher")}
                        className="w-full text-left p-2.5 rounded-2xl bg-white/50 dark:bg-[#2a1a2e]/60 backdrop-blur-sm border border-white/60 dark:border-[#6C1D5F]/30 hover:bg-white dark:hover:bg-[#3a2240] hover:border-[#6C1D5F] dark:hover:border-[#84117C] hover:shadow-md transition-all duration-300 text-xs cursor-pointer flex items-center gap-3 group"
                      >
                        <img
                          src={t.avatar}
                          className="w-8 h-8 rounded-full shadow-sm"
                          alt=""
                          referrerPolicy="no-referrer"
                        />
                        <div className="truncate flex-1">
                          <p className="font-extrabold text-neutral-800 dark:text-white truncate group-hover:text-[#6C1D5F] dark:group-hover:text-[#D4A0D0] transition-colors">
                            {t.name.split(" ")[1] || t.name.split(" ")[0]}
                          </p>
                          <p className="text-[10px] text-neutral-500 dark:text-[#b0a0b0] truncate font-medium">
                            Trainer
                          </p>
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {/* Students Column */}
                  <div className="space-y-2">
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-extrabold uppercase tracking-wider ml-1">
                      Students
                    </p>
                    {demoStudents.map((s, idx) => (
                      <motion.button
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 + idx * 0.05 }}
                        key={s.id}
                        type="button"
                        onClick={() => handleQuickLogin(s.email, "student")}
                        className="w-full text-left p-2.5 rounded-2xl bg-white/50 dark:bg-[#1a2a28]/60 backdrop-blur-sm border border-white/60 dark:border-[#01AC9F]/30 hover:bg-white dark:hover:bg-[#1e3532] hover:border-[#01AC9F] dark:hover:border-[#01AC9F] hover:shadow-md transition-all duration-300 text-xs cursor-pointer flex items-center gap-3 group"
                      >
                        <img
                          src={s.avatar}
                          className="w-8 h-8 rounded-full shadow-sm"
                          alt=""
                          referrerPolicy="no-referrer"
                        />
                        <div className="truncate flex-1">
                          <p className="font-extrabold text-neutral-800 dark:text-white truncate group-hover:text-[#01AC9F] dark:group-hover:text-[#5EDED4] transition-colors">
                            {s.name.split(" ")[0]}
                          </p>
                          <p className="text-[10px] text-neutral-500 dark:text-[#a0c0bc] truncate font-medium">
                            Batch {(s.batches && s.batches[0]) || "B1"}
                          </p>
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {/* Admins Column */}
                  <div className="space-y-2">
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-extrabold uppercase tracking-wider ml-1">
                      Admins
                    </p>
                    <motion.button
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 }}
                      type="button"
                      onClick={() => handleQuickLogin("admin@xebia.com", "admin")}
                      className="w-full text-left p-2.5 rounded-2xl bg-white/50 dark:bg-[#2a1a30]/60 backdrop-blur-sm border border-white/60 dark:border-[#84117C]/30 hover:bg-white dark:hover:bg-[#3a2240] hover:border-[#84117C] dark:hover:border-[#FFACE8] hover:shadow-md transition-all duration-300 text-xs cursor-pointer flex items-center gap-3 group"
                    >
                      <div className="w-8 h-8 rounded-full shadow-sm bg-gradient-to-br from-[#84117C] to-[#6C1D5F] flex items-center justify-center text-white font-bold text-[10px]">
                        A
                      </div>
                      <div className="truncate flex-1">
                        <p className="font-extrabold text-neutral-800 dark:text-white truncate group-hover:text-[#84117C] dark:group-hover:text-[#FFACE8] transition-colors">
                          Admin User
                        </p>
                        <p className="text-[10px] text-neutral-500 dark:text-[#c0a0c0] truncate font-medium">
                          System Admin
                        </p>
                      </div>
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
