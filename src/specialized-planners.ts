// ---------------------------------------------------------------------------
// Specialized Event Planner Catalog
// ---------------------------------------------------------------------------
// 12 church event types, each with tailored timeline, checklist, budget
// allocation, and AI prompts. Rule-based today; the `prompts` arrays are the
// exact inputs an LLM provider would receive when a key becomes available.
// ---------------------------------------------------------------------------

export interface PlannerTimelineItem {
  time: string;
  activity: string;
  owner?: string;
}

export interface PlannerChecklistItem {
  label: string;
  category: string; // Setup, Promotion, Day-of, Follow-up
}

export interface PlannerBudgetItem {
  category: string;
  pct: number;
  note?: string;
}

export interface PlannerDefinition {
  type: string;
  title: string;
  icon: string;
  tagline: string;
  description: string;
  timeline: PlannerTimelineItem[];
  checklist: PlannerChecklistItem[];
  budget: PlannerBudgetItem[];
  prompts: string[];
}

export const PLANNERS: Record<string, PlannerDefinition> = {
  // -------------------------------------------------------------------------
  // VBS — Vacation Bible School
  // -------------------------------------------------------------------------
  vbs: {
    type: "vbs",
    title: "Vacation Bible School (VBS)",
    icon: "⛺",
    tagline: "A high-energy, multi-day kids' outreach — the biggest volunteer lift of the year.",
    description:
      "VBS is a 3–5 day program for children, often the church's largest outreach event. It requires heavy volunteer coordination across teaching, crafts, snacks, games, music, and security — plus strict child-safety protocols.",
    timeline: [
      { time: "3 months out", activity: "Recruit VBS director & department leads (teaching, crafts, games, snacks, music, security)", owner: "Children's Pastor" },
      { time: "2 months out", activity: "Order curriculum & supplies; confirm theme", owner: "VBS Director" },
      { time: "6 weeks out", activity: "Open registration; launch background checks for all volunteers", owner: "Admin" },
      { time: "4 weeks out", activity: "Recruit volunteer team — target 1 adult per 5 children", owner: "VBS Director" },
      { time: "2 weeks out", activity: "Volunteer training night — safety protocols, room assignments, schedule walkthrough", owner: "VBS Director" },
      { time: "1 week out", activity: "Decorate sanctuary & classrooms; assemble craft/game supply kits", owner: "All leads" },
      { time: "Day 1", activity: "Early check-in opens 30 min before start; roving security in place", owner: "Security" },
      { time: "Final day", activity: "Family closing program & ice cream social", owner: "All" },
    ],
    checklist: [
      { label: "Confirm liability waivers & photo release forms for every child", category: "Setup" },
      { label: "Complete background checks on 100% of volunteers", category: "Setup" },
      { label: "Two-deep rule: no adult alone with a child, ever", category: "Setup" },
      { label: "Secure check-in/check-out system with matching tags", category: "Day-of" },
      { label: "First aid kit & AED location posted; designate first-responder", category: "Day-of" },
      { label: "Allergy list distributed to snack team", category: "Day-of" },
      { label: "Craft supplies pre-sorted into per-class kits", category: "Setup" },
      { label: "Games rotation schedule with water breaks", category: "Day-of" },
      { label: "Music/AV checked with songs loaded", category: "Setup" },
      { label: "Lost-child protocol printed & posted at check-in", category: "Day-of" },
      { label: "Follow-up call to every visiting family within 48 hrs", category: "Follow-up" },
      { label: "Thank-you notes to all VBS volunteers", category: "Follow-up" },
    ],
    budget: [
      { category: "Curriculum & supplies", pct: 30, note: "Teacher/leader kits, student books" },
      { category: "Crafts & materials", pct: 20 },
      { category: "Snacks & drinks", pct: 15 },
      { category: "Decorations", pct: 10 },
      { category: "Promotion & outreach", pct: 10 },
      { category: "T-shirts / volunteer gear", pct: 8 },
      { category: "Insurance & safety", pct: 7 },
    ],
    prompts: [
      "Write a VBS volunteer recruitment announcement for Sunday morning, emphasizing safety and the joy of serving kids.",
      "Draft a parent FAQ covering check-in/check-out, allergies, and what to bring.",
      "Create a 5-day social media countdown for VBS week.",
      "Write a thank-you email to VBS volunteers highlighting the number of kids reached.",
      "Generate a follow-up postcard to families who attended for the first time.",
      "Summarize safety protocols in a one-page volunteer handbook.",
    ],
  },

  // -------------------------------------------------------------------------
  // Easter
  // -------------------------------------------------------------------------
  easter: {
    type: "easter",
    title: "Easter Sunday",
    icon: "🌅",
    tagline: "Your highest-attendance service of the year — plan for the overflow.",
    description:
      "Easter brings your biggest crowd and many first-time guests. The focus is on hospitality, extra service times, parking overflow, children's programming, and a memorable, guest-friendly experience.",
    timeline: [
      { time: "8 weeks out", activity: "Lock service times & confirm guest speaker/message", owner: "Senior Pastor" },
      { time: "6 weeks out", activity: "Launch invite cards & social campaign", owner: "Comms" },
      { time: "4 weeks out", activity: "Recruit extra greeters, parking, and children's volunteers for all services", owner: "Volunteer Director" },
      { time: "2 weeks out", activity: "Confirm nursery & kids classroom capacity; overflow plan", owner: "Children's Director" },
      { time: "1 week out", activity: "Bulletin printing, worship set finalized, tech rehearsal", owner: "Media/Worship" },
      { time: "Easter Eve", activity: "Full sanctuary setup, extra seating staged, welcome packets assembled", owner: "All" },
      { time: "Easter morning", activity: "Early volunteer huddle & prayer 45 min before first service", owner: "Pastor" },
      { time: "Post-service", activity: "Connection cards collected; first-time guest follow-up begins", owner: "Hospitality" },
    ],
    checklist: [
      { label: "Add extra service time(s) if attendance history warrants", category: "Setup" },
      { label: "Overflow seating & overflow room with live feed", category: "Setup" },
      { label: "Parking team briefing — off-site overflow lot & shuttle if needed", category: "Day-of" },
      { label: "Welcome packets for first-time guests", category: "Setup" },
      { label: "Nursery & kids classrooms fully staffed at double ratio", category: "Day-of" },
      { label: "Bulletin with clear 'next steps' for guests", category: "Setup" },
      { label: "Sound/video rehearsal including livestream test", category: "Setup" },
      { label: "Extra communion elements prepared", category: "Day-of" },
      { label: "Greeters at every entrance & in parking lot", category: "Day-of" },
      { label: "Guest follow-up email/text within 24 hrs", category: "Follow-up" },
      { label: "Debrief meeting to capture what to scale next year", category: "Follow-up" },
    ],
    budget: [
      { category: "Promotion & invite cards", pct: 20 },
      { category: "Hospitality / welcome packets", pct: 15 },
      { category: "Decorations & flowers", pct: 20 },
      { category: "Children's supplies", pct: 15 },
      { category: "Additional staffing / security", pct: 15 },
      { category: "Tech & livestream", pct: 10 },
      { category: "Misc / contingency", pct: 5 },
    ],
    prompts: [
      "Write an Easter invitation postcard for first-time guests.",
      "Draft a 3-week social media campaign leading to Easter Sunday.",
      "Create talking points for volunteers on welcoming overflow crowds.",
      "Write a follow-up email to first-time Easter guests.",
      "Generate a parking & traffic plan for Easter morning.",
      "Summarize a post-Easter debrief agenda.",
    ],
  },

  // -------------------------------------------------------------------------
  // Christmas
  // -------------------------------------------------------------------------
  christmas: {
    type: "christmas",
    title: "Christmas Service / Concert",
    icon: "🎄",
    tagline: "A warm, musical celebration that draws guests at the most relational time of year.",
    description:
      "Christmas services and concerts emphasize music, candlelight, and warmth. Coordinate worship, choir, lighting, refreshments, and guest follow-up for a season of high emotional receptivity.",
    timeline: [
      { time: "10 weeks out", activity: "Choose service format (concert, candlelight, pageant) & date(s)", owner: "Worship Pastor" },
      { time: "8 weeks out", activity: "Choir & music rehearsals begin; secure musicians", owner: "Worship Pastor" },
      { time: "6 weeks out", activity: "Launch advent & Christmas service promotion", owner: "Comms" },
      { time: "4 weeks out", activity: "Order candles, programs, decorations", owner: "Events Team" },
      { time: "2 weeks out", activity: "Full tech run-through with lighting & sound", owner: "Media" },
      { time: "1 week out", activity: "Decorations complete; refreshment plan finalized", owner: "Hospitality" },
      { time: "Service night", activity: "Warm welcome, candle-lighting segment, post-service refreshments", owner: "All" },
      { time: "Post-service", activity: "Guest follow-up & volunteer thanks", owner: "Pastor" },
    ],
    checklist: [
      { label: "Confirm candle supply & safe candle-lighting plan (drip guards, extinguishing)", category: "Day-of" },
      { label: "Choir & musicians fully rehearsed with music stands & lighting", category: "Setup" },
      { label: "Programs printed with song lyrics & welcome message", category: "Setup" },
      { label: "Refreshments — cookies, cider/hot cocoa, allergen labels", category: "Day-of" },
      { label: "Nursery available for young children", category: "Day-of" },
      { label: "Stage & nativity decorations complete", category: "Setup" },
      { label: "Photo-friendly welcome area for family pictures", category: "Day-of" },
      { label: "Guest connection cards in every program", category: "Setup" },
      { label: "Follow-up to guests within 24-48 hrs", category: "Follow-up" },
      { label: "Thank musicians & tech volunteers", category: "Follow-up" },
    ],
    budget: [
      { category: "Music & choir expenses", pct: 25 },
      { category: "Decorations & candles", pct: 20 },
      { category: "Refreshments", pct: 15 },
      { category: "Programs & printing", pct: 10 },
      { category: "Promotion", pct: 15 },
      { category: "Tech & lighting", pct: 10 },
      { category: "Misc / contingency", pct: 5 },
    ],
    prompts: [
      "Write a Christmas Eve candlelight service invitation.",
      "Draft the candle-lighting moment narration.",
      "Create a social media series for the 12 days leading to the service.",
      "Write a thank-you to the choir and musicians.",
      "Generate guest follow-up copy with a warm, non-pushy tone.",
      "Draft a program welcome message for the Christmas service.",
    ],
  },

  // -------------------------------------------------------------------------
  // Women's Conference
  // -------------------------------------------------------------------------
  womens_conference: {
    type: "womens_conference",
    title: "Women's Conference",
    icon: "💐",
    tagline: "A retreat-style gathering for connection, worship, and spiritual renewal.",
    description:
      "A women's conference is typically a half-day to full-day event with keynote speakers, breakout sessions, worship, meals, and small-group connection. Focus on hospitality, registration, and thoughtful touches.",
    timeline: [
      { time: "6 months out", activity: "Book keynote speaker & venue; set theme", owner: "Conference Lead" },
      { time: "4 months out", activity: "Open registration with early-bird pricing", owner: "Admin" },
      { time: "3 months out", activity: "Recruit breakout session leaders & worship team", owner: "Conference Lead" },
      { time: "2 months out", activity: "Order decor, swag bags, and materials", owner: "Events Team" },
      { time: "1 month out", activity: "Finalize schedule, seating, and meal plan", owner: "Conference Lead" },
      { time: "1 week out", activity: "Assemble registration packets & name tags", owner: "Admin" },
      { time: "Conference day", activity: "Registration opens; host team greets; sessions run", owner: "All" },
      { time: "Post-event", activity: "Send thank-you & survey; follow up with new attendees", owner: "Conference Lead" },
    ],
    checklist: [
      { label: "Speaker contract signed with travel & AV requirements", category: "Setup" },
      { label: "Online registration + on-site check-in with name tags", category: "Setup" },
      { label: "Breakout session rooms assigned with signs", category: "Day-of" },
      { label: "Meals/snacks arranged with dietary options", category: "Setup" },
      { label: "Welcome gift or swag bag assembled", category: "Setup" },
      { label: "Worship team & tech rehearsal scheduled", category: "Setup" },
      { label: "Host team trained to welcome & connect", category: "Day-of" },
      { label: "Book table / resource table set up", category: "Day-of" },
      { label: "Prayer team available for ministry time", category: "Day-of" },
      { label: "Feedback survey sent within 48 hrs", category: "Follow-up" },
      { label: "Thank-you to speakers & volunteers", category: "Follow-up" },
    ],
    budget: [
      { category: "Speaker honorarium & travel", pct: 30 },
      { category: "Venue / room rental", pct: 15 },
      { category: "Catering & refreshments", pct: 25 },
      { category: "Decor & ambiance", pct: 10 },
      { category: "Promotion & registration", pct: 10 },
      { category: "Swag & materials", pct: 10 },
    ],
    prompts: [
      "Write a warm invitation email for the women's conference.",
      "Draft the conference theme tagline and description.",
      "Create a social media campaign to drive registrations.",
      "Write breakout session descriptions for the program.",
      "Generate a thank-you email to attendees with a survey link.",
      "Draft a speaker introduction for the keynote.",
    ],
  },

  // -------------------------------------------------------------------------
  // Men's Conference
  // -------------------------------------------------------------------------
  mens_conference: {
    type: "mens_conference",
    title: "Men's Conference",
    icon: "🛠️",
    tagline: "Brotherhood, challenge, and honest conversation over food and fellowship.",
    description:
      "A men's conference centers on keynote talks, breakout workshops, food (often breakfast or BBQ), and activities that foster connection. Keep it action-oriented and practical.",
    timeline: [
      { time: "6 months out", activity: "Book speaker & venue; set theme", owner: "Men's Ministry Lead" },
      { time: "4 months out", activity: "Open registration; recruit breakout leaders", owner: "Admin" },
      { time: "3 months out", activity: "Plan meals (breakfast/BBQ) & activity/competition", owner: "Men's Ministry Lead" },
      { time: "2 months out", activity: "Order swag, materials, and AV", owner: "Events Team" },
      { time: "1 month out", activity: "Finalize schedule & small-group discussion questions", owner: "Men's Ministry Lead" },
      { time: "1 week out", activity: "Confirm food quantities & setup crew", owner: "Events Team" },
      { time: "Conference day", activity: "Doors open, breakfast served, sessions & activities", owner: "All" },
      { time: "Post-event", activity: "Follow-up on next-steps & discipleship groups", owner: "Men's Ministry Lead" },
    ],
    checklist: [
      { label: "Speaker contract with AV & travel needs confirmed", category: "Setup" },
      { label: "Registration + walk-in check-in", category: "Setup" },
      { label: "Breakfast/BBQ catering with generous portions", category: "Day-of" },
      { label: "Breakout rooms & discussion guides prepared", category: "Setup" },
      { label: "Activity/competition planned with equipment", category: "Day-of" },
      { label: "Audio/video tested for speaker & worship", category: "Setup" },
      { label: "Small-group discussion leaders briefed", category: "Day-of" },
      { label: "Next-steps table (discipleship groups, serving)", category: "Day-of" },
      { label: "Prayer team available", category: "Day-of" },
      { label: "Thank-you & follow-up to attendees", category: "Follow-up" },
    ],
    budget: [
      { category: "Speaker honorarium & travel", pct: 30 },
      { category: "Food & catering", pct: 30 },
      { category: "Venue / room rental", pct: 15 },
      { category: "Promotion", pct: 10 },
      { category: "Swag & materials", pct: 10 },
      { category: "Activities & equipment", pct: 5 },
    ],
    prompts: [
      "Write a direct, no-nonsense invitation email for the men's conference.",
      "Draft the conference theme and a challenge statement.",
      "Create a social media campaign targeting men to register.",
      "Write small-group discussion questions for breakouts.",
      "Generate a follow-up email with next-steps and discipleship invitations.",
      "Draft a speaker introduction with a tone of brotherhood.",
    ],
  },

  // -------------------------------------------------------------------------
  // Youth Retreat
  // -------------------------------------------------------------------------
  youth_retreat: {
    type: "youth_retreat",
    title: "Youth Retreat",
    icon: "🏕️",
    tagline: "A weekend away for students — spiritual growth with intentional safety and fun.",
    description:
      "A youth retreat is an overnight or weekend event for middle/high school students. It requires careful chaperone ratios, permission slips, medical info, transportation, meals, and a balance of teaching, worship, and recreation.",
    timeline: [
      { time: "4 months out", activity: "Book retreat venue & speaker; set theme", owner: "Youth Pastor" },
      { time: "3 months out", activity: "Open registration; distribute permission slips & medical forms", owner: "Admin" },
      { time: "2 months out", activity: "Recruit adult chaperones (1:5 ratio) & complete background checks", owner: "Youth Pastor" },
      { time: "1 month out", activity: "Plan meals, transportation, and recreation", owner: "Youth Pastor" },
      { time: "2 weeks out", activity: "Chaperone training & packing list sent to parents", owner: "Youth Pastor" },
      { time: "1 week out", activity: "Confirm bus/van rentals, first aid, and emergency contacts", owner: "Admin" },
      { time: "Departure day", activity: "Check-in, meds collected, headcount, prayer before departure", owner: "All" },
      { time: "Return day", activity: "Parent pickup with sign-out; debrief", owner: "All" },
    ],
    checklist: [
      { label: "Signed permission slips & medical forms for 100% of students", category: "Setup" },
      { label: "Background checks complete on all chaperones", category: "Setup" },
      { label: "Chaperone-to-student ratio 1:5 minimum", category: "Setup" },
      { label: "Medication collection & distribution plan", category: "Day-of" },
      { label: "Transportation confirmed with licensed drivers", category: "Setup" },
      { label: "First aid kit, AED, and emergency contacts accessible", category: "Day-of" },
      { label: "Meal plan with allergies accounted for", category: "Setup" },
      { label: "Recreation equipment & weather backup plan", category: "Day-of" },
      { label: "Headcount at every transition", category: "Day-of" },
      { label: "Parent communication (text updates) during retreat", category: "Day-of" },
      { label: "Post-retreat follow-up with students & parents", category: "Follow-up" },
      { label: "Thank-you to chaperones & speaker", category: "Follow-up" },
    ],
    budget: [
      { category: "Venue / lodging", pct: 30 },
      { category: "Transportation", pct: 15 },
      { category: "Food & meals", pct: 25 },
      { category: "Speaker honorarium", pct: 15 },
      { category: "Recreation & activities", pct: 10 },
      { category: "Scholarships / misc", pct: 5 },
    ],
    prompts: [
      "Write a parent information packet cover letter for the retreat.",
      "Draft a student invitation that builds excitement.",
      "Create a packing list for students.",
      "Generate chaperone guidelines and expectations.",
      "Write a follow-up message to parents summarizing the weekend.",
      "Draft a social media post highlighting retreat highlights.",
    ],
  },

  // -------------------------------------------------------------------------
  // Missions Trip
  // -------------------------------------------------------------------------
  missions_trip: {
    type: "missions_trip",
    title: "Missions Trip",
    icon: "🌍",
    tagline: "Serving together — logistics, fundraising, and spiritual preparation.",
    description:
      "A missions trip (local, domestic, or international) requires fundraising, travel logistics, training, and team formation. Plan for passports/visas, health considerations, and post-trip sharing.",
    timeline: [
      { time: "6-9 months out", activity: "Choose destination, partner org, and trip dates", owner: "Missions Lead" },
      { time: "6 months out", activity: "Open team applications & interviews; set budget", owner: "Missions Lead" },
      { time: "5 months out", activity: "Launch fundraising — support letters, events", owner: "Team" },
      { time: "3 months out", activity: "Book flights/lodging; confirm passports & visas", owner: "Admin" },
      { time: "2 months out", activity: "Team training sessions — cultural prep, safety, ministry skills", owner: "Missions Lead" },
      { time: "1 month out", activity: "Final health precautions, packing list, and itinerary distribution", owner: "Admin" },
      { time: "1 week out", activity: "Team commissioning service & final logistics check", owner: "Pastor" },
      { time: "Trip", activity: "Daily debriefs, serve, and document the story", owner: "Team" },
      { time: "Post-trip", activity: "Share testimonies, thank partners, follow up with contacts", owner: "Missions Lead" },
    ],
    checklist: [
      { label: "Partner organization vetted & agreement signed", category: "Setup" },
      { label: "Team budget finalized with per-person cost", category: "Setup" },
      { label: "Passports valid 6+ months beyond return; visas secured", category: "Setup" },
      { label: "Travel insurance & emergency evacuation coverage", category: "Setup" },
      { label: "Fundraising letters sent & tracked", category: "Setup" },
      { label: "Team training complete (culture, safety, ministry)", category: "Setup" },
      { label: "Health precautions — vaccines, meds, allergies documented", category: "Setup" },
      { label: "Itinerary & emergency contacts distributed to team & families", category: "Day-of" },
      { label: "Daily team debrief & prayer", category: "Day-of" },
      { label: "Photo/story capture for sharing", category: "Day-of" },
      { label: "Post-trip thank-you to financial partners", category: "Follow-up" },
      { label: "Testimony sharing in service & newsletter", category: "Follow-up" },
    ],
    budget: [
      { category: "Travel (flights, ground)", pct: 40 },
      { category: "Lodging & meals", pct: 25 },
      { category: "Project supplies & donations", pct: 15 },
      { category: "Insurance & fees", pct: 10 },
      { category: "Training & materials", pct: 5 },
      { category: "Scholarships / contingency", pct: 5 },
    ],
    prompts: [
      "Write a fundraising support letter for a missions trip team member.",
      "Draft a team covenant and expectations document.",
      "Create a cultural preparation guide for the destination.",
      "Write a commissioning prayer/service outline for the team.",
      "Generate a post-trip thank-you to financial partners.",
      "Draft a testimony prompt to help team members share their story.",
    ],
  },

  // -------------------------------------------------------------------------
  // Banquet
  // -------------------------------------------------------------------------
  banquet: {
    type: "banquet",
    title: "Banquet / Fundraiser Dinner",
    icon: "🍽️",
    tagline: "An elegant evening of food, story, and generosity.",
    description:
      "A banquet or fundraising dinner is a formal evening with a plated or buffet meal, keynote, testimonies, and a giving appeal. Focus on ambiance, table hosting, AV, and a clear call to action.",
    timeline: [
      { time: "6 months out", activity: "Set date, venue, and fundraising goal", owner: "Development Lead" },
      { time: "4 months out", activity: "Book caterer & keynote speaker", owner: "Development Lead" },
      { time: "3 months out", activity: "Recruit table hosts & sell/sponsor tables", owner: "Development Lead" },
      { time: "2 months out", activity: "Design program, decor, and AV plan", owner: "Events Team" },
      { time: "1 month out", activity: "Finalize menu, seating chart, and giving appeal", owner: "Development Lead" },
      { time: "1 week out", activity: "Confirm guest count & table assignments", owner: "Admin" },
      { time: "Banquet night", activity: "Check-in, dinner, program, testimonies, giving appeal", owner: "All" },
      { time: "Post-event", activity: "Thank donors, send receipts, report results", owner: "Development Lead" },
    ],
    checklist: [
      { label: "Venue & caterer contracts signed", category: "Setup" },
      { label: "Table host recruitment & training", category: "Setup" },
      { label: "RSVP & check-in system with table assignments", category: "Setup" },
      { label: "AV — stage lighting, microphones, slides, video", category: "Setup" },
      { label: "Program & speaking order finalized", category: "Setup" },
      { label: "Giving appeal — pledge cards or text-to-give ready", category: "Day-of" },
      { label: "Table decor & centerpieces set", category: "Day-of" },
      { label: "Dietary restrictions communicated to caterer", category: "Setup" },
      { label: "Testimony speakers rehearsed", category: "Day-of" },
      { label: "Post-event thank-you & tax receipts sent", category: "Follow-up" },
      { label: "Results reported to leadership & donors", category: "Follow-up" },
    ],
    budget: [
      { category: "Catering & venue", pct: 45 },
      { category: "Speaker honorarium", pct: 15 },
      { category: "Decor & ambiance", pct: 15 },
      { category: "AV & tech", pct: 10 },
      { category: "Printing & program", pct: 8 },
      { category: "Misc / contingency", pct: 7 },
    ],
    prompts: [
      "Write an elegant banquet invitation letter.",
      "Draft a table host recruitment email.",
      "Create a giving appeal script for the emcee.",
      "Write a thank-you letter to banquet donors.",
      "Generate a program welcome message.",
      "Draft a social media post highlighting banquet impact.",
    ],
  },

  // -------------------------------------------------------------------------
  // Baptism
  // -------------------------------------------------------------------------
  baptism: {
    type: "baptism",
    title: "Baptism Service",
    icon: "💧",
    tagline: "A joyful celebration of new life in Christ.",
    description:
      "A baptism service is a high-emotion celebration. Coordinate candidates, preparation, logistics (pool, towels, robes), photography, and a warm welcome for friends and family of those being baptized.",
    timeline: [
      { time: "4 weeks out", activity: "Open baptism sign-ups & meet with candidates", owner: "Pastor" },
      { time: "3 weeks out", activity: "Confirm baptism date & prepare testimonies", owner: "Pastor" },
      { time: "2 weeks out", activity: "Order robes, towels, and certificates", owner: "Admin" },
      { time: "1 week out", activity: "Test baptismal/pool, water temp, and drainage", owner: "Facilities" },
      { time: "3 days out", activity: "Rehearse with candidates — order, positioning, exits", owner: "Pastor" },
      { time: "Service day", activity: "Fill pool, warm water, prepare changing rooms", owner: "Facilities" },
      { time: "During service", activity: "Testimonies, baptisms, celebration", owner: "Pastor" },
      { time: "Post-service", activity: "Certificates, photos, follow-up with candidates", owner: "Pastor" },
    ],
    checklist: [
      { label: "Candidate preparation meetings & testimony coaching", category: "Setup" },
      { label: "Baptismal/pool cleaned, filled, and temperature-checked", category: "Day-of" },
      { label: "Robes, towels, and change of clothes available", category: "Day-of" },
      { label: "Certificates printed for each candidate", category: "Setup" },
      { label: "Photographer/videographer assigned", category: "Day-of" },
      { label: "Microphone & video feed for pool area", category: "Setup" },
      { label: "Changing rooms private & staffed", category: "Day-of" },
      { label: "Water safety — designated assistant in pool", category: "Day-of" },
      { label: "Welcome area for guests & family", category: "Day-of" },
      { label: "Post-baptism follow-up & next-steps discipleship", category: "Follow-up" },
    ],
    budget: [
      { category: "Robes & towels", pct: 20 },
      { category: "Certificates & printing", pct: 10 },
      { category: "Facilities (water, heating)", pct: 20 },
      { category: "Photography/video", pct: 20 },
      { category: "Hospitality for guests", pct: 15 },
      { category: "Misc / contingency", pct: 15 },
    ],
    prompts: [
      "Write a baptism announcement for Sunday service.",
      "Draft testimony questions to help candidates prepare.",
      "Create a baptism certificate template text.",
      "Write a follow-up note to a newly baptized believer.",
      "Generate a social media post celebrating baptisms.",
      "Draft the pastor's script for the baptism moment.",
    ],
  },

  // -------------------------------------------------------------------------
  // Wedding
  // -------------------------------------------------------------------------
  wedding: {
    type: "wedding",
    title: "Wedding",
    icon: "💍",
    tagline: "A sacred, beautifully-coordinated covenant celebration.",
    description:
      "Church weddings require coordination of the ceremony, rehearsal, officiant, musicians, decorations, and facility use. Balance the couple's vision with church policies and a reverent atmosphere.",
    timeline: [
      { time: "6+ months out", activity: "Premarital counseling & date/facility booking", owner: "Pastor" },
      { time: "3 months out", activity: "Ceremony planning — order of service, readings, music", owner: "Wedding Coordinator" },
      { time: "2 months out", activity: "Confirm officiant, musicians, and AV needs", owner: "Wedding Coordinator" },
      { time: "1 month out", activity: "Finalize decor, flowers, and facility use details", owner: "Couple + Coordinator" },
      { time: "1 week out", activity: "Rehearsal scheduled with full wedding party", owner: "Wedding Coordinator" },
      { time: "Rehearsal day", activity: "Walk through processional, vows, and recessional", owner: "Wedding Coordinator" },
      { time: "Wedding day", activity: "Setup, ceremony, photos, teardown", owner: "All" },
      { time: "Post-wedding", activity: "Marriage license signed & returned; follow-up with couple", owner: "Pastor" },
    ],
    checklist: [
      { label: "Premarital counseling completed", category: "Setup" },
      { label: "Facility use agreement & fees confirmed", category: "Setup" },
      { label: "Officiant, musicians, and AV confirmed", category: "Setup" },
      { label: "Order of service & readings finalized", category: "Setup" },
      { label: "Decor & flowers plan approved by church", category: "Setup" },
      { label: "Rehearsal run with full wedding party", category: "Setup" },
      { label: "Sound system & microphones tested", category: "Day-of" },
      { label: "Photographer/videographer access confirmed", category: "Day-of" },
      { label: "Cleanup crew & teardown assigned", category: "Day-of" },
      { label: "Marriage license signed & filed promptly", category: "Follow-up" },
      { label: "Post-wedding follow-up with couple", category: "Follow-up" },
    ],
    budget: [
      { category: "Facility use & fees", pct: 25 },
      { category: "Officiant honorarium", pct: 15 },
      { category: "Music / musicians", pct: 20 },
      { category: "Decor & flowers", pct: 25 },
      { category: "AV & tech", pct: 10 },
      { category: "Coordination & misc", pct: 5 },
    ],
    prompts: [
      "Write a wedding ceremony order of service template.",
      "Draft a premarital counseling session outline.",
      "Create a wedding rehearsal checklist.",
      "Write a welcome message for the wedding program.",
      "Generate a facility use policy summary for couples.",
      "Draft the officiant's opening remarks for a wedding.",
    ],
  },

  // -------------------------------------------------------------------------
  // Funeral
  // -------------------------------------------------------------------------
  funeral: {
    type: "funeral",
    title: "Funeral / Memorial Service",
    icon: "🕊️",
    tagline: "A compassionate service honoring a life with dignity and hope.",
    description:
      "Funerals require sensitivity and speed. Coordinate with the family, funeral home, officiant, and facilities to honor the deceased and comfort the grieving with warmth and the hope of the gospel.",
    timeline: [
      { time: "Immediately", activity: "Contact family; offer condolences & support", owner: "Pastor" },
      { time: "24-48 hrs", activity: "Meet family to plan service — readings, music, eulogy, obituary", owner: "Pastor" },
      { time: "2-3 days", activity: "Coordinate with funeral home & schedule facility", owner: "Pastor" },
      { time: "1-2 days out", activity: "Confirm officiant, musicians, and AV; prepare program", owner: "Pastor" },
      { time: "Service day", activity: "Setup, greeting, service, committal/reception", owner: "All" },
      { time: "Post-service", activity: "Bereavement follow-up & ongoing care plan", owner: "Pastor" },
    ],
    checklist: [
      { label: "Pastor available to meet family promptly", category: "Setup" },
      { label: "Service details — readings, music, eulogy, obituary confirmed", category: "Setup" },
      { label: "Facility & funeral home coordination", category: "Setup" },
      { label: "Program/order of service printed", category: "Setup" },
      { label: "Audio/video for slideshow & music", category: "Setup" },
      { label: "Grief-support resources available", category: "Day-of" },
      { label: "Reception/hospitality arranged", category: "Day-of" },
      { label: "Greeters & ushers for family & guests", category: "Day-of" },
      { label: "Bereavement meal coordination", category: "Day-of" },
      { label: "Ongoing pastoral follow-up scheduled", category: "Follow-up" },
      { label: "Thank-you to volunteers & funeral home", category: "Follow-up" },
    ],
    budget: [
      { category: "Facility & staff", pct: 25 },
      { category: "Program & printing", pct: 15 },
      { category: "Hospitality / reception", pct: 30 },
      { category: "AV & slideshow", pct: 15 },
      { category: "Officiant honorarium", pct: 10 },
      { category: "Misc / contingency", pct: 5 },
    ],
    prompts: [
      "Write a compassionate condolence message from the church.",
      "Draft a memorial service order of service template.",
      "Create a eulogy outline with prompts for the family.",
      "Write a grief-support follow-up letter.",
      "Generate an obituary announcement for the church newsletter.",
      "Draft the pastor's opening words of comfort and hope.",
    ],
  },

  // -------------------------------------------------------------------------
  // Baby Dedication
  // -------------------------------------------------------------------------
  baby_dedication: {
    type: "baby_dedication",
    title: "Baby Dedication",
    icon: "👶",
    tagline: "A tender commitment of a child and family before the congregation.",
    description:
      "A baby dedication is a brief, joyful moment during a service where parents commit to raise their child in the faith and the church commits to support them. Coordinate families, certificates, gifts, and photography.",
    timeline: [
      { time: "4 weeks out", activity: "Open dedication sign-ups & meet with families", owner: "Pastor" },
      { time: "3 weeks out", activity: "Confirm dedication date & parent prep session", owner: "Pastor" },
      { time: "2 weeks out", activity: "Prepare certificates & dedication gifts (e.g., Bible)", owner: "Admin" },
      { time: "1 week out", activity: "Confirm list of families & order of dedication", owner: "Pastor" },
      { time: "Service day", activity: "Welcome families, dedication moment, photo", owner: "Pastor" },
      { time: "Post-service", activity: "Follow-up with families & parenting resources", owner: "Pastor" },
    ],
    checklist: [
      { label: "Parent prep session held (meaning of dedication)", category: "Setup" },
      { label: "List of families & child names confirmed", category: "Setup" },
      { label: "Certificates & dedication gifts prepared", category: "Setup" },
      { label: "Script/order for the dedication moment finalized", category: "Setup" },
      { label: "Microphone for parents available", category: "Day-of" },
      { label: "Photographer assigned", category: "Day-of" },
      { label: "Welcome for extended family & guests", category: "Day-of" },
      { label: "Post-dedication parenting resources shared", category: "Follow-up" },
      { label: "Thank-you to families", category: "Follow-up" },
    ],
    budget: [
      { category: "Dedication gifts (Bibles)", pct: 35 },
      { category: "Certificates & printing", pct: 15 },
      { category: "Photography", pct: 25 },
      { category: "Hospitality", pct: 15 },
      { category: "Misc / contingency", pct: 10 },
    ],
    prompts: [
      "Write a baby dedication announcement for Sunday service.",
      "Draft the pastor's script for the dedication moment.",
      "Create a parent preparation handout on the meaning of dedication.",
      "Write a certificate wording template.",
      "Generate a follow-up note to parents with resources.",
      "Draft a social media post celebrating the dedication.",
    ],
  },
};

export const PLANNER_KEYS = Object.keys(PLANNERS);

export function getPlanner(type: string): PlannerDefinition {
  return PLANNERS[type] ?? PLANNERS.vbs;
}