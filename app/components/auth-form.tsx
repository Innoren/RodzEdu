"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import {
  loginAction,
  registerAction,
  type AuthState,
} from "@/app/actions/auth";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const action = mode === "login" ? loginAction : registerAction;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {mode === "register" && (
        <div>
          <label className="block text-sm font-medium text-ink-700">
            Full name
          </label>
          <input
            name="name"
            type="text"
            required
            autoComplete="name"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            placeholder="Jane Technologist"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-ink-700">Email</label>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink-700">
          Password
        </label>
        <input
          name="password"
          type="password"
          required
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          placeholder="••••••••"
        />
      </div>

      {mode === "register" && (
        <div>
          <label className="block text-sm font-medium text-ink-700">
            I am a…
          </label>
          <div className="mt-1 grid grid-cols-2 gap-3">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2.5 text-sm has-checked:border-brand-500 has-checked:bg-brand-50">
              <input
                type="radio"
                name="role"
                value="STUDENT"
                defaultChecked
                className="accent-brand-600"
              />
              Student
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2.5 text-sm has-checked:border-brand-500 has-checked:bg-brand-50">
              <input
                type="radio"
                name="role"
                value="TEACHER"
                className="accent-brand-600"
              />
              Instructor
            </label>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {mode === "login" ? "Log in" : "Create account"}
      </button>

      <p className="text-center text-sm text-ink-500">
        {mode === "login" ? (
          <>
            New to RodzEdu?{" "}
            <Link
              href="/register"
              className="font-semibold text-brand-700 hover:underline"
            >
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-brand-700 hover:underline"
            >
              Log in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
