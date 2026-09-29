import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { getAuthState, clearSessionCookie, logoutFn, type SessionUser } from "~/auth";
import { createEvent, EVENT_TYPE_LABELS, type EventType } from "~/events";

export const Route = createFileRoute("/dashboard/events/new")({
  beforeLoad: async () => {
    const { user } = await getAuthState();
    if (!user) throw redirect({ to: "/login" });
    return { user };
  },
  component: CreateEventPage,
});

function CreateEventPage() {
  const { user } = Route.useRouteContext() as { user: SessionUser };
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState<EventType>("other");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("10:00");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("draft");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleLogout = async () => {
    await logoutFn();
    clearSessionCookie();
    router.navigate({ to: "/" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError("");

    // Client-side validation
    const clientErrors: Record<string, string> = {};
    if (!title.trim()) clientErrors.title = "Title is required.";
    if (!startDate) clientErrors.startDate = "Start date is required.";
    if (!endDate) clientErrors.endDate = "End date is required.";
    if (
      startDate &&
      endDate &&
      startTime &&
      endTime &&
      new Date(`${endDate}T${endTime}`) <= new Date(`${startDate}T${startTime}`)
    ) {
      clientErrors.endDate = "End must be after start.";
    }

    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    setSubmitting(true);
    try {
      const startDateTime = new Date(`${startDate}T${startTime}`).toISOString();
      const endDateTime = new Date(`${endDate}T${endTime}`).toISOString();

      const result = await createEvent({
        title,
        description,
        event_type: eventType,
        start_date: startDateTime,
        end_date: endDateTime,
        location: location || undefined,
        status,
      });

      if (!result.success) {
        setErrors(result.errors || {});
      } else {
        router.navigate({ to: `/dashboard/events/${result.event.id}` });
      }
    } catch (err: any) {
      setServerError(err.message || "Failed to create event");
    } finally {
      setSubmitting(false);
    }
  };

  // Build a default start/end date for the "today" fallback
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-warm-200/60 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="flex items-center gap-2 text-teal-700">
              <svg className="h-8 w-8" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2.5" />
                <path d="M20 8c-4 4-8 16-4 22 2 3 6 3 8 0 4-6 0-18-4-22z" fill="currentColor" opacity="0.7" />
                <path d="M20 8v8M16 16h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="text-xl font-bold tracking-tight">Shepherd</span>
            </a>
            <span className="hidden text-sm text-warm-700 sm:inline">/</span>
            <a href="/dashboard/events" className="hidden text-sm font-semibold text-teal-700 hover:underline sm:inline">
              Events
            </a>
            <span className="hidden text-sm text-warm-700 sm:inline">/</span>
            <span className="hidden text-sm font-semibold text-warm-900 sm:inline">New</span>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-warm-200 px-4 py-2 text-sm font-semibold text-warm-700 transition hover:bg-warm-100"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Form */}
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-warm-900">Create Event</h1>

        {serverError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{serverError}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-warm-900">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Sunday Worship Service"
              className="mt-1 block w-full rounded-xl border border-warm-200 bg-white px-4 py-2.5 text-sm text-warm-900 placeholder:text-warm-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-warm-900">
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Details about this event..."
              className="mt-1 block w-full rounded-xl border border-warm-200 bg-white px-4 py-2.5 text-sm text-warm-900 placeholder:text-warm-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200 resize-y"
            />
          </div>

          {/* Event Type & Status */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="eventType" className="block text-sm font-semibold text-warm-900">
                Event Type
              </label>
              <select
                id="eventType"
                value={eventType}
                onChange={(e) => setEventType(e.target.value as EventType)}
                className="mt-1 block w-full rounded-xl border border-warm-200 bg-white px-4 py-2.5 text-sm text-warm-900 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
              >
                {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-semibold text-warm-900">
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-warm-200 bg-white px-4 py-2.5 text-sm text-warm-900 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
              >
                <option value="draft">Draft</option>
                <option value="planned">Planned</option>
              </select>
            </div>
          </div>

          {/* Date/Time */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="startDate" className="block text-sm font-semibold text-warm-900">
                Start Date <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="flex-1 rounded-xl border border-warm-200 bg-white px-4 py-2.5 text-sm text-warm-900 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
                />
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-28 rounded-xl border border-warm-200 bg-white px-3 py-2.5 text-sm text-warm-900 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
                />
              </div>
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
              )}
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-semibold text-warm-900">
                End Date <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1 rounded-xl border border-warm-200 bg-white px-4 py-2.5 text-sm text-warm-900 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
                />
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-28 rounded-xl border border-warm-200 bg-white px-3 py-2.5 text-sm text-warm-900 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
                />
              </div>
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-semibold text-warm-900">
              Location
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Main Sanctuary"
              className="mt-1 block w-full rounded-xl border border-warm-200 bg-white px-4 py-2.5 text-sm text-warm-900 placeholder:text-warm-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <a
              href="/dashboard/events"
              className="rounded-xl border border-warm-200 px-5 py-2.5 text-sm font-semibold text-warm-700 transition hover:bg-warm-100"
            >
              Cancel
            </a>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700 disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Event"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
