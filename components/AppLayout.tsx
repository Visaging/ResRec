// Sophisticated application layout with institutional design and authentication integration

"use client";

import Link from "next/link";
import Image from "next/image";
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
  Bell,
  Sun,
  Moon,
  LogOut,
  User,
  Building2,
  Lock,
  ChevronDown,
  Menu,
  X,
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

// The persistent sidebar is desktop-only; below this width it becomes a drawer.
const SIDEBAR_WIDTH = { collapsed: 64, expanded: 224 };

function getInitials(name?: string): string {
  if (!name) return "US";
  const clean = name.replace(/^Dr\.\s*/i, "").trim();
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

/**
 * The primary navigation list. Rendered by the desktop sidebar (collapsible) and
 * by the mobile drawer (always expanded), so the route list and the active-state
 * treatment stay identical in both places.
 */
function NavigationItems({
  pathname,
  collapsed = false,
  layoutId,
  onNavigate,
}: {
  pathname: string;
  collapsed?: boolean;
  layoutId: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      {navigation.map((item, index) => {
        const isActive = pathname === item.href;
        return (
          <Link key={item.name} href={item.href} className="relative block" onClick={onNavigate}>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center gap-3 px-4 py-2.5 min-h-11 md:min-h-0 text-sm font-medium transition-all ${
                isActive
                  ? "text-ink bg-surface-elevated"
                  : "text-ink-muted hover:text-ink hover:bg-surface-elevated"
              }`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && (
                <span className="whitespace-nowrap">{item.name}</span>
              )}
              {isActive && (
                <motion.div
                  layoutId={layoutId}
                  className="absolute right-0 top-0 bottom-0 w-0.5 bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </motion.div>
          </Link>
        );
      })}
    </>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated, loading } = useAuth();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const userMenuRef = useRef<HTMLDivElement>(null);
  const isLoginPage = pathname === "/login";

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

  // Dismiss the drawer with Escape, and stop the page behind it from scrolling.
  useEffect(() => {
    if (!mobileNavOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileNavOpen(false);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileNavOpen]);

  /*
    The drawer is hidden by CSS at md and up, but its open state (and the body
    scroll lock above) would otherwise survive a resize. This only reconciles
    that state — the responsive layout itself is pure CSS.
  */
  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 768px)");
    function handleBreakpointChange(event: MediaQueryListEvent) {
      if (event.matches) setMobileNavOpen(false);
    }
    desktopQuery.addEventListener("change", handleBreakpointChange);
    return () => desktopQuery.removeEventListener("change", handleBreakpointChange);
  }, []);

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    setMobileNavOpen(false);
    await logout();
    router.push("/login");
  };

  useEffect(() => {
    if (loading) return;

    if (!user) {
      if (!isLoginPage) {
        router.replace(`/login?from=${encodeURIComponent(pathname)}`);
      }
    }

    if (user && isLoginPage) {
      router.replace("/");
    }
  }, [loading, user, isLoginPage, pathname, router]);

  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-background">
        <header className="h-14 bg-surface border-b border-border">
          <div className="flex items-center justify-between h-full px-4 sm:px-6 max-w-7xl mx-auto">
            <Link href="/" className="flex items-center gap-3 min-w-0">
              <Image
                src="/resrec-logo.svg"
                alt="ResRec"
                width={160}
                height={45}
                className="w-32 h-auto shadow-sm sm:w-40"
              />
            </Link>

            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="flex h-11 w-11 sm:h-8 sm:w-8 items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-elevated transition-colors cursor-pointer"
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
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto">{children}</main>
      </div>
    );
  }

  const initials = getInitials(user?.name);
  const institutionDisplay = user?.institutionName || "Indian Institute of Technology Bombay";
  const asideWidth = sidebarCollapsed ? SIDEBAR_WIDTH.collapsed : SIDEBAR_WIDTH.expanded;

  return (
    <div className="min-h-screen bg-background">
      {/* Top institutional header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-surface border-b border-border z-50">
        <div className="flex items-center justify-between h-full gap-2 px-3 sm:px-6">
          <div className="flex items-center gap-3 min-w-0 sm:gap-8">
            {/* Mobile navigation trigger — the sidebar itself is desktop-only */}
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="-ml-1 flex h-11 w-11 shrink-0 items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-elevated transition-colors cursor-pointer md:hidden"
              aria-label="Open navigation menu"
              aria-expanded={mobileNavOpen}
              aria-controls="mobile-navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link href="/" className="flex items-center gap-3 min-w-0">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3"
              >
                <Image
                  src="/resrec-logo.svg"
                  alt="ResRec"
                  width={160}
                  height={45}
                  className="w-28 h-auto shadow-sm sm:w-40"
                />
              </motion.div>
            </Link>
          </div>

          <div className="flex items-center gap-1 sm:gap-4 lg:gap-6">
            <span className="text-sm text-ink-muted hidden lg:block font-medium">
              {institutionDisplay}
            </span>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-elevated transition-colors cursor-pointer"
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
                    className="fixed inset-x-3 top-16 z-50 bg-surface border border-border shadow-lg sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80"
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

            {/* Theme Switcher — below sm it lives in the navigation drawer instead,
                where the header would otherwise be overcrowded. */}
            <button
              onClick={toggleTheme}
              className="hidden sm:flex h-8 w-8 items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-elevated transition-colors cursor-pointer"
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
                  className="flex items-center gap-3 min-h-11 md:min-h-0 pl-3 sm:pl-4 border-l border-border hover:opacity-90 transition-opacity cursor-pointer text-left"
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
                  className="flex items-center gap-2 min-h-11 md:min-h-0 pl-3 sm:pl-4 border-l border-border text-sm font-semibold text-primary hover:underline"
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
                    className="fixed inset-x-3 top-16 z-50 bg-surface border border-border shadow-xl p-4 divide-y divide-border sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-72"
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

      {/* Mobile navigation drawer — takes over from the sidebar below md */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.div
              key="mobile-nav-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileNavOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              aria-hidden="true"
            />
            <motion.aside
              key="mobile-nav"
              id="mobile-navigation"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="fixed top-14 left-0 bottom-0 z-50 flex w-72 max-w-[85vw] flex-col bg-surface border-r border-border md:hidden"
              aria-label="Navigation"
            >
              <div className="flex items-center justify-between gap-2 p-3 border-b border-border">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
                  Workspace
                </span>
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(false)}
                  className="flex h-11 w-11 items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-elevated transition-colors cursor-pointer"
                  aria-label="Close navigation menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 py-4 overflow-y-auto">
                <NavigationItems
                  pathname={pathname}
                  layoutId="activeIndicatorMobile"
                  onNavigate={() => setMobileNavOpen(false)}
                />
              </nav>

              <div className="border-t border-border">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex w-full min-h-11 items-center gap-3 px-4 text-sm font-medium text-ink-muted hover:text-ink hover:bg-surface-elevated transition-colors cursor-pointer"
                >
                  {theme === "dark" ? (
                    <Sun className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <Moon className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span className="whitespace-nowrap">
                    {theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
                  </span>
                </button>
              </div>

            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Sidebar (desktop) */}
      <motion.aside
        animate={{ width: asideWidth }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="hidden md:block fixed top-14 left-0 bottom-0 bg-surface border-r border-border overflow-hidden z-40"
      >
        <nav className="flex flex-col h-full">
          {/* Collapse button */}
          <div
            className={`flex items-center gap-2 p-3 border-b border-border ${
              sidebarCollapsed ? "justify-center" : "justify-between"
            }`}
          >
            {!sidebarCollapsed && (
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
                Workspace
              </span>
            )}
            <motion.button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!sidebarCollapsed}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface-elevated/60 text-ink-muted shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary cursor-pointer"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <motion.span
                animate={{ rotate: sidebarCollapsed ? 180 : 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex"
              >
                <ChevronLeft className="w-4 h-4" />
              </motion.span>
            </motion.button>
          </div>

          {/* Main navigation */}
          <div className="flex-1 py-4 overflow-y-auto">
            <NavigationItems
              pathname={pathname}
              collapsed={sidebarCollapsed}
              layoutId="activeIndicator"
            />
          </div>

          {/* Sidebar Footer User Info */}
        </nav>
      </motion.aside>

      {/* Main content. The spacer below reproduces the sidebar offset in the flow so
          the responsive behaviour stays in CSS (the sidebar is desktop-only). */}
      <div className="pt-14 min-h-screen bg-background flex">
        <motion.div
          aria-hidden="true"
          animate={{ width: asideWidth }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="hidden shrink-0 md:block"
        />
        <main className="flex-1 min-w-0">
          <div className="p-4 sm:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
