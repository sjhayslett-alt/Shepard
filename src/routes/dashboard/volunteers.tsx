import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getAuthState, clearSessionCookie, logoutFn, type SessionUser } from "~/auth";
import {
  getVolunteers,
  getVolunteerRoles,
  createVolunteer,
  updateVolunteer,
  deleteVolunteer,
  DEFAULT_ROLE_LABELS,
  DEFAULT_ROLE_DESCRIPTIONS,
  type Volunteer,
  type VolunteerRole,
} from "~/volunteers";

export const Route = createFileRoute("/dashboard/volunteers")({
  beforeLoad: async () => {
    const { user } = await getAuthState();
    if (!user) throw redirect({ to: "/login" });
    return { user };
  },
  component: VolunteersPage,
});

const SKILL_OPTIONS = Object.keys(DEFAULT_ROLE_LABELS);

// ── Skill tag input component ──
function SkillTagInput({
  skills,
  onChange,
}: {
  skills: string[];
  onChange: (s: string[]) => void;
}) {
  const [input, setInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const addSkill = (skill: string) => {
    const trimmed = skill.trim().toLowerCase();
    if (trimmed && !skills.includes(trimmed)) {
      onChange([...skills, trimmed]);
    }
    setInput("");
    setShowDropdown(false);
  };

  const removeSkill = (skill: string) => {
    onChange(skills.filter((s) => s !== skill));
  };

  const filteredOptions = SKILL_OPTIONS.filter(
    (opt) =>
      opt.toLowerCase().includes(input.toLowerCase()) && !skills.includes(opt),
  );

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-1 mb-1">
        {skills.map((s) => (
          <span
            key={s}
            className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-700"
          >
            {DEFAULT_ROLE_LABELS[s] || s}
            <button
              type="button"
              onClick={() => removeSkill(s)}
              className="ml-0.5 text-teal-500 hover:text-teal-800"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (input.trim()) addSkill(input.trim());
          }
        }}
        placeholder="Add skill..."
        className="w-full rounded-lg border border-warm-200 bg-white px-3 py-2 text-sm text-warm-800 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
      />
      {showDropdown && input && filteredOptions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-warm-200 bg-white shadow-lg max-h-36 overflow-y-auto">
          {filteredOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => addSkill(opt)}
              className="block w-full px-3 py-1.5 text-left text-sm text-warm-800 hover:bg-teal-50"
            >
              {DEFAULT_ROLE_LABELS[opt]}
            </button>
          ))}
          {input.trim() &&
            !SKILL_OPTIONS.some((o) => o === input.trim().toLowerCase()) && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addSkill(input.trim())}
                className="block w-full px-3 py-1.5 text-left text-sm text-teal-700 font-semibold hover:bg-teal-50"
              >
                Add "{input.trim()}"
              </button>
            )}
        </div>
      )}
    </div>
  );
}

// ── Main page ──
function VolunteersPage() {
  const { user } = Route.useRouteContext() as { user: SessionUser };
  const router = useRouter();

  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [roles, setRoles] = useState<VolunteerRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterSkill, setFilterSkill] = useState("");

  // Modal / form state
  const [showForm, setShowForm] = useState(false);
  const [editingVolunteer, setEditingVolunteer] = useState<Volunteer | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formSkills, setFormSkills] = useState<string[]>([]);
  const [formAvailability, setFormAvailability] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Volunteer | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [volData, roleData] = await Promise.all([
        getVolunteers({ data: { skill: filterSkill || undefined } }),
        getVolunteerRoles(),
      ]);
      setVolunteers(volData);
      setRoles(roleData);
    } catch (err: any) {
      setError(err.message || "Failed to load volunteers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterSkill]);

  const resetForm = () => {
    setEditingVolunteer(null);
    setFormName("");
    setFormEmail("");
    setFormPhone("");
    setFormSkills([]);
    setFormAvailability("");
    setFormNotes("");
    setFormErrors({});
  };

  const openAddForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (v: Volunteer) => {
    setEditingVolunteer(v);
    setFormName(v.name);
    setFormEmail(v.email || "");
    setFormPhone(v.phone || "");
    setFormSkills(v.skills || []);
    setFormAvailability(
      (v.availability as any)?.notes || "",
    );
    setFormNotes(v.notes || "");
    setFormErrors({});
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setFormErrors({});
    try {
      if (editingVolunteer) {
        const result = await updateVolunteer({
          data: {
            volunteerId: editingVolunteer.id,
            name: formName,
            email: formEmail || undefined,
            phone: formPhone || undefined,
            skills: formSkills,
            availability: formAvailability || undefined,
            notes: formNotes || undefined,
          },
        });
        if (!result.success) {
          setFormErrors(result.errors || {});
          setSaving(false);
          return;
        }
      } else {
        const result = await createVolunteer({
          data: {
            name: formName,
            email: formEmail || undefined,
            phone: formPhone || undefined,
            skills: formSkills,
            availability: formAvailability || undefined,
            notes: formNotes || undefined,
          },
        });
        if (!result.success) {
          setFormErrors(result.errors || {});
          setSaving(false);
          return;
        }
      }
      setShowForm(false);
      resetForm();
      await fetchData();
    } catch (err: any) {
      setFormErrors({ form: err.message || "Save failed" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteVolunteer({ data: { volunteerId: deleteTarget.id } });
      setDeleteTarget(null);
      await fetchData();
    } catch (err: any) {
      alert(err.message || "Delete failed");
    }
  };

  const handleLogout = async () => {
    await logoutFn();
    clearSessionCookie();
    router.navigate({ to: "/" });
  };

  const formatSkills = (skills: string[] | null) => {
    if (!skills || skills.length === 0) return "—";
    return skills
      .map((s) => DEFAULT_ROLE_LABELS[s] || s)
      .join(", ");
  };

  const formatAvailability = (avail: Record<string, unknown> | null) => {
    if (!avail) return "—";
    return (avail as any).notes || JSON.stringify(avail);
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
            <span className="hidden text-sm font-semibold text-warm-900 sm:inline">Volunteers</span>
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
            <h1 className="text-3xl font-bold tracking-tight text-warm-900">Volunteers</h1>
            <p className="mt-1 text-warm-700">{user.churchName}</p>
          </div>
          <button
            onClick={openAddForm}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Volunteer
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Main area */}
          <div className="lg:col-span-3">
            {/* Filters */}
            <div className="mb-6 flex flex-wrap gap-3">
              <select
                value={filterSkill}
                onChange={(e) => setFilterSkill(e.target.value)}
                className="rounded-lg border border-warm-200 bg-white px-3 py-2 text-sm text-warm-800 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
              >
                <option value="">All skills</option>
                {SKILL_OPTIONS.map((sk) => (
                  <option key={sk} value={sk}>
                    {DEFAULT_ROLE_LABELS[sk]}
                  </option>
                ))}
              </select>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* List */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
              </div>
            ) : volunteers.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-warm-200 bg-white px-6 py-20 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-warm-900">No volunteers yet</h3>
                <p className="mt-1 text-sm text-warm-700">
                  {filterSkill
                    ? "No volunteers match the current filter."
                    : "Add your first volunteer to start building your serving team."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {volunteers.map((v) => (
                  <div
                    key={v.id}
                    className="group rounded-2xl border border-warm-200/60 bg-white p-5 transition hover:border-teal-200 hover:shadow-md"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-warm-900">{v.name}</h3>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-warm-700">
                          {v.email && <span>{v.email}</span>}
                          {v.phone && <span>{v.phone}</span>}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-warm-500">Skills:</span>
                          {v.skills && v.skills.length > 0 ? (
                            v.skills.map((s) => (
                              <span
                                key={s}
                                className="inline-flex items-center rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-700"
                              >
                                {DEFAULT_ROLE_LABELS[s] || s}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-warm-400">None</span>
                          )}
                        </div>
                        <div className="mt-1 text-xs text-warm-500">
                          <span className="font-semibold">Availability:</span>{" "}
                          {formatAvailability(v.availability)}
                        </div>
                        {v.notes && (
                          <p className="mt-1 text-xs text-warm-400 italic">{v.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 sm:flex-shrink-0">
                        <button
                          onClick={() => openEditForm(v)}
                          className="rounded-lg border border-warm-200 px-3 py-1.5 text-sm font-semibold text-teal-700 transition hover:bg-teal-50 hover:border-teal-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteTarget(v)}
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
          </div>

          {/* Sidebar: role legend */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-warm-200/60 bg-white p-5">
              <h3 className="text-lg font-bold text-warm-900 mb-3">Volunteer Roles</h3>
              <div className="space-y-3">
                {Object.entries(DEFAULT_ROLE_DESCRIPTIONS).map(([key, desc]) => (
                  <div key={key} className="border-b border-warm-100 pb-3 last:border-0 last:pb-0">
                    <h4 className="text-sm font-semibold text-teal-700">
                      {DEFAULT_ROLE_LABELS[key]}
                    </h4>
                    <p className="mt-0.5 text-xs text-warm-600 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* ── Add / Edit Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl p-6 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-warm-900">
                {editingVolunteer ? "Edit Volunteer" : "Add Volunteer"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg p-1 text-warm-400 hover:text-warm-700"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {formErrors.form && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {formErrors.form}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-warm-800 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-lg border border-warm-200 bg-white px-3 py-2 text-sm text-warm-800 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
                  placeholder="Full name"
                />
                {formErrors.name && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-warm-800 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full rounded-lg border border-warm-200 bg-white px-3 py-2 text-sm text-warm-800 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-warm-800 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full rounded-lg border border-warm-200 bg-white px-3 py-2 text-sm text-warm-800 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-warm-800 mb-1">
                  Skills
                </label>
                <SkillTagInput skills={formSkills} onChange={setFormSkills} />
              </div>

              <div>
                <label className="block text-sm font-semibold text-warm-800 mb-1">
                  Availability
                </label>
                <input
                  type="text"
                  value={formAvailability}
                  onChange={(e) => setFormAvailability(e.target.value)}
                  className="w-full rounded-lg border border-warm-200 bg-white px-3 py-2 text-sm text-warm-800 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
                  placeholder='e.g., "Sundays 9am-12pm, Wednesday evenings"'
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-warm-800 mb-1">
                  Notes
                </label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-warm-200 bg-white px-3 py-2 text-sm text-warm-800 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
                  placeholder="Any additional notes..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-warm-200 px-4 py-2 text-sm font-semibold text-warm-700 transition hover:bg-warm-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-teal-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-teal-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : editingVolunteer ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl p-6">
            <h2 className="text-lg font-bold text-warm-900">Delete Volunteer?</h2>
            <p className="mt-2 text-sm text-warm-700">
              Are you sure you want to remove <strong>{deleteTarget.name}</strong>? This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-warm-200 px-4 py-2 text-sm font-semibold text-warm-700 transition hover:bg-warm-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
