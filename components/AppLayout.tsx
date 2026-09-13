// Sophisticated application layout with institutional design

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useTheme } from "@/lib/theme";
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

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      {/* Top institutional header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-surface border-b border-border z-50">
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center gap-8">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-primary flex items-center justify-center text-primary-ink font-bold text-sm">
                R
              </div>
              <div>
                <h1 className="text-base font-semibold text-ink tracking-tight">
                  ResRec
                </h1>
                <p className="text-xs text-ink-faint leading-none">
                  Research Evidence Infrastructure
                </p>
              </div>
            </motion.div>
          </div>

          <div className="flex items-center gap-6">
            <span className="text-sm text-ink-muted hidden lg:block">
              National Institute of Advanced Materials
            </span>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 text-ink-muted hover:text-ink hover:bg-surface-elevated transition-colors"
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
                    <div className="p-4 border-b border-border">
                      <h3 className="text-sm font-semibold text-ink">
                        Notifications
                      </h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto divide-y divide-border">
                      <div className="p-4 hover:bg-surface-elevated transition-colors">
                        <div className="text-sm text-ink mb-1">
                          Integrity verification failed
                        </div>
                        <div className="text-xs text-ink-muted">
                          EXP-2026-0042 · 2 hours ago
                        </div>
                      </div>
                      <div className="p-4 hover:bg-surface-elevated transition-colors">
                        <div className="text-sm text-ink mb-1">
                          Dataset finalized
                        </div>
                        <div className="text-xs text-ink-muted">
                          thermal-cycling-042.csv · 3 hours ago
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
              className="p-2 text-ink-muted hover:text-ink hover:bg-surface-elevated transition-colors"
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

            {/* User profile */}
            <div className="flex items-center gap-3 pl-6 border-l border-border">
              <div className="text-right hidden md:block">
                <p className="text-sm text-ink leading-tight">Dr. Sarah Chen</p>
                <p className="text-xs text-ink-faint leading-tight">Researcher</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-surface-elevated flex items-center justify-center text-sm text-ink font-medium border border-border-strong">
                SC
              </div>
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
              className="p-1.5 text-ink-muted hover:text-ink hover:bg-surface-elevated transition-all"
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
                  className="relative"
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
