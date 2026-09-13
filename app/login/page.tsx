"use client";

import React, { useState, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Building2,
  Atom,
  KeyRound,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Fingerprint,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const DEMO_ACCOUNTS = [
  {
    name: "Akshat Agrawal",
    email: "akshat.agrawal@iitb.ac.in",
    password: "password123",
    role: "Lead Investigator",
    institution: "Indian Institute of Technology Bombay",
    department: "Materials Science & Battery Storage",
    badge: "EXP-0042 Owner",
  },
  {
    name: "Armaan Singh",
    email: "armaan.singh@iisc.ac.in",
    password: "password123",
    role: "Principal Investigator",
    institution: "Indian Institute of Science, Bengaluru",
    department: "Genomics & CRISPR Therapeutics",
    badge: "EXP-0038 Owner",
  },
  {
    name: "Ayush Roy",
    email: "ayush.roy@iitd.ac.in",
    password: "password123",
    role: "Senior Physicist",
    institution: "Indian Institute of Technology Delhi",
    department: "High Pressure Condensed Matter",
    badge: "EXP-0019 Owner",
  },
  {
    name: "Abhinav Raturi",
    email: "abhinav.raturi@iitm.ac.in",
    password: "password123",
    role: "Peer Reviewer",
    institution: "Indian Institute of Technology Madras",
    department: "Materials Science & Review Board",
    badge: "Reviewer",
  },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("from") || "/";

  const { login, register } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [institutionName, setInstitutionName] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("RESEARCHER");

  const selectDemoAccount = (account: typeof DEMO_ACCOUNTS[0]) => {
    setMode("login");
    setEmail(account.email);
    setPassword(account.password);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (mode === "login") {
        if (!email || !password) {
          throw new Error("Please enter both email and password.");
        }
        await login(email, password);
        setSuccessMessage("Cryptographic session verified. Access granted.");
        setTimeout(() => {
          router.push(returnUrl);
          router.refresh();
        }, 500);
      } else {
        if (!name || !email || !password) {
          throw new Error("Name, email, and password are required.");
        }
        if (password.length < 8) {
          throw new Error("Password must be at least 8 characters long.");
        }
        await register({
          name,
          email,
          password,
          institutionName: institutionName || undefined,
          department: department || undefined,
          role,
        });
        setSuccessMessage("Institutional researcher account created successfully.");
        setTimeout(() => {
          router.push(returnUrl);
          router.refresh();
        }, 500);
      }
    } catch (err: unknown) {
      console.error("Auth error:", err);
      setError(err instanceof Error ? err.message : "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Background Decorative Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-40 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 z-10">
        {/* Left Column: Context & Scientific Assurance */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-5 flex flex-col justify-between space-y-6"
        >
          <div>
            <div className="mb-6">
              <Image
                src="/resrec-logo.svg"
                alt="ResRec"
                width={280}
                height={79}
                className="w-64 h-auto shadow-sm"
              />
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-ink leading-tight">
                Cryptographically Verifiable Scientific Research
              </h2>
              <p className="text-sm text-ink-muted leading-relaxed">
                Log in to manage your experiments, dataset version commitments, and ML-DSA-65 post-quantum verified evidence receipts with strict user data isolation.
              </p>
            </div>

            {/* Platform Integrity Guarantees */}
            <div className="mt-8 space-y-3">
              <div className="flex items-start gap-3 p-3 bg-surface border border-border">
                <ShieldCheck className="w-5 h-5 text-success shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-semibold text-ink block">CooL Receipt Verification</span>
                  <span className="text-ink-muted">Tamper-evident logs sealed with digital signatures.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-surface border border-border">
                <Fingerprint className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-semibold text-ink block">Isolated Workspace</span>
                  <span className="text-ink-muted">Zero unauthorized access across peer research groups.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-surface border border-border">
                <Atom className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-semibold text-ink block">Reproducible Lineage</span>
                  <span className="text-ink-muted">Dataset version trees with direct hash commitments.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Demo Credentials */}
          <div className="p-4 bg-surface border border-border/80">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-ink uppercase tracking-wider">
                Quick Demo Switcher
              </span>
            </div>
            <p className="text-xs text-ink-faint mb-3">
              Click any researcher profile below to test data isolation instantly:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => selectDemoAccount(acc)}
                  className="text-left p-2 bg-surface-elevated hover:bg-surface-elevated/80 border border-border text-xs transition-colors group cursor-pointer"
                >
                  <div className="font-medium text-ink flex items-center justify-between">
                    <span>{acc.name.replace("Dr. ", "")}</span>
                    <span className="text-[10px] px-1 bg-surface text-ink-faint border border-border">
                      {acc.badge}
                    </span>
                  </div>
                  <div className="text-[10px] text-ink-faint truncate mt-0.5">
                    {acc.institution}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right Column: Authentication Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="lg:col-span-7 bg-surface border border-border shadow-sm p-6 sm:p-8"
        >
          {/* Mode Switcher Tabs */}
          <div className="flex border-b border-border mb-6">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
                setSuccessMessage(null);
              }}
              className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                mode === "login"
                  ? "border-primary text-ink"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              Sign In to Portal
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError(null);
                setSuccessMessage(null);
              }}
              className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                mode === "register"
                  ? "border-primary text-ink"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Feedback messages */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-3.5 bg-error/10 border border-error/30 text-error flex items-start gap-3 text-xs"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            {successMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-3.5 bg-success/10 border border-success/30 text-success flex items-start gap-3 text-xs"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                    Full Name & Academic Title
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-ink-faint" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-surface-elevated border border-border text-ink focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                      Institution Name
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-ink-faint" />
                      <input
                        type="text"
                        placeholder="e.g. Indian Institute of Technology Bombay"
                        value={institutionName}
                        onChange={(e) => setInstitutionName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm bg-surface-elevated border border-border text-ink focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                      Department / Lab
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Condensed Matter Lab"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-surface-elevated border border-border text-ink focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                    Research Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-surface-elevated border border-border text-ink focus:outline-none focus:border-primary transition-colors"
                  >
                    <option value="RESEARCHER">Primary Investigator / Researcher</option>
                    <option value="REVIEWER">Peer Reviewer / Audit Board</option>
                    <option value="ADMIN">Institutional Lab Administrator</option>
                  </select>
                </div>
              </motion.div>
            )}

            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                Institutional Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-ink-faint" />
                <input
                  type="email"
                  required
                  placeholder="name@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-surface-elevated border border-border text-ink focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                Passphrase
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-ink-faint" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-surface-elevated border border-border text-ink focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              {mode === "register" && (
                <p className="text-[11px] text-ink-faint mt-1">
                  Must be at least 8 characters. Hashed using scrypt with a 32-byte cryptographic salt.
                </p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-primary text-primary-ink font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary-hover disabled:opacity-50 transition-colors cursor-pointer shadow-sm"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-ink/30 border-t-primary-ink rounded-full animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : mode === "login" ? (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Sign In to Repository</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Establish Institutional Account</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer note */}
          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs text-ink-faint">
            <span>Identity standard: W3C DID / NIST SP 800-63B</span>
            <span className="font-mono">CooL Core v1.4</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

