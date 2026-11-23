import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getAuthState, clearSessionCookie, logoutFn, type SessionUser } from "~/auth";
import {
  getEvent,
  deleteEvent,
  type Event,
  EVENT_TYPE_LABELS,
  EVENT_STATUS_LABELS,
  EVENT_STATUS_COLORS,
  EVENT_TYPE_COLORS,
  type EventType,
  type EventStatus,
} from "~/events";
import { AiToolsPanel } from "~/components/AiTools";
import { CommandCenterPanel } from "~/components/CommandCenter";
import { SpecializedPlannersPanel } from "~/components/SpecializedPlanners";

export const Route = createFileRoute("/dashboard/events/$eventId")({
  beforeLoad: async () => {
    const { user } = await getAuthState();
    if (!user) throw redirect({ to: "/login" });
    return { user };
  },
  component: EventDetailPage,
});

function EventDetailPage() {
  const { user } = Route.useRouteContext() as { user: SessionUser };
  const router = useRouter();
  const { eventId } = Route.useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      setError("");
      try {
        const result = await getEvent({ data: { eventId } });
        setEvent(result);
      } catch (err: any) {
        setError(err.message || "Event not found");
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId]);

  const handleLogout = async () => {
    await logoutFn();
    clearSessionCookie();
    router.navigate({ to: "/" });
  };

  const handleDelete = async () => {
    if (!event) return;
    if (!confirm(`Delete "${event.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await deleteEvent({ data: { eventId } });
      router.navigate({ to: "/dashboard/events" });
    } catch (err: any) {
      alert(err.message || "Failed to delete event");
      setDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  if (loading) {
    return <div className="flex min-h-dvh flex-col"><DetailHeader user={user} onLogout={handleLogout} /><main className="flex flex-1 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" /></main></div>;
  }

  if (error || !event) {
    return <div className="flex min-h-dvh flex-col"><DetailHeader user={user} onLogout={handleLogout} /><main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 text-center sm:px-6"><div className="rounded-2xl border border-red-200 bg-red-50 p-8"><h2 className="text-xl font-bold text-red-700">Event not found</h2><p className="mt-2 text-red-600">{error || "This event may have been deleted."}</p><a href="/dashboard/events" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700">Back to Events</a></div></main></div>;
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <DetailHeader user={user} onLogout={handleLogout} eventTitle={event.title} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <a href="/dashboard/events" className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-teal-700 hover:underline">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          Back to Events
        </a>

        {/* Event detail card */}
        <div className="rounded-2xl border border-warm-200/60 bg-white p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <h1 className="text-2xl font-bold text-warm-900 sm:text-3xl">{event.title}</h1>
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${EVENT_STATUS_COLORS[event.status as EventStatus]}`}>{EVENT_STATUS_LABELS[event.status as EventStatus]}</span>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 mb-8">
            <div><p className="text-xs font-semibold uppercase tracking-wider text-warm-400">Event Type</p><span className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-semibold ${EVENT_TYPE_COLORS[event.event_type as EventType]}`}>{EVENT_TYPE_LABELS[event.event_type as EventType]}</span></div>
            {event.location && <div><p className="text-xs font-semibold uppercase tracking-wider text-warm-400">Location</p><p className="mt-1 text-sm font-medium text-warm-900">{event.location}</p></div>}
            <div><p className="text-xs font-semibold uppercase tracking-wider text-warm-400">Start</p><p className="mt-1 text-sm font-medium text-warm-900">{formatDate(event.start_date)} at {formatTime(event.start_date)}</p></div>
            {event.end_date && <div><p className="text-xs font-semibold uppercase tracking-wider text-warm-400">End</p><p className="mt-1 text-sm font-medium text-warm-900">{formatDate(event.end_date)} at {formatTime(event.end_date)}</p></div>}
          </div>
          {event.description && <div className="border-t border-warm-100 pt-6"><p className="text-xs font-semibold uppercase tracking-wider text-warm-400 mb-2">Description</p><p className="text-sm text-warm-700 whitespace-pre-wrap leading-relaxed">{event.description}</p></div>}
          <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-warm-100">
            <a href={`/dashboard/events/${event.id}/edit`} className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
              Edit Event
            </a>
            <button onClick={handleDelete} disabled={deleting} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-5 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-50">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
              {deleting ? "Deleting..." : "Delete Event"}
            </button>
          </div>
        </div>

        {/* AI Tools section */}
        <AiToolsPanel eventId={event.id} />

        <CommandCenterPanel eventId={event.id} />

        <SpecializedPlannersPanel defaultType={event.event_type} />
      </main>
    </div>
  );
}

function DetailHeader({ user, onLogout, eventTitle }: { user: SessionUser; onLogout: () => void; eventTitle?: string }) {
  return (
    <header className="sticky top-0 z-50 border-b border-warm-200/60 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4 min-w-0">
          <a href="/dashboard" className="flex items-center gap-2 text-teal-700 flex-shrink-0">
            <svg className="h-8 w-8" viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2.5" /><path d="M20 8c-4 4-8 16-4 22 2 3 6 3 8 0 4-6 0-18-4-22z" fill="currentColor" opacity="0.7" /><path d="M20 8v8M16 16h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            <span className="text-xl font-bold tracking-tight">Shepherd</span>
          </a>
          <span className="hidden text-sm text-warm-700 sm:inline">/</span>
          <a href="/dashboard/events" className="hidden text-sm font-semibold text-teal-700 hover:underline sm:inline flex-shrink-0">Events</a>
          {eventTitle && <><span className="hidden text-sm text-warm-700 sm:inline">/</span><span className="hidden text-sm font-semibold text-warm-900 truncate sm:inline">{eventTitle}</span></>}
        </div>
        <button onClick={onLogout} className="rounded-lg border border-warm-200 px-4 py-2 text-sm font-semibold text-warm-700 transition hover:bg-warm-100 flex-shrink-0">Sign out</button>
      </div>
    </header>
  );
}
