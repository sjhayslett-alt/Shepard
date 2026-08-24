import { createServerFn } from "@tanstack/react-start";
import { getAuthState } from "~/auth";
import { getEvent, type Event, type EventType } from "~/events";
import { sql } from "~/db";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TimelineBlock {
  time: string;
  activity: string;
  notes?: string;
}

export interface TimelineResult {
  eventTitle: string;
  eventType: EventType;
  blocks: TimelineBlock[];
}

export interface ChecklistItem {
  id: string;
  text: string;
}

export interface ChecklistPhase {
  phase: string;
  items: ChecklistItem[];
}

export interface ChecklistResult {
  eventTitle: string;
  eventType: EventType;
  phases: ChecklistPhase[];
}

export interface BudgetCategory {
  name: string;
  amount: number;
  percentage: number;
  locked?: boolean;
}

export interface BudgetResult {
  eventTitle: string;
  eventType: EventType;
  totalBudget: number;
  categories: BudgetCategory[];
}

// ---------------------------------------------------------------------------
// Provider interface (for future LLM integration)
// ---------------------------------------------------------------------------

export interface AIProvider {
  generateTimeline(event: Event): Promise<TimelineResult>;
  generateChecklist(event: Event): Promise<ChecklistResult>;
  generateBudget(event: Event, totalBudget: number): Promise<BudgetResult>;
}

// ---------------------------------------------------------------------------
// Rule-based generators (used when no AI provider is configured)
// ---------------------------------------------------------------------------

function generateDefaultTitle(event: Event, suffix: string): string {
  if (event.title.length > 30) return `${event.title.slice(0, 27)}... ${suffix}`;
  return `${event.title} ${suffix}`;
}

function ruleBasedTimeline(event: Event): TimelineResult {
  const et = event.event_type as EventType;
  const startDate = new Date(event.start_date);
  const endDate = event.end_date ? new Date(event.end_date) : new Date(startDate.getTime() + 3 * 60 * 60 * 1000);

  const templates: Record<EventType, TimelineBlock[]> = {
    service: [
      { time: "8:00 AM", activity: "Worship team sound check", notes: "Full run-through with AV team" },
      { time: "8:30 AM", activity: "Volunteer huddle", notes: "Greeters, ushers, and hospitality team briefing" },
      { time: "9:00 AM", activity: "Pre-service prayer", notes: "Prayer room or front of sanctuary" },
      { time: "9:30 AM", activity: "Doors open / Welcome", notes: "Greeters at all entrances" },
      { time: "9:45 AM", activity: "Worship set begins", notes: "3–4 songs, worship leader coordinates with band" },
      { time: "10:00 AM", activity: "Announcements", notes: "Upcoming events and ministry highlights" },
      { time: "10:10 AM", activity: "Sermon", notes: "Pastor delivers message" },
      { time: "10:45 AM", activity: "Response / Ministry time", notes: "Altar call, prayer teams available" },
      { time: "11:00 AM", activity: "Benediction & Dismissal", notes: "Closing blessing" },
      { time: "11:15 AM", activity: "Fellowship & Refreshments", notes: "Coffee and snacks in lobby" },
      { time: "11:45 AM", activity: "Volunteer debrief", notes: "Quick huddle for feedback" },
      { time: "12:00 PM", activity: "Building secured", notes: "Final walkthrough and lockup" },
    ],
    wedding: [
      { time: "12:00 PM", activity: "Venue access for setup", notes: "Decor team, florist, and AV arrive" },
      { time: "1:00 PM", activity: "Bridal party arrival", notes: "Hair, makeup, dressing rooms open" },
      { time: "2:00 PM", activity: "Photographer arrives", notes: "Getting-ready shots and detail photos" },
      { time: "2:00 PM", activity: "Groom & groomsmen arrival", notes: "Groom's room available" },
      { time: "3:00 PM", activity: "Final venue walkthrough", notes: "Coordinator checks ceremony and reception setup" },
      { time: "3:30 PM", activity: "Guests begin arriving", notes: "Ushers and greeters in place" },
      { time: "4:00 PM", activity: "Ceremony begins", notes: "Processional, welcome, readings, vows, ring exchange" },
      { time: "4:45 PM", activity: "Recessional & receiving line", notes: "Couple exits, guests proceed to cocktail hour" },
      { time: "5:00 PM", activity: "Cocktail hour", notes: "Appetizers and drinks served" },
      { time: "5:30 PM", activity: "Photographs", notes: "Family and bridal party photos" },
      { time: "6:00 PM", activity: "Reception begins", notes: "Grand entrance, blessing, dinner service" },
      { time: "7:00 PM", activity: "Toasts & speeches", notes: "Best man, maid of honor, parents" },
      { time: "7:30 PM", activity: "First dance & open dancing", notes: "DJ or band begins full set" },
      { time: "8:30 PM", activity: "Cake cutting", notes: "Dessert served" },
      { time: "9:30 PM", activity: "Last dance & sparkler send-off", notes: "Coordinate sparklers with venue" },
      { time: "10:00 PM", activity: "Venue cleanup begins", notes: "Decor teardown, gifts collected" },
      { time: "11:00 PM", activity: "Venue secured", notes: "All items removed, final walkthrough" },
    ],
    funeral: [
      { time: "9:00 AM", activity: "Venue preparation", notes: "Set up flowers, photos, guest book, AV for slideshow" },
      { time: "9:30 AM", activity: "Family arrival", notes: "Private family room available for gathering" },
      { time: "10:00 AM", activity: "Family viewing (if applicable)", notes: "Private time for immediate family" },
      { time: "10:30 AM", activity: "Doors open for guests", notes: "Ushers and greeters in place" },
      { time: "11:00 AM", activity: "Service begins", notes: "Welcome, opening prayer, musical selection" },
      { time: "11:15 AM", activity: "Eulogies & tributes", notes: "Family and friends share memories (2–4 speakers)" },
      { time: "11:45 AM", activity: "Message of hope", notes: "Pastor or officiant delivers sermon" },
      { time: "12:00 PM", activity: "Closing prayer & benediction", notes: "Final blessing" },
      { time: "12:15 PM", activity: "Recessional & dismissal", notes: "Guests exit, family escorted" },
      { time: "12:30 PM", activity: "Reception / meal", notes: "Fellowship hall prepared with food and seating" },
      { time: "2:00 PM", activity: "Graveside committal (if applicable)", notes: "Travel to cemetery, brief service" },
      { time: "3:00 PM", activity: "Venue cleanup", notes: "Remove flowers, photos, tear down setup" },
    ],
    vbs: [
      { time: "8:00 AM", activity: "Volunteer check-in & prayer", notes: "All station leaders and assistants arrive" },
      { time: "8:15 AM", activity: "Final station prep", notes: "Set up crafts, snacks, games, and teaching materials" },
      { time: "8:30 AM", activity: "Registration & check-in opens", notes: "Check-in table staffed, name tags ready" },
      { time: "9:00 AM", activity: "Opening assembly", notes: "Welcome, worship songs, skit, daily theme intro" },
      { time: "9:30 AM", activity: "Bible story station (Group 1)", notes: "Interactive Bible lesson with visuals and discussion" },
      { time: "10:00 AM", activity: "Rotation: Crafts (Group 1)", notes: "Theme-related craft project" },
      { time: "10:00 AM", activity: "Rotation: Games (Group 2)", notes: "Outdoor or indoor group games tied to lesson" },
      { time: "10:30 AM", activity: "Snack time", notes: "Theme snack with allergy-safe options" },
      { time: "10:50 AM", activity: "Music & motions", notes: "Worship and memory verse songs" },
      { time: "11:10 AM", activity: "Small group discussion", notes: "Review day's lesson, prayer requests" },
      { time: "11:30 AM", activity: "Closing assembly", notes: "Review, announcements, take-home challenge" },
      { time: "12:00 PM", activity: "Dismissal & parent pickup", notes: "Secure checkout process" },
      { time: "12:30 PM", activity: "Volunteer debrief", notes: "What worked, adjustments for tomorrow" },
      { time: "1:00 PM", activity: "Cleanup & reset", notes: "Prep stations for next day" },
    ],
    retreat: [
      { time: "4:00 PM", activity: "Arrival & check-in", notes: "Welcome packets, room assignments, name tags" },
      { time: "5:00 PM", activity: "Icebreakers & group mixer", notes: "Get-to-know-you activities" },
      { time: "6:00 PM", activity: "Dinner", notes: "Seating mixed for fellowship across groups" },
      { time: "7:00 PM", activity: "Session 1: Opening worship & message", notes: "Theme introduction, keynote speaker" },
      { time: "8:30 PM", activity: "Small group discussion", notes: "Breakout by pre-assigned groups" },
      { time: "9:30 PM", activity: "Free time / Bonfire / Fellowship", notes: "Snacks and hot drinks available" },
      { time: "7:00 AM", activity: "Morning devotion (optional)", notes: "Quiet time and personal reflection" },
      { time: "8:00 AM", activity: "Breakfast", notes: "Full breakfast service" },
      { time: "9:00 AM", activity: "Session 2: Worship & teaching", notes: "Deeper dive into theme" },
      { time: "10:30 AM", activity: "Workshop / Activity block", notes: "Choice of 2–3 tracks (prayer, service, creative)" },
      { time: "12:00 PM", activity: "Lunch", notes: "Cafeteria or catered" },
      { time: "1:00 PM", activity: "Free time / Recreation", notes: "Hiking, sports, rest, or reflection" },
      { time: "3:00 PM", activity: "Session 3: Closing worship", notes: "Commissioning and prayer" },
      { time: "4:30 PM", activity: "Pack up & departure", notes: "Clean rooms, gather belongings" },
    ],
    potluck: [
      { time: "10:00 AM", activity: "Kitchen & hall setup", notes: "Set up serving tables, chafing dishes, power strips for crockpots" },
      { time: "10:30 AM", activity: "Labeling stations", notes: "Place cards for categories: mains, sides, salads, desserts" },
      { time: "11:00 AM", activity: "Volunteer briefing", notes: "Serving line flow, allergy labeling, cleanup rotation" },
      { time: "11:30 AM", activity: "Food drop-off begins", notes: "Volunteers help unload, label dishes, plug in warmers" },
      { time: "12:00 PM", activity: "Welcome & blessing", notes: "Pastor or host welcomes everyone, prays over meal" },
      { time: "12:05 PM", activity: "Serving lines open", notes: "Elders/families with small children go first, then open" },
      { time: "12:30 PM", activity: "Fellowship & dining", notes: "Background music, open seating" },
      { time: "1:00 PM", activity: "Program / Activity", notes: "Brief announcements, game, or testimony (optional)" },
      { time: "1:30 PM", activity: "Dessert & coffee", notes: "Dessert table opens" },
      { time: "2:00 PM", activity: "Cleanup begins", notes: "Sort dishes by owner, pack leftovers, wipe tables" },
      { time: "2:30 PM", activity: "Dish pickup", notes: "Attendees collect their dishes and leftovers" },
      { time: "3:00 PM", activity: "Final cleanup & lockup", notes: "Trash out, floors swept, kitchen cleaned" },
    ],
    outreach: [
      { time: "7:30 AM", activity: "Volunteer check-in & breakfast", notes: "Coffee, pastries, team assignments" },
      { time: "8:00 AM", activity: "Team huddle & prayer", notes: "Review goals, safety briefing, distribute supplies" },
      { time: "8:30 AM", activity: "Setup at outreach site", notes: "Tents, tables, signage, resource distribution stations" },
      { time: "9:00 AM", activity: "Event opens to community", notes: "Welcome team greeting, directing attendees" },
      { time: "9:30 AM", activity: "Service stations active", notes: "Food pantry, clothing, health screenings, prayer tent" },
      { time: "11:00 AM", activity: "Kids' activities begin", notes: "Face painting, games, bounce house (if available)" },
      { time: "12:00 PM", activity: "Community meal served", notes: "Hot meal provided, community seating" },
      { time: "1:00 PM", activity: "Worship & testimony", notes: "Brief outdoor worship set, personal stories shared" },
      { time: "1:30 PM", activity: "Gospel presentation / Invitation", notes: "Clear presentation, prayer team available" },
      { time: "2:00 PM", activity: "Resource distribution wrap-up", notes: "Ensure remaining needs are met where possible" },
      { time: "2:30 PM", activity: "Event closes", notes: "Thank attendees, collect contact cards for follow-up" },
      { time: "3:00 PM", activity: "Tear-down & cleanup", notes: "Pack supplies, clean site, load vehicles" },
      { time: "4:00 PM", activity: "Team debrief", notes: "Share highlights, compile follow-up list, closing prayer" },
    ],
    other: [
      { time: "1 hour before", activity: "Setup & preparation", notes: "Arrange space, AV check, materials ready" },
      { time: "30 min before", activity: "Volunteer huddle", notes: "Go over roles and schedule" },
      { time: "Start time", activity: "Event begins / Welcome", notes: "Opening remarks and overview" },
      { time: "Mid-point", activity: "Main activity / Program", notes: "Core content or activity for this event" },
      { time: "Near end", activity: "Wrap-up", notes: "Closing remarks, next steps, thank yous" },
      { time: "After event", activity: "Cleanup & debrief", notes: "Tear down, volunteer feedback, lock up" },
    ],
  };

  return {
    eventTitle: generateDefaultTitle(event, "Timeline"),
    eventType: et,
    blocks: templates[et] || templates.other,
  };
}

function ruleBasedChecklist(event: Event): ChecklistResult {
  const et = event.event_type as EventType;

  const commonPhases = [
    { phase: "4 Weeks Before", items: [
      "Reserve venue and confirm availability",
      "Recruit key volunteers / team leads",
      "Create event budget and get approval",
      "Order any major supplies or rentals",
      "Begin promotion — announcements, bulletin, social media",
    ]},
    { phase: "2 Weeks Before", items: [
      "Confirm all volunteers and assign roles",
      "Send detailed schedule to team leads",
      "Order food / catering (if applicable)",
      "Prepare printed materials — programs, signage, name tags",
      "Check AV equipment and tech needs",
    ]},
    { phase: "1 Week Before", items: [
      "Send reminder to all volunteers",
      "Finalize run-of-show / detailed timeline",
      "Purchase remaining supplies",
      "Send event reminder to congregation / attendees",
      "Confirm deliveries and vendor arrival times",
    ]},
    { phase: "Day Before", items: [
      "Set up rooms — chairs, tables, staging",
      "Test all AV equipment — mics, projector, slides",
      "Set up signage and directional signs",
      "Prep welcome / registration area",
      "Charge all devices — tablets, mics, radios",
      "Confirm weather plan if outdoor elements",
    ]},
    { phase: "Day Of", items: [
      "Arrive early — do final walkthrough",
      "Volunteer check-in and huddle",
      "Set out food / refreshments",
      "Execute event per timeline",
      "Capture photos and attendance count",
      "Thank volunteers throughout event",
    ]},
    { phase: "After Event", items: [
      "Tear down and clean all areas",
      "Return rented equipment",
      "Send thank-you notes to volunteers",
      "Debrief with team — what worked, what to improve",
      "Reconcile budget — actual vs planned spend",
      "Post event photos and follow-up on social media",
      "Follow up with new visitors / contacts",
    ]},
  ];

  // Event-type-specific additions
  const extras: Record<EventType, { phase: string; items: string[] }[]> = {
    service: [
      { phase: "1 Week Before", items: ["Finalize sermon slides and notes with pastor", "Select and rehearse worship set"] },
      { phase: "Day Before", items: ["Print bulletins and insert handouts"] },
    ],
    wedding: [
      { phase: "4 Weeks Before", items: ["Final dress/tux fitting", "Confirm marriage license obtained"] },
      { phase: "2 Weeks Before", items: ["Final walkthrough with couple and officiant", "Confirm rehearsal dinner plans"] },
      { phase: "1 Week Before", items: ["Rehearsal — run through ceremony twice", "Finalize seating chart and place cards"] },
      { phase: "Day Of", items: ["Set up bridal suite and groom's room", "Coordinate with photographer and DJ/band"] },
      { phase: "After Event", items: ["Return tux rentals", "Preserve bouquet (if couple requests)"] },
    ],
    funeral: [
      { phase: "4 Weeks Before", items: ["Meet with family to plan service details", "Arrange for obituary and funeral program printing"] },
      { phase: "1 Week Before", items: ["Prepare slideshow / photo tribute", "Confirm pallbearers and honorary pallbearers"] },
      { phase: "Day Of", items: ["Set up memory table with photos and mementos", "Coordinate with funeral home director"] },
      { phase: "After Event", items: ["Send meal leftovers home with family", "Mail acknowledgment cards for flowers/donations"] },
    ],
    vbs: [
      { phase: "4 Weeks Before", items: ["Order curriculum and craft supplies", "Recruit station leaders: Bible, crafts, games, snacks"] },
      { phase: "2 Weeks Before", items: ["Complete background checks on all volunteers", "Plan and purchase snack supplies"] },
      { phase: "1 Week Before", items: ["Decorate church for VBS theme", "Print registration forms and name tags"] },
      { phase: "After Event", items: ["Send follow-up letters to families", "Compile registration data for children's ministry"] },
    ],
    retreat: [
      { phase: "4 Weeks Before", items: ["Book retreat center / venue", "Confirm speaker and worship leader"] },
      { phase: "2 Weeks Before", items: ["Send packing list to attendees", "Prepare small group discussion guides"] },
      { phase: "Day Before", items: ["Pack first-aid kit and emergency supplies", "Print room assignments and schedule handouts"] },
      { phase: "After Event", items: ["Collect feedback forms", "Share photos and session recordings"] },
    ],
    potluck: [
      { phase: "2 Weeks Before", items: ["Create sign-up sheet for dishes (mains, sides, desserts)", "Assign serving line volunteers"] },
      { phase: "1 Week Before", items: ["Send reminder and coordinate dish categories to avoid gaps"] },
      { phase: "Day Before", items: ["Purchase paper goods, drinks, and serving utensils"] },
      { phase: "Day Of", items: ["Set up allergy-friendly labeling system", "Prepare backup food (church-provided dish)"] },
    ],
    outreach: [
      { phase: "4 Weeks Before", items: ["Secure permits (if needed) for public space", "Partner with local organizations for resources"] },
      { phase: "2 Weeks Before", items: ["Collect donations — food, clothing, hygiene items", "Train volunteers on outreach and prayer protocols"] },
      { phase: "1 Week Before", items: ["Distribute flyers in target neighborhood", "Assemble resource packets / gift bags"] },
      { phase: "After Event", items: ["Log all contacts for follow-up", "Schedule follow-up calls within 48 hours"] },
    ],
    other: [],
  };

  const phases = commonPhases.map((p) => {
    const extra = (extras[et] || []).find((e) => e.phase === p.phase);
    const items = extra ? [...p.items, ...extra.items] : [...p.items];
    return {
      phase: p.phase,
      items: items.map((text, i) => ({ id: `${p.phase.replace(/\s+/g, "-").toLowerCase()}-${i}`, text })),
    };
  });

  return {
    eventTitle: generateDefaultTitle(event, "Checklist"),
    eventType: et,
    phases,
  };
}

const BUDGET_TEMPLATES: Record<EventType, { name: string; pct: number }[]> = {
  service: [
    { name: "Worship & Tech", pct: 25 },
    { name: "Printed Materials", pct: 10 },
    { name: "Hospitality", pct: 15 },
    { name: "Children's Ministry", pct: 15 },
    { name: "Decorations", pct: 10 },
    { name: "AV / Equipment", pct: 10 },
    { name: "Miscellaneous", pct: 15 },
  ],
  wedding: [
    { name: "Venue & Facilities", pct: 25 },
    { name: "Decorations & Flowers", pct: 15 },
    { name: "Food & Catering", pct: 20 },
    { name: "Music / Entertainment", pct: 10 },
    { name: "Photography / Video", pct: 12 },
    { name: "Attire & Accessories", pct: 8 },
    { name: "Stationery & Printing", pct: 5 },
    { name: "Miscellaneous", pct: 5 },
  ],
  funeral: [
    { name: "Venue & Facilities", pct: 15 },
    { name: "Funeral Home Services", pct: 25 },
    { name: "Flowers & Arrangements", pct: 10 },
    { name: "Reception Meal", pct: 20 },
    { name: "Printed Materials", pct: 10 },
    { name: "Honorariums", pct: 10 },
    { name: "Miscellaneous", pct: 10 },
  ],
  vbs: [
    { name: "Curriculum & Materials", pct: 25 },
    { name: "Snacks & Drinks", pct: 15 },
    { name: "Crafts Supplies", pct: 20 },
    { name: "Decorations", pct: 15 },
    { name: "Games & Activities", pct: 10 },
    { name: "T-shirts / Giveaways", pct: 10 },
    { name: "Miscellaneous", pct: 5 },
  ],
  retreat: [
    { name: "Venue / Lodging", pct: 35 },
    { name: "Food & Meals", pct: 25 },
    { name: "Speaker Honorarium", pct: 15 },
    { name: "Materials & Supplies", pct: 10 },
    { name: "Transportation", pct: 10 },
    { name: "Miscellaneous", pct: 5 },
  ],
  potluck: [
    { name: "Paper Goods & Utensils", pct: 20 },
    { name: "Drinks", pct: 15 },
    { name: "Church-Provided Dishes", pct: 25 },
    { name: "Decorations", pct: 15 },
    { name: "Serving Supplies", pct: 10 },
    { name: "Activities / Games", pct: 10 },
    { name: "Miscellaneous", pct: 5 },
  ],
  outreach: [
    { name: "Food & Meals", pct: 25 },
    { name: "Giveaways / Resources", pct: 20 },
    { name: "Marketing / Flyers", pct: 10 },
    { name: "Equipment & Rentals", pct: 15 },
    { name: "Kids' Activities", pct: 10 },
    { name: "Speaker / Entertainment", pct: 10 },
    { name: "Miscellaneous", pct: 10 },
  ],
  other: [
    { name: "Venue / Facilities", pct: 25 },
    { name: "Food & Beverages", pct: 20 },
    { name: "Equipment & Rentals", pct: 15 },
    { name: "Marketing", pct: 10 },
    { name: "Decorations", pct: 10 },
    { name: "Speakers / Entertainment", pct: 10 },
    { name: "Miscellaneous", pct: 10 },
  ],
};

function ruleBasedBudget(event: Event, totalBudget: number): BudgetResult {
  const et = event.event_type as EventType;
  const template = BUDGET_TEMPLATES[et] || BUDGET_TEMPLATES.other;

  const categories: BudgetCategory[] = template.map((cat) => ({
    name: cat.name,
    amount: Math.round(totalBudget * (cat.pct / 100) * 100) / 100,
    percentage: cat.pct,
  }));

  return {
    eventTitle: generateDefaultTitle(event, "Budget"),
    eventType: et,
    totalBudget,
    categories,
  };
}

// ---------------------------------------------------------------------------
// Server functions — these are the public API the UI calls
// ---------------------------------------------------------------------------

export const generateTimeline = createServerFn({ method: "POST" })
  .validator((d: unknown) => {
    const data = d as { eventId: string };
    if (!data.eventId) throw new Error("Event ID is required");
    return { eventId: data.eventId };
  })
  .handler(async ({ data }) => {
    const { user } = await getAuthState();
    if (!user) throw new Error("Unauthorized");

    const event = await getEvent({ eventId: data.eventId });
    return ruleBasedTimeline(event);
  });

export const generateChecklist = createServerFn({ method: "POST" })
  .validator((d: unknown) => {
    const data = d as { eventId: string };
    if (!data.eventId) throw new Error("Event ID is required");
    return { eventId: data.eventId };
  })
  .handler(async ({ data }) => {
    const { user } = await getAuthState();
    if (!user) throw new Error("Unauthorized");

    const event = await getEvent({ eventId: data.eventId });
    return ruleBasedChecklist(event);
  });

export const generateBudget = createServerFn({ method: "POST" })
  .validator((d: unknown) => {
    const data = d as { eventId: string; totalBudget: number };
    if (!data.eventId) throw new Error("Event ID is required");
    if (!data.totalBudget || data.totalBudget <= 0) throw new Error("Budget must be a positive number");
    return { eventId: data.eventId, totalBudget: data.totalBudget };
  })
  .handler(async ({ data }) => {
    const { user } = await getAuthState();
    if (!user) throw new Error("Unauthorized");

    const event = await getEvent({ eventId: data.eventId });
    return ruleBasedBudget(event, data.totalBudget);
  });

// ---------------------------------------------------------------------------
// Types for new tools
// ---------------------------------------------------------------------------

export interface VolunteerAssignment {
  id: string;
  name: string;
  role: string;
  reason: string;
}

export interface VolunteerAssignmentResult {
  eventTitle: string;
  eventType: EventType;
  assignments: VolunteerAssignment[];
  isSampleData: boolean;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  category: string;
}

export interface ShoppingListResult {
  eventTitle: string;
  eventType: EventType;
  categories: { category: string; items: ShoppingItem[] }[];
}

export interface RiskItem {
  id: string;
  risk: string;
  likelihood: string;
  severity: string;
  mitigation: string;
}

export interface RiskPlanResult {
  eventTitle: string;
  eventType: EventType;
  risks: RiskItem[];
  rainPlan: string | null;
  isOutdoorEvent: boolean;
}

export interface SetupBreakdownTask {
  id: string;
  task: string;
  time: string;
  duration: string;
  phase: "setup" | "breakdown";
  assignee?: string;
}

export interface SetupBreakdownResult {
  eventTitle: string;
  eventType: EventType;
  setupTasks: SetupBreakdownTask[];
  breakdownTasks: SetupBreakdownTask[];
}

// ---------------------------------------------------------------------------
// 4. Volunteer Assignment Generator
// ---------------------------------------------------------------------------

const EVENT_TYPE_ROLES: Record<EventType, string[]> = {
  service: ["greeter", "parking", "hospitality", "childrens_ministry", "worship_team", "cleanup", "security"],
  wedding: ["greeter", "parking", "hospitality", "cleanup", "floater", "security"],
  funeral: ["greeter", "hospitality", "cleanup", "parking", "floater"],
  vbs: ["childrens_ministry", "registration", "security", "hospitality", "cleanup", "floater"],
  retreat: ["hospitality", "registration", "cleanup", "security", "floater"],
  potluck: ["hospitality", "cleanup", "floater", "greeter", "registration"],
  outreach: ["greeter", "registration", "hospitality", "security", "cleanup", "childrens_ministry", "floater"],
  other: ["floater", "hospitality", "cleanup", "registration", "greeter"],
};

const ROLE_REASONS: Record<string, string[]> = {
  greeter: ["Friendly and welcoming — great first impression for guests", "Warm personality suited for welcoming attendees"],
  parking: ["Experienced with traffic flow and parking lot management", "Detail-oriented — can manage parking logistics smoothly"],
  hospitality: ["Natural host with food/beverage service experience", "Excels at creating a warm atmosphere for guests"],
  childrens_ministry: ["Passionate about children's ministry and has relevant experience", "Patient and engaging with kids"],
  security: ["Alert and trained in safety protocols", "Calm under pressure — ideal for safety monitoring"],
  cleanup: ["Thorough and efficient — gets the job done quickly", "Reliable and detail-oriented for post-event cleanup"],
  registration: ["Organized and friendly — great at checking people in", "Detail-oriented with strong people skills"],
  floater: ["Versatile and adaptable — can jump in wherever needed", "Well-rounded volunteer able to fill gaps"],
  worship_team: ["Musically gifted and experienced in worship settings", "Skilled musician or vocalist for worship services"],
};

export const generateVolunteerAssignments = createServerFn({ method: "POST" })
  .validator((d: unknown) => {
    const data = d as { eventId: string };
    if (!data.eventId) throw new Error("Event ID is required");
    return { eventId: data.eventId };
  })
  .handler(async ({ data }) => {
    const { user } = await getAuthState();
    if (!user) throw new Error("Unauthorized");

    const event = await getEvent({ eventId: data.eventId });
    const et = event.event_type as EventType;
    const neededRoles = EVENT_TYPE_ROLES[et] || EVENT_TYPE_ROLES.other;

    // Fetch volunteers for the church
    const volunteerRows = await sql.query(
      "SELECT id, name, skills, availability FROM volunteers WHERE church_id = $1",
      [user.churchId],
    );

    if (volunteerRows.length === 0) {
      // No volunteers in DB — return sample data
      const sampleVolunteers = [
        { name: "Sarah Williams", skills: ["greeter", "hospitality"] },
        { name: "Mike Johnson", skills: ["parking", "security"] },
        { name: "Emily Davis", skills: ["childrens_ministry", "registration"] },
        { name: "Robert Brown", skills: ["cleanup", "floater"] },
        { name: "Lisa Martinez", skills: ["hospitality", "greeter"] },
        { name: "David Kim", skills: ["worship_team", "hospitality"] },
        { name: "Rachel Torres", skills: ["registration", "childrens_ministry"] },
        { name: "James Wilson", skills: ["security", "parking"] },
      ];

      const assignments: VolunteerAssignment[] = [];
      const usedNames = new Set<string>();

      for (const role of neededRoles) {
        const candidate = sampleVolunteers.find(
          (v) => v.skills.includes(role) && !usedNames.has(v.name),
        );
        if (candidate) {
          usedNames.add(candidate.name);
          const reasons = ROLE_REASONS[role] || ["Well-suited for this role"];
          assignments.push({
            id: `sample-${role}-${assignments.length}`,
            name: candidate.name,
            role,
            reason: reasons[assignments.length % reasons.length],
          });
        }
      }

      return {
        eventTitle: `${event.title} — Volunteer Assignments`,
        eventType: et,
        assignments,
        isSampleData: true,
      };
    }

    // Real volunteers: match skills to needed roles
    const volunteers = volunteerRows as { id: string; name: string; skills: string[] | null; availability: unknown }[];
    const assignments: VolunteerAssignment[] = [];
    const usedIds = new Set<string>();

    for (const role of neededRoles) {
      const candidate = volunteers.find(
        (v) => {
          if (usedIds.has(v.id)) return false;
          const skills = Array.isArray(v.skills) ? v.skills : [];
          return skills.includes(role);
        },
      );

      if (candidate) {
        usedIds.add(candidate.id);
        const reasons = ROLE_REASONS[role] || ["Well-suited for this role"];
        assignments.push({
          id: `${candidate.id}-${role}`,
          name: candidate.name,
          role,
          reason: reasons[assignments.length % reasons.length],
        });
      }
    }

    // Fill remaining needed roles with any unmatched volunteers
    for (const role of neededRoles) {
      const alreadyAssigned = assignments.some((a) => a.role === role);
      if (alreadyAssigned) continue;

      const candidate = volunteers.find((v) => !usedIds.has(v.id));
      if (candidate) {
        usedIds.add(candidate.id);
        assignments.push({
          id: `${candidate.id}-${role}`,
          name: candidate.name,
          role,
          reason: "Available and ready to serve in this capacity",
        });
      }
    }

    return {
      eventTitle: `${event.title} — Volunteer Assignments`,
      eventType: et,
      assignments,
      isSampleData: false,
    };
  });

// ---------------------------------------------------------------------------
// 5. Shopping List Generator
// ---------------------------------------------------------------------------

const SHOPPING_TEMPLATES: Record<EventType, { category: string; items: { name: string; quantity: string }[] }[]> = {
  service: [
    { category: "Printed Materials", items: [
      { name: "Bulletins / programs", quantity: "1 per attendee + 20 extra" },
      { name: "Announcement inserts", quantity: "1 per attendee" },
      { name: "Sermon note sheets", quantity: "1 per attendee" },
    ]},
    { category: "Hospitality", items: [
      { name: "Coffee (ground)", quantity: "2 lbs" },
      { name: "Coffee filters", quantity: "1 pack" },
      { name: "Disposable cups", quantity: "100" },
      { name: "Snacks / pastries", quantity: "Assorted, serves 50" },
      { name: "Napkins", quantity: "1 pack" },
    ]},
    { category: "AV & Tech", items: [
      { name: "AA / AAA batteries", quantity: "8 of each" },
      { name: "Stage tape (gaffers tape)", quantity: "1 roll" },
    ]},
    { category: "Cleaning", items: [
      { name: "Trash bags (large)", quantity: "1 box" },
      { name: "Disinfecting wipes", quantity: "1 container" },
    ]},
  ],
  wedding: [
    { category: "Decorations", items: [
      { name: "Fresh flowers (bouquets)", quantity: "Bride + 3-5 bridesmaids" },
      { name: "Aisle flowers / pew bows", quantity: "10-20 depending on aisle length" },
      { name: "Unity candle set", quantity: "1" },
      { name: "Aisle runner", quantity: "1" },
      { name: "Decorative arch / arbor", quantity: "1" },
    ]},
    { category: "Printed Materials", items: [
      { name: "Wedding programs", quantity: "1 per guest + 15 extra" },
      { name: "Place cards", quantity: "1 per guest" },
      { name: "Seating chart poster", quantity: "1" },
      { name: "Guest book", quantity: "1" },
      { name: "Thank-you cards", quantity: "1 per gift expected" },
    ]},
    { category: "Reception", items: [
      { name: "Table linens", quantity: "1 per table" },
      { name: "Centerpieces", quantity: "1 per table" },
      { name: "Disposable dinnerware", quantity: "1 set per guest + extras" },
      { name: "Champagne / sparkling cider", quantity: "1 bottle per table" },
      { name: "Cake cutting set", quantity: "1" },
    ]},
    { category: "Miscellaneous", items: [
      { name: "Ring pillow", quantity: "1" },
      { name: "Flower girl basket + petals", quantity: "1 set" },
      { name: "Emergency kit (safety pins, stain remover, etc.)", quantity: "1" },
    ]},
  ],
  funeral: [
    { category: "Flowers & Arrangements", items: [
      { name: "Casket spray", quantity: "1" },
      { name: "Standing sprays / wreaths", quantity: "2-4" },
      { name: "Small arrangements for altar", quantity: "2" },
    ]},
    { category: "Printed Materials", items: [
      { name: "Funeral programs / bulletins", quantity: "1 per attendee + 20 extra" },
      { name: "Guest book", quantity: "1" },
      { name: "Memorial cards", quantity: "1 per attendee" },
      { name: "Thank-you / acknowledgment cards", quantity: "50" },
    ]},
    { category: "Reception Meal", items: [
      { name: "Disposable plates, cups, utensils", quantity: "1 set per attendee + extras" },
      { name: "Napkins", quantity: "2 packs" },
      { name: "Coffee & tea supplies", quantity: "Enough for estimated guests" },
      { name: "Serving platters / trays", quantity: "10-15" },
    ]},
    { category: "Setup", items: [
      { name: "Easel for photo display", quantity: "1-2" },
      { name: "Memory table cloth", quantity: "1" },
      { name: "Tissue boxes", quantity: "6" },
    ]},
  ],
  vbs: [
    { category: "Craft Supplies", items: [
      { name: "Construction paper (assorted colors)", quantity: "100 sheets per color" },
      { name: "Child-safe scissors", quantity: "15 pairs" },
      { name: "Glue sticks", quantity: "30" },
      { name: "Washable markers", quantity: "10 packs" },
      { name: "Craft foam sheets", quantity: "50 sheets" },
      { name: "Pipe cleaners", quantity: "100" },
      { name: "Googly eyes", quantity: "50 pairs" },
      { name: "Stickers (assorted)", quantity: "10 sheets" },
    ]},
    { category: "Snacks", items: [
      { name: "Juice boxes", quantity: "2 per child per day" },
      { name: "Goldfish crackers", quantity: "2 large cartons" },
      { name: "Fresh fruit (apples, bananas)", quantity: "1 per child per day" },
      { name: "Granola bars", quantity: "1 box per group" },
      { name: "Small paper plates", quantity: "100" },
      { name: "Napkins", quantity: "2 packs" },
    ]},
    { category: "Classroom Supplies", items: [
      { name: "Name tags", quantity: "1 per child + volunteers" },
      { name: "Pencils", quantity: "30" },
      { name: "Whiteboard markers", quantity: "4 packs" },
      { name: "Poster board", quantity: "10" },
    ]},
    { category: "Decorations", items: [
      { name: "Streamers / crepe paper", quantity: "10 rolls" },
      { name: "Balloons", quantity: "30" },
      { name: "Bulletin board border trim", quantity: "4 rolls" },
      { name: "Theme-specific poster kit", quantity: "1" },
    ]},
  ],
  retreat: [
    { category: "Registration & Check-in", items: [
      { name: "Name tags", quantity: "1 per attendee + staff" },
      { name: "Welcome packets / folders", quantity: "1 per attendee" },
      { name: "Pens", quantity: "1 per attendee" },
      { name: "Schedule printouts", quantity: "1 per attendee + 10 extra" },
    ]},
    { category: "Session Materials", items: [
      { name: "Notebooks / journals", quantity: "1 per attendee" },
      { name: "Workbook / study guide copies", quantity: "1 per attendee" },
      { name: "Bible passage handouts", quantity: "1 per attendee" },
      { name: "Small group discussion guides", quantity: "1 per group leader" },
    ]},
    { category: "Hospitality", items: [
      { name: "Coffee & tea supplies (large batch)", quantity: "Enough for entire retreat" },
      { name: "Disposable cups", quantity: "150" },
      { name: "Snacks for breaks", quantity: "Assorted, 3 breaks per day" },
      { name: "Bottled water", quantity: "2 per attendee per day" },
    ]},
    { category: "First Aid & Safety", items: [
      { name: "First aid kit (fully stocked)", quantity: "1" },
      { name: "Sunscreen", quantity: "2 bottles" },
      { name: "Bug spray", quantity: "2 bottles" },
      { name: "Emergency contact list", quantity: "1 per staff member" },
    ]},
  ],
  potluck: [
    { category: "Serving Supplies", items: [
      { name: "Disposable plates (dinner size)", quantity: "2 per expected attendee" },
      { name: "Disposable bowls", quantity: "1 per expected attendee" },
      { name: "Forks, knives, spoons", quantity: "1 set per attendee + extras" },
      { name: "Napkins", quantity: "2 packs" },
      { name: "Disposable cups", quantity: "2 per expected attendee" },
    ]},
    { category: "Setup", items: [
      { name: "Disposable tablecloths", quantity: "1 per serving table" },
      { name: "Chafing dishes / fuel canisters", quantity: "5-8" },
      { name: "Serving spoons / tongs", quantity: "10-15" },
      { name: "Power strips (for crockpots)", quantity: "4-6" },
      { name: "Extension cords", quantity: "4-6" },
    ]},
    { category: "Labels & Signs", items: [
      { name: "Tent cards / food labels", quantity: "20" },
      { name: "Category signs (Mains, Sides, Desserts)", quantity: "3-4" },
      { name: "Allergen warning labels", quantity: "10" },
      { name: "Permanent markers", quantity: "4" },
    ]},
    { category: "Drinks & Ice", items: [
      { name: "Bottled water", quantity: "1 per attendee" },
      { name: "Lemonade / tea mix", quantity: "2 gallons" },
      { name: "Ice bags", quantity: "4-6" },
      { name: "Drink dispensers", quantity: "2" },
    ]},
  ],
  outreach: [
    { category: "Food & Meals", items: [
      { name: "Hot meal ingredients (bulk)", quantity: "Serves estimated crowd" },
      { name: "Disposable plates, utensils, cups", quantity: "1 set per person + 25% extra" },
      { name: "Napkins", quantity: "3 packs" },
      { name: "Bottled water", quantity: "1 per attendee" },
      { name: "Coffee & supplies", quantity: "Large batch" },
    ]},
    { category: "Giveaways & Resources", items: [
      { name: "Grocery bags (reusable)", quantity: "50" },
      { name: "Non-perishable food items", quantity: "Assorted, 1 bag per family" },
      { name: "Hygiene kits (toothbrush, soap, etc.)", quantity: "50" },
      { name: "Resource flyers (local services)", quantity: "100" },
    ]},
    { category: "Setup & Signage", items: [
      { name: "Canopy tents (pop-up)", quantity: "2-4" },
      { name: "Folding tables", quantity: "6-8" },
      { name: "Folding chairs", quantity: "20" },
      { name: "Directional signs", quantity: "5-8" },
      { name: "Banners (event name)", quantity: "1-2" },
    ]},
    { category: "Kids' Activities", items: [
      { name: "Face paint kit", quantity: "1" },
      { name: "Bubbles", quantity: "10 bottles" },
      { name: "Jump rope / balls", quantity: "Assorted" },
      { name: "Coloring books & crayons", quantity: "20 sets" },
    ]},
  ],
  other: [
    { category: "Setup", items: [
      { name: "Event-specific signage", quantity: "As needed" },
      { name: "Tables & chairs", quantity: "Based on headcount" },
    ]},
    { category: "Hospitality", items: [
      { name: "Bottled water", quantity: "1 per attendee" },
      { name: "Snacks / light refreshments", quantity: "Based on headcount" },
    ]},
    { category: "Supplies", items: [
      { name: "Name tags", quantity: "1 per attendee" },
      { name: "Pens / markers", quantity: "As needed" },
    ]},
  ],
};

export const generateShoppingList = createServerFn({ method: "POST" })
  .validator((d: unknown) => {
    const data = d as { eventId: string };
    if (!data.eventId) throw new Error("Event ID is required");
    return { eventId: data.eventId };
  })
  .handler(async ({ data }) => {
    const { user } = await getAuthState();
    if (!user) throw new Error("Unauthorized");

    const event = await getEvent({ eventId: data.eventId });
    const et = event.event_type as EventType;
    const template = SHOPPING_TEMPLATES[et] || SHOPPING_TEMPLATES.other;

    const categories = template.map((cat) => ({
      category: cat.category,
      items: cat.items.map((item, i) => ({
        id: `${cat.category.replace(/\s+/g, "-").toLowerCase()}-${i}`,
        name: item.name,
        quantity: item.quantity,
        category: cat.category,
      })),
    }));

    return {
      eventTitle: `${event.title} — Shopping List`,
      eventType: et,
      categories,
    };
  });

// ---------------------------------------------------------------------------
// 6. Risk Checklist + Rain Plan Generator
// ---------------------------------------------------------------------------

const RISK_TEMPLATES: Record<EventType, { risk: string; likelihood: string; severity: string; mitigation: string; isOutdoorRelevant?: boolean }[]> = {
  service: [
    { risk: "AV / tech failure", likelihood: "Medium", severity: "High", mitigation: "Test all equipment day before; have backup laptop and cables on standby" },
    { risk: "Worship team member no-show", likelihood: "Low", severity: "Medium", mitigation: "Maintain a backup musician roster; have acoustic-only fallback plan" },
    { risk: "Power outage", likelihood: "Low", severity: "High", mitigation: "Keep battery-powered lanterns and acoustic instruments accessible; have printed lyric sheets" },
    { risk: "Medical emergency", likelihood: "Low", severity: "Critical", mitigation: "Ensure first aid kit is stocked; identify medical professionals in congregation each Sunday" },
    { risk: "Fire alarm / evacuation", likelihood: "Very Low", severity: "Critical", mitigation: "Ushers trained on evacuation routes; announce emergency exits at start of service" },
    { risk: "Severe weather blocking access", likelihood: "Low", severity: "Medium", mitigation: "Communicate closures via text/email by 7:30 AM; offer livestream alternative" },
  ],
  wedding: [
    { risk: "Officiant or key vendor no-show", likelihood: "Low", severity: "Critical", mitigation: "Confirm all vendors 1 week and 1 day before; have backup officiant contact on file" },
    { risk: "Weather impacting outdoor photos", likelihood: "Medium", severity: "Medium", mitigation: "Scout indoor photo locations at venue; provide umbrellas for bridal party", isOutdoorRelevant: true },
    { risk: "Music / sound system failure", likelihood: "Low", severity: "High", mitigation: "Test system during rehearsal; have Bluetooth speaker as backup for ceremony" },
    { risk: "Late deliveries (flowers, cake)", likelihood: "Medium", severity: "Medium", mitigation: "Schedule deliveries 2+ hours before needed; confirm vendor arrival windows" },
    { risk: "Guest exceeding venue capacity", likelihood: "Low", severity: "Medium", mitigation: "Track RSVPs closely; have overflow seating plan ready" },
    { risk: "Bridal party member late/no-show", likelihood: "Low", severity: "Medium", mitigation: "Schedule arrival 30 min earlier than needed; designated coordinator calls anyone missing" },
  ],
  funeral: [
    { risk: "Funeral home schedule delay", likelihood: "Low", severity: "High", mitigation: "Direct line of communication with funeral director; build 30-min buffer into timeline" },
    { risk: "AV slideshow not working", likelihood: "Medium", severity: "High", mitigation: "Test slideshow day before on actual equipment; have backup on USB and cloud" },
    { risk: "Insufficient seating / overflow", likelihood: "Medium", severity: "Medium", mitigation: "Prepare overflow room with audio feed; have extra chairs ready in adjacent space" },
    { risk: "Emotional distress of attendees", likelihood: "Medium", severity: "Medium", mitigation: "Designate a quiet room with tissues and water; have pastor or counselor available" },
    { risk: "Reception food shortage", likelihood: "Low", severity: "Medium", mitigation: "Order for 15% over estimated attendance; have backup platters (fruit, cheese) ready" },
  ],
  vbs: [
    { risk: "Child injury during activities", likelihood: "Medium", severity: "High", mitigation: "First aid kit at every station; all volunteers trained on incident reporting; parent emergency contacts on hand" },
    { risk: "Food allergy reaction", likelihood: "Medium", severity: "High", mitigation: "Collect allergy info at registration; post allergy list at snack station; keep epinephrine auto-injector if any known severe allergies" },
    { risk: "Volunteer shortage", likelihood: "Medium", severity: "Medium", mitigation: "Recruit 20% more volunteers than needed; have floaters who can fill any station" },
    { risk: "Severe weather (outdoor games)", likelihood: "Low", severity: "Medium", mitigation: "Plan indoor alternative games; monitor weather radar starting 2 hours before", isOutdoorRelevant: true },
    { risk: "Child release to unauthorized adult", likelihood: "Very Low", severity: "Critical", mitigation: "Strict ID-check pickup process; photo-matched pickup cards; never release without verification" },
    { risk: "Lost child", likelihood: "Low", severity: "Critical", mitigation: "Buddy system for bathroom trips; color-coded group wristbands; designated search procedure" },
  ],
  retreat: [
    { risk: "Venue double-booking or issue", likelihood: "Low", severity: "Critical", mitigation: "Confirm booking 2 weeks and 48 hours before; have backup venue shortlist" },
    { risk: "Weather disrupting outdoor activities", likelihood: "Medium", severity: "Medium", mitigation: "Indoor alternatives for all outdoor sessions; flexible schedule blocks", isOutdoorRelevant: true },
    { risk: "Medical emergency at remote site", likelihood: "Low", severity: "Critical", mitigation: "Map nearest hospital and urgent care; first aid trained staff on site; satellite phone if no cell service" },
    { risk: "Speaker cancellation", likelihood: "Low", severity: "High", mitigation: "Have backup session plan (small group deep-dive, testimony night, or video teaching series)" },
    { risk: "Transportation issues", likelihood: "Low", severity: "Medium", mitigation: "Vehicle checklist before departure; spare tire and emergency kit in each vehicle; rideshare info as backup" },
    { risk: "Low attendee engagement", likelihood: "Low", severity: "Low", mitigation: "Mix of activities (active, reflective, social); anonymous feedback form midway through" },
  ],
  potluck: [
    { risk: "Not enough food / category imbalance", likelihood: "Medium", severity: "High", mitigation: "Track sign-ups by category; have church-provided backup dishes (2-3 main dishes)" },
    { risk: "Food safety / temperature issues", likelihood: "Medium", severity: "High", mitigation: "Provide chafing dishes and power strips; label cook time on each dish; discard food after 2 hours unheated" },
    { risk: "Allergen exposure", likelihood: "Medium", severity: "High", mitigation: "Require ingredient cards for each dish; designate allergen-free table section; list common allergens on signs" },
    { risk: "Kitchen equipment failure", likelihood: "Low", severity: "Medium", mitigation: "Check all equipment morning of; have backup coffee maker and warming trays" },
    { risk: "Spills / slip hazard", likelihood: "Medium", severity: "Medium", mitigation: "Wet floor signs available; designated spill cleanup person; mop and bucket nearby" },
  ],
  outreach: [
    { risk: "Inclement weather", likelihood: "Medium", severity: "High", mitigation: "Tents for all outdoor stations; rain date identified; indoor backup plan communicated to team", isOutdoorRelevant: true },
    { risk: "Permit / space access issues", likelihood: "Low", severity: "Critical", mitigation: "Confirm permits 30 days out; carry permit copies on-site; have alternate public space identified" },
    { risk: "Medical emergency in crowd", likelihood: "Low", severity: "High", mitigation: "Dedicated first aid tent; identify medical volunteers; know EMS response time to location" },
    { risk: "Insufficient supplies / resources", likelihood: "Medium", severity: "Medium", mitigation: "Over-stock by 20%; partner with backup supplier; have emergency purchase fund available" },
    { risk: "Security / crowd management issues", likelihood: "Low", severity: "Medium", mitigation: "Designated security volunteers in high-visibility vests; clear entry/exit flow; de-escalation training" },
    { risk: "Negative community reception", likelihood: "Low", severity: "Low", mitigation: "Pre-event community notification; invite community leaders; have liaison for any concerns" },
  ],
  other: [
    { risk: "Key organizer unavailable", likelihood: "Low", severity: "High", mitigation: "Document all plans in shared location; designate backup lead for each area" },
    { risk: "Venue issues", likelihood: "Low", severity: "Medium", mitigation: "Confirm venue 1 week before; do walkthrough day before" },
    { risk: "Low attendance", likelihood: "Low", severity: "Low", mitigation: "Send reminders 1 week and 1 day before; make it easy to RSVP" },
    { risk: "Budget overrun", likelihood: "Medium", severity: "Medium", mitigation: "Track expenses in real-time; have 10% contingency fund" },
    { risk: "AV / tech problems", likelihood: "Medium", severity: "Medium", mitigation: "Test all equipment ahead of time; have backup plan" },
  ],
};

const RAIN_PLANS: Record<EventType, string | null> = {
  service: null,
  wedding: "Move outdoor photography under covered portico or inside venue lobby. If ceremony is outdoors, relocate to main sanctuary (pre-decorated as backup). Arrange shuttle from parking to covered entrance. Have basket of umbrellas at entrances.",
  funeral: null,
  vbs: "Relocate outdoor games to Fellowship Hall. Adjust schedule: double indoor craft time, shorten game rotation. Set up indoor obstacle course with available furniture (supervised). Have kids' rainy-day movie as last-resort backup.",
  retreat: "All outdoor sessions move to main lodge meeting room. Adjust schedule: extend indoor workshops and small group time. Have board games and indoor team-building activities ready.",
  potluck: null,
  outreach: "Move all stations under canopy tents or inside church building. If at a public park: relocate to church campus and post signage at original location. Communicate change via social media and flyer QR code.",
  other: null,
};

export const generateRiskPlan = createServerFn({ method: "POST" })
  .validator((d: unknown) => {
    const data = d as { eventId: string };
    if (!data.eventId) throw new Error("Event ID is required");
    return { eventId: data.eventId };
  })
  .handler(async ({ data }) => {
    const { user } = await getAuthState();
    if (!user) throw new Error("Unauthorized");

    const event = await getEvent({ eventId: data.eventId });
    const et = event.event_type as EventType;
    const template = RISK_TEMPLATES[et] || RISK_TEMPLATES.other;
    const rainPlan = RAIN_PLANS[et] || null;
    const isOutdoorEvent = template.some((r) => r.isOutdoorRelevant) || !!event.location?.toLowerCase().includes("outdoor");

    const risks: RiskItem[] = template.map((r, i) => ({
      id: `risk-${i}`,
      risk: r.risk,
      likelihood: r.likelihood,
      severity: r.severity,
      mitigation: r.mitigation,
    }));

    return {
      eventTitle: `${event.title} — Risk Plan`,
      eventType: et,
      risks,
      rainPlan,
      isOutdoorEvent,
    };
  });

// ---------------------------------------------------------------------------
// 7. Setup & Breakdown Schedule Generator
// ---------------------------------------------------------------------------

const SETUP_TEMPLATES: Record<EventType, { task: string; timeOffsetMin: number; duration: string }[]> = {
  service: [
    { task: "AV system power-on and sound check", timeOffsetMin: 90, duration: "30 min" },
    { task: "Set up hospitality station (coffee, snacks)", timeOffsetMin: 75, duration: "20 min" },
    { task: "Place bulletins in sanctuary seats", timeOffsetMin: 60, duration: "15 min" },
    { task: "Set up greeter stations at all entrances", timeOffsetMin: 45, duration: "10 min" },
    { task: "Stage setup — music stands, mics, chairs", timeOffsetMin: 45, duration: "15 min" },
    { task: "Final AV run-through with worship team", timeOffsetMin: 30, duration: "25 min" },
    { task: "Door unlock and signage placement", timeOffsetMin: 30, duration: "10 min" },
    { task: "Pre-service prayer gathering", timeOffsetMin: 15, duration: "15 min" },
  ],
  wedding: [
    { task: "Venue unlock — decor team arrival", timeOffsetMin: 240, duration: "—" },
    { task: "Set up ceremony chairs in rows", timeOffsetMin: 210, duration: "45 min" },
    { task: "Install aisle runner and pew decorations", timeOffsetMin: 180, duration: "30 min" },
    { task: "Set up altar arrangements and unity candle", timeOffsetMin: 150, duration: "20 min" },
    { task: "AV check — mics, speakers, music playlist", timeOffsetMin: 120, duration: "20 min" },
    { task: "Set up reception tables and linens", timeOffsetMin: 120, duration: "60 min" },
    { task: "Place centerpieces and table numbers", timeOffsetMin: 90, duration: "20 min" },
    { task: "Set up guest book, gift, and card tables", timeOffsetMin: 75, duration: "15 min" },
    { task: "Final walkthrough with coordinator", timeOffsetMin: 45, duration: "15 min" },
  ],
  funeral: [
    { task: "Set up memory table (photos, mementos)", timeOffsetMin: 90, duration: "20 min" },
    { task: "Arrange flower displays around altar", timeOffsetMin: 75, duration: "15 min" },
    { task: "Set up guest book and program table", timeOffsetMin: 60, duration: "10 min" },
    { task: "AV check — slideshow and microphone test", timeOffsetMin: 45, duration: "15 min" },
    { task: "Prep reception area — tables, coffee, water", timeOffsetMin: 45, duration: "20 min" },
    { task: "Place tissue boxes throughout sanctuary", timeOffsetMin: 30, duration: "5 min" },
    { task: "Greeters in position at all entrances", timeOffsetMin: 30, duration: "5 min" },
  ],
  vbs: [
    { task: "Unlock all classrooms and turn on lights", timeOffsetMin: 60, duration: "5 min" },
    { task: "Set up registration check-in table", timeOffsetMin: 50, duration: "10 min" },
    { task: "Distribute craft supplies to each station", timeOffsetMin: 45, duration: "15 min" },
    { task: "Set up snack station with day's supplies", timeOffsetMin: 45, duration: "10 min" },
    { task: "Set up game station (indoor or outdoor)", timeOffsetMin: 40, duration: "15 min" },
    { task: "Set up Bible story area with visuals", timeOffsetMin: 35, duration: "10 min" },
    { task: "AV check for opening assembly", timeOffsetMin: 30, duration: "10 min" },
    { task: "Volunteer prayer huddle", timeOffsetMin: 15, duration: "10 min" },
  ],
  retreat: [
    { task: "Set up registration / check-in table", timeOffsetMin: 120, duration: "15 min" },
    { task: "Prepare welcome packets (name tags, schedules)", timeOffsetMin: 90, duration: "20 min" },
    { task: "Set up main session room — seating, stage, AV", timeOffsetMin: 90, duration: "30 min" },
    { task: "Set up small group breakout spaces", timeOffsetMin: 60, duration: "20 min" },
    { task: "Prep hospitality station — coffee, water, snacks", timeOffsetMin: 45, duration: "15 min" },
    { task: "Place directional signage around venue", timeOffsetMin: 30, duration: "10 min" },
    { task: "Staff briefing and prayer walk of venue", timeOffsetMin: 30, duration: "20 min" },
  ],
  potluck: [
    { task: "Set up serving tables in designated area", timeOffsetMin: 90, duration: "15 min" },
    { task: "Arrange chafing dishes and plug in power strips", timeOffsetMin: 75, duration: "20 min" },
    { task: "Set up category signs (Mains, Sides, Desserts, Drinks)", timeOffsetMin: 60, duration: "10 min" },
    { task: "Set up drink station with dispensers and ice", timeOffsetMin: 50, duration: "15 min" },
    { task: "Place plates, utensils, and napkins at start of line", timeOffsetMin: 45, duration: "5 min" },
    { task: "Set up allergen labeling station", timeOffsetMin: 40, duration: "5 min" },
    { task: "Designate and label dish pickup area", timeOffsetMin: 30, duration: "5 min" },
  ],
  outreach: [
    { task: "Set up canopy tents and anchor securely", timeOffsetMin: 120, duration: "45 min" },
    { task: "Arrange tables under tents by station type", timeOffsetMin: 90, duration: "30 min" },
    { task: "Set up food service station with warming equipment", timeOffsetMin: 75, duration: "30 min" },
    { task: "Set up registration / welcome tent", timeOffsetMin: 60, duration: "15 min" },
    { task: "Place directional and informational signage", timeOffsetMin: 45, duration: "15 min" },
    { task: "Set up kids' activity area", timeOffsetMin: 45, duration: "20 min" },
    { task: "Set up first aid tent and supplies", timeOffsetMin: 30, duration: "10 min" },
    { task: "Team huddle and prayer walk of site", timeOffsetMin: 15, duration: "15 min" },
  ],
  other: [
    { task: "Set up tables and chairs per layout", timeOffsetMin: 60, duration: "20 min" },
    { task: "AV equipment check", timeOffsetMin: 45, duration: "15 min" },
    { task: "Set up welcome / registration area", timeOffsetMin: 40, duration: "10 min" },
    { task: "Place signage", timeOffsetMin: 30, duration: "10 min" },
    { task: "Final walkthrough", timeOffsetMin: 15, duration: "10 min" },
  ],
};

const BREAKDOWN_TEMPLATES: Record<EventType, { task: string; order: number; duration: string }[]> = {
  service: [
    { task: "Collect leftover bulletins and papers from sanctuary", order: 1, duration: "10 min" },
    { task: "Clean and put away hospitality supplies", order: 2, duration: "15 min" },
    { task: "Power down AV equipment", order: 3, duration: "5 min" },
    { task: "Return stage items to storage", order: 4, duration: "10 min" },
    { task: "Empty all trash bins and replace liners", order: 5, duration: "10 min" },
    { task: "Check and lock all classrooms", order: 6, duration: "5 min" },
    { task: "Final building walkthrough and lockup", order: 7, duration: "10 min" },
  ],
  wedding: [
    { task: "Collect all personal items and gifts for couple", order: 1, duration: "15 min" },
    { task: "Remove decorations from ceremony space", order: 2, duration: "20 min" },
    { task: "Take down reception tables and linens", order: 3, duration: "30 min" },
    { task: "Collect and pack centerpieces", order: 4, duration: "15 min" },
    { task: "Stack chairs and return to storage", order: 5, duration: "20 min" },
    { task: "Clean kitchen and reception area", order: 6, duration: "20 min" },
    { task: "Remove all trash to dumpster", order: 7, duration: "10 min" },
    { task: "Final venue walkthrough with coordinator", order: 8, duration: "10 min" },
  ],
  funeral: [
    { task: "Collect memory table items for family", order: 1, duration: "10 min" },
    { task: "Remove and pack flowers (give to family or donate)", order: 2, duration: "15 min" },
    { task: "Clean reception area — put away food, wash dishes", order: 3, duration: "20 min" },
    { task: "Take down AV equipment and slideshow", order: 4, duration: "10 min" },
    { task: "Remove all tissues and trash from sanctuary", order: 5, duration: "10 min" },
    { task: "Return sanctuary to standard layout", order: 6, duration: "15 min" },
    { task: "Final walkthrough and lockup", order: 7, duration: "5 min" },
  ],
  vbs: [
    { task: "Collect and organize leftover craft supplies", order: 1, duration: "15 min" },
    { task: "Clean snack area — wipe tables, restock supplies", order: 2, duration: "10 min" },
    { task: "Take down game equipment and store", order: 3, duration: "15 min" },
    { task: "Collect name tags and registration materials", order: 4, duration: "5 min" },
    { task: "Pack up AV equipment from assembly area", order: 5, duration: "10 min" },
    { task: "Remove decorations from classrooms and hallways", order: 6, duration: "15 min" },
    { task: "Empty all trash and recycling", order: 7, duration: "10 min" },
    { task: "Lock all classrooms and secure building", order: 8, duration: "5 min" },
  ],
  retreat: [
    { task: "Collect and organize leftover materials", order: 1, duration: "15 min" },
    { task: "Pack up AV and tech equipment", order: 2, duration: "20 min" },
    { task: "Tear down registration area", order: 3, duration: "10 min" },
    { task: "Restore breakout rooms to original layout", order: 4, duration: "15 min" },
    { task: "Collect all trash and recycling", order: 5, duration: "15 min" },
    { task: "Final sweep of all rooms for lost items", order: 6, duration: "15 min" },
    { task: "Return keys and sign out with venue staff", order: 7, duration: "10 min" },
  ],
  potluck: [
    { task: "Sort dishes by owner — label with sticky notes if needed", order: 1, duration: "10 min" },
    { task: "Pack leftover food into containers for owners", order: 2, duration: "15 min" },
    { task: "Wipe down serving tables and chafing dishes", order: 3, duration: "10 min" },
    { task: "Empty and clean drink dispensers", order: 4, duration: "10 min" },
    { task: "Take down signage and category labels", order: 5, duration: "5 min" },
    { task: "Sweep and mop serving/kitchen area", order: 6, duration: "15 min" },
    { task: "Empty all trash and recycling", order: 7, duration: "10 min" },
    { task: "Return furniture to normal layout", order: 8, duration: "10 min" },
  ],
  outreach: [
    { task: "Begin food station teardown — pack leftovers", order: 1, duration: "20 min" },
    { task: "Collect unused giveaways and resource packets", order: 2, duration: "10 min" },
    { task: "Take down kids' activity area", order: 3, duration: "15 min" },
    { task: "Remove all signage and banners", order: 4, duration: "10 min" },
    { task: "Take down canopy tents and fold", order: 5, duration: "20 min" },
    { task: "Load all equipment and supplies into vehicles", order: 6, duration: "30 min" },
    { task: "Site litter sweep — leave area cleaner than found", order: 7, duration: "15 min" },
    { task: "Team debrief and closing prayer at site", order: 8, duration: "10 min" },
  ],
  other: [
    { task: "Remove signage and decorations", order: 1, duration: "10 min" },
    { task: "Pack up AV equipment", order: 2, duration: "10 min" },
    { task: "Return tables and chairs to storage", order: 3, duration: "15 min" },
    { task: "Empty trash and recycling", order: 4, duration: "10 min" },
    { task: "Final walkthrough and lockup", order: 5, duration: "10 min" },
  ],
};

// ---------------------------------------------------------------------------
// Types for content generator
// ---------------------------------------------------------------------------

export interface FacebookPost {
  label: string;
  body: string;
  imageDescription: string;
}

export interface InstagramCaption {
  label: string;
  body: string;
  hashtags: string;
}

export interface EmailTemplate {
  subject: string;
  body: string;
}

export interface ContentResult {
  eventTitle: string;
  eventType: EventType;
  churchName: string;
  eventDateFormatted: string;
  eventTimeFormatted: string;
  eventLocation: string;
  facebookPosts: FacebookPost[];
  instagramCaptions: InstagramCaption[];
  websiteAnnouncement: string;
  emailNewsletter: EmailTemplate;
  bulletinInsert: string;
  pushNotifications: string[];
  smsReminders: string[];
  volunteerEmail: EmailTemplate;
  sponsorRequestLetter: string;
  pressRelease: string;
}

// ---------------------------------------------------------------------------
// Content generator helper
// ---------------------------------------------------------------------------

function formatEventDateTime(event: Event): { dateStr: string; timeStr: string } {
  const start = new Date(event.start_date);
  const dateStr = start.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = start.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return { dateStr, timeStr };
}

const CONTENT_TONES: Record<EventType, { adjective: string; audience: string; mood: string }> = {
  service: { adjective: "uplifting", audience: "church congregation and visitors", mood: "worshipful and welcoming" },
  wedding: { adjective: "joyous", audience: "family and friends of the couple", mood: "celebratory and romantic" },
  funeral: { adjective: "solemn", audience: "family, friends, and community members", mood: "respectful and comforting" },
  vbs: { adjective: "exciting", audience: "children ages 5–12 and their families", mood: "fun and energetic" },
  retreat: { adjective: "refreshing", audience: "church members seeking spiritual renewal", mood: "peaceful and reflective" },
  potluck: { adjective: "delightful", audience: "church family and friends", mood: "warm and communal" },
  outreach: { adjective: "impactful", audience: "local community and neighbors", mood: "generous and inviting" },
  other: { adjective: "special", audience: "church members and guests", mood: "engaging and warm" },
};

// ---------------------------------------------------------------------------
// 8. Content Generator
// ---------------------------------------------------------------------------

export const generateContent = createServerFn({ method: "POST" })
  .validator((d: unknown) => {
    const data = d as { eventId: string };
    if (!data.eventId) throw new Error("Event ID is required");
    return { eventId: data.eventId };
  })
  .handler(async ({ data }) => {
    const { user } = await getAuthState();
    if (!user) throw new Error("Unauthorized");

    const event = await getEvent({ eventId: data.eventId });
    const et = event.event_type as EventType;
    const { dateStr, timeStr } = formatEventDateTime(event);
    const tone = CONTENT_TONES[et] || CONTENT_TONES.other;
    const churchName = user.churchName;
    const location = event.location || `${churchName} Campus`;
    const title = event.title;
    const description = event.description || `Join us for this ${tone.adjective} event!`;

    // --- 1. Facebook Posts ---
    const fbAnnouncement = `📣 Mark your calendars, ${churchName} family!

We're excited to announce "${title}" on ${dateStr} at ${timeStr} at ${location}.

${description}

This is going to be a${tone.adjective.startsWith("e") || tone.adjective.startsWith("i") || tone.adjective.startsWith("o") || tone.adjective.startsWith("u") ? "n" : ""} ${tone.adjective} time for ${tone.audience}. We'd love to see you there!

Invite a friend, share this post, and help us spread the word. 🙌

#${churchName.replace(/\s+/g, "")} #ChurchEvents #${et.charAt(0).toUpperCase() + et.slice(1)}`;

    const fbReminder = `⏰ One week to go!

"${title}" is coming up next ${dateStr.includes(",") ? dateStr.split(",")[0] : dateStr} at ${timeStr}. Have you marked your calendar?

📍 ${location}
🕐 ${timeStr}

We can't wait to gather together for this ${tone.adjective} time. Bring your family, bring a friend, and come expectant!

See you there! ✨`;

    const fbHype = `🚨 Tomorrow's the day!

"${title}" is happening TOMORROW at ${timeStr} at ${location}. 

Here's your checklist:
✅ Set your alarm
✅ Invite a friend
✅ Come ready for a ${tone.adjective} time

We're praying for you and can't wait to see you! 🙏

#${churchName.replace(/\s+/g, "")} #SeeYouThere`;

    const facebookPosts: FacebookPost[] = [
      { label: "Announcement Post", body: fbAnnouncement, imageDescription: `A warm, inviting graphic featuring the ${churchName} logo, event title "${title}", date ${dateStr}, and time ${timeStr}. Use ${tone.mood} colors and imagery.` },
      { label: "1-Week Reminder", body: fbReminder, imageDescription: `A countdown-style image with "7 Days Until ${title}!" in bold text over a photo of ${location} or relevant ${tone.adjective} imagery.` },
      { label: "Day-Before Hype", body: fbHype, imageDescription: `An energetic graphic with "Tomorrow!" in large text, event name, and ${tone.adjective} visuals. Include the church logo and location.` },
    ];

    // --- 2. Instagram Captions ---
    const igCaption1 = `✨ Something ${tone.adjective} is coming! ✨\n\n${churchName} presents "${title}" — and you're invited! 🎉\n\n📅 ${dateStr}\n⏰ ${timeStr}\n📍 ${location}\n\n${description.slice(0, 120)}${description.length > 120 ? "..." : ""}\n\nTag someone you're bringing with you! 👇💛`;

    const igCaption2 = `Can't wait for this! 🙌💫\n\n"${title}" at ${churchName} is going to be a ${tone.adjective} gathering for ${tone.audience}.\n\nJoin us ${dateStr} at ${timeStr}. We've been preparing something special for you!\n\n📍 ${location}\n\nDrop a 🙏 if you're coming!`;

    const igHashtags = `#${churchName.replace(/\s+/g, "")} #ChurchEvents #Faith #Community #${et.charAt(0).toUpperCase() + et.slice(1)} #ChristianLife #ChurchFamily #${tone.adjective.charAt(0).toUpperCase() + tone.adjective.slice(1)}`;

    const instagramCaptions: InstagramCaption[] = [
      { label: "Photo Post", body: igCaption1, hashtags: igHashtags },
      { label: "Story / Reel", body: igCaption2, hashtags: igHashtags },
    ];

    // --- 3. Website Announcement ---
    const websiteAnnouncement = `${title}

${dateStr} | ${timeStr}
${location}

Join us at ${churchName} for "${title}" — a${tone.adjective.startsWith("e") || tone.adjective.startsWith("i") || tone.adjective.startsWith("o") || tone.adjective.startsWith("u") ? "n" : ""} ${tone.adjective} event for ${tone.audience}. ${description} We invite everyone to be part of this special time of fellowship${et === "service" ? " and worship" : ""}${et === "retreat" ? " and renewal" : ""}${et === "outreach" ? " and service" : ""}${et === "vbs" ? " and learning" : ""}. Whether you're a long-time member or visiting for the first time, you are welcome here. We look forward to seeing you!`;

    // --- 4. Email Newsletter ---
    const emailBody = `Dear ${churchName} Family,

We're looking forward to "${title}" coming up on ${dateStr} at ${timeStr}, and we want YOU to be part of it!

${description}

📍 Where: ${location}
🕐 When: ${dateStr} at ${timeStr}

${et === "vbs" ? "Registration is open now — secure your child's spot today!" : et === "wedding" ? "Please RSVP to help us plan for your presence." : et === "retreat" ? "Spots are limited — register soon to reserve your place!" : "Come as you are and bring a friend!"}

This is going to be a${tone.adjective.startsWith("e") || tone.adjective.startsWith("i") || tone.adjective.startsWith("o") || tone.adjective.startsWith("u") ? "n" : ""} ${tone.adjective} time for ${tone.audience}, and we'd love to share it with you.

If you have any questions, feel free to reach out to the church office.

Blessings,
${churchName} Leadership`;

    const emailNewsletter: EmailTemplate = {
      subject: `Join Us: "${title}" — ${dateStr.split(",")[0]}, ${dateStr.split(",").slice(1).join(",").trim()}`,
      body: emailBody,
    };

    // --- 5. Bulletin Insert ---
    const bulletinInsert = `**${title}**\n${dateStr} at ${timeStr} | ${location}\n${description.slice(0, 100)}${description.length > 100 ? "..." : ""}\nAll are welcome! For more info, visit our website or contact the church office.`;

    // --- 6. Push Notifications ---
    const pushNotifications = [
      `📣 "${title}" — ${dateStr.split(",")[0]} at ${timeStr}. ${description.slice(0, 60).trim()}... Join us at ${churchName}!`,
      `⏰ Reminder: "${title}" is coming up! ${dateStr.split(",")[0]} at ${timeStr} — see you at ${churchName}. 🙏`,
    ];

    // --- 7. SMS Reminders ---
    const smsReminders = [
      `${churchName}: "${title}" is ${dateStr.split(",")[0]} at ${timeStr}. ${location}. We can't wait to see you!`,
      `Reminder: "${title}" is tomorrow at ${timeStr}! ${location}. Come expectant — see you soon!`,
    ];

    // --- 8. Volunteer Email ---
    const volunteerEmailBody = `Dear ${churchName} Volunteer Team,

Thank you for your heart to serve! We're preparing for "${title}" on ${dateStr} at ${timeStr}, and we need your help to make this ${tone.adjective} event a success.

We're looking for volunteers in the following areas:
${et === "service" ? "• Greeters\n• Parking team\n• Hospitality\n• Children's ministry\n• Worship team\n• Cleanup crew" : et === "wedding" ? "• Setup & decorations\n• Greeters & ushers\n• Parking coordination\n• Hospitality\n• Cleanup crew" : et === "vbs" ? "• Station leaders (Bible, crafts, games, snacks)\n• Registration & check-in\n• Small group assistants\n• Cleanup & setup crew" : "• Setup & preparation\n• Greeters & welcome team\n• Hospitality\n• Cleanup crew\n• General assistance"}

No matter your skill set, there's a place for you to serve! This is a wonderful opportunity to bless ${tone.audience} and use your gifts.

If you're available to help, please reply to this email or sign up at the connection center by ${new Date(new Date(event.start_date).getTime() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { month: "long", day: "numeric" })}.

Thank you for being the hands and feet of Christ in our church!

In His service,
${churchName} Leadership`;

    const volunteerEmail: EmailTemplate = {
      subject: `Volunteers Needed: "${title}" — ${dateStr.split(",")[0]}, ${dateStr.split(",").slice(1).join(",").trim()}`,
      body: volunteerEmailBody,
    };

    // --- 9. Sponsor Request Letter ---
    const sponsorLetter = `${churchName}
${location}
${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}

Dear Community Partner,

Greetings from ${churchName}! We are reaching out to invite you to partner with us as a sponsor for our upcoming event, "${title}," taking place on ${dateStr} at ${timeStr} at ${location}.

${description}

This event brings together ${tone.audience} for a${tone.adjective.startsWith("e") || tone.adjective.startsWith("i") || tone.adjective.startsWith("o") || tone.adjective.startsWith("u") ? "n" : ""} ${tone.adjective} time of ${et === "outreach" ? "service and outreach to our neighbors" : et === "vbs" ? "fun and learning for the children of our community" : "fellowship and community building"}. Your sponsorship would help us cover costs associated with ${et === "vbs" ? "curriculum materials, snacks, and craft supplies" : et === "outreach" ? "food, resources, and giveaways for community members" : "supplies, refreshments, and event materials"}, ensuring that every attendee has a meaningful experience.

We offer the following sponsorship levels:
• Partner ($100–$249): Name listed in event program
• Supporter ($250–$499): Name in program + social media mention
• Sponsor ($500–$999): All above + logo on event signage
• Presenting Sponsor ($1,000+): All above + recognition from the platform

As a sponsor, your business or organization will be highlighted to our congregation and guests, demonstrating your commitment to our shared community.

We would be honored to have you partner with us. If you're interested or would like to discuss further, please contact us at your earliest convenience.

With gratitude,
${churchName} Leadership`;

    // --- 10. Press Release ---
    const pressRelease = `FOR IMMEDIATE RELEASE

${churchName} Announces "${title}"

${location} — ${churchName} is pleased to announce "${title}," a${tone.adjective.startsWith("e") || tone.adjective.startsWith("i") || tone.adjective.startsWith("o") || tone.adjective.startsWith("u") ? "n" : ""} ${tone.adjective} event for ${tone.audience}, taking place on ${dateStr} at ${timeStr} at ${location}.

${description}

The event ${et === "outreach" ? "is open to the public and aims to serve local families with food, resources, and community connection" : et === "vbs" ? "is open to children ages 5–12 and combines fun activities with Bible-based learning" : et === "service" ? "is open to the public and features worship, a message from our pastor, and fellowship time afterward" : "welcomes all members of the community to join in this time of fellowship and connection"}.

${churchName} has been serving the ${location.split(",")[0] || location} community${et === "outreach" ? ", demonstrating Christ's love through word and deed" : ""}. For more information about "${title}" or ${churchName}, please visit our website or contact the church office.

###\n\nAbout ${churchName}:\n${churchName} is a community of faith committed to ${et === "outreach" ? "loving and serving our neighbors" : "worshiping God and loving people"}. We welcome everyone to join us as we grow together in faith, hope, and love.\n\nContact:\n${churchName}\n${location}\nPhone: [Church Office Phone]\nEmail: [Church Office Email]\nWebsite: [Church Website]`;

    const result: ContentResult = {
      eventTitle: `${title} — Communications Kit`,
      eventType: et,
      churchName,
      eventDateFormatted: dateStr,
      eventTimeFormatted: timeStr,
      eventLocation: location,
      facebookPosts,
      instagramCaptions,
      websiteAnnouncement,
      emailNewsletter,
      bulletinInsert,
      pushNotifications,
      smsReminders,
      volunteerEmail,
      sponsorRequestLetter: sponsorLetter,
      pressRelease,
    };

    return result;
  });

// ---------------------------------------------------------------------------

export const generateSetupBreakdown = createServerFn({ method: "POST" })
  .validator((d: unknown) => {
    const data = d as { eventId: string };
    if (!data.eventId) throw new Error("Event ID is required");
    return { eventId: data.eventId };
  })
  .handler(async ({ data }) => {
    const { user } = await getAuthState();
    if (!user) throw new Error("Unauthorized");

    const event = await getEvent({ eventId: data.eventId });
    const et = event.event_type as EventType;
    const setupTemplate = SETUP_TEMPLATES[et] || SETUP_TEMPLATES.other;
    const breakdownTemplate = BREAKDOWN_TEMPLATES[et] || BREAKDOWN_TEMPLATES.other;

    const startDate = new Date(event.start_date);

    const setupTasks: SetupBreakdownTask[] = setupTemplate.map((t, i) => {
      const taskTime = new Date(startDate.getTime() - t.timeOffsetMin * 60 * 1000);
      const timeStr = taskTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      return {
        id: `setup-${i}`,
        task: t.task,
        time: timeStr,
        duration: t.duration,
        phase: "setup" as const,
      };
    });

    const breakdownTasks: SetupBreakdownTask[] = breakdownTemplate
      .sort((a, b) => a.order - b.order)
      .map((t, i) => ({
        id: `breakdown-${i}`,
        task: t.task,
        time: "",
        duration: t.duration,
        phase: "breakdown" as const,
      }));

    return {
      eventTitle: `${event.title} — Setup & Breakdown`,
      eventType: et,
      setupTasks,
      breakdownTasks,
    };
  });
