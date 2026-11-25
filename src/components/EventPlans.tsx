import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  loadEventPlans,
  saveEventPlan,
  type PlanKind,
  type PlanMap,
} from "~/event-plans";

// ---------------------------------------------------------------------------
// Persisted AI plans — shared context
//
// The event detail page renders every AI card inside one provider. The
// provider loads all saved plans for the event once on mount; each card
// seeds its local state from the matching plan and saves whenever it
// generates or the user toggles/edits something.
// ---------------------------------------------------------------------------

type SaveFn = (kind: PlanKind, payload: unknown) => void;

interface PlansContextValue {
  plans: PlanMap;
  ready: boolean;
  save: SaveFn;
}

const PlansContext = createContext<PlansContextValue>({
  plans: {},
  ready: false,
  save: () => {},
});

export function EventPlansProvider({
  eventId,
  children,
}: {
  eventId: string;
  children: React.ReactNode;
}) {
  const [plans, setPlans] = useState<PlanMap>({});
  const [ready, setReady] = useState(false);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    let cancelled = false;
    setPlans({});
    setReady(false);
    loadEventPlans({ data: { eventId } })
      .then((loaded) => {
        if (!cancelled) setPlans((loaded as PlanMap) ?? {});
      })
      .catch(() => {
        // No saved plans — cards fall back to their "Generate…" state.
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const t of Object.values(pending)) clearTimeout(t);
    };
  }, []);

  // Coalesce rapid saves (typing in a budget line item, for example) so a
  // single card doesn't fire a request per keystroke.
  const save = useCallback<SaveFn>(
    (kind, payload) => {
      if (timers.current[kind]) clearTimeout(timers.current[kind]);
      timers.current[kind] = setTimeout(() => {
        delete timers.current[kind];
        saveEventPlan({ data: { eventId, kind, payload } }).catch(() => {
          // Persisting is best-effort; the card keeps its in-memory state.
        });
      }, 300);
    },
    [eventId],
  );

  return (
    <PlansContext.Provider value={{ plans, ready, save }}>
      {children}
    </PlansContext.Provider>
  );
}

/** The saved payload for one kind of plan, or undefined if nothing saved yet. */
export function useSavedPlan<T>(kind: PlanKind): T | undefined {
  const { plans } = useContext(PlansContext);
  return plans[kind] as T | undefined;
}

/** Save (upsert) a plan payload for this event. */
export function useSavePlan(): SaveFn {
  return useContext(PlansContext).save;
}

/** True once the saved plans for this event have finished loading. */
export function usePlansReady(): boolean {
  return useContext(PlansContext).ready;
}
