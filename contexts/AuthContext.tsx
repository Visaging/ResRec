"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { AuthUser } from "@/types";
import { changePassword, getCurrentUser, loginUser, registerUser, logoutUser, updateProfile, updateAvatar } from "@/services/api";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    institutionName?: string;
    department?: string;
    role?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: {
    name: string;
    email: string;
    institutionName?: string;
    department?: string;
    currentPassword?: string;
  }) => Promise<void>;
  changePassword: (data: { currentPassword: string; newPassword: string }) => Promise<void>;
  updateAvatar: (avatarUrl: string | null) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const res = await loginUser({ email, password });
    setUser(res.user);
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    institutionName?: string;
    department?: string;
    role?: string;
  }) => {
    const res = await registerUser(data);
    setUser(res.user);
  };

  const logout = async () => {
    try {
      await logoutUser();
    } finally {
      setUser(null);
    }
  };

  const updateUserProfile = async (data: {
    name: string;
    email: string;
    institutionName?: string;
    department?: string;
  }) => {
    const updatedUser = await updateProfile(data);
    setUser(updatedUser);
  };

  const updateUserAvatar = async (avatarUrl: string | null) => {
    const updatedUser = await updateAvatar(avatarUrl);
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateProfile: updateUserProfile,
        changePassword,
        updateAvatar: updateUserAvatar,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
