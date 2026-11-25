import { useState, useEffect } from "react";
import {
  generatePromotion,
  generateFollowUp,
  type PromotionResult,
  type FollowUpResult,
} from "~/ai-promo";
import { useSavedPlan, useSavePlan } from "~/components/EventPlans";

interface Props {
  eventId: string;
}

// ---------------------------------------------------------------------------
// Section wrapper (minimal, matching AiTools.tsx style)
// ---------------------------------------------------------------------------

function Section({
  title,
  children,
  defaultOpen,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="rounded-xl border border-warm-200 bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span className="flex items-center gap-2 text-base font-semibold text-warm-900">
          <span className="text-amber-500">✨</span> {title}
        </span>
        <svg
          className={`h-5 w-5 text-warm-400 transition ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && <div className="border-t border-warm-100 px-5 pb-5">{children}</div>}
    </div>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="rounded-lg border border-warm-200 px-3 py-1 text-xs font-medium text-warm-600 transition hover:bg-teal-50 hover:border-teal-300"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

// ---------------------------------------------------------------------------
// PromotionTool
// ---------------------------------------------------------------------------

function PromotionTool({ eventId }: Props) {
  const [data, setData] = useState<PromotionResult | null>(null);
  const [loading, setLoading] = useState(false);

  const saved = useSavedPlan<PromotionResult>("promotion");
  const savePlan = useSavePlan();
  useEffect(() => {
    if (saved && !data) setData(saved);
  }, [saved]);

  const handleGenerate = async () => {
    setLoading(true);
    const result = await generatePromotion({ data: { eventId } });
    setData(result);
    savePlan("promotion", result);
    setLoading(false);
  };

  return (
    <Section title="Promotion AI">
      <div className="flex gap-3 mb-4 pt-3">
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="rounded-xl bg-teal-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
        >
          {loading ? "Generating..." : data ? "Regenerate" : "Generate"}
        </button>
      </div>

      {data && (
        <div className="space-y-6">
          {/* Social Calendar */}
          <div>
            <h4 className="text-sm font-bold text-warm-900 mb-2">
              30-Day Social Calendar
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-warm-200 text-left text-warm-600">
                    <th className="pb-2 pr-3 font-medium">Day</th>
                    <th className="pb-2 pr-3 font-medium">Platform</th>
                    <th className="pb-2 font-medium">Content</th>
                  </tr>
                </thead>
                <tbody>
                  {data.socialCalendar.slice(0, 10).map((d, i) => (
                    <tr key={i} className="border-b border-warm-100 text-warm-700">
                      <td className="py-1.5 pr-3 whitespace-nowrap">{d.day}</td>
                      <td className="py-1.5 pr-3 whitespace-nowrap">{d.platform}</td>
                      <td className="py-1.5 text-xs">{d.contentIdea}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-1 text-xs text-warm-400">Showing first 10 of 30 entries</p>
            </div>
          </div>

          {/* Countdown Graphics */}
          <div>
            <h4 className="text-sm font-bold text-warm-900 mb-2">Countdown Graphics</h4>
            <ul className="list-disc pl-5 text-sm text-warm-700 space-y-1">
              {data.countdownGraphics.map((g, i) => (
                <li key={i}>{g}</li>
              ))}
            </ul>
          </div>

          {/* Reel Scripts */}
          <div>
            <h4 className="text-sm font-bold text-warm-900 mb-2">Reel Scripts</h4>
            <div className="space-y-3">
              {data.reelScripts.map((r, i) => (
                <div key={i} className="rounded-lg border border-warm-200 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-warm-900">{r.title}</span>
                    <span className="text-xs text-warm-500">{r.duration}</span>
                  </div>
                  <pre className="mt-2 text-xs text-warm-700 whitespace-pre-wrap">{r.script}</pre>
                  <div className="mt-2">
                    <CopyBtn text={r.script} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TikTok Ideas */}
          <div>
            <h4 className="text-sm font-bold text-warm-900 mb-2">TikTok Ideas</h4>
            <div className="space-y-2">
              {data.tiktokIdeas.map((t, i) => (
                <div key={i} className="rounded-lg border border-warm-200 p-3">
                  <p className="text-sm font-semibold text-warm-900">Hook: {t.hook}</p>
                  <p className="mt-1 text-xs text-warm-700">{t.body}</p>
                  <p className="mt-1 text-xs text-teal-600">{t.caption}</p>
                  <div className="mt-2">
                    <CopyBtn text={`Hook: ${t.hook}\nBody: ${t.body}\nCaption: ${t.caption}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Announcement Scripts */}
          <div>
            <h4 className="text-sm font-bold text-warm-900 mb-2">Announcement Scripts</h4>
            {data.announcementScripts.map((a, i) => (
              <div key={i} className="mb-2 rounded-lg border border-warm-200 p-3">
                <span className="text-xs font-semibold text-teal-600">{a.type}</span>
                <p className="mt-1 text-sm text-warm-700">{a.script}</p>
                <div className="mt-2">
                  <CopyBtn text={a.script} />
                </div>
              </div>
            ))}
          </div>

          {/* Stage Announcements */}
          <div>
            <h4 className="text-sm font-bold text-warm-900 mb-2">Stage Announcements</h4>
            {data.stageAnnouncements.map((s, i) => (
              <div key={i} className="mb-2 rounded-lg border border-warm-200 p-3">
                <span className="text-xs font-semibold text-teal-600">{s.occasion}</span>
                <p className="mt-1 text-sm text-warm-700">{s.script}</p>
                <div className="mt-2">
                  <CopyBtn text={s.script} />
                </div>
              </div>
            ))}
          </div>

          {/* Pastor Talking Points */}
          <div>
            <h4 className="text-sm font-bold text-warm-900 mb-2">Pastor Talking Points</h4>
            <ul className="list-disc pl-5 text-sm text-warm-700 space-y-1">
              {data.pastorTalkingPoints.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>

          {/* Email Sequence */}
          <div>
            <h4 className="text-sm font-bold text-warm-900 mb-2">Email Sequence</h4>
            <div className="space-y-3">
              {data.emailSequence.map((e, i) => (
                <div key={i} className="rounded-lg border border-warm-200 p-3">
                  <span className="text-xs text-teal-600">Email #{e.emailNumber}</span>
                  <p className="text-sm font-semibold text-warm-900 mt-1">Subject: {e.subject}</p>
                  <pre className="mt-1 text-xs text-warm-700 whitespace-pre-wrap">{e.body}</pre>
                  <div className="mt-2">
                    <CopyBtn text={`Subject: ${e.subject}\n\n${e.body}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Section>
  );
}

// ---------------------------------------------------------------------------
// FollowUpTool
// ---------------------------------------------------------------------------

function FollowUpTool({ eventId }: Props) {
  const [data, setData] = useState<FollowUpResult | null>(null);
  const [loading, setLoading] = useState(false);

  const saved = useSavedPlan<FollowUpResult>("follow_up");
  const savePlan = useSavePlan();
  useEffect(() => {
    if (saved && !data) setData(saved);
  }, [saved]);

  const handleGenerate = async () => {
    setLoading(true);
    const result = await generateFollowUp({ data: { eventId } });
    setData(result);
    savePlan("follow_up", result);
    setLoading(false);
  };

  return (
    <Section title="Follow-Up AI">
      <div className="flex gap-3 mb-4 pt-3">
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="rounded-xl bg-teal-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
        >
          {loading ? "Generating..." : data ? "Regenerate" : "Generate"}
        </button>
      </div>

      {data && (
        <div className="space-y-6">
          {/* Thank-you emails */}
          <div>
            <h4 className="text-sm font-bold text-warm-900 mb-2">Thank-You Emails</h4>
            {data.thankYouEmails.map((t, i) => (
              <div key={i} className="mb-2 rounded-lg border border-warm-200 p-3">
                <span className="text-xs font-semibold text-teal-600">{t.audience}</span>
                <p className="text-sm font-semibold text-warm-900 mt-1">Subject: {t.subject}</p>
                <pre className="mt-1 text-xs text-warm-700 whitespace-pre-wrap">{t.body}</pre>
                <div className="mt-2">
                  <CopyBtn text={`Subject: ${t.subject}\n\n${t.body}`} />
                </div>
              </div>
            ))}
          </div>

          {/* Volunteer appreciation */}
          <div>
            <h4 className="text-sm font-bold text-warm-900 mb-2">Volunteer Appreciation</h4>
            {data.volunteerAppreciation.map((v, i) => (
              <div key={i} className="mb-2 rounded-lg border border-warm-200 p-3">
                <span className="text-xs font-semibold text-teal-600">{v.format}</span>
                <p className="mt-1 text-sm text-warm-700">{v.message}</p>
                <div className="mt-2">
                  <CopyBtn text={v.message} />
                </div>
              </div>
            ))}
          </div>

          {/* Attendance report */}
          <div>
            <h4 className="text-sm font-bold text-warm-900 mb-2">Attendance Report</h4>
            <div className="rounded-lg border border-warm-200 p-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-warm-600">Registered:</span>
                <span className="text-warm-900">{data.attendanceReport.registered}</span>
                <span className="text-warm-600">Attended:</span>
                <span className="text-warm-900">{data.attendanceReport.attended}</span>
                <span className="text-warm-600">No-Show Rate:</span>
                <span className="text-warm-900">{data.attendanceReport.noShowRate}</span>
              </div>
              <p className="mt-2 text-xs text-warm-600">{data.attendanceReport.notes}</p>
            </div>
          </div>

          {/* Expense report */}
          <div>
            <h4 className="text-sm font-bold text-warm-900 mb-2">Expense Report</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-warm-200 text-left text-warm-600">
                    <th className="pb-2 pr-3 font-medium">Category</th>
                    <th className="pb-2 pr-3 font-medium">Budgeted</th>
                    <th className="pb-2 pr-3 font-medium">Actual</th>
                    <th className="pb-2 font-medium">Variance</th>
                  </tr>
                </thead>
                <tbody>
                  {data.expenseReport.map((e, i) => (
                    <tr key={i} className="border-b border-warm-100 text-warm-700">
                      <td className="py-1.5 pr-3">{e.category}</td>
                      <td className="py-1.5 pr-3">{e.budgeted}</td>
                      <td className="py-1.5 pr-3">{e.actual}</td>
                      <td className="py-1.5">{e.variance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Lessons learned */}
          <div>
            <h4 className="text-sm font-bold text-warm-900 mb-2">Lessons Learned</h4>
            {data.lessonsLearned.map((l, i) => (
              <label key={i} className="flex items-start gap-2 py-1">
                <input type="checkbox" className="mt-1 rounded border-warm-300 text-teal-600" />
                <span className="text-sm text-warm-700">{l}</span>
              </label>
            ))}
          </div>

          {/* Survey questions */}
          <div>
            <h4 className="text-sm font-bold text-warm-900 mb-2">Survey Questions</h4>
            {data.surveyQuestions.map((s, i) => (
              <div key={i} className="flex items-start gap-2 py-1">
                <span className="text-xs text-warm-400 mt-0.5 w-16 shrink-0">{s.type}</span>
                <span className="text-sm text-warm-700">{s.question}</span>
              </div>
            ))}
          </div>

          {/* Next-year recommendations */}
          <div>
            <h4 className="text-sm font-bold text-warm-900 mb-2">Next-Year Recommendations</h4>
            <ul className="list-disc pl-5 text-sm text-warm-700 space-y-1">
              {data.nextYearRecommendations.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Exported panel
// ---------------------------------------------------------------------------

export function PromoFollowUpPanel({ eventId }: Props) {
  return (
    <div className="space-y-4">
      <PromotionTool eventId={eventId} />
      <FollowUpTool eventId={eventId} />
    </div>
  );
}