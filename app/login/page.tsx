import { type FormEvent, useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginCheck } from "../lib/auth-api";
import { usePwaDisplay } from "../hooks/use-pwa-display";

export default function LoginPage() {
  const navigate = useNavigate();
  const isPwa = usePwaDisplay();
  const formId = useId();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    try {
      await loginCheck({ email, password });
      navigate("/landing", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Connexion impossible",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      data-pwa={isPwa ? "true" : "false"}
      className="login-shell relative flex min-h-dvh w-full flex-col overflow-hidden bg-zinc-950 text-zinc-50"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(56,189,248,0.22),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 top-1/3 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl"
        aria-hidden
      />

      <div className="login-grid relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col lg:min-h-dvh lg:flex-row lg:items-stretch lg:gap-0 lg:px-6 lg:py-8">
        <aside className="login-brand flex shrink-0 flex-col justify-between px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-6 lg:max-w-md lg:flex-1 lg:rounded-3xl lg:px-10 lg:py-12">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/15 ring-1 ring-cyan-400/30">
              <img
                src="/next.svg"
                alt=""
                width={22}
                height={22}
                className="invert"
              />
            </span>
            <div>
              <p className="text-sm font-medium tracking-wide text-cyan-300/90">
                TOA
              </p>
              <p className="text-xs text-zinc-500">Operations platform</p>
            </div>
          </div>

          <div className="mt-10 hidden lg:block">
            <h1 className="text-4xl font-semibold tracking-tight text-white">
              Welcome back
            </h1>
            <p className="mt-4 max-w-sm text-base leading-relaxed text-zinc-400">
              Sign in to manage tasks, track activity, and stay synced across
              your team — on web or installed app.
            </p>
          </div>

          <p className="hidden text-xs text-zinc-600 lg:block">
            © {new Date().getFullYear()} TOA. All rights reserved.
          </p>
        </aside>

        <main className="login-main flex flex-1 flex-col justify-center px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] lg:max-w-lg lg:flex-none lg:justify-center lg:px-8 lg:pb-8">
          <div className="login-card w-full rounded-3xl border border-white/8 bg-zinc-900/80 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8">
            <div className="mb-8 lg:hidden">
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                Sign in
              </h1>
              <p className="mt-2 text-sm text-zinc-400">
                Use your work email to continue
              </p>
            </div>

            <div className="mb-8 hidden lg:block">
              <h2 className="text-xl font-semibold text-white">Sign in</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Enter your credentials below
              </p>
            </div>

            {error ? (
              <p
                role="alert"
                className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
              >
                {error}
              </p>
            ) : null}

            <form
              id={formId}
              className="flex flex-col gap-5"
              onSubmit={handleSubmit}
            >
              <div className="flex flex-col gap-2">
                <label
                  htmlFor={`${formId}-email`}
                  className="text-sm font-medium text-zinc-300"
                >
                  Email
                </label>
                <input
                  id={`${formId}-email`}
                  name="email"
                  type="email"
                  autoComplete="username email"
                  inputMode="email"
                  required
                  placeholder="you@company.com"
                  className="login-input h-12 w-full rounded-xl border border-white/10 bg-zinc-950/60 px-4 text-base text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor={`${formId}-password`}
                    className="text-sm font-medium text-zinc-300"
                  >
                    Password
                  </label>
                  <a
                    href="#"
                    className="touch-target text-sm font-medium text-cyan-400 hover:text-cyan-300"
                    onClick={(e) => e.preventDefault()}
                  >
                    Forgot?
                  </a>
                </div>
                <div className="relative">
                  <input
                    id={`${formId}-password`}
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    className="login-input h-12 w-full rounded-xl border border-white/10 bg-zinc-950/60 px-4 pr-12 text-base text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
                  />
                  <button
                    type="button"
                    className="touch-target absolute right-1 top-1/2 flex h-10 min-w-10 -translate-y-1/2 items-center justify-center rounded-lg text-xs font-medium text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-pressed={showPassword}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <label className="flex min-h-11 cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  name="remember"
                  className="h-5 w-5 shrink-0 rounded border-white/20 bg-zinc-950 accent-cyan-400"
                />
                <span className="text-sm text-zinc-400">Keep me signed in</span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="login-submit touch-target mt-1 flex h-12 w-full items-center justify-center rounded-xl bg-cyan-500 text-base font-semibold text-zinc-950 transition hover:bg-cyan-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 disabled:cursor-wait disabled:opacity-70 active:scale-[0.98]"
              >
                {isSubmitting ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-zinc-500">
              No account?{" "}
              <a
                href="#"
                className="touch-target-inline font-medium text-cyan-400 hover:text-cyan-300"
                onClick={(e) => e.preventDefault()}
              >
                Contact admin
              </a>
            </p>
          </div>

          {isPwa ? (
            <p className="mt-4 text-center text-xs text-zinc-600">
              Running as installed app
            </p>
          ) : null}
        </main>
      </div>
    </div>
  );
}
