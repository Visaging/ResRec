"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, CircleUserRound, Loader2, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate } from "@/lib/utils";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type ProfileFields = "name" | "email" | "institutionName" | "department";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, updateProfile, changePassword, updateAvatar } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [institutionName, setInstitutionName] = useState("");
  const [department, setDepartment] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");
  const [profilePassword, setProfilePassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ProfileFields, string>>>({});
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      setName(user.name);
      setEmail(user.email);
      setCurrentEmail(user.email);
      setInstitutionName(user.institutionName || "");
      setDepartment(user.department || "");
    }
  }, [loading, user]);

  const isDirty = name !== user?.name || email !== currentEmail || institutionName !== (user?.institutionName || "") || department !== (user?.department || "");

  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const handleInternalNavigation = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as HTMLElement;
      const link = target.closest("a");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;

      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin || destination.pathname === window.location.pathname) return;

      if (!window.confirm("You have unsaved profile changes. Leave this page without saving?")) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    const handleHistoryNavigation = () => {
      if (!window.confirm("You have unsaved profile changes. Leave this page without saving?")) {
        window.history.pushState(null, "", window.location.href);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleInternalNavigation, true);
    window.addEventListener("popstate", handleHistoryNavigation);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleInternalNavigation, true);
      window.removeEventListener("popstate", handleHistoryNavigation);
    };
  }, [isDirty]);

  useEffect(() => {
    if (!loading && !user) router.replace("/login?from=%2Fprofile");
  }, [loading, user, router]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    const nextErrors: Partial<Record<ProfileFields, string>> = {};
    if (name.trim().length === 0) nextErrors.name = "Name is required.";
    if (!EMAIL_REGEX.test(email.trim())) nextErrors.email = "Enter a valid email address.";
    if (name.trim().length > 120) nextErrors.name = "Name must be 120 characters or fewer.";
    if (institutionName.trim().length > 200) nextErrors.institutionName = "Institution must be 200 characters or fewer.";
    if (department.trim().length > 160) nextErrors.department = "Department must be 160 characters or fewer.";
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setSaving(false);
      return;
    }

    try {
      await updateProfile({ name, email, institutionName, department, currentPassword: profilePassword });
      setCurrentEmail(email.trim().toLowerCase());
      setProfilePassword("");
      setMessage("Profile updated successfully.");
    } catch (profileError) {
      setError(profileError instanceof Error ? profileError.message : "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setChangingPassword(true);
    setPasswordMessage(null);
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      setChangingPassword(false);
      return;
    }

    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage("Password changed successfully. Other sessions have been signed out.");
    } catch (passwordChangeError) {
      setPasswordError(passwordChangeError instanceof Error ? passwordChangeError.message : "Unable to change password.");
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading || !user) return null;

  const initials = (() => {
    if (!user.name) return "US";
    const clean = user.name.replace(/^Dr\.\s*/i, "").trim();
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return clean.slice(0, 2).toUpperCase();
  })();

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAvatarError(null);

    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setAvatarError("Unsupported format. Use JPEG, PNG, WebP, or GIF.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError("Image must be smaller than 2 MB.");
      return;
    }

    setAvatarUploading(true);
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to read file."));
        reader.readAsDataURL(file);
      });
      await updateAvatar(dataUrl);
    } catch (uploadError) {
      setAvatarError(uploadError instanceof Error ? uploadError.message : "Unable to upload avatar.");
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarError(null);
    setAvatarUploading(true);
    try {
      await updateAvatar(null);
    } catch (removeError) {
      setAvatarError(removeError instanceof Error ? removeError.message : "Unable to remove avatar.");
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Profile"
        subtitle="Manage your researcher details and workspace information."
      />

      {/* Avatar section – centered at top */}
      <div className="bg-surface border border-border p-5 sm:p-7">
        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-24 h-24 rounded-full object-cover border-2 border-primary/30"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary/15 text-primary flex items-center justify-center text-2xl font-bold border-2 border-primary/30">
                {initials}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
              aria-label="Change profile picture"
            >
              {avatarUploading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Camera className="w-6 h-6" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-ink">{user.name}</p>
            <p className="text-xs text-ink-muted">{user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              className="text-xs font-medium text-primary hover:text-primary-hover transition-colors cursor-pointer disabled:opacity-50"
            >
              {user.avatarUrl ? "Change photo" : "Upload photo"}
            </button>
            {user.avatarUrl && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                disabled={avatarUploading}
                className="flex items-center gap-1 text-xs font-medium text-error hover:text-error/80 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3 h-3" />
                Remove
              </button>
            )}
          </div>
          {avatarError && <p className="text-xs text-error">{avatarError}</p>}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface border border-border p-5 sm:p-7 space-y-6">
        <div className="flex items-center gap-3 border-b border-border pb-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
            <CircleUserRound className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-ink">Personal details</h2>
            <p className="text-xs text-ink-muted">These details appear in your research workspace.</p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-sm text-ink-muted">
            Full name
            <input value={name} onChange={(event) => setName(event.target.value)} className="mt-1.5 w-full border border-border bg-background px-3 py-2.5 text-sm text-ink outline-none focus:border-primary" required />
            {fieldErrors.name && <span className="mt-1 block text-xs text-error">{fieldErrors.name}</span>}
          </label>
          <label className="text-sm text-ink-muted">
            Email address
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full border border-border bg-background px-3 py-2.5 text-sm text-ink outline-none focus:border-primary" required />
            {fieldErrors.email && <span className="mt-1 block text-xs text-error">{fieldErrors.email}</span>}
          </label>
          <label className="text-sm text-ink-muted">
            Institution
            <input value={institutionName} onChange={(event) => setInstitutionName(event.target.value)} className="mt-1.5 w-full border border-border bg-background px-3 py-2.5 text-sm text-ink outline-none focus:border-primary" />
            {fieldErrors.institutionName && <span className="mt-1 block text-xs text-error">{fieldErrors.institutionName}</span>}
          </label>
          <label className="text-sm text-ink-muted">
            Department
            <input value={department} onChange={(event) => setDepartment(event.target.value)} className="mt-1.5 w-full border border-border bg-background px-3 py-2.5 text-sm text-ink outline-none focus:border-primary" />
            {fieldErrors.department && <span className="mt-1 block text-xs text-error">{fieldErrors.department}</span>}
          </label>
        </div>

        <div className="grid gap-5 border-t border-border pt-5 sm:grid-cols-2">
          <label className="text-sm text-ink-muted">
            Account role
            <input value={user.role === "REVIEWER" ? "Peer Reviewer" : user.role} readOnly className="mt-1.5 w-full cursor-not-allowed border border-border bg-surface-elevated px-3 py-2.5 text-sm text-ink-muted" />
          </label>
          <div className="text-sm text-ink-muted">
            Account created
            <p className="mt-1.5 border border-border bg-surface-elevated px-3 py-2.5 text-sm text-ink-muted">{user.createdAt ? formatDate(user.createdAt) : "Not available"}</p>
          </div>
        </div>

        {email.trim().toLowerCase() !== currentEmail && (
          <label className="block text-sm text-ink-muted">
            Current password to change email
            <input type="password" value={profilePassword} onChange={(event) => setProfilePassword(event.target.value)} className="mt-1.5 w-full border border-border bg-background px-3 py-2.5 text-sm text-ink outline-none focus:border-primary" autoComplete="current-password" required />
          </label>
        )}

        {message && <p className="flex items-center gap-2 text-sm text-success"><Check className="h-4 w-4" />{message}</p>}
        {error && <p className="text-sm text-error">{error}</p>}

        <div className="flex justify-end border-t border-border pt-5">
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 bg-primary px-4 py-2.5 text-sm font-semibold text-primary-ink transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>

      <form onSubmit={handlePasswordSubmit} className="bg-surface border border-border p-5 sm:p-7 space-y-6">
        <div className="border-b border-border pb-5">
          <h2 className="text-base font-semibold text-ink">Change password</h2>
          <p className="text-xs text-ink-muted mt-1">Use a new password that is at least 8 characters long.</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-sm text-ink-muted sm:col-span-2">
            Current password
            <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="mt-1.5 w-full border border-border bg-background px-3 py-2.5 text-sm text-ink outline-none focus:border-primary" autoComplete="current-password" required />
          </label>
          <label className="text-sm text-ink-muted">
            New password
            <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="mt-1.5 w-full border border-border bg-background px-3 py-2.5 text-sm text-ink outline-none focus:border-primary" minLength={8} autoComplete="new-password" required />
          </label>
          <label className="text-sm text-ink-muted">
            Confirm new password
            <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-1.5 w-full border border-border bg-background px-3 py-2.5 text-sm text-ink outline-none focus:border-primary" minLength={8} autoComplete="new-password" required />
          </label>
        </div>

        {passwordMessage && <p className="flex items-center gap-2 text-sm text-success"><Check className="h-4 w-4" />{passwordMessage}</p>}
        {passwordError && <p className="text-sm text-error">{passwordError}</p>}

        <div className="flex justify-end border-t border-border pt-5">
          <button type="submit" disabled={changingPassword} className="inline-flex items-center gap-2 bg-primary px-4 py-2.5 text-sm font-semibold text-primary-ink transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60">
            {changingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
            {changingPassword ? "Updating..." : "Change password"}
          </button>
        </div>
      </form>
    </div>
  );
}