import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuthToken, getAuthToken } from "../lib/auth-storage";

export default function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!getAuthToken()) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-zinc-950 px-6 text-center text-zinc-50">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(56,189,248,0.2),transparent)]"
        aria-hidden
      />
      <main className="relative z-10 flex max-w-2xl flex-col items-center gap-6">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/15 ring-1 ring-cyan-400/30">
          <img
            src="/next.svg"
            alt=""
            width={28}
            height={28}
            className="invert"
          />
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">
          Welcome to Tower to Africa
        </h1>
        <p className="max-w-md text-base leading-relaxed text-zinc-400">
          You are signed in. This is your landing page after authentication.
        </p>
        <button
          type="button"
          onClick={() => {
            clearAuthToken();
            navigate("/login", { replace: true });
          }}
          className="touch-target mt-4 rounded-xl border border-white/10 px-6 py-3 text-sm font-medium text-zinc-300 transition hover:bg-white/5 hover:text-white"
        >
          Back to sign in
        </button>
      </main>
    </div>
  );
}
