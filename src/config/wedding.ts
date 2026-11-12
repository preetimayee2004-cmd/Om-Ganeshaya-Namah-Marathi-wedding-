// Single source of truth for the invitation template.
// These are the DEFAULTS. Anything saved from the Edit panel (open the site with ?edit) is
// merged over them at startup (see src/lib/content.ts), so no code change is needed to edit.
export const wedding = {
  // Illustrations and backgrounds. Any value can be a /public path or a full https:// image URL.
  images: {
    door: "/intro/royal-door.jpg", // opening: the two door halves
    ganeshClosed: "/intro/ganesh-closed.jpg", // Ganpati, eyes closed
    ganeshBlessing: "/intro/ganesh-blessing.jpg", // Ganpati, blessing
    invitationScene: "/intro/invitation-wada.jpg", // invitation screen (courtyard)
    coupleScene: "/intro/couple-mandap.jpg", // couple section after Open Invitation
    thankYouCouple: "/intro/couple-arch.jpg", // couple inside the Thank You arch
    rsvpCouple: "/rsvp/couple.png", // couple rising from the RSVP envelope (transparent PNG)
    venue: "/venue/mandap.jpg", // venue illustration
    sky: "/bg/mandap-sky.jpg", // sky background behind every section
    peacockBorder: "/border/peacock-border.png", // strip above/below the scratch card
    laptopBackground: "/bg/stage.jpg", // blurred backdrop around the phone on laptops
  },
  couple: {
    bride: "Sayeli",
    groom: "Shreyash",
    // Which name is shown first on the invitation, footer and thank-you.
    showFirst: "groom" as "bride" | "groom",
  },
  coupleHeading: "The People Behind the Celebration",
  coupleMessage:
    "Two different journeys, two unique stories, and one beautiful beginning. Today, their paths come together to create a lifetime of memories.",
  // Optional short intros: replace with real descriptions from the couple.
  bios: {
    bride: "A short introduction to the bride goes here.",
    groom: "A short introduction to the groom goes here.",
  },
  // Placeholder parents: replace with the families' real names.
  parents: {
    bride: { heading: "Daughter of", names: "Mr. & Mrs. Bride Parents" },
    groom: { heading: "Son of", names: "Mr. & Mrs. Groom Parents" },
  },
  // Parents as given in the storyboard (Marathi and English).
  parentsMr: {
    groom: "श्री. अनिल व सौ. सुनीता",
    bride: "श्री. विजय व सौ. मंगल",
  },
  parentsEn: {
    groom: "Son of Mr. Anil & Mrs. Sunita",
    bride: "Daughter of Mr. Vijay & Mrs. Mangal",
  },
  invitationMessage:
    "With the blessings of Lord Ganesha and the love of our families, we joyfully invite you to celebrate the beginning of our forever.",
  // Our Story: PLACEHOLDER copy. Replace each `text` (and optional `when` / `photo`) with the
  // couple's real details; the PRD asks for real details, not invented romantic copy.
  story: [
    { title: "The First Meeting", when: "Date / place", text: "Write how and where you first met.", photo: undefined as string | undefined },
    { title: "Getting to Know Each Other", when: "", text: "Write about the early days and what you discovered in each other.", photo: undefined as string | undefined },
    { title: "The Moment Everything Changed", when: "", text: "Write about the moment you knew, or the proposal.", photo: undefined as string | undefined },
    { title: "The Beginning of Forever", when: "", text: "Write about the families coming together and the road to the wedding.", photo: undefined as string | undefined },
  ],
  countdownDoneMessage: "Today is the day! Join us as we begin our forever.",
  // Placeholder schedule (event list from the storyboard): the family must confirm names, dates, times and venues.
  events: [
    {
      id: "haldi",
      art: "haldi",
      image: "/events/haldi.jpg",
      name: "Haldi",
      marathi: "हळद",
      start: "2027-02-26T10:00:00+05:30",
      tagline: "A Golden Celebration",
      venue: "Prabhat Lawns, Kothrud, Pune",
      mapUrl: "https://maps.google.com/?q=Shree+Mangal+Karyalaya+Pune",
      description:
        "A golden morning of turmeric, marigolds and laughter. Family gather to bless the couple with haldi, wishing them a life as bright as sunshine.",
      dressCode: [{ name: "Haldi Yellow", color: "#F2C12E" }, { name: "Marigold", color: "#E98A15" }, { name: "Ivory", color: "#FFF4D6" }],
    },
    {
      id: "mehendi",
      art: "mehendi",
      image: "/events/mehendi.jpg",
      name: "Mehendi",
      marathi: "मेहेंदी",
      start: "2027-02-26T15:00:00+05:30",
      tagline: "Hues of Love",
      venue: "Prabhat Lawns, Kothrud, Pune",
      mapUrl: "https://maps.google.com/?q=Shree+Mangal+Karyalaya+Pune",
      description:
        "An afternoon of henna, folk songs and sweet moments. Delicate designs bloom on every hand as the women of the family celebrate together.",
      dressCode: [{ name: "Leaf Green", color: "#5E8C4A" }, { name: "Rose Pink", color: "#D9578A" }, { name: "Mint", color: "#BFE0C8" }],
    },
    {
      id: "simant",
      art: "kalash",
      image: "/events/kalash.jpg",
      name: "Seemant Pujan",
      marathi: "सीमंत पूजन",
      start: "2027-02-26T18:00:00+05:30",
      tagline: "The Grand Welcome",
      venue: "Shree Mangal Karyalaya, Pune",
      mapUrl: "https://maps.google.com/?q=Shree+Mangal+Karyalaya+Pune",
      description:
        "The two families meet at the threshold for a warm, traditional welcome. The kalash is worshipped and the groom is received with love and blessings.",
      dressCode: [{ name: "Auspicious Red", color: "#B3202A" }, { name: "Antique Gold", color: "#D4A53C" }, { name: "Cream", color: "#F6EAD0" }],
    },
    {
      id: "antarpat",
      art: "antarpat",
      image: "/events/antarpat.jpg",
      name: "Antarpat & Mangalashtak",
      marathi: "अंतरपाट आणि मंगलाष्टक",
      start: "2027-02-26T20:00:00+05:30",
      tagline: "The Sacred Union",
      venue: "Shree Mangal Karyalaya, Pune",
      mapUrl: "https://maps.google.com/?q=Shree+Mangal+Karyalaya+Pune",
      description:
        "A silk curtain is held between the couple while the mangalashtak verses are sung. The curtain falls, garlands are exchanged and two lives begin to unite.",
      dressCode: [{ name: "Maroon", color: "#7A1F2B" }, { name: "Gold", color: "#D4A53C" }, { name: "Ivory", color: "#FBF3E0" }],
    },
    {
      id: "lagn",
      art: "lagn",
      image: "/events/lagn.jpg",
      name: "Lagn Sohala",
      marathi: "लग्न सोहळा",
      start: "2027-02-27T10:00:00+05:30",
      tagline: "The Wedding Ceremony",
      venue: "Shree Mangal Karyalaya, Pune",
      mapUrl: "https://maps.google.com/?q=Shree+Mangal+Karyalaya+Pune",
      description:
        "The heart of the celebration. Before the sacred fire, the couple take their vows through Kanyadaan and Saptapadi, and begin their forever.",
      dressCode: [{ name: "Nauvari Maroon", color: "#8B1A2B" }, { name: "Mustard Gold", color: "#D9A81E" }, { name: "Cream", color: "#F7EBD0" }],
    },
    {
      id: "reception",
      art: "reception",
      image: "/events/reception.jpg",
      name: "Reception",
      marathi: "रिसेप्शन",
      start: "2027-02-27T19:00:00+05:30",
      tagline: "An Evening of Celebration",
      venue: "The Grand Ballroom, Koregaon Park, Pune",
      mapUrl: "https://maps.google.com/?q=Shree+Mangal+Karyalaya+Pune",
      description:
        "An evening of good food, music and blessings with everyone we love. Come dressed in your most elegant best and celebrate the newly-weds with us.",
      dressCode: [{ name: "Royal Blue", color: "#243B7A" }, { name: "Rose Gold", color: "#C98B7B" }, { name: "Champagne", color: "#E9D6B5" }],
    },
  ],
  // Placeholder families. `photo` is optional (put the file in /public/family).
  families: [
    {
      side: "Bride's Family",
      marathi: "वधू पक्ष",
      surname: "Kulkarni Family",
      parents: ["Shri. Prakash Kulkarni", "Smt. Sunita Kulkarni"],
      message: "Please join us with your family to bless our beloved Sayeli.",
      members: ["आजी-आजोबा", "अथर्व", "काका-काकू", "मामा-मामी"],
      photo: "/family/bride.jpg" as string | undefined,
    },
    {
      side: "Groom's Family",
      marathi: "वर पक्ष",
      surname: "Deshpande Family", // example surname: replace with the real one
      parents: ["Shri. Anil Deshpande", "Smt. Sunita Deshpande"],
      message: "Please join us with your family to bless our dear Shreyash.",
      members: ["आजी-आजोबा", "काका-काकू", "मामा-मामी"],
      photo: "/family/groom.jpg" as string | undefined,
    },
  ],
  // Placeholder venue and travel info: replace with the real details.
  venue: {
    name: "Shree Mangal Karyalaya",
    city: "Pune",
    marathi: "विवाह स्थळ",
    address: "Shree Mangal Karyalaya, Pune, Maharashtra (add the street address and PIN)",
    mapUrl: "https://maps.google.com/?q=Shree+Mangal+Karyalaya+Pune",
    note: "Parking is available on site. Please arrive 15 minutes before the ceremony.",
  },
  // "Getting there" cards (By Air / By Train / By Road & Metro): placeholders, replace with the real details.
  travel: [
    { mode: "By Air", detail: "Pune International Airport (PNQ) · ~30 min" },
    { mode: "By Train", detail: "Pune Junction (PUNE) · ~25 min" },
    { mode: "By Road & Metro", detail: "Pune Metro / Valet Parking Available" },
  ],
  stays: [
    { name: "Hotel One", distance: "1.2 km from venue", tier: "Premium", phone: "+910000000001", link: "" },
    { name: "Hotel Two", distance: "3 km from venue", tier: "Mid-range", phone: "+910000000002", link: "" },
    { name: "Guest House", distance: "500 m from venue", tier: "Budget", phone: "", link: "" },
  ] as { name: string; distance: string; tier: string; phone: string; link: string }[],
  thankYouMessage:
    "Your presence made our celebration even more beautiful. Thank you for showering us with your love, blessings and happiness. We will cherish these memories forever.",
  finalNote: "Until we celebrate together, with all our love.",
  hashtag: "#SreyashWedsSayeli",
  // Placeholder contacts. Use digits with country code, no spaces (e.g. +919876543210).
  contacts: [
    { name: "Contact Name", role: "Bride's Brother", phone: "+910000000011" },
    { name: "Contact Name", role: "Groom's Sister", phone: "+910000000012" },
    { name: "Contact Name", role: "Guest Coordinator", phone: "+910000000013", note: "Stay, travel & pickups" },
    { name: "Contact Name", role: "Wedding Coordinator", phone: "+910000000014", note: "Venue, timings & rituals" },
  ] as { name: string; role: string; phone: string; note?: string }[],
  // Approved blessings shown on the wall. SAMPLE entries: replace with real, moderated ones.
  blessings: [
    { name: "Sample Guest", message: "May your journey together be filled with love, laughter and endless joy." },
    { name: "Sample Relative", message: "Ganpati Bappa Morya! Wishing you a lifetime of happiness and togetherness." },
    { name: "Sample Friend", message: "So happy for you both. Can't wait to celebrate with you!" },
  ],
  // Add real photos by setting `src` (put files in /public/gallery). Without `src`, a placeholder tile shows.
  // Photos live in /public/gallery. The middle one (index 2) is the hero of the Antarpat reveal.
  gallery: [
    { alt: "Blessed moment on the steps", caption: "Blessings", ratio: "4/5", tone: "gold", src: "/gallery/kiss.jpg" },
    { alt: "Couple in front of the pink Ganesh backdrop", caption: "Together", ratio: "4/5", tone: "gold", src: "/gallery/pink.jpg" },
    { alt: "Couple in traditional Maharashtrian attire", caption: "Forever Begins", ratio: "4/5", tone: "gold", src: "/gallery/hero.jpg" },
    { alt: "The bride arriving in a palkhi", caption: "The Palkhi", ratio: "4/5", tone: "gold", src: "/gallery/palki.jpg" },
    { alt: "Celebrating at the wedding ceremony", caption: "Celebration", ratio: "4/5", tone: "gold", src: "/gallery/dance.jpg" },
  ] as { alt: string; caption: string; ratio: string; tone: string; src?: string }[],
  // ISO string with explicit offset so the countdown is correct for any viewer (IST here).
  // Date is Sunday 28 Feb 2027; the 11:30 AM start time is a placeholder until confirmed.
  date: "2027-02-28T11:30:00+05:30",
  timeZone: "Asia/Kolkata",
  guestParam: "guest", // ?guest=Priya+Sharma
  guestFallback: "Guest",
};

/** [first, second] names in the order they appear on the invitation. */
export const coupleOrder: [string, string] = ["", ""];
export function refreshCoupleOrder() {
  const { bride, groom, showFirst } = wedding.couple;
  coupleOrder[0] = showFirst === "groom" ? groom : bride;
  coupleOrder[1] = showFirst === "groom" ? bride : groom;
}
refreshCoupleOrder();
