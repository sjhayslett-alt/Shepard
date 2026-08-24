import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getAuthState, clearSessionCookie, logoutFn, type SessionUser } from "~/auth";
import {
  getEvents,
  type Event,
  EVENT_TYPE_LABELS,
  EVENT_STATUS_LABELS,
  EVENT_STATUS_COLORS,
  type EventStatus,
  type EventType,
} from "~/events";

export const Route = createFileRoute("/dashboard/events")({
  beforeLoad: async () => {
    const { user } = await getAuthState();
    if (!user) throw redirect({ to: "/login" });
    return { user };
  },
  component: EventsListPage,
});

function EventsListPage() {
  const { user } = Route.useLoaderData() as { user: SessionUser };
  const router = useRouter();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [sort, setSort] = useState("upcoming");
  const [error, setError] = useState("");

  const fetchEvents = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getEvents({
        status: filterStatus || undefined,
        event_type: filterType || undefined,
        sort,
      });
      setEvents(result);
    } catch (err: any) {
      setError(err.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [filterStatus, filterType, sort]);

  const handleLogout = async () => {
    await logoutFn();
    clearSessionCookie();
    router.navigate({ to: "/" });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const handleDelete = async (eventId: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      const { deleteEvent } = await import("~/events");
      await deleteEvent({ eventId });
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch (err: any) {
      alert(err.message || "Failed to delete event");
    }
  };

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
            <span className="hidden text-sm font-semibold text-warm-900 sm:inline">Events</span>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-warm-200 px-4 py-2 text-sm font-semibold text-warm-700 transition hover:bg-warm-100"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {/* Page header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-warm-900">Events</h1>
            <p className="mt-1 text-warm-700">{user.churchName}</p>
          </div>
          <a
            href="/dashboard/events/new"
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Event
          </a>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-warm-200 bg-white px-3 py-2 text-sm text-warm-800 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
          >
            <option value="">All statuses</option>
            {Object.entries(EVENT_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-lg border border-warm-200 bg-white px-3 py-2 text-sm text-warm-800 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
          >
            <option value="">All types</option>
            {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-lg border border-warm-200 bg-white px-3 py-2 text-sm text-warm-800 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
          >
            <option value="upcoming">Upcoming first</option>
            <option value="oldest">Furthest out</option>
            <option value="recent">Recently created</option>
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Events list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-warm-200 bg-white px-6 py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 text-teal-700">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-warm-900">No events yet</h3>
            <p className="mt-1 text-sm text-warm-700">
              {filterStatus || filterType
                ? "No events match the current filters."
                : "Create your first event to get started."}
            </p>
            {!filterStatus && !filterType && (
              <a
                href="/dashboard/events/new"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Create your first event
              </a>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="group rounded-2xl border border-warm-200/60 bg-white p-5 transition hover:border-teal-200 hover:shadow-md"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-warm-900 truncate">
                        {event.title}
                      </h3>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${EVENT_STATUS_COLORS[event.status as EventStatus]}`}>
                        {EVENT_STATUS_LABELS[event.status as EventStatus]}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-warm-700">
                      <span className="inline-flex items-center gap-1">
                        <svg className="h-4 w-4 text-warm-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                        </svg>
                        {EVENT_TYPE_LABELS[event.event_type as EventType]}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <svg className="h-4 w-4 text-warm-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                        {formatDate(event.start_date)} at {formatTime(event.start_date)}
                      </span>
                      {event.location && (
                        <span className="inline-flex items-center gap-1">
                          <svg className="h-4 w-4 text-warm-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                          </svg>
                          {event.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:flex-shrink-0">
                    <a
                      href={`/dashboard/events/${event.id}`}
                      className="rounded-lg border border-warm-200 px-3 py-1.5 text-sm font-semibold text-warm-700 transition hover:bg-warm-100 hover:border-warm-300"
                    >
                      View
                    </a>
                    <a
                      href={`/dashboard/events/${event.id}/edit`}
                      className="rounded-lg border border-warm-200 px-3 py-1.5 text-sm font-semibold text-teal-700 transition hover:bg-teal-50 hover:border-teal-300"
                    >
                      Edit
                    </a>
                    <button
                      onClick={() => handleDelete(event.id, event.title)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 hover:border-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
