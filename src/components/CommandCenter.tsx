import { useState, useEffect, useCallback } from "react";
import { getCommandCenter, type CommandCenterState, type CommandTask, type TaskStatus } from "~/command-center";

// ---------------------------------------------------------------------------
// Live clock
// ---------------------------------------------------------------------------

function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="text-right">
      <div className="text-3xl font-bold tabular-nums text-warm-900">
        {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </div>
      <div className="text-sm text-warm-500">
        {now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Progress bar
// ---------------------------------------------------------------------------

function OverallProgress({ sections }: { sections: CommandCenterState["sections"] }) {
  const allTasks = sections.flatMap((s) => s.tasks);
  const done = allTasks.filter((t) => t.status === "done").length;
  const total = allTasks.length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold text-warm-700">Overall Progress</span>
        <span className="text-sm font-bold text-teal-700">{done}/{total} tasks ({pct}%)</span>
      </div>
      <div className="h-3 rounded-full bg-warm-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-teal-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Task row
// ---------------------------------------------------------------------------

function statusColor(s: TaskStatus): string {
  switch (s) {
    case "done": return "bg-emerald-100 text-emerald-800 border-emerald-300";
    case "in-progress": return "bg-amber-100 text-amber-800 border-amber-300";
    case "skipped": return "bg-slate-100 text-slate-500 border-slate-200";
    default: return "bg-white text-warm-600 border-warm-200";
  }
}

const STATUS_CYCLE: Record<TaskStatus, TaskStatus> = {
  "pending": "in-progress",
  "in-progress": "done",
  "done": "skipped",
  "skipped": "pending",
};

const STATUS_BADGE: Record<TaskStatus, string> = {
  "pending": "○",
  "in-progress": "◉",
  "done": "✓",
  "skipped": "—",
};

interface TaskProps {
  task: CommandTask;
  onToggle: (id: string) => void;
}

function TaskRow({ task, onToggle }: TaskProps) {
  return (
    <div
      onClick={() => onToggle(task.id)}
      className={`flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer transition hover:shadow-sm ${statusColor(task.status)}`}
    >
      <span className="text-lg w-6 text-center font-bold">{STATUS_BADGE[task.status]}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${task.status === "done" ? "line-through text-slate-500" : "text-warm-900"}`}>
          {task.label}
        </p>
        <div className="flex gap-3 mt-0.5 text-xs text-warm-500">
          {task.time && <span>⏰ {task.time}</span>}
          {task.assignedTo && <span>👤 {task.assignedTo}</span>}
        </div>
      </div>
      {task.notes && (
        <span className="text-xs text-warm-400 italic hidden sm:block max-w-[120px] truncate" title={task.notes}>
          {task.notes}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

function SectionPanel({
  name,
  icon,
  tasks,
  onToggle,
}: {
  name: string;
  icon: string;
  tasks: CommandTask[];
  onToggle: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const done = tasks.filter((t) => t.status === "done").length;

  return (
    <div className="rounded-xl border border-warm-200 bg-white overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-warm-50 transition"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-sm font-bold text-warm-900">{name}</span>
          <span className="text-xs text-warm-500 ml-1">{done}/{tasks.length}</span>
        </div>
        <svg
          className={`h-4 w-4 text-warm-400 transition ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <div className="border-t border-warm-100 px-4 pb-4 pt-2 space-y-2">
          {tasks.map((t) => (
            <TaskRow key={t.id} task={t} onToggle={onToggle} />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Run Sheet tab
// ---------------------------------------------------------------------------

function RunSheetView({ entries }: { entries: CommandCenterState["runSheet"] }) {
  return (
    <div className="rounded-xl border border-warm-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-warm-100">
        <h3 className="text-sm font-bold text-warm-900">📋 Run Sheet</h3>
      </div>
      <div className="divide-y divide-warm-100">
        {entries.map((e, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-2.5">
            <span className="text-xs font-bold text-teal-700 w-16 shrink-0 tabular-nums">{e.time}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-warm-900">{e.activity}</p>
              <div className="flex gap-3 mt-0.5 text-xs text-warm-500">
                {e.owner && <span>👤 {e.owner}</span>}
                {e.location && <span>📍 {e.location}</span>}
                {e.duration && <span>⏱ {e.duration}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Emergency Contacts
// ---------------------------------------------------------------------------

function EmergencyContacts({ contacts }: { contacts: CommandCenterState["emergencyContacts"] }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 overflow-hidden">
      <div className="px-4 py-3 border-b border-red-200">
        <h3 className="text-sm font-bold text-red-800">🆘 Emergency Contacts</h3>
      </div>
      <div className="divide-y divide-red-100">
        {contacts.map((c, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-2">
            <div>
              <p className="text-sm font-medium text-red-900">{c.role}</p>
              {c.name && <p className="text-xs text-red-700">{c.name}</p>}
            </div>
            {c.phone && (
              <a
                href={`tel:${c.phone.replace(/\D/g, "")}`}
                className="text-sm font-bold text-red-700 hover:text-red-900 transition"
              >
                {c.phone}
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Volunteer Roster
// ---------------------------------------------------------------------------

function VolunteerRoster({ roster }: { roster: CommandCenterState["volunteerRoster"] }) {
  if (roster.length === 0) {
    return (
      <div className="rounded-xl border border-warm-200 bg-white p-4 text-center text-sm text-warm-500">
        No volunteers assigned to this event yet.
      </div>
    );
  }

  const [checkedIn, setCheckedIn] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setCheckedIn((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const present = roster.filter((v) => checkedIn.has(v.id)).length;

  return (
    <div className="rounded-xl border border-warm-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-warm-100 flex items-center justify-between">
        <h3 className="text-sm font-bold text-warm-900">👥 Volunteer Roster</h3>
        <span className="text-xs text-teal-700 font-semibold">{present}/{roster.length} checked in</span>
      </div>
      <div className="divide-y divide-warm-100 max-h-64 overflow-y-auto">
        {roster.map((v) => (
          <label
            key={v.id}
            className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-warm-50 transition"
          >
            <input
              type="checkbox"
              checked={checkedIn.has(v.id)}
              onChange={() => toggle(v.id)}
              className="rounded border-warm-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="flex-1 text-sm text-warm-900">{v.name}</span>
            <span className="text-xs text-warm-500 bg-warm-100 rounded-full px-2 py-0.5">{v.role}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Room/Resource Status
// ---------------------------------------------------------------------------

function RoomResourceStatus({
  rooms,
  resources,
}: {
  rooms: CommandCenterState["roomStatuses"];
  resources: CommandCenterState["resourceStatuses"];
}) {
  const roomStatusIcon = (s: string) => {
    switch (s) {
      case "ready": return "✅";
      case "in-use": return "🔵";
      default: return "⚠️";
    }
  };
  const resourceStatusIcon = (s: string) => {
    switch (s) {
      case "available": return "✅";
      case "deployed": return "🔵";
      default: return "❌";
    }
  };

  return (
    <div className="rounded-xl border border-warm-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-warm-100">
        <h3 className="text-sm font-bold text-warm-900">🏠 Rooms & Resources</h3>
      </div>
      <div className="p-4 space-y-4">
        {rooms.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-warm-600 mb-2">Rooms</p>
            <div className="space-y-1">
              {rooms.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-sm">
                  <span className="text-warm-700">{roomStatusIcon(r.status)} {r.name}</span>
                  <span className="text-xs text-warm-500">{r.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {resources.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-warm-600 mb-2">Resources</p>
            <div className="space-y-1">
              {resources.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-sm">
                  <span className="text-warm-700">{resourceStatusIcon(r.status)} {r.name}</span>
                  <span className="text-xs text-warm-500">{r.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {rooms.length === 0 && resources.length === 0 && (
          <p className="text-sm text-warm-500 text-center">No rooms or resources assigned to this event.</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Export
// ---------------------------------------------------------------------------

export function CommandCenterPanel({ eventId }: { eventId: string }) {
  const [state, setState] = useState<CommandCenterState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"checklist" | "runsheet">("checklist");

  // Local mutable task state (so toggles work client-side)
  const [taskMap, setTaskMap] = useState<Record<string, TaskStatus>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getCommandCenter({ data: { eventId } });
      setState(result);
      // Initialize task map from server state
      const map: Record<string, TaskStatus> = {};
      result.sections.forEach((s) => s.tasks.forEach((t) => { map[t.id] = t.status; }));
      setTaskMap(map);
    } catch (err: any) {
      setError(err.message || "Failed to load command center");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const toggleTask = useCallback((id: string) => {
    setTaskMap((prev) => {
      const current = prev[id] || "pending";
      const next = STATUS_CYCLE[current];
      return { ...prev, [id]: next };
    });
  }, []);

  // Derive sections with live task statuses
  const sections = state?.sections.map((s) => ({
    ...s,
    tasks: s.tasks.map((t) => ({ ...t, status: taskMap[t.id] || t.status })),
  })) ?? [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-warm-900">🎛️ Command Center</h2>
          {state && (
            <p className="text-sm text-warm-500">
              {state.eventName} — {new Date(state.eventDate).toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
            </p>
          )}
        </div>
        <LiveClock />
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      {/* Not loaded yet */}
      {!state && (
        <div className="rounded-xl border border-warm-200 bg-white p-8 text-center">
          <p className="text-warm-600 mb-4">Load the day-of-event dashboard to track every detail in real time.</p>
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-teal-700 disabled:opacity-50"
          >
            {loading ? "Loading..." : "🚀 Launch Command Center"}
          </button>
        </div>
      )}

      {/* Loaded */}
      {state && (
        <>
          {/* Progress */}
          <OverallProgress sections={sections} />

          {/* Tab bar */}
          <div className="flex gap-1 rounded-xl bg-warm-100 p-1">
            <button
              onClick={() => setActiveTab("checklist")}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeTab === "checklist" ? "bg-white text-teal-700 shadow-sm" : "text-warm-600 hover:text-warm-900"
              }`}
            >
              ✅ Checklist
            </button>
            <button
              onClick={() => setActiveTab("runsheet")}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeTab === "runsheet" ? "bg-white text-teal-700 shadow-sm" : "text-warm-600 hover:text-warm-900"
              }`}
            >
              📋 Run Sheet
            </button>
          </div>

          {/* Tab content */}
          {activeTab === "checklist" && (
            <div className="space-y-3">
              {sections.map((s) => (
                <SectionPanel key={s.name} name={s.name} icon={s.icon} tasks={s.tasks} onToggle={toggleTask} />
              ))}
            </div>
          )}

          {activeTab === "runsheet" && <RunSheetView entries={state.runSheet} />}

          {/* Side panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <VolunteerRoster roster={state.volunteerRoster} />
            <RoomResourceStatus rooms={state.roomStatuses} resources={state.resourceStatuses} />
          </div>

          <EmergencyContacts contacts={state.emergencyContacts} />

          {/* Reload button */}
          <div className="text-center">
            <button
              onClick={load}
              disabled={loading}
              className="text-sm text-teal-600 hover:text-teal-800 transition disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "🔄 Refresh"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}