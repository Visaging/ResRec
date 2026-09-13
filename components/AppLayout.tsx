// Sophisticated application layout with institutional design and authentication integration

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  FlaskConical,
  Database,
  Shield,
  ShieldCheck,
  GitBranch,
  FileText,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Bell,
  Sun,
  Moon,
  LogOut,
  User,
  Building2,
  Lock,
  ChevronDown,
} from "lucide-react";

const navigation = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Experiments", href: "/experiments", icon: FlaskConical },
  { name: "Datasets", href: "/datasets", icon: Database },
  { name: "Evidence", href: "/evidence", icon: Shield },
  { name: "Provenance", href: "/provenance", icon: GitBranch },
  { name: "Verification", href: "/verification", icon: ShieldCheck },
  { name: "Submissions", href: "/submissions", icon: FileText },
  { name: "Reports", href: "/reports", icon: BarChart3 },
];

function getInitials(name?: string): string {
  if (!name) return "US";
  const clean = name.replace(/^Dr\.\s*/i, "").trim();
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    await logout();
    router.push("/login");
  };

  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-background">
        <header className="h-14 bg-surface border-b border-border">
          <div className="flex items-center justify-between h-full px-6 max-w-7xl mx-auto">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary flex items-center justify-center text-primary-ink font-bold text-sm shadow-sm">
                R
              </div>
              <div>
                <h1 className="text-base font-semibold text-ink tracking-tight font-serif">
                  ResRec
                </h1>
                <p className="text-xs text-ink-faint leading-none">
                  Research Evidence Infrastructure
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="p-2 text-ink-muted hover:text-ink hover:bg-surface-elevated transition-colors cursor-pointer"
                title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto">{children}</main>
      </div>
    );
  }

  const initials = getInitials(user?.name);
  const institutionDisplay = user?.institutionName || "Stanford University";

  return (
    <div className="min-h-screen bg-background">
      {/* Top institutional header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-surface border-b border-border z-50">
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-primary flex items-center justify-center text-primary-ink font-bold text-sm shadow-sm">
                  R
                </div>
                <div>
                  <h1 className="text-base font-semibold text-ink tracking-tight font-serif">
                    ResRec
                  </h1>
                  <p className="text-xs text-ink-faint leading-none">
                    Research Evidence Infrastructure
                  </p>
                </div>
              </motion.div>
            </Link>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <span className="text-sm text-ink-muted hidden lg:block font-medium">
              {institutionDisplay}
            </span>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 text-ink-muted hover:text-ink hover:bg-surface-elevated transition-colors cursor-pointer"
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full" />
              </button>

              <AnimatePresence>
                {notificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-80 bg-surface border border-border shadow-lg z-50"
                  >
                    <div className="p-4 border-b border-border flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-ink">
                        System Notifications
                      </h3>
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 font-mono font-medium">
                        CooL v1.4
                      </span>
                    </div>
                    <div className="max-h-96 overflow-y-auto divide-y divide-border">
                      <div className="p-4 hover:bg-surface-elevated transition-colors">
                        <div className="text-sm text-ink font-medium mb-1">
                          Integrity Verification Ready
                        </div>
                        <div className="text-xs text-ink-muted">
                          All ML-DSA-65 post-quantum signatures validated.
                        </div>
                      </div>
                      <div className="p-4 hover:bg-surface-elevated transition-colors">
                        <div className="text-sm text-ink font-medium mb-1">
                          Session Cryptographically Verified
                        </div>
                        <div className="text-xs text-ink-muted">
                          Logged in as {user?.name || "Researcher"}.
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Theme Switcher */}
            <button
              onClick={toggleTheme}
              className="p-2 text-ink-muted hover:text-ink hover:bg-surface-elevated transition-colors cursor-pointer"
              title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              aria-label={
                theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
              }
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            {/* User profile dropdown */}
            <div className="relative" ref={userMenuRef}>
              {isAuthenticated && user ? (
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 pl-4 border-l border-border hover:opacity-90 transition-opacity cursor-pointer text-left"
                >
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-medium text-ink leading-tight">
                      {user.name}
                    </p>
                    <p className="text-xs text-ink-faint leading-tight">
                      {user.role === "REVIEWER" ? "Peer Reviewer" : "Researcher"}
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center text-sm font-semibold border border-primary/30">
                    {initials}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-ink-faint hidden md:block" />
                </button>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-2 pl-4 border-l border-border text-sm font-semibold text-primary hover:underline"
                >
                  <Lock className="w-4 h-4" />
                  <span>Sign In</span>
                </Link>
              )}

              <AnimatePresence>
                {userMenuOpen && user && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-72 bg-surface border border-border shadow-xl z-50 p-4 divide-y divide-border"
                  >
                    <div className="pb-3">
                      <p className="text-sm font-bold text-ink">{user.name}</p>
                      <p className="text-xs text-ink-faint truncate">{user.email}</p>
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-ink-muted">
                        <Building2 className="w-3.5 h-3.5 text-ink-faint shrink-0" />
                        <span className="truncate">{user.institutionName || "Independent"}</span>
                      </div>
                      {user.department && (
                        <p className="text-[11px] text-ink-faint mt-0.5 truncate pl-5">
                          {user.department}
                        </p>
                      )}
                    </div>

                    <div className="py-2">
                      <Link
                        href="/login"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-2 py-1.5 text-xs text-ink-muted hover:text-ink hover:bg-surface-elevated transition-colors"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>Switch Researcher Account</span>
                      </Link>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-error hover:bg-error/10 transition-colors cursor-pointer text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 64 : 224 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed top-14 left-0 bottom-0 bg-surface border-r border-border overflow-hidden z-40"
      >
        <nav className="flex flex-col h-full">
          {/* Collapse button */}
          <div className="flex justify-end p-3 border-b border-border">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 text-ink-muted hover:text-ink hover:bg-surface-elevated transition-all cursor-pointer"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Main navigation */}
          <div className="flex-1 py-4 overflow-y-auto">
            {navigation.map((item, index) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="relative block"
                >
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all ${
                      isActive
                        ? "text-ink bg-surface-elevated"
                        : "text-ink-muted hover:text-ink hover:bg-surface-elevated"
                    }`}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <span className="whitespace-nowrap">{item.name}</span>
                    )}
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute right-0 top-0 bottom-0 w-0.5 bg-primary"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </div>

          {/* Sidebar Footer User Info */}
          {!sidebarCollapsed && user && (
            <div className="p-3 border-t border-border bg-surface-elevated/40">
              <div className="flex items-center justify-between text-xs">
                <div className="truncate pr-2">
                  <span className="font-semibold text-ink block truncate">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-success flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                    CooL Node Active
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  title="Sign Out"
                  className="p-1 text-ink-muted hover:text-error transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </nav>
      </motion.aside>

      {/* Main content */}
      <motion.main
        animate={{ marginLeft: sidebarCollapsed ? 64 : 224 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="pt-14 min-h-screen bg-background"
      >
        <div className="p-8">{children}</div>
      </motion.main>
    </div>
  );
}
