"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

export type UserRole = "CUSTOMER" | "ADMIN";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: UserRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (
    fullName: string,
    email: string,
    password: string,
  ) => Promise<AuthUser>;
  logout: () => void;
  updateUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "dinkhub-auth";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

// Most error responses are the API's `{ success, message }` JSON shape, but
// some (e.g. the rate limiter's 429) come back as plain text — parsing those
// with response.json() throws a raw SyntaxError instead of a usable message.
async function parseResponseBody(response: Response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    if (response.status === 429) {
      throw new Error("Too many attempts. Please wait a moment and try again.");
    }
    throw new Error("Something went wrong. Please try again.");
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // localStorage doesn't exist during SSR, so this can't be computed during
  // render — it has to be hydrated client-side after mount via an effect.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          user: AuthUser;
          accessToken: string;
        };
        setUser(parsed.user);
        setAccessToken(parsed.accessToken);
      }
    } catch {
      // Ignore corrupted/inaccessible storage — user just stays logged out.
    } finally {
      setIsLoading(false);
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  function persistSession(nextUser: AuthUser, nextToken: string) {
    setUser(nextUser);
    setAccessToken(nextToken);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ user: nextUser, accessToken: nextToken }),
    );
  }

  async function login(email: string, password: string) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const body = await parseResponseBody(response);

    if (!response.ok || !body.success) {
      throw new Error(body.message ?? "Login failed");
    }

    const nextUser = body.data.user as AuthUser;
    const nextToken = body.data.accessToken as string;
    persistSession(nextUser, nextToken);

    return nextUser;
  }

  async function register(fullName: string, email: string, password: string) {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, password }),
    });

    const body = await parseResponseBody(response);

    if (!response.ok || !body.success) {
      throw new Error(body.message ?? "Registration failed");
    }

    const nextUser = body.data.user as AuthUser;
    const nextToken = body.data.accessToken as string;
    persistSession(nextUser, nextToken);

    return nextUser;
  }

  function logout() {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  // Used after a profile change (avatar upload, etc.) that returns a fresh
  // user object but doesn't involve a new session/token.
  function updateUser(nextUser: AuthUser) {
    setUser(nextUser);
    if (accessToken) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ user: nextUser, accessToken }),
      );
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, accessToken, isLoading, login, register, logout, updateUser }}
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
