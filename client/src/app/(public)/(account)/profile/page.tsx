"use client";

import { FiMail, FiShield, FiUser } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <section className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-secondary">View Profile</h1>
      <p className="mt-1 text-sm text-gray-600">
        Your account details on DinkHub.
      </p>

      <div className="mt-6 space-y-4 rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-secondary">
            <FiUser className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs text-gray-500">Full Name</p>
            <p className="text-sm font-medium text-secondary">
              {user?.fullName ?? "—"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-secondary">
            <FiMail className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs text-gray-500">Email</p>
            <p className="text-sm font-medium text-secondary">
              {user?.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-secondary">
            <FiShield className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs text-gray-500">Role</p>
            <p className="text-sm font-medium text-secondary">
              {user?.role}
            </p>
          </div>
        </div>
      </div>

      <p className="mt-6 text-xs text-gray-400">
        Editing your profile isn&apos;t wired up yet.
      </p>
    </section>
  );
}
