import { createServerFn } from "@tanstack/react-start";
import { getAuthState } from "~/auth";
import { sql } from "~/db";
import type { Event } from "~/events";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TaskStatus = "pending" | "in-progress" | "done" | "skipped";

export interface CommandTask {
  id: string;
  section: string;
  label: string;
  assignedTo?: string;
  time?: string;        // e.g. "8:00 AM"
  notes?: string;
  status: TaskStatus;
}

export interface RunSheetEntry {
  time: string;
  activity: string;
  location?: string;
  owner?: string;
  duration?: string;    // e.g. "15 min"
  notes?: string;
}

export interface CommandCenterState {
  eventName: string;
  eventDate: string;
  eventType: string;
  sections: CommandSection[];
  runSheet: RunSheetEntry[];
  emergencyContacts: EmergencyContact[];
  volunteerRoster: VolunteerCheckItem[];
  roomStatuses: RoomStatusItem[];
  resourceStatuses: ResourceStatusItem[];
  generatedAt: string;
}

export interface CommandSection {
  name: string;
  icon: string;        // emoji
  tasks: CommandTask[];
}

export interface EmergencyContact {
  role: string;
  name: string;
  phone: string;
}

export interface VolunteerCheckItem {
  id: string;
  name: string;
  role: string;
  checkedIn: boolean;
}

export interface RoomStatusItem {
  id: string;
  name: string;
  status: "ready" | "needs-setup" | "in-use";
}

export interface ResourceStatusItem {
  id: string;
  name: string;
  status: "available" | "deployed" | "missing";
}

// ---------------------------------------------------------------------------
// Generator helpers
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function buildDefaultSections(event: Event): CommandSection[] {
  const isOutdoor = event.location?.toLowerCase().includes("outdoor") ||
    event.location?.toLowerCase().includes("park") ||
    event.location?.toLowerCase().includes("garden");

  const base: CommandSection[] = [
    {
      name: "Setup & Arrival",
      icon: "🔧",
      tasks: [
        { id: "unlock", section: "Setup & Arrival", label: "Unlock building / venue", status: "pending", time: "2 hrs before" },
        { id: "lights-hvac", section: "Setup & Arrival", label: "Turn on lights & HVAC", status: "pending", time: "2 hrs before" },
        { id: "signage", section: "Setup & Arrival", label: "Place directional signage outside", status: "pending", time: "1.5 hrs before", assignedTo: "Greeter team" },
        { id: "parking-arrows", section: "Setup & Arrival", label: "Set up parking cones / arrows", status: "pending", time: "1.5 hrs before", assignedTo: "Parking team" },
        { id: "walkthrough", section: "Setup & Arrival", label: "Venue walkthrough — check for hazards", status: "pending", time: "1.5 hrs before" },
      ],
    },
    {
      name: "AV & Sound Check",
      icon: "🎤",
      tasks: [
        { id: "sound-system", section: "AV & Sound Check", label: "Power on sound system, test all mics", status: "pending", time: "1.5 hrs before", assignedTo: "Sound tech" },
        { id: "projector", section: "AV & Sound Check", label: "Test projector / screens — confirm slides loaded", status: "pending", time: "1.5 hrs before", assignedTo: "Media team" },
        { id: "stage-lights", section: "AV & Sound Check", label: "Set stage lighting levels", status: "pending", time: "1 hr before", assignedTo: "Media team" },
        { id: "livestream", section: "AV & Sound Check", label: "Confirm livestream connection (if applicable)", status: "pending", time: "45 min before", assignedTo: "Media team" },
        { id: "backup-plan", section: "AV & Sound Check", label: "Have backup laptop / phone ready for slides", status: "pending", time: "30 min before" },
      ],
    },
    {
      name: "Volunteer Check-In",
      icon: "👋",
      tasks: [
        { id: "volunteer-station", section: "Volunteer Check-In", label: "Open volunteer check-in station", status: "pending", time: "1 hr before" },
        { id: "name-tags", section: "Volunteer Check-In", label: "Distribute name tags / lanyards", status: "pending", time: "1 hr before" },
        { id: "volunteer-briefing", section: "Volunteer Check-In", label: "Hold volunteer briefing / prayer", status: "pending", time: "45 min before" },
        { id: "assign-posts", section: "Volunteer Check-In", label: "Confirm all volunteers at their posts", status: "pending", time: "30 min before" },
        { id: "radio-check", section: "Volunteer Check-In", label: "Test radios / comms channel", status: "pending", time: "30 min before", assignedTo: "Security" },
      ],
    },
    {
      name: "Hospitality & Rooms",
      icon: "🏠",
      tasks: [
        { id: "nursery-ready", section: "Hospitality & Rooms", label: "Nursery — check toys, changing station stocked", status: "pending", time: "45 min before", assignedTo: "Children's Ministry" },
        { id: "kids-classroom", section: "Hospitality & Rooms", label: "Children's classrooms — materials ready", status: "pending", time: "45 min before", assignedTo: "Children's Ministry" },
        { id: "welcome-table", section: "Hospitality & Rooms", label: "Welcome table — bulletins, connect cards, pens", status: "pending", time: "45 min before", assignedTo: "Greeter team" },
        { id: "coffee-station", section: "Hospitality & Rooms", label: "Coffee / refreshment station set up", status: "pending", time: "45 min before", assignedTo: "Hospitality" },
        { id: "restrooms-check", section: "Hospitality & Rooms", label: "Restrooms — stocked, clean, trash emptied", status: "pending", time: "45 min before", assignedTo: "Cleanup" },
        { id: "prayer-room", section: "Hospitality & Rooms", label: "Prayer room / quiet room ready", status: "pending", time: "30 min before" },
      ],
    },
    {
      name: "Pre-Service Final Checks",
      icon: "✅",
      tasks: [
        { id: "doors-open", section: "Pre-Service Final Checks", label: "Open doors to attendees", status: "pending", time: "30 min before" },
        { id: "greeters-ready", section: "Pre-Service Final Checks", label: "Greeters at all entrances", status: "pending", time: "30 min before", assignedTo: "Greeter team" },
        { id: "music-ready", section: "Pre-Service Final Checks", label: "Worship team in place, instruments tuned", status: "pending", time: "15 min before", assignedTo: "Worship team" },
        { id: "speaker-ready", section: "Pre-Service Final Checks", label: "Speaker / pastor mic check complete", status: "pending", time: "10 min before" },
        { id: "countdown-start", section: "Pre-Service Final Checks", label: "Start pre-service countdown loop", status: "pending", time: "5 min before", assignedTo: "Media team" },
        { id: "head-count", section: "Pre-Service Final Checks", label: "Quick head count estimate", status: "pending", time: "5 min before" },
      ],
    },
    {
      name: "During Event",
      icon: "🎯",
      tasks: [
        { id: "service-start", section: "During Event", label: "Service / event begins", status: "pending", time: "Start time" },
        { id: "late-seating", section: "During Event", label: "Direct late arrivals to available seats", status: "pending", assignedTo: "Greeter team" },
        { id: "offering", section: "During Event", label: "Receive offering / donation collection", status: "pending", assignedTo: "Ushers" },
        { id: "kid-checkout", section: "During Event", label: "Prepare children's ministry for parent pickup", status: "pending", time: "15 min before end", assignedTo: "Children's Ministry" },
        { id: "next-steps", section: "During Event", label: "Have next-steps / connection team ready in lobby", status: "pending", time: "10 min before end", assignedTo: "Hospitality" },
      ],
    },
    {
      name: "Post-Event Teardown",
      icon: "🧹",
      tasks: [
        { id: "thanks-announce", section: "Post-Event Teardown", label: "Thank volunteers publicly / announcement", status: "pending" },
        { id: "lobby-cleanup", section: "Post-Event Teardown", label: "Lobby — clear welcome table, return items", status: "pending", assignedTo: "Greeter team" },
        { id: "sanctuary-cleanup", section: "Post-Event Teardown", label: "Sanctuary — pick up bulletins, straighten chairs", status: "pending", assignedTo: "Cleanup" },
        { id: "av-shutdown", section: "Post-Event Teardown", label: "Shut down AV equipment, secure mics", status: "pending", assignedTo: "Sound tech" },
        { id: "trash-run", section: "Post-Event Teardown", label: "Empty all trash bins, replace liners", status: "pending", assignedTo: "Cleanup" },
        { id: "kitchen-cleanup", section: "Post-Event Teardown", label: "Kitchen / refreshment area cleaned", status: "pending", assignedTo: "Hospitality" },
        { id: "restrooms-final", section: "Post-Event Teardown", label: "Final restroom check", status: "pending", assignedTo: "Cleanup" },
        { id: "lock-up", section: "Post-Event Teardown", label: "Lock all doors, set alarm", status: "pending", assignedTo: "Security" },
        { id: "thank-volunteers", section: "Post-Event Teardown", label: "Send thank-you message to volunteers", status: "pending", time: "Within 24 hrs" },
      ],
    },
  ];

  // Outdoor-specific tasks
  if (isOutdoor) {
    const setup = base.find((s) => s.name === "Setup & Arrival")!;
    setup.tasks.splice(2, 0,
      { id: "tent-check", section: "Setup & Arrival", label: "Set up tents / canopies", status: "pending", time: "3 hrs before", assignedTo: "Setup crew" },
      { id: "chair-setup", section: "Setup & Arrival", label: "Set up outdoor chairs / seating", status: "pending", time: "2 hrs before", assignedTo: "Setup crew" },
      { id: "weather-check", section: "Setup & Arrival", label: "Check weather radar — rain plan ready?", status: "pending", time: "2 hrs before" },
    );
    const during = base.find((s) => s.name === "During Event")!;
    during.tasks.splice(2, 0,
      { id: "weather-monitor", section: "During Event", label: "Monitor weather — trigger rain plan if needed", status: "pending", assignedTo: "Event lead" },
    );
  }

  return base;
}

function buildRunSheet(event: Event): RunSheetEntry[] {
  const base: RunSheetEntry[] = [];

  // Morning setup
  base.push({ time: "T-2:00", activity: "Doors unlocked, team arrival", owner: "Event lead" });
  base.push({ time: "T-1:45", activity: "AV team setup begins", owner: "Sound tech", location: "Sanctuary" });
  base.push({ time: "T-1:30", activity: "Volunteer check-in opens", owner: "Volunteer coordinator", location: "Lobby" });
  base.push({ time: "T-1:00", activity: "Hospitality setup — coffee, welcome table", owner: "Hospitality lead", location: "Lobby" });
  base.push({ time: "T-0:45", activity: "Volunteer briefing & prayer", owner: "Event lead", location: "Green room" });
  base.push({ time: "T-0:30", activity: "Doors open to attendees", owner: "Greeter team", location: "Entrances" });
  base.push({ time: "T-0:15", activity: "Worship team sound check", owner: "Worship leader", location: "Stage" });
  base.push({ time: "T-0:05", activity: "Pre-service countdown begins", owner: "Media team" });
  base.push({ time: "T-0:00", activity: "Event begins — welcome & announcements", owner: "Pastor / Host" });

  // Main event activities (generic)
  base.push({ time: "T+0:05", activity: "Opening prayer", owner: "Pastor" });
  base.push({ time: "T+0:10", activity: "Worship set begins", owner: "Worship team", duration: "20-25 min" });
  base.push({ time: "T+0:35", activity: "Message / sermon", owner: "Pastor", duration: "30-40 min" });
  base.push({ time: "T+1:10", activity: "Response time / altar call", owner: "Pastor" });
  base.push({ time: "T+1:20", activity: "Announcements & benediction", owner: "Pastor" });
  base.push({ time: "T+1:30", activity: "Event concludes — fellowship begins", owner: "All" });

  // Teardown
  base.push({ time: "T+1:35", activity: "AV shutdown", owner: "Sound tech", duration: "15 min" });
  base.push({ time: "T+1:35", activity: "Lobby & sanctuary cleanup begins", owner: "Cleanup team", duration: "30 min" });
  base.push({ time: "T+2:00", activity: "Final walkthrough, lock-up", owner: "Event lead" });

  return base;
}

function buildEmergencyContacts(): EmergencyContact[] {
  return [
    { role: "Event Lead", name: "TBD — check roster", phone: "" },
    { role: "Security / Safety Lead", name: "TBD — check roster", phone: "" },
    { role: "Medical / First Aid", name: "TBD — check roster", phone: "" },
    { role: "Children's Ministry Lead", name: "TBD — check roster", phone: "" },
    { role: "Venue / Facility Manager", name: "TBD — check roster", phone: "" },
    { role: "Local Emergency", name: "", phone: "911" },
  ];
}

// ---------------------------------------------------------------------------
// Server function
// ---------------------------------------------------------------------------

export const getCommandCenter = createServerFn({ method: "POST" })
  .validator((d: unknown) => {
    const data = d as { eventId: string };
    if (!data.eventId) throw new Error("Event ID is required");
    return { eventId: data.eventId };
  })
  .handler(async ({ data }) => {
    const { user } = await getAuthState();
    if (!user) throw new Error("Unauthorized");

    // Fetch the event
    const rows = await sql`
      SELECT id, title, event_date, event_type, location, church_id
      FROM events
      WHERE id = ${data.eventId} AND church_id = ${user.church_id}
    `;
    if (rows.length === 0) throw new Error("Event not found");
    const event = rows[0] as Event;

    // Fetch volunteers assigned to this event
    const volunteerRows = await sql`
      SELECT v.id, v.name, ev.role
      FROM volunteer_roles vr
      JOIN event_volunteers ev ON ev.role_id = vr.id
      JOIN volunteers v ON v.id = ev.volunteer_id
      WHERE ev.event_id = ${data.eventId}
    `;

    const volunteerRoster: VolunteerCheckItem[] = volunteerRows.map((r: any) => ({
      id: r.id,
      name: r.name,
      role: r.role,
      checkedIn: false,
    }));

    // Fetch rooms assigned to this event
    const roomRows = await sql`
      SELECT r.id, r.name
      FROM rooms r
      JOIN event_rooms er ON er.room_id = r.id
      WHERE er.event_id = ${data.eventId}
    `;

    const roomStatuses: RoomStatusItem[] = roomRows.map((r: any) => ({
      id: r.id,
      name: r.name,
      status: "needs-setup" as const,
    }));

    // Fetch resources assigned to this event
    const resourceRows = await sql`
      SELECT res.id, res.name
      FROM resources res
      JOIN event_resources eres ON eres.resource_id = res.id
      WHERE eres.event_id = ${data.eventId}
    `;

    const resourceStatuses: ResourceStatusItem[] = resourceRows.map((r: any) => ({
      id: r.id,
      name: r.name,
      status: "available" as const,
    }));

    const state: CommandCenterState = {
      eventName: event.title,
      eventDate: event.event_date,
      eventType: event.event_type,
      sections: buildDefaultSections(event),
      runSheet: buildRunSheet(event),
      emergencyContacts: buildEmergencyContacts(),
      volunteerRoster,
      roomStatuses,
      resourceStatuses,
      generatedAt: new Date().toISOString(),
    };

    return state;
  });