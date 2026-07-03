"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { STAFF_FIXTURE_USERS } from "@/lib/auth/staff-fixtures";
import { ADMIN_FIXTURE_USERS } from "@/lib/auth/admin-fixtures";

interface QuickLoginUser {
  id: string;
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleQuickLogin = async (
    user: QuickLoginUser,
    options: { ensureEndpoint: string; redirect: string },
  ) => {
    setLoading(user.id);
    setError("");

    try {
      // Clear local session immediately before signing in as a different user
      await supabase.auth.signOut({ scope: "local" });

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: user.password,
      });

      if (signInError) {
        if (signInError.message.includes("Invalid login credentials")) {
          const response = await fetch(options.ensureEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(user),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Failed to create test user");
          }

          const { error: retryError } =
            await supabase.auth.signInWithPassword({
              email: user.email,
              password: user.password,
            });

          if (retryError) throw retryError;
          router.refresh();
          router.push(options.redirect);
        } else {
          throw signInError;
        }
      } else {
        router.refresh();
        router.push(options.redirect);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas p-4">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink mb-2">
            CareSuite
          </h1>
          <p className="text-sm text-ink-muted">
            Select your organization to sign in as staff
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl border border-critical-500/30 bg-critical-500/8">
            <p className="text-sm text-critical-400 text-center">{error}</p>
          </div>
        )}

        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-dim">
          Staff Workspace
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {STAFF_FIXTURE_USERS.map((user) => (
            <button
              key={user.id}
              onClick={() =>
                handleQuickLogin(user, {
                  ensureEndpoint: "/api/dev/ensure-staff-profile",
                  redirect: "/app/home",
                })
              }
              disabled={loading === user.id}
              className="group surface-card p-5 rounded-2xl border border-hairline hover:border-hairline-strong hover:bg-white/[.02] transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-dim">
                    {user.tenant_name}
                  </span>
                  {loading === user.id ? (
                    <span className="text-xs text-brand-300">Signing in...</span>
                  ) : null}
                </div>
                <p className="font-display text-sm font-medium text-ink group-hover:text-brand-200 transition-colors">
                  {user.full_name}
                </p>
                <p className="text-xs text-ink-dim">{user.email}</p>
              </div>
            </button>
          ))}
        </div>

        <p className="mb-3 mt-8 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-dim">
          Organization Admin
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ADMIN_FIXTURE_USERS.map((user) => (
            <button
              key={user.id}
              onClick={() =>
                handleQuickLogin(user, {
                  ensureEndpoint: "/api/dev/ensure-admin-profile",
                  redirect: "/admin",
                })
              }
              disabled={loading === user.id}
              className="group surface-card p-5 rounded-2xl border border-brand-500/30 hover:border-brand-500/50 hover:bg-brand-500/[.04] transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-300/80">
                    {user.tenant_name}
                  </span>
                  {loading === user.id ? (
                    <span className="text-xs text-brand-300">Signing in...</span>
                  ) : null}
                </div>
                <p className="font-display text-sm font-medium text-ink group-hover:text-brand-200 transition-colors">
                  {user.name}
                </p>
                <p className="text-xs text-ink-dim">{user.email}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 text-center text-xs text-ink-dim">
          <p>Dev login only · All accounts use password: test123</p>
        </div>
      </div>
    </div>
  );
}
