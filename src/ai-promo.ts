import { createServerFn } from "@tanstack/react-start";
import { getAuthState } from "~/auth";
import { getEvent, type Event } from "~/events";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SocialCalendarEntry {
  day: string;
  platform: string;
  contentIdea: string;
  graphicDescription: string;
}

export interface ReelScript {
  title: string;
  duration: string;
  script: string;
}

export interface TikTokIdea {
  hook: string;
  body: string;
  caption: string;
}

export interface AnnouncementScript {
  type: string;
  script: string;
}

export interface StageAnnouncement {
  occasion: string;
  script: string;
}

export interface EmailSequenceEntry {
  emailNumber: number;
  subject: string;
  body: string;
}

export interface PromotionResult {
  eventTitle: string;
  socialCalendar: SocialCalendarEntry[];
  countdownGraphics: string[];
  reelScripts: ReelScript[];
  tiktokIdeas: TikTokIdea[];
  announcementScripts: AnnouncementScript[];
  stageAnnouncements: StageAnnouncement[];
  pastorTalkingPoints: string[];
  emailSequence: EmailSequenceEntry[];
}

export interface ThankYouEmail {
  audience: string;
  subject: string;
  body: string;
}

export interface VolunteerAppreciation {
  format: string;
  message: string;
}

export interface ExpenseLine {
  category: string;
  budgeted: string;
  actual: string;
  variance: string;
}

export interface SurveyQuestion {
  question: string;
  type: string;
}

export interface FollowUpResult {
  eventTitle: string;
  thankYouEmails: ThankYouEmail[];
  volunteerAppreciation: VolunteerAppreciation[];
  attendanceReport: {
    registered: string;
    attended: string;
    noShowRate: string;
    notes: string;
  };
  expenseReport: ExpenseLine[];
  lessonsLearned: string[];
  surveyQuestions: SurveyQuestion[];
  nextYearRecommendations: string[];
}

// ---------------------------------------------------------------------------
// Promotion generator (rule-based)
// ---------------------------------------------------------------------------

function buildPromotion(event: Event): PromotionResult {
  const title = event.title;
  const location = event.location ?? "the church campus";
  const platforms = ["Facebook", "Instagram", "TikTok", "Email"];

  const socialCalendar: SocialCalendarEntry[] = Array.from(
    { length: 30 },
    (_, i) => {
      const day = i + 1;
      const platform = platforms[i % platforms.length];
      const contentIdea =
        day === 1
          ? `Announce ${title} to the congregation with the key details and a warm invitation.`
          : day === 30
            ? `Final reminder — "tomorrow is the day!" post with a countdown graphic.`
            : day % 7 === 0
              ? `Mid-week momentum post: highlight a testimonial or a behind-the-scenes peek at preparation.`
              : day % 5 === 0
                ? `Share a practical detail: parking, what to bring, or how to sign up to serve.`
                : `Encouraging reminder about ${title} and a simple call to invite a friend.`;
      return {
        day: `Day ${day}`,
        platform,
        contentIdea,
        graphicDescription:
          day <= 3
            ? "Clean announcement graphic with event name, date, time, and location."
            : day >= 28
              ? "Bold countdown graphic — big number with the event name below."
              : "Warm lifestyle photo of the church community with a short text overlay.",
      };
    },
  );

  const countdownGraphics = [
    "Day 7 — large number '7' over a soft background with event name beneath.",
    "Day 5 — '5 days to go' with a photo of the team preparing.",
    "Day 3 — '3 days' bold countdown with a call to register.",
    "Day 2 — '2 days' with a checklist of what to bring.",
    "Day 1 — 'Tomorrow!' with time and location front and center.",
    "Day 0 — 'Today!' celebration graphic with doors-open time.",
  ];

  const reelScripts: ReelScript[] = [
    {
      title: "30-Second Invite",
      duration: "30 sec",
      script: `Hook: "You're invited." Show the front of the church, then a warm smile to camera.\n\nBody: "On ${title}, we're gathering at ${location}. Whether you've been here a hundred times or never stepped inside, this is for you." Cut between quick shots of people greeting, laughing, and the space being prepared.\n\nClose: "Come as you are. Bring a friend. We'll save you a seat."`,
    },
    {
      title: "Behind-the-Scenes Prep",
      duration: "45 sec",
      script: `Hook: "A lot goes into making ${title} happen." Fast cuts of setup — arranging chairs, setting tables, testing sound.\n\nBody: "Our volunteers are already at work, and it's not too late to join them. Every hand helps."\n\nClose: "Want to be part of it? Tap the link to sign up."`,
    },
    {
      title: "Testimonial Spotlight",
      duration: "60 sec",
      script: `Hook: "Here's what last time meant to one of us." A member shares a 20-second story about why the event matters to them.\n\nBody: "That could be you this time. ${title} is coming up, and we'd love to see you there."\n\nClose: "Details below. See you there."`,
    },
  ];

  const tiktokIdeas: TikTokIdea[] = [
    {
      hook: "POV: you showed up to help and it changed your weekend",
      body: "Montage of volunteers having fun while setting up, with upbeat audio.",
      caption: `We're getting ready for ${title} — come be part of it. #ChurchFamily #Volunteer`,
    },
    {
      hook: "This is what happens when the church comes together",
      body: "Transition from empty room to full room with people, timed to a trending sound.",
      caption: `${title} is coming. Don't miss it. #Faith #Community`,
    },
    {
      hook: "Things you didn't know happen before a church event",
      body: "Fast, funny behind-the-scenes of setup mishaps and wins.",
      caption: `The real MVPs behind ${title}. #BTS #ChurchLife`,
    },
    {
      hook: "Tag someone who should come with you",
      body: "Simple graphic over a warm photo, with 'tag a friend' text.",
      caption: `Bring a friend to ${title}! #Invite #Together`,
    },
    {
      hook: "One week. One invitation. Could change a life.",
      body: "Slow, sincere direct-to-camera invitation with soft music.",
      caption: `${title} — one week away. #YoureInvited`,
    },
  ];

  const announcementScripts: AnnouncementScript[] = [
    {
      type: "30-second verbal announcement",
      script: `We want to invite everyone to ${title} happening at ${location}. Mark your calendars — it's going to be a special time together. Whether you're new or you've been here for years, there's a place for you. Look for the sign-up table in the lobby if you'd like to help, and we'll share more details in the coming weeks. We hope to see you there.`,
    },
    {
      type: "60-second verbal announcement",
      script: `I'm excited to tell you about ${title}, coming up here at ${location}. This is going to be a wonderful opportunity for us to come together as a church family. We'll have something for everyone — and we'd love for you to invite a friend or neighbor. We're also looking for volunteers to help make it happen; if you can serve, there's a sign-up table in the lobby after the service, or you can reach out to the office. Details are in the bulletin and on our website. Mark the date, spread the word, and let's make this something special.`,
    },
  ];

  const stageAnnouncements: StageAnnouncement[] = [
    {
      occasion: "Two weeks before",
      script: `Church, I want to make sure ${title} is on your radar. It's coming up in just two weeks, and it's going to be a beautiful time for us to gather. I want to encourage you to invite someone — a neighbor, a coworker, a friend who's been on your heart. We'll share more each week, but for now, mark the date and start praying about who you might bring.`,
    },
    {
      occasion: "Sunday before",
      script: `This is it — ${title} is happening next week, and I'm asking every one of you to be part of it. Bring a friend. Consider serving if you're able — we still have a few spots to fill. This is our chance to open our doors wide and show our community the love of Christ. Let's make this the best one yet.`,
    },
  ];

  const pastorTalkingPoints = [
    `Frame ${title} as an act of hospitality, not just an event — it's how we love our neighbors.`,
    "Connect the event to the bigger mission of the church; tie it to a Scripture about welcoming the stranger.",
    "Share a personal story of a time community changed you, to make the invitation authentic.",
    "Emphasize that everyone can contribute — through prayer, serving, inviting, or simply showing up.",
    "Invite the congregation to pray over the guest list in the days leading up.",
  ];

  const emailSequence: EmailSequenceEntry[] = [
    {
      emailNumber: 1,
      subject: `Save the date: ${title}`,
      body: `Hi there,\n\nWe're excited to invite you to ${title}, coming up at ${location}. We'd love to see you there and would be honored if you'd bring a friend.\n\nMark your calendar and stay tuned for more details. If you'd like to help make this event happen, just reply to this email and let us know.\n\nWith gratitude,\nThe church team`,
    },
    {
      emailNumber: 2,
      subject: `One week to go: ${title}`,
      body: `Hi there,\n\nJust a quick reminder that ${title} is one week away! We've been preparing and praying, and we can't wait to gather together.\n\nHere are the details:\n- When: ${event.start_date}\n- Where: ${location}\n\nThere's still time to invite a friend or sign up to volunteer. Just reply to this email if you'd like to help.\n\nSee you soon,\nThe church team`,
    },
    {
      emailNumber: 3,
      subject: `Tomorrow: ${title}`,
      body: `Hi there,\n\nTomorrow's the day! ${title} is happening at ${location}, and we'd love to see you there.\n\nA few friendly reminders:\n- Arrive a little early to find parking and get settled.\n- Bring a friend — there's always room for one more.\n- Come as you are.\n\nWe can't wait to see you.\n\nThe church team`,
    },
  ];

  return {
    eventTitle: title,
    socialCalendar,
    countdownGraphics,
    reelScripts,
    tiktokIdeas,
    announcementScripts,
    stageAnnouncements,
    pastorTalkingPoints,
    emailSequence,
  };
}

// ---------------------------------------------------------------------------
// Follow-up generator (rule-based)
// ---------------------------------------------------------------------------

function buildFollowUp(event: Event): FollowUpResult {
  const title = event.title;

  const thankYouEmails: ThankYouEmail[] = [
    {
      audience: "General attendees",
      subject: `Thank you for joining us at ${title}`,
      body: `Dear friend,\n\nThank you so much for being part of ${title}. It was a joy to have you with us, and we hope you were encouraged and blessed.\n\nIf you're new or visiting, we'd love to see you again. Please don't hesitate to reach out if there's any way we can serve you.\n\nWith gratitude,\nThe church team`,
    },
    {
      audience: "Speakers & special guests",
      subject: `With gratitude for your part in ${title}`,
      body: `Dear [Name],\n\nThank you for the time, care, and energy you gave to ${title}. Your contribution made a real difference, and we're grateful for the gift you shared with our community.\n\nWe'd be honored to have you with us again. Thank you for partnering with us in this work.\n\nWarmly,\nThe church team`,
    },
  ];

  const volunteerAppreciation: VolunteerAppreciation[] = [
    {
      format: "Email",
      message: `Dear [Name],\n\nThank you for serving at ${title}. The event simply wouldn't have happened without you. Your faithfulness and joyful heart made a difference that was felt by everyone who walked through our doors.\n\nThank you for saying yes. We're so grateful for you.\n\nThe church team`,
    },
    {
      format: "Text / SMS",
      message: `Hi [Name]! Just wanted to say a huge THANK YOU for serving at ${title}. You made it happen — we're so grateful for you! 🙏`,
    },
    {
      format: "Stage / speech snippet",
      message: `Before we close, I want to say a special thank you to every volunteer who served at ${title}. You showed up early, stayed late, and gave your best. Church, let's show our appreciation for these faithful servants.`,
    },
  ];

  const attendanceReport = {
    registered: "[Enter number registered]",
    attended: "[Enter number attended]",
    noShowRate: "[Attended / Registered, expressed as %]",
    notes:
      "Compare actual attendance against prior years or similar events. Note weather, promotions that worked, and any registration friction.",
  };

  const expenseReport: ExpenseLine[] = [
    { category: "Decorations", budgeted: "$", actual: "$", variance: "$" },
    { category: "Marketing", budgeted: "$", actual: "$", variance: "$" },
    { category: "Food", budgeted: "$", actual: "$", variance: "$" },
    { category: "Equipment", budgeted: "$", actual: "$", variance: "$" },
    { category: "Rentals", budgeted: "$", actual: "$", variance: "$" },
    { category: "Speakers", budgeted: "$", actual: "$", variance: "$" },
    { category: "Insurance", budgeted: "$", actual: "$", variance: "$" },
    { category: "Miscellaneous", budgeted: "$", actual: "$", variance: "$" },
  ];

  const lessonsLearned = [
    "What worked well that we should repeat next time?",
    "What would we do differently if we ran this again?",
    "Did our volunteer coverage match the actual need? Where were the gaps?",
    "Did our promotion reach new people, or mostly our existing congregation?",
    "Was the budget accurate? Which line items came in over or under?",
    "Did the timeline hold up on the day, or did we feel rushed?",
    "What feedback did attendees share (positive and constructive)?",
    "Is there anything we should automate or streamline for next time?",
  ];

  const surveyQuestions: SurveyQuestion[] = [
    { question: "Overall, how would you rate your experience?", type: "1-5 rating" },
    { question: "How did you first hear about this event?", type: "multiple choice" },
    { question: "Was the event what you expected? Why or why not?", type: "open text" },
    { question: "How welcoming did you find the atmosphere?", type: "1-5 rating" },
    { question: "Would you invite a friend to a similar event?", type: "yes/no" },
    { question: "How easy was it to find parking and get settled?", type: "1-5 rating" },
    { question: "What was the highlight of the event for you?", type: "open text" },
    { question: "What could we improve for next time?", type: "open text" },
    { question: "How likely are you to attend another church event?", type: "1-5 rating" },
    { question: "Would you be interested in volunteering at future events?", type: "yes/no" },
    { question: "Did the event feel relevant to your life?", type: "1-5 rating" },
    { question: "Any other comments or suggestions?", type: "open text" },
  ];

  const nextYearRecommendations = [
    "Start promotion one week earlier based on registration momentum.",
    "Add a second volunteer orientation session to reduce day-of confusion.",
    "Increase the food budget — it was the most mentioned highlight.",
    "Add a follow-up touchpoint for first-time guests within 48 hours.",
    "Consider an earlier setup window to reduce time pressure on volunteers.",
    "Capture short video testimonials during the event for next year's promotion.",
  ];

  return {
    eventTitle: title,
    thankYouEmails,
    volunteerAppreciation,
    attendanceReport,
    expenseReport,
    lessonsLearned,
    surveyQuestions,
    nextYearRecommendations,
  };
}

// ---------------------------------------------------------------------------
// Server functions
// ---------------------------------------------------------------------------

export const generatePromotion = createServerFn({ method: "POST" })
  .validator((d: unknown) => {
    const data = d as { eventId: string };
    if (!data.eventId) throw new Error("Event ID is required");
    return { eventId: data.eventId };
  })
  .handler(async ({ data }) => {
    const { user } = await getAuthState();
    if (!user) throw new Error("Unauthorized");
    const event = await getEvent({ data: { eventId: data.eventId } });
    return buildPromotion(event);
  });

export const generateFollowUp = createServerFn({ method: "POST" })
  .validator((d: unknown) => {
    const data = d as { eventId: string };
    if (!data.eventId) throw new Error("Event ID is required");
    return { eventId: data.eventId };
  })
  .handler(async ({ data }) => {
    const { user } = await getAuthState();
    if (!user) throw new Error("Unauthorized");
    const event = await getEvent({ data: { eventId: data.eventId } });
    return buildFollowUp(event);
  });
