"use client";

import {
  FiCalendar,
  FiCreditCard,
  FiDollarSign,
  FiGrid,
} from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";

const stats = [
  { label: "Today's Revenue", value: "₱0", icon: FiDollarSign },
  { label: "Today's Bookings", value: "0", icon: FiCalendar },
  { label: "Available Courts", value: "0", icon: FiGrid },
  { label: "Pending Payments", value: "0", icon: FiCreditCard },
];

export default function AdminDashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold text-secondary">
        Welcome back{user?.fullName ? `, ${user.fullName}` : ""}
      </h1>
      <p className="mt-1 text-sm text-gray-600">
        Here&apos;s what&apos;s happening at DinkHub today.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-secondary">
              <stat.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-gray-500">{stat.label}</p>
              <p className="text-xl font-bold text-secondary">
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs text-gray-400">
        These stats are placeholders until the bookings/payments API is
        wired up.
      </p>
    </div>
  );
}
