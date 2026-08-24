import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { getAuthState, signupFn, setSessionCookie } from "~/auth";

export const Route = createFileRoute("/signup")({
  beforeLoad: async () => {
    const { user } = await getAuthState();
    if (user) throw redirect({ to: "/dashboard" });
  },
  component: SignupPage,
});

function SignupPage() {
  const router = useRouter();
  const [churchName, setChurchName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const result = await signupFn({
        data: { churchName, name, email, password, confirmPassword },
      });

      if (result.success && result.token) {
        setSessionCookie(result.token);
        router.navigate({ to: "/dashboard" });
      } else if (result.errors) {
        setErrors(result.errors);
      }
    } catch {
      setErrors({ form: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <AuthHeader showSignup={false} />

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-warm-900">
              Create your church account
            </h1>
            <p className="mt-2 text-sm text-warm-700">
              Set up Shepherd Events for your church in under a minute.
            </p>
          </div>

          {errors.form && (
            <div className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {errors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Field
              label="Church name"
              name="churchName"
              type="text"
              placeholder="Grace Fellowship Church"
              value={churchName}
              onChange={setChurchName}
              error={errors.churchName}
            />
            <Field
              label="Your name"
              name="name"
              type="text"
              placeholder="Pastor John Smith"
              value={name}
              onChange={setName}
              error={errors.name}
            />
            <Field
              label="Email address"
              name="email"
              type="email"
              placeholder="you@church.org"
              value={email}
              onChange={setEmail}
              error={errors.email}
            />
            <Field
              label="Password"
              name="password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={setPassword}
              error={errors.password}
            />
            <Field
              label="Confirm password"
              name="confirmPassword"
              type="password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              error={errors.confirmPassword}
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-teal-600 px-6 py-3 text-base font-semibold text-white shadow-md transition hover:bg-teal-700 disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-warm-700">
            Already have an account?{" "}
            <a href="/login" className="font-semibold text-teal-600 hover:text-teal-700">
              Sign in
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  name,
  type,
  placeholder,
  value,
  onChange,
  error,
}: {
  label: string;
  name: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-warm-800">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-1 w-full rounded-xl border bg-white px-4 py-2.5 text-warm-900 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 ${
          error ? "border-red-400" : "border-warm-200 focus:border-teal-500"
        }`}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function AuthHeader({ showSignup = true }: { showSignup?: boolean }) {
  return (
    <header className="sticky top-0 z-50 border-b border-warm-200/60 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <a href="/" className="flex items-center gap-2 text-teal-700">
          <svg className="h-8 w-8" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2.5" />
            <path d="M20 8c-4 4-8 16-4 22 2 3 6 3 8 0 4-6 0-18-4-22z" fill="currentColor" opacity="0.7" />
            <path d="M20 8v8M16 16h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="text-xl font-bold tracking-tight">Shepherd</span>
        </a>
        <a
          href={showSignup ? "/signup" : "/login"}
          className="rounded-lg border border-teal-600 px-4 py-2 text-sm font-semibold text-teal-600 transition hover:bg-teal-50"
        >
          {showSignup ? "Sign up" : "Sign in"}
        </a>
      </div>
    </header>
  );
}
