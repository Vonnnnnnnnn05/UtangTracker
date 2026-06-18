"use client";

import { signInWithEmailAndPassword } from "firebase/auth";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { auth } from "@/lib/firebase/config";
import { hasFirebaseConfig } from "@/lib/firebase/config";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryEmail = params.get("email");
    if (queryEmail) {
      setEmail(queryEmail);
    }

    if (params.has("password")) {
      params.delete("password");
      const nextQuery = params.toString();
      window.history.replaceState(null, "", `/login${nextQuery ? `?${nextQuery}` : ""}`);
    }
  }, []);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, router, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    try {
      if (!hasFirebaseConfig()) {
        throw new Error("Firebase environment variables are missing.");
      }

      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/dashboard");
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : String(loginError) || "Unable to sign in. Check the email and password.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-8">
      <section className="w-full max-w-md rounded-lg border border-line bg-surface p-5 shadow-soft">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-md bg-mint text-leaf">
            <LockKeyhole aria-hidden="true" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-ink">ListaUtang</h1>
            <p className="text-sm font-semibold text-muted">Sign in to manage records</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <Input
            autoComplete="email"
            label="Email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
          <div className="relative">
            <Input
              autoComplete="current-password"
              label="Password"
              name="password"
              required
              type={showPassword ? "text" : "password"}
            />
            <button
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="focus-ring absolute bottom-1.5 right-1.5 flex size-10 items-center justify-center rounded-md text-muted hover:bg-mint"
              onClick={() => setShowPassword((current) => !current)}
              type="button"
            >
              {showPassword ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}
            </button>
          </div>

          {error ? (
            <p role="alert" className="rounded-md border border-[#E5A18B] bg-[#FFE1D6] px-3 py-2 text-sm font-semibold text-[#8B351F]">
              {error}
            </p>
          ) : null}

          <Button disabled={pending} type="submit">
            {pending ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </section>
    </main>
  );
}
