// Enhanced UI components for ResRec v2

"use client";

import { cn } from "@/lib/utils";
import type { VerificationStatus } from "@/types";
import { CheckCircle2, XCircle, AlertCircle, Minus, Copy, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

// Status Badge with animation
interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variants: Record<string, string> = {
    active: "bg-primary/10 text-primary border-primary/25",
    completed: "bg-surface-elevated text-ink-muted border-border",
    under_review: "bg-warning/10 text-warning border-warning/25",
    integrity_issue: "bg-error/10 text-error border-error/25",
    verified: "bg-success/10 text-success border-success/25",
    failed: "bg-error/10 text-error border-error/25",
    not_provided: "bg-surface-elevated text-ink-faint border-border",
    not_checked: "bg-surface-elevated text-ink-faint border-border",
  };

  const variant = variants[status] ?? variants.not_checked;
  const label = status.replace(/_/g, " ");

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "inline-flex items-center px-2.5 py-1 text-xs font-medium border uppercase tracking-wide whitespace-nowrap",
        variant,
        className
      )}
    >
      {label}
    </motion.span>
  );
}

// General Badge component
interface BadgeProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "success" | "warning" | "error";
  className?: string;
}

export function Badge({ children, variant = "secondary", className }: BadgeProps) {
  const variants: Record<string, string> = {
    primary: "bg-primary/10 text-primary border-primary/25",
    secondary: "bg-surface-elevated text-ink border-border",
    success: "bg-success/10 text-success border-success/25",
    warning: "bg-warning/10 text-warning border-warning/25",
    error: "bg-error/10 text-error border-error/25",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 text-xs font-medium border uppercase tracking-wide",
        variants[variant] ?? variants.secondary,
        className
      )}
    >
      {children}
    </span>
  );
}

// Verification Icon with status
interface VerificationIconProps {
  status: VerificationStatus;
  className?: string;
  animate?: boolean;
}

export function VerificationIcon({ status, className, animate = true }: VerificationIconProps) {
  const icons: Record<VerificationStatus, React.ReactNode> = {
    verified: <CheckCircle2 className="w-4 h-4 text-success" />,
    failed: <XCircle className="w-4 h-4 text-error" />,
    not_provided: <Minus className="w-4 h-4 text-ink-faint" />,
    not_checked: <AlertCircle className="w-4 h-4 text-ink-faint" />,
  };

  const icon = icons[status] ?? icons.not_checked;

  if (!animate) {
    return (
      <span className={cn("inline-flex items-center", className)}>{icon}</span>
    );
  }

  return (
    <motion.span
      className={cn("inline-flex items-center", className)}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, type: "spring", stiffness: 400, damping: 25 }}
    >
      {icon}
    </motion.span>
  );
}

// Page Header
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions, badge }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-8"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-2">
            <h1 className="text-2xl font-semibold text-ink">{title}</h1>
            {badge}
          </div>
          {subtitle && <p className="text-sm text-ink-muted leading-relaxed max-w-3xl">{subtitle}</p>}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-3 sm:ml-6">{actions}</div>
        )}
      </div>
    </motion.div>
  );
}

// Section
interface SectionProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function Section({ title, subtitle, children, className, action }: SectionProps) {
  return (
    <section className={cn("mb-8", className)}>
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="min-w-0">
            {title && <h2 className="text-base font-semibold text-ink">{title}</h2>}
            {subtitle && <p className="text-sm text-ink-muted mt-1">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

// Card with hover effect
interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, hover = false, onClick }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className={cn(
        "bg-surface border border-border",
        hover && "transition-colors hover:border-border-strong hover:shadow-sm cursor-pointer",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

// Button with variants
interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onAnimationStart" | "onDragStart" | "onDragEnd" | "onDrag"> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "xs" | "sm" | "md" | "lg";
  children: React.ReactNode;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  children,
  className,
  loading,
  disabled,
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "bg-primary text-primary-ink border border-primary hover:bg-primary-hover hover:border-primary-hover",
    secondary:
      "bg-surface text-ink border border-border hover:bg-surface-elevated hover:border-border-strong",
    outline:
      "bg-transparent text-ink-muted border border-border hover:text-ink hover:border-border-strong hover:bg-surface-elevated",
    ghost:
      "bg-transparent text-ink-muted border border-transparent hover:text-ink hover:bg-surface-elevated",
    danger:
      "bg-error text-white border border-error hover:opacity-90",
  };

  /*
    Below `sm` the vertical padding is raised so controls clear the ~44px
    minimum touch target; from `sm` up the boxes are exactly the original sizes.
  */
  const sizes = {
    xs: "px-2 py-1 text-xs",
    sm: "px-3 py-2.5 sm:py-1.5 text-xs",
    md: "px-4 py-3 sm:py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.015 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.985 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        variants[variant],
        sizes[size],
        (disabled || loading) && "cursor-not-allowed opacity-60",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {children}
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
}

// Input with focus animation
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-ink mb-1.5">{label}</label>
      )}
      <input
        className={cn(
          // 16px type + taller box on small screens: comfortable to tap and it
          // stops mobile browsers from zooming in on focus.
          "w-full min-w-0 px-3 py-2.5 sm:py-2 border bg-surface text-base sm:text-sm text-ink placeholder:text-ink-faint",
          "focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary",
          "transition-colors duration-200",
          error ? "border-error" : "border-border hover:border-border-strong",
          className
        )}
        {...props}
      />
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1.5 text-xs text-error"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

// Select
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className, ...props }: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-ink mb-1.5">{label}</label>
      )}
      <select
        className={cn(
          "w-full min-w-0 px-3 py-2.5 sm:py-2 border border-border bg-surface text-base sm:text-sm text-ink",
          "focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary",
          "hover:border-border-strong transition-colors duration-200",
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// Textarea
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ label, className, ...props }: TextareaProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-ink mb-1.5">{label}</label>
      )}
      <textarea
        className={cn(
          "w-full min-w-0 px-3 py-2.5 sm:py-2 border border-border bg-surface text-base sm:text-sm text-ink placeholder:text-ink-faint",
          "focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary",
          "hover:border-border-strong transition-colors duration-200",
          className
        )}
        {...props}
      />
    </div>
  );
}

// Copy button with feedback
interface CopyButtonProps {
  text: string;
  className?: string;
}

export function CopyButton({ text, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "p-1.5 text-ink-faint hover:text-ink hover:bg-surface-elevated transition-colors",
        className
      )}
      title="Copy to clipboard"
      aria-label="Copy to clipboard"
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.div
            key="check"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <Check className="w-4 h-4 text-success" />
          </motion.div>
        ) : (
          <motion.div
            key="copy"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <Copy className="w-4 h-4" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

// Empty State
interface EmptyStateProps {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="text-center py-12 sm:py-16"
    >
      {icon && <div className="flex justify-center mb-4 text-ink-faint">{icon}</div>}
      <h3 className="text-base font-semibold text-ink mb-2">{title}</h3>
      {description && (
        <div className="text-sm text-ink-muted mb-6 max-w-md mx-auto">{description}</div>
      )}
      {action}
    </motion.div>
  );
}

// Loading Skeleton with shimmer
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded", className)} role="status" aria-label="Loading" />;
}

// Table wrapper
interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export function Table({ children, className }: TableProps) {
  return (
    /*
      Wide data tables scroll inside this box — that is the shared strategy for
      content which genuinely cannot fit a narrow viewport. The page itself never
      scrolls sideways, and columns keep their readable width instead of being
      squeezed into unreadable type.
    */
    <div className="w-full max-w-full overflow-x-auto overscroll-x-contain">
      <table className={cn("w-full text-sm", className)}>{children}</table>
    </div>
  );
}

// Metric Card for dashboard
interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  sparkline?: number[];
}

export function MetricCard({ label, value, subtitle, trend }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-surface border border-border p-4 sm:p-6 hover:border-border-strong hover:shadow-sm transition-colors"
    >
      <div className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-2">
        {label}
      </div>
      <div className="text-2xl sm:text-3xl font-semibold text-ink mb-1 tabular-nums-sm">{value}</div>
      {subtitle && (
        <div className="text-xs text-ink-muted flex items-center gap-1">
          {trend && (
            <span
              className={cn(
                "font-medium",
                trend === "up" && "text-success",
                trend === "down" && "text-error"
              )}
            >
              {trend === "up" ? "↑" : trend === "down" ? "↓" : ""}
            </span>
          )}
          {subtitle}
        </div>
      )}
    </motion.div>
  );
}

// Tab Navigation
interface TabProps {
  tabs: { id: string; label: string; count?: number }[];
  activeTab: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabProps) {
  return (
    <div className="border-b border-border">
      {/* Scrolls horizontally on narrow screens; from `sm` up the overflow is
          visible again so the desktop tab bar renders exactly as before. */}
      <div className="flex gap-4 overflow-x-auto overscroll-x-contain sm:gap-6 sm:overflow-x-visible">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="relative shrink-0 whitespace-nowrap sm:shrink sm:whitespace-normal pb-3 text-sm font-medium transition-colors"
            aria-current={activeTab === tab.id ? "page" : undefined}
          >
            <span
              className={cn(
                "transition-colors",
                activeTab === tab.id ? "text-ink" : "text-ink-muted hover:text-ink"
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-2 text-xs text-ink-faint">({tab.count})</span>
              )}
            </span>
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute -bottom-px left-0 right-0 h-0.5 bg-primary"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// Modal Component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "lg",
}: ModalProps) {
  if (!isOpen) return null;

  const widthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-3 sm:items-center sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        />

        {/* Dialog Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={cn(
            // `dvh` keeps the dialog — and its close button — inside the visible
            // area on mobile browsers whose URL bar overlaps the large viewport.
            "relative w-full bg-surface border border-border shadow-2xl z-10 max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] flex flex-col overflow-hidden",
            widthClasses[maxWidth]
          )}
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 p-4 sm:p-6 border-b border-border bg-surface-elevated">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-ink">{title}</h2>
              {description && (
                <p className="text-sm text-ink-muted mt-1">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="flex h-11 w-11 sm:h-8 sm:w-8 shrink-0 items-center justify-center text-ink-muted hover:text-ink hover:bg-surface transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1">{children}</div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

