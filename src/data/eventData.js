// Audition date: Thursday, 22 October 2026 IST
export const FINALE_REVEAL_TIMESTAMP = new Date('2026-10-22T00:00:00+05:30').getTime();

export const isFinaleDateRevealed = () => {
  try {
    return Date.now() >= FINALE_REVEAL_TIMESTAMP;
  } catch {
    return false;
  }
};

const finaleRevealed = isFinaleDateRevealed();

export const EVENT_DETAILS = {
  title: "GSFCU GOT TALENT 2026",
  tagline: "EXPECT THE UNEXPECTED",
  
  // Auditions (Primary date)
  auditionDate: "22 OCTOBER 2026",
  auditionDay: "THURSDAY",
  auditionFullDate: "Thursday, 22 October 2026",
  
  // Grand Showcase / Auditions
  isFinaleRevealed: false,
  finaleDate: "22 OCTOBER 2026",
  finaleDay: "THURSDAY",
  finaleFullDate: "Thursday, 22 October 2026",
  
  // Dynamic presentation properties
  date: "22 OCTOBER 2026",
  fullDate: "Thursday, 22 October 2026 (Auditions)",
  displayEventDate: "22 OCTOBER 2026",
  displayAuditionDate: "22 OCTOBER 2026 • THURSDAY",
  
  university: "GSFC University",
  location: "Aanganva, GSFC University",
  venue: "Aanganva, GSFC University",
  season: "2026 Edition",
  whatsappGroupUrl: "https://chat.whatsapp.com/LETsJjET2As6fXFHCA8iAh",
  contactEmail: "radiogsfcu@gsfcuniversity.ac.in",
  instagramHandles: [
    { handle: "@radiogsfcu", url: "https://instagram.com/radiogsfcu" },
    { handle: "@theatreclub_gsfcu", url: "https://instagram.com/theatreclub_gsfcu" }
  ],
  instagramHandle: "@radiogsfcu"
};

export const TALENT_CATEGORIES = [
  {
    id: "singing",
    number: "01",
    title: "Singing",
    subtitle: "Solo & Group Vocals",
    description: "Showcase your vocal prowess across Indian classical, Bollywood, Western, semi-classical, or original compositions.",
    icon: "Mic2",
    badge: "Solo / Group",
    highlights: ["3-5 Minutes Limit", "Backing Tracks Allowed", "Live Instrument Option"]
  },
  {
    id: "dance",
    number: "02",
    title: "Dance",
    subtitle: "Garba Fusion, Classical & Hip-Hop",
    description: "Bring the stage alive with explosive choreography, traditional Navratri Folk, Garba Fusion, Contemporary, or Street styles.",
    icon: "Sparkles",
    badge: "Solo / Duo / Group",
    highlights: ["Up to 8 Mins for Group", "Costume Evaluation", "All Dance Forms Welcome"]
  },
  {
    id: "drama",
    number: "03",
    title: "Drama / Theatre",
    subtitle: "Skit, Mono-Act & Street Play",
    description: "Captivate the audience with powerful storytelling, dramatic expressions, theatrical skits, mime, or mono-acting.",
    icon: "Theater",
    badge: "Solo / Group",
    highlights: ["Script Verification", "Props Permitted", "Stage Setup Support"]
  },
  {
    id: "instrumental",
    number: "04",
    title: "Instrumental",
    subtitle: "Acoustic & Electronic Performance",
    description: "Let your instruments speak. Drums, Keyboards, Guitar, Flute, Tabla, Violin or full acoustic band jams.",
    icon: "Music",
    badge: "Solo / Band",
    highlights: ["PA System Provided", "Soundcheck Slot", "Original Arrangements"]
  },
  {
    id: "comedy",
    number: "05",
    title: "Stand-up / Comedy",
    subtitle: "Solo Comedy & Improv Acts",
    description: "Deliver sharp wit, relatable college humor, mimicry, or audience improv acts that leave the hall roaring.",
    icon: "Laugh",
    badge: "Solo Act",
    highlights: ["4-6 Minutes Slot", "Original Content Only", "No Offensive Language"]
  },
  {
    id: "other",
    number: "06",
    title: "Other / Special Talent",
    subtitle: "Unconventional & Special Acts",
    description: "Beatboxing, Magic, Martial Arts Demonstration, Spoken Word Poetry, Rap Battles, or any unique talent.",
    icon: "Flame",
    badge: "Any Format",
    highlights: ["Safety Review Required", "Unique Props", "Unconventional Setup"]
  }
];

export const HOW_IT_WORKS_STEPS = [
  {
    step: "01",
    title: "REGISTER",
    subtitle: "Lock In Your Slot",
    description: "Complete your online registration on this portal before the deadline. Choose your category, specify solo or group performance, and submit student details."
  },
  {
    step: "02",
    title: "AUDITIONS",
    subtitle: "22 OCTOBER 2026 • THURSDAY",
    description: "Perform your preliminary act in front of our faculty & guest judges panel during the campus audition rounds at Aanganva, GSFC University on Thursday, 22 October 2026."

  },
  {
    step: "03",
    title: "GRAND SHOWCASE",
    subtitle: "22 OCTOBER 2026 • AUDITIONS",
    description: "Auditions will be held on Thursday, 22 October 2026 at Aanganva, GSFC University before our panel of faculty & celebrity judges."
  }
];

export const SCHOOLS_AND_DEPARTMENTS = [
  "School of Information and Communication Technology (SOICT)",
  "School of Chemical and Fire Safety (SOCEFS)",
  "School of Life Sciences (SOLS)",
  "School of Chemical and Industry Sciences (SOCIS)",
  "School of Management and Enterprise (SOM&E)"
];

export const IMPORTANT_INFO = [
  {
    title: "Event Dates & Schedule",
    detail: "Auditions will be held on Thursday, 22 October 2026 at Aanganva, GSFC University. Detailed call sheets will be issued to registered candidates."
  },
  {
    title: "Registration Guidelines",
    detail: "Registrations are completely free of charge. Open to all active GSFC University students with a valid enrollment number."
  },
  {
    title: "Eligibility",
    detail: "Enrolled undergraduate & postgraduate students from SOICT, SOCEFS, SOLS, SOCIS, and SOM&E."
  },
  {
    title: "Performance & Equipment",
    detail: "Stage lighting, sound setup, microphones, and basic PA systems are provided at Aanganva. Specific props or custom audio tracks must be pre-submitted."
  },
  {
    title: "Official Announcements",
    detail: "All official slot allocations, audition time slots, and finalist lists will be broadcasted via the official WhatsApp group and college notice boards."
  }
];

export const RULES_AND_GUIDELINES = [
  {
    id: 1,
    title: "Student Identity Verification",
    content: "All participants must present their official GSFC University student ID card during audition check-in on 22 October 2026 and stage performances."
  },
  {
    id: 2,
    title: "Time Limit Compliance",
    content: "Performances must strictly adhere to the designated time limits: Solo acts (3-5 mins), Group acts (5-8 mins). Exceeding time limits may result in point deductions."
  },
  {
    id: 3,
    title: "Decorum & Content Policy",
    content: "Performances must maintain dignity. Any content containing vulgarity, offensive religious/political statements, or inappropriate gestures will lead to immediate disqualification."
  },
  {
    id: 4,
    title: "Track & Prop Submissions",
    content: "Audio backing tracks (MP3 format, 320kbps) and prop requirements must be submitted to the organizing committee 48 hours prior to audition day."
  },
  {
    id: 5,
    title: "Jury Decision Finality",
    content: "The decisions made by the official judge panel regarding audition scoring and finalist selection are absolute and binding."
  },
  {
    id: 6,
    title: "Group Representation",
    content: "For group events, all team members must belong to GSFC University. A designated team leader will serve as the primary contact person."
  }
];

export const FAQS = [
  {
    question: "Who can participate in GSFCU Got Talent 2026?",
    answer: "Any currently enrolled student of GSFC University (B.Tech, B.Sc, BBA, MBA, M.Sc, etc.) with a valid enrollment number can participate."
  },
  {
    question: "When and where are the auditions and the main event held?",
    answer: "Auditions will be held on Thursday, 22 October 2026 at Aanganva, GSFC University."
  },
  {
    question: "What talent categories can I register for?",
    answer: "We offer 6 major categories: Singing, Dance (including Navratri/Garba Fusion), Drama/Theatre, Instrumental, Stand-up Comedy, and Special/Other talents (Beatboxing, Magic, Poetry, etc.)."
  },
  {
    question: "Can I participate in multiple categories or as a group?",
    answer: "Yes! You can participate in a solo performance as well as a group performance in different categories, provided audition slots do not clash."
  },
  {
    question: "Is there any registration fee for participants?",
    answer: "No, registration for GSFCU Got Talent 2026 is completely free for all GSFC University students."
  },
  {
    question: "Where and when will I receive audition updates?",
    answer: "Auditions will be held on Thursday, 22 October 2026 at Aanganva, GSFC University. After submitting your registration form, you will get a link to join the official GSFCU Got Talent WhatsApp Group where audition reporting times and stage rules are shared."
  }
];

