export type PrivatePlanningRunsheetStatus =
  | "Draft"
  | "Confirmed"
  | "Needs confirmation"
  | "Optional"
  | "Optional / Needs confirmation";

export type PrivatePlanningRunsheetItem = {
  id: string;
  time: string;
  title: string;
  category: string;
  location: string;
  owner: string;
  notes: string;
  vendorId: string;
  status: PrivatePlanningRunsheetStatus;
  internalOnly: boolean;
  buffer: boolean;
};

export type PrivatePlanningRunsheetRole = {
  id: string;
  role: string;
  person: string;
  responsibility: string;
};

export type PrivatePlanningRunsheetChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

export type PrivatePlanningRunsheetNotes = {
  wetWeatherPlan: string;
  vendorContacts: string;
  familyPhotoList: string;
  speechOrder: string;
  songList: string;
  decorStylingSetup: string;
  ceremonySetup: string;
  receptionSetup: string;
  dietaryAllergyNotes: string;
  transportNotes: string;
  packDownNotes: string;
  itemsToBring: string;
  itemsToCollect: string;
};

export type PrivatePlanningRunsheet = {
  items: PrivatePlanningRunsheetItem[];
  alternateEnding: {
    title: string;
    notes: string[];
    items: PrivatePlanningRunsheetItem[];
  };
  roles: PrivatePlanningRunsheetRole[];
  confirmationChecklist: PrivatePlanningRunsheetChecklistItem[];
  notes: PrivatePlanningRunsheetNotes;
};

const defaultPrivatePlanningRunsheet: PrivatePlanningRunsheet = {
  items: [
    {
      id: "runsheet-0830-venue-access",
      time: "8:30 AM",
      title: "Venue access / supplier bump-in begins",
      category: "Venue / Suppliers",
      location: "Caversham House",
      owner: "TBC",
      vendorId: "vendor-venue",
      status: "Needs confirmation",
      internalOnly: false,
      buffer: false,
      notes:
        "Confirm exact venue access time with Caversham House. Florals, styling, signage, ceremony setup, reception setup, sound, lighting, and hire items begin setup if permitted.",
    },
    {
      id: "runsheet-0900-hair-makeup-starts",
      time: "9:00 AM",
      title: "Hair and makeup starts",
      category: "Morning Prep",
      location: "Getting-ready location TBC",
      owner: "Hair and makeup team",
      vendorId: "",
      status: "Draft",
      internalOnly: false,
      buffer: false,
      notes: "Adjust start time based on final bridal party size. Have breakfast, water, and snacks available from the beginning.",
    },
    {
      id: "runsheet-1030-breakfast",
      time: "10:30 AM",
      title: "Breakfast / coffee / light food",
      category: "Morning Prep",
      location: "Getting-ready location TBC",
      owner: "TBC",
      vendorId: "",
      status: "Draft",
      internalOnly: false,
      buffer: false,
      notes: "Keep food easy and reliable. Prioritize water, electrolytes, fruit, toast, pastries, and coffee.",
    },
    {
      id: "runsheet-1130-photographer-arrives",
      time: "11:30 AM",
      title: "Photographer arrives",
      category: "Photography",
      location: "Getting-ready location TBC",
      owner: "Photographer",
      vendorId: "",
      status: "Draft",
      internalOnly: false,
      buffer: false,
      notes:
        "Capture details, flatlays, getting-ready moments, outfits, invitations, rings, jewellery, vow cards, shoes, perfume, sentimental items, and detail box.",
    },
    {
      id: "runsheet-1215-touch-ups",
      time: "12:15 PM",
      title: "Final hair and makeup touch-ups begin",
      category: "Beauty",
      location: "Getting-ready location TBC",
      owner: "Hair and makeup team",
      vendorId: "",
      status: "Draft",
      internalOnly: false,
      buffer: true,
      notes: "Bride should be ahead of schedule. Build in buffer.",
    },
    {
      id: "runsheet-1245-bridal-party-dressed",
      time: "12:45 PM",
      title: "Bridal party starts getting dressed",
      category: "Attire",
      location: "Getting-ready location TBC",
      owner: "Bridal party",
      vendorId: "",
      status: "Draft",
      internalOnly: false,
      buffer: false,
      notes: "Bridesmaids and immediate bridal party get dressed first so they are ready to help.",
    },
    {
      id: "runsheet-1315-bride-dressed",
      time: "1:15 PM",
      title: "Bride gets dressed",
      category: "Attire",
      location: "Getting-ready location TBC",
      owner: "TBC",
      vendorId: "",
      status: "Draft",
      internalOnly: false,
      buffer: false,
      notes: "Allow time for dress, veil, jewellery, shoes, portraits, and final touch-ups.",
    },
    {
      id: "runsheet-1345-first-look-portraits",
      time: "1:45 PM",
      title: "First look or separate portraits",
      category: "Photography",
      location: "Getting-ready location or venue TBC",
      owner: "Photographer",
      vendorId: "",
      status: "Needs confirmation",
      internalOnly: false,
      buffer: false,
      notes: "If we do not want a first look, use this time for separate portraits and wedding party photos.",
    },
    {
      id: "runsheet-1430-arrive-caversham",
      time: "2:30 PM",
      title: "Travel to / arrive at Caversham House",
      category: "Transport",
      location: "Caversham House",
      owner: "TBC",
      vendorId: "vendor-venue",
      status: "Draft",
      internalOnly: false,
      buffer: true,
      notes: "If getting ready onsite, use this as final buffer and portrait time. Confirm transport requirements.",
    },
    {
      id: "runsheet-1500-ceremony-setup-check",
      time: "3:00 PM",
      title: "Ceremony setup final check",
      category: "Ceremony",
      location: "Garden House, Caversham House",
      owner: "Venue/coordinator TBC",
      vendorId: "vendor-venue",
      status: "Draft",
      internalOnly: false,
      buffer: false,
      notes:
        "Check ceremony florals, chairs, reserved seats, music, microphones, signing table, confetti, aisle, and wet-weather backup.",
    },
    {
      id: "runsheet-1515-family-party-ready",
      time: "3:15 PM",
      title: "Immediate family and wedding party ready",
      category: "Ceremony",
      location: "Garden House",
      owner: "Timeline lead / coordinator TBC",
      vendorId: "",
      status: "Draft",
      internalOnly: false,
      buffer: false,
      notes: "Family photo wrangler confirms key family members are onsite and knows where to find people after the ceremony.",
    },
    {
      id: "runsheet-1530-guests-arrive",
      time: "3:30 PM",
      title: "Guests arrive",
      category: "Guest Arrival",
      location: "Garden House",
      owner: "Venue / ushers TBC",
      vendorId: "vendor-venue",
      status: "Draft",
      internalOnly: false,
      buffer: false,
      notes: "Guests are directed toward the ceremony area. Optional welcome drink station if confirmed with venue.",
    },
    {
      id: "runsheet-1550-guests-seated",
      time: "3:50 PM",
      title: "Guests seated",
      category: "Ceremony",
      location: "Garden House",
      owner: "Ushers / venue TBC",
      vendorId: "vendor-venue",
      status: "Draft",
      internalOnly: false,
      buffer: false,
      notes: "Ceremony prelude music starts or shifts. Wedding party hidden and ready.",
    },
    {
      id: "runsheet-1600-ceremony-begins",
      time: "4:00 PM",
      title: "Ceremony begins",
      category: "Ceremony",
      location: "Garden House",
      owner: "Celebrant/officiant",
      vendorId: "",
      status: "Confirmed",
      internalOnly: false,
      buffer: false,
      notes: "Main anchor time for the whole day.",
    },
    {
      id: "runsheet-1630-ceremony-ends-confetti",
      time: "4:30 PM",
      title: "Ceremony ends + confetti moment",
      category: "Ceremony / Photos",
      location: "Garden House",
      owner: "Celebrant / photographer / confetti lead",
      vendorId: "",
      status: "Draft",
      internalOnly: false,
      buffer: false,
      notes: "Confetti toss or petal moment immediately after recessional. Confirm confetti rules with venue.",
    },
    {
      id: "runsheet-1640-family-photos",
      time: "4:40 PM",
      title: "Full group photo + family photos",
      category: "Photography",
      location: "Garden House / venue grounds",
      owner: "Photographer + family photo wrangler",
      vendorId: "",
      status: "Draft",
      internalOnly: false,
      buffer: false,
      notes: "Keep the family photo list tight. Assign a family photo wrangler to gather people quickly.",
    },
    {
      id: "runsheet-1700-canapes-drinks",
      time: "5:00 PM",
      title: "Canapes + drinks",
      category: "Cocktail Hour",
      location: "Caversham House",
      owner: "Venue / catering",
      vendorId: "vendor-venue",
      status: "Draft",
      internalOnly: false,
      buffer: false,
      notes: "Guests enjoy canapes and drinks while couple and wedding party portraits happen.",
    },
    {
      id: "runsheet-1700-portraits",
      time: "5:00 PM-5:50 PM",
      title: "Couple portraits / wedding party portraits",
      category: "Photography",
      location: "Caversham House grounds",
      owner: "Photographer",
      vendorId: "",
      status: "Draft",
      internalOnly: false,
      buffer: false,
      notes: "Use gardens and venue grounds. Photographer to refine exact locations and timing.",
    },
    {
      id: "runsheet-1750-private-refresh",
      time: "5:50 PM",
      title: "Couple refresh / bustle / touch-ups",
      category: "Private Buffer",
      location: "Private room TBC",
      owner: "Touch-up kit keeper / coordinator TBC",
      vendorId: "",
      status: "Draft",
      internalOnly: true,
      buffer: true,
      notes: "Private reset before reception entrance. Dress bustle, lipstick, water, perfume, veil/hair check.",
    },
    {
      id: "runsheet-1800-guests-to-reception",
      time: "6:00 PM",
      title: "Guests directed to reception",
      category: "Reception",
      location: "Reception space TBC",
      owner: "MC / venue staff",
      vendorId: "vendor-venue",
      status: "Draft",
      internalOnly: false,
      buffer: false,
      notes: "Venue staff and MC begin moving guests from cocktail hour to reception.",
    },
    {
      id: "runsheet-1815-guests-seated-reception",
      time: "6:15 PM",
      title: "Guests seated for reception",
      category: "Reception",
      location: "Reception space TBC",
      owner: "Venue staff",
      vendorId: "vendor-venue",
      status: "Draft",
      internalOnly: false,
      buffer: false,
      notes: "Menus, place cards, water, wine service, dietary notes, and seating chart should be ready.",
    },
    {
      id: "runsheet-1825-mc-welcome",
      time: "6:25 PM",
      title: "MC welcome + housekeeping",
      category: "Reception",
      location: "Reception space",
      owner: "MC",
      vendorId: "",
      status: "Draft",
      internalOnly: false,
      buffer: false,
      notes: "MC welcomes guests, mentions bathrooms, phones, bar, speeches, and any key housekeeping.",
    },
    {
      id: "runsheet-1830-entrance",
      time: "6:30 PM",
      title: "Couple / bridal party entrance",
      category: "Reception",
      location: "Reception space",
      owner: "MC / DJ / band",
      vendorId: "",
      status: "Draft",
      internalOnly: false,
      buffer: false,
      notes: "Short, polished entrance. Confirm entrance song.",
    },
    {
      id: "runsheet-1835-first-course",
      time: "6:35 PM",
      title: "First course served",
      category: "Dinner Service",
      location: "Reception space",
      owner: "Venue / catering",
      vendorId: "vendor-venue",
      status: "Draft",
      internalOnly: false,
      buffer: false,
      notes: "Reception dinner begins. Confirm service style and dietary handling.",
    },
    {
      id: "runsheet-1910-speeches-one",
      time: "7:10 PM",
      title: "Speeches round one",
      category: "Speeches",
      location: "Reception space",
      owner: "MC",
      vendorId: "",
      status: "Draft",
      internalOnly: false,
      buffer: false,
      notes: "Suggested for parent/welcome speeches. Add speaker names later. Keep speeches short and timed.",
    },
    {
      id: "runsheet-1935-mains",
      time: "7:35 PM",
      title: "Mains served",
      category: "Dinner Service",
      location: "Reception space",
      owner: "Venue / catering",
      vendorId: "vendor-venue",
      status: "Draft",
      internalOnly: false,
      buffer: false,
      notes: "Confirm service timing with venue. Allow guests proper time to eat.",
    },
    {
      id: "runsheet-2015-speeches-two",
      time: "8:15 PM",
      title: "Speeches round two",
      category: "Speeches",
      location: "Reception space",
      owner: "MC",
      vendorId: "",
      status: "Draft",
      internalOnly: false,
      buffer: false,
      notes: "Suggested for bridal party speeches and/or couple thank-you. Add speaker order later.",
    },
    {
      id: "runsheet-2045-cake-cutting",
      time: "8:45 PM",
      title: "Cake cutting",
      category: "Reception Moment",
      location: "Reception space",
      owner: "MC / photographer / venue",
      vendorId: "vendor-venue",
      status: "Draft",
      internalOnly: false,
      buffer: false,
      notes: "Keep quick and elegant. Confirm cake table position and knife.",
    },
    {
      id: "runsheet-2055-first-dance",
      time: "8:55 PM",
      title: "First dance",
      category: "Reception Moment",
      location: "Dance floor",
      owner: "DJ / band / MC",
      vendorId: "",
      status: "Draft",
      internalOnly: false,
      buffer: false,
      notes: "Confirm first dance song. MC transitions guests toward dance floor.",
    },
    {
      id: "runsheet-2105-dance-floor",
      time: "9:05 PM",
      title: "Dance floor opens",
      category: "Party",
      location: "Dance floor",
      owner: "DJ / band",
      vendorId: "",
      status: "Draft",
      internalOnly: false,
      buffer: false,
      notes: "Music should lift energy immediately after first dance.",
    },
    {
      id: "runsheet-2200-late-night-snack",
      time: "10:00 PM",
      title: "Late-night snack",
      category: "Catering",
      location: "Reception space",
      owner: "Venue / catering",
      vendorId: "vendor-venue",
      status: "Optional / Needs confirmation",
      internalOnly: false,
      buffer: false,
      notes: "Optional but helpful if guests are dancing. Confirm whether included.",
    },
    {
      id: "runsheet-2230-sparkler-exit",
      time: "10:30 PM",
      title: "Farewell sparkler tunnel / formal exit",
      category: "Farewell",
      location: "Venue exit area TBC",
      owner: "Coordinator / MC / venue",
      vendorId: "vendor-venue",
      status: "Optional / Needs confirmation",
      internalOnly: false,
      buffer: false,
      notes: "Only if venue allows. Confirm sparkler/fire rules, safety, lighter plan, disposal, and photographer coverage.",
    },
    {
      id: "runsheet-2245-last-drinks",
      time: "10:45 PM",
      title: "Last drinks / final song window",
      category: "Reception Close",
      location: "Reception space",
      owner: "Venue / MC / DJ",
      vendorId: "vendor-venue",
      status: "Draft",
      internalOnly: false,
      buffer: false,
      notes: "Begin soft close. Confirm bar closing time.",
    },
    {
      id: "runsheet-2300-reception-ends",
      time: "11:00 PM",
      title: "Reception ends",
      category: "Reception Close",
      location: "Caversham House",
      owner: "Venue / coordinator",
      vendorId: "vendor-venue",
      status: "Needs confirmation",
      internalOnly: false,
      buffer: false,
      notes:
        "Confirm exact venue curfew, guest transport, vendor pack-down, card/gift collection, leftover cake/flowers, and final checks.",
    },
  ],
  alternateEnding: {
    title: "Alternate ending if venue allows midnight finish",
    notes: [
      "Do not move dinner later.",
      "Keep ceremony, canapes, dinner, speeches, cake, first dance, and dance floor opening at the same times.",
      "Extend dancing only.",
    ],
    items: [
      {
        id: "alternate-2215-late-night-snack",
        time: "10:15 PM",
        title: "Late-night snack",
        category: "Catering",
        location: "Reception space",
        owner: "Venue / catering",
        vendorId: "vendor-venue",
        status: "Optional / Needs confirmation",
        internalOnly: true,
        buffer: false,
        notes: "Midnight-finish version if venue allows the later end time.",
      },
      {
        id: "alternate-2315-sparkler-exit",
        time: "11:15 PM",
        title: "Farewell sparkler tunnel / formal exit",
        category: "Farewell",
        location: "Venue exit area TBC",
        owner: "Coordinator / MC / venue",
        vendorId: "vendor-venue",
        status: "Optional / Needs confirmation",
        internalOnly: true,
        buffer: false,
        notes: "Only if venue allows and photographer coverage extends late enough.",
      },
      {
        id: "alternate-2345-final-song",
        time: "11:45 PM",
        title: "Final song",
        category: "Reception Close",
        location: "Reception space",
        owner: "MC / DJ / band",
        vendorId: "",
        status: "Draft",
        internalOnly: true,
        buffer: false,
        notes: "Final song if venue allows a midnight finish.",
      },
      {
        id: "alternate-0000-reception-ends",
        time: "12:00 AM",
        title: "Reception ends",
        category: "Reception Close",
        location: "Caversham House",
        owner: "Venue / coordinator",
        vendorId: "vendor-venue",
        status: "Needs confirmation",
        internalOnly: true,
        buffer: false,
        notes: "Confirm exact venue curfew, transport, pack-down, and collection plan before relying on this version.",
      },
    ],
  },
  roles: [
    {
      id: "role-timeline-lead",
      role: "Timeline lead / coordinator",
      person: "TBC",
      responsibility: "Keeps the day moving and becomes first contact for vendors/logistics.",
    },
    {
      id: "role-mc",
      role: "MC",
      person: "TBC",
      responsibility: "Announces seating, speeches, cake cutting, first dance, last drinks, and key transitions.",
    },
    {
      id: "role-family-photo-wrangler",
      role: "Family photo wrangler",
      person: "TBC",
      responsibility: "Finds family members quickly after ceremony.",
    },
    {
      id: "role-confetti-lead",
      role: "Confetti lead",
      person: "TBC",
      responsibility: "Ensures confetti is distributed and ready before ceremony exit.",
    },
    {
      id: "role-touch-up-kit",
      role: "Touch-up kit keeper",
      person: "TBC",
      responsibility: "Keeps lipstick, tissues, blotting paper, perfume, pins, and small beauty items.",
    },
    {
      id: "role-emergency-kit",
      role: "Emergency kit keeper",
      person: "TBC",
      responsibility: "Keeps sewing kit, plasters, pain relief, stain remover, fashion tape, safety pins, etc.",
    },
    {
      id: "role-gift-card-collector",
      role: "Gift/card collector",
      person: "TBC",
      responsibility: "Keeps cards and gifts secure at the end of the night.",
    },
    {
      id: "role-transport-lead",
      role: "Transport lead",
      person: "TBC",
      responsibility: "Confirms couple, family, bridal party, and guest transport timing.",
    },
  ],
  confirmationChecklist: [
    "Venue access / supplier bump-in time",
    "Getting-ready location",
    "Reception space name",
    "Venue curfew / reception end time",
    "Wet-weather ceremony location",
    "Sparkler/farewell rules",
    "Final catering timeline",
    "Bar closing time",
    "Vendor pack-down requirements",
    "Family photo list",
    "Speech order",
    "Song choices",
    "Transport/end-of-night plan",
    "Vendor emergency contact numbers",
  ].map((text) => ({
    id: `confirm-${text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
    text,
    done: false,
  })),
  notes: {
    wetWeatherPlan: "",
    vendorContacts: "",
    familyPhotoList: "",
    speechOrder: "",
    songList: "",
    decorStylingSetup: "",
    ceremonySetup: "",
    receptionSetup: "",
    dietaryAllergyNotes: "",
    transportNotes: "",
    packDownNotes: "",
    itemsToBring: "",
    itemsToCollect: "",
  },
};

function cloneDefaultRunsheet() {
  return JSON.parse(JSON.stringify(defaultPrivatePlanningRunsheet)) as PrivatePlanningRunsheet;
}

export function buildDefaultPrivatePlanningRunsheet() {
  return cloneDefaultRunsheet();
}

export function withDefaultPrivatePlanningRunsheet(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { runsheet: cloneDefaultRunsheet() };
  }

  const payloadRecord = payload as Record<string, unknown>;

  if (payloadRecord.runsheet && typeof payloadRecord.runsheet === "object" && !Array.isArray(payloadRecord.runsheet)) {
    return payloadRecord;
  }

  return {
    ...payloadRecord,
    runsheet: cloneDefaultRunsheet(),
  };
}
