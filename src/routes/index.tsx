import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { useState } from "react";

// ---------------------------------------------------------------------------
// Server function: waitlist signup
// ---------------------------------------------------------------------------
const submitWaitlist = createServerFn({ method: "POST" })
  .validator((d: unknown) => {
    const data = d as { name?: string; email?: string };
    const errors: string[] = [];
    if (!data.name?.trim()) errors.push("Name is required.");
    if (!data.email?.trim()) errors.push("Email is required.");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()))
      errors.push("Please enter a valid email address.");
    return { name: data.name?.trim() ?? "", email: data.email?.trim() ?? "", errors };
  })
  .handler(async ({ data }) => {
    if (data.errors.length > 0) {
      return { success: false, message: data.errors.join(" ") };
    }

    const filePath = "data/waitlist.json";

    // Ensure the data directory exists
    await mkdir("data", { recursive: true });

    let entries: { name: string; email: string; submittedAt: string }[] = [];
    try {
      const raw = await readFile(filePath, "utf8");
      entries = JSON.parse(raw);
    } catch {
      entries = [];
    }

    // Prevent duplicate emails
    if (entries.some((e) => e.email.toLowerCase() === data.email.toLowerCase())) {
      return { success: false, message: "You're already on the waitlist!" };
    }

    entries.push({
      name: data.name,
      email: data.email,
      submittedAt: new Date().toISOString(),
    });

    await writeFile(filePath, JSON.stringify(entries, null, 2), "utf8");

    return { success: true, message: "You're on the list! We'll be in touch soon." };
  });

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export const Route = createFileRoute("/")({
  component: Home,
});

const features = [
  {
    title: "AI-Powered Scheduling",
    desc: "Tell the assistant what you need and it handles the calendar — avoiding conflicts, sending invites, and keeping everyone in sync.",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
  },
  {
    title: "Volunteer Coordination",
    desc: "Recruit, schedule, and remind volunteers automatically. See who's available, avoid burnout, and fill every role without the back-and-forth.",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    title: "Room & Resource Management",
    desc: "Assign rooms, equipment, and resources intelligently. No more double-booked fellowship halls or missing AV carts.",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
      </svg>
    ),
  },
  {
    title: "Church Event Templates",
    desc: "Pre-built templates for every occasion — Sunday services, weddings, funerals, VBS, retreats, potlucks, and community outreach. Start in seconds.",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
      </svg>
    ),
  },
  {
    title: "Congregation Communication",
    desc: "Send announcements, reminders, and follow-ups through email and SMS. One message reaches everyone — or just the right group.",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
    ),
  },
  {
    title: "Built for Ministry Teams",
    desc: "Designed for how churches actually work. Multiple staff roles, ministry leaders, and volunteer captains — all with the right level of access.",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
];

const steps = [
  {
    step: "1",
    title: "Tell us about your event",
    desc: "Describe what you need in plain language — a Sunday service, a wedding, or a community potluck. Our AI understands church events.",
  },
  {
    step: "2",
    title: "Shepherd handles the details",
    desc: "It finds open dates, invites volunteers, books rooms, and sends communications — all coordinated automatically.",
  },
  {
    step: "3",
    title: "Focus on your people",
    desc: "With the logistics handled, your team is free to do what matters: ministering to your congregation and community.",
  },
];

const pricingTiers = [
  {
    name: "Free",
    price: "$0",
    members: "Up to 100 members",
    desc: "Perfect for small congregations and church plants getting started.",
    features: ["AI scheduling", "5 event templates", "Email support"],
    highlighted: false,
  },
  {
    name: "Growing",
    price: "$49",
    period: "/mo",
    members: "Up to 300 members",
    desc: "For growing churches ready to streamline their event planning.",
    features: ["Everything in Free", "Volunteer coordination", "Room management", "All event templates", "Priority support"],
    highlighted: true,
  },
  {
    name: "Established",
    price: "$99",
    period: "/mo",
    members: "Up to 750 members",
    desc: "For established churches with active ministry calendars.",
    features: ["Everything in Growing", "SMS notifications", "Custom templates", "Multi-user roles", "Analytics dashboard"],
    highlighted: false,
  },
  {
    name: "Thriving",
    price: "$199",
    period: "/mo",
    members: "Up to 1,500 members",
    desc: "For large churches and multi-service campuses.",
    features: ["Everything in Established", "Multi-site support", "API access", "Dedicated account manager", "Custom integrations"],
    highlighted: false,
  },
];

function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* ---------- Nav ---------- */}
      <Header />

      {/* ---------- Hero ---------- */}
      <HeroSection />

      {/* ---------- Features ---------- */}
      <FeaturesSection />

      {/* ---------- How It Works ---------- */}
      <HowItWorksSection />

      {/* ---------- Pricing ---------- */}
      <PricingSection />

      {/* ---------- Waitlist ---------- */}
      <WaitlistSection />

      {/* ---------- Footer ---------- */}
      <Footer />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-warm-200/60 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <a href="#" className="flex items-center gap-2 text-teal-700">
          <svg className="h-8 w-8" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2.5" />
            <path d="M20 8c-4 4-8 16-4 22 2 3 6 3 8 0 4-6 0-18-4-22z" fill="currentColor" opacity="0.7" />
            <path d="M20 8v8M16 16h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="text-xl font-bold tracking-tight">Shepherd</span>
        </a>
        <div className="flex items-center gap-3">
          <a
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-warm-700 transition hover:text-teal-700"
          >
            Sign In
          </a>
          <a
            href="#waitlist"
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
          >
            Get Early Access
          </a>
        </div>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-teal-50 via-white to-warm-50 px-4 pb-20 pt-16 sm:pt-24">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-amber-100/50 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-teal-100/40 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl text-center">
        <span className="inline-block rounded-full bg-teal-100 px-4 py-1.5 text-sm font-semibold text-teal-700">
          AI-Powered Event Planning for Churches
        </span>
        <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-warm-900 sm:text-5xl lg:text-6xl">
          Plan church events{" "}
          <span className="text-teal-600">without the chaos</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-warm-700">
          Shepherd Events handles scheduling, volunteer coordination, room assignments, and
          communication — so your team can focus on ministry, not logistics.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <a
            href="#waitlist"
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-8 py-3.5 text-base font-semibold text-white shadow-md transition hover:bg-teal-700 hover:shadow-lg"
          >
            Get Early Access
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </a>
          <a
            href="#features"
            className="inline-flex items-center gap-2 rounded-xl border border-warm-200 bg-white px-8 py-3.5 text-base font-semibold text-warm-700 transition hover:bg-warm-100"
          >
            See what it can do
          </a>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="bg-white px-4 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-teal-600">Features</span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-warm-900 sm:text-4xl">
            Everything your team needs
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-warm-700">
            Purpose-built for church life — from weekly services to special events, Shepherd has you covered.
          </p>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-warm-200/60 bg-warm-50/50 p-6 transition hover:border-teal-200 hover:bg-white hover:shadow-md"
            >
              <div className="mb-4 inline-flex rounded-xl bg-teal-100 p-3 text-teal-700">
                {f.icon}
              </div>
              <h3 className="text-lg font-bold text-warm-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-warm-700">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section className="bg-teal-700 px-4 py-20 sm:py-28">
      <div className="mx-auto max-w-5xl text-center">
        <span className="text-sm font-semibold uppercase tracking-wider text-teal-200">How It Works</span>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          From idea to event in three steps
        </h2>

        <div className="mt-14 grid gap-8 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.step} className="relative rounded-2xl bg-teal-600/30 p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-400 text-lg font-bold text-warm-900">
                {s.step}
              </div>
              <h3 className="mt-5 text-xl font-bold text-white">{s.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-teal-100">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section className="bg-white px-4 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-teal-600">Pricing</span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-warm-900 sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-warm-700">
            Start free and scale as your church grows. No hidden fees, no long-term contracts.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-2xl border p-6 transition ${
                tier.highlighted
                  ? "border-teal-500 bg-teal-50/50 shadow-lg ring-1 ring-teal-500"
                  : "border-warm-200/60 bg-white hover:shadow-md"
              }`}
            >
              {tier.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-3 py-0.5 text-xs font-bold text-warm-900">
                  Most Popular
                </span>
              )}
              <h3 className="text-lg font-bold text-warm-900">{tier.name}</h3>
              <div className="mt-3">
                <span className="text-4xl font-extrabold text-warm-900">{tier.price}</span>
                {tier.period && <span className="text-sm text-warm-700">{tier.period}</span>}
              </div>
              <p className="mt-1 text-sm text-teal-600 font-medium">{tier.members}</p>
              <p className="mt-2 text-sm text-warm-700">{tier.desc}</p>
              <ul className="mt-5 flex-1 space-y-2">
                {tier.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2 text-sm text-warm-700">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {feat}
                  </li>
                ))}
              </ul>
              <a
                href="#waitlist"
                className={`mt-6 block rounded-xl px-5 py-2.5 text-center text-sm font-semibold transition ${
                  tier.highlighted
                    ? "bg-teal-600 text-white hover:bg-teal-700"
                    : "border border-teal-600 text-teal-600 hover:bg-teal-50"
                }`}
              >
                Get Started
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WaitlistSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const result = await submitWaitlist({ data: { name, email } });
      if (result.success) {
        setStatus("success");
        setMessage(result.message);
        setName("");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(result.message);
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <section
      id="waitlist"
      className="bg-gradient-to-b from-warm-50 to-amber-50/50 px-4 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-lg text-center">
        <span className="text-sm font-semibold uppercase tracking-wider text-amber-600">
          Join the Waitlist
        </span>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-warm-900 sm:text-4xl">
          Be the first to know
        </h2>
        <p className="mt-4 text-warm-700">
          Shepherd Events is launching soon. Sign up for early access and we'll let you know the moment it's ready.
        </p>

        {status === "success" ? (
          <div className="mt-8 rounded-2xl border border-teal-200 bg-teal-50 p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-100 text-teal-600">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h3 className="mt-4 text-xl font-bold text-teal-800">You're on the list!</h3>
            <p className="mt-2 text-teal-700">{message}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="name" className="sr-only">
                Your name
              </label>
              <input
                id="name"
                type="text"
                required
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-warm-200 bg-white px-4 py-3 text-warm-900 placeholder:text-warm-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="you@church.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-warm-200 bg-white px-4 py-3 text-warm-900 placeholder:text-warm-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full rounded-xl bg-amber-500 px-6 py-3 text-base font-semibold text-white shadow-md transition hover:bg-amber-600 disabled:opacity-60"
            >
              {status === "loading" ? "Submitting..." : "Join the Waitlist"}
            </button>
            {status === "error" && (
              <p className="text-sm text-red-600">{message}</p>
            )}
          </form>
        )}
        <p className="mt-4 text-xs text-warm-400">
          We'll never share your email. Unsubscribe anytime.
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-warm-200 bg-warm-900 px-4 py-10 text-center text-sm text-warm-400">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-2 text-white">
          <svg className="h-6 w-6 text-teal-400" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2.5" />
            <path d="M20 8c-4 4-8 16-4 22 2 3 6 3 8 0 4-6 0-18-4-22z" fill="currentColor" opacity="0.7" />
          </svg>
          <span className="font-semibold">Shepherd Events</span>
        </div>
        <p>&copy; {new Date().getFullYear()} Shepherd Events. All rights reserved.</p>
      </div>
    </footer>
  );
}
