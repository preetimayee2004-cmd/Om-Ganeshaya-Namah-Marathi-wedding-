// Single source of truth for the invitation template.
// Change names, dates and photos here; no component should hard-code them.
export const wedding = {
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
      name: "Haldi",
      marathi: "हळद",
      start: "2027-02-26T10:00:00+05:30",
      tagline: "A Golden Celebration",
      venue: "Venue name, Pune",
      mapUrl: "https://maps.google.com/?q=Shree+Mangal+Karyalaya+Pune",
      description:
        "A joyful turmeric ceremony with family, music and laughter.",
    },
    {
      id: "mehendi",
      art: "mehendi",
      name: "Mehendi",
      marathi: "मेहेंदी",
      start: "2027-02-26T15:00:00+05:30",
      tagline: "Hues of Love",
      venue: "Venue name, Pune",
      mapUrl: "https://maps.google.com/?q=Shree+Mangal+Karyalaya+Pune",
      description:
        "Henna, songs and sweet moments with the women of the family.",
    },
    {
      id: "simant",
      art: "kalash",
      name: "Seemant Pujan",
      marathi: "सीमंत पूजन",
      start: "2027-02-26T18:00:00+05:30",
      tagline: "The Grand Welcome",
      venue: "Venue name, Pune",
      mapUrl: "https://maps.google.com/?q=Shree+Mangal+Karyalaya+Pune",
      description:
        "The two families meet at the threshold in a warm, traditional welcome.",
    },
    {
      id: "antarpat",
      art: "antarpat",
      name: "Antarpat & Mangalashtak",
      marathi: "अंतरपाट आणि मंगलाष्टक",
      start: "2027-02-26T20:00:00+05:30",
      tagline: "The Sacred Union",
      venue: "Venue name, Pune",
      mapUrl: "https://maps.google.com/?q=Shree+Mangal+Karyalaya+Pune",
      description:
        "The antarpat is held between the couple while the mangalashtak verses are sung.",
    },
    {
      id: "lagn",
      art: "lagn",
      name: "Lagn Sohala",
      marathi: "लग्न सोहळा",
      start: "2027-02-27T10:00:00+05:30",
      tagline: "The Wedding Ceremony",
      venue: "Shree Mangal Karyalaya, Pune",
      mapUrl: "https://maps.google.com/?q=Shree+Mangal+Karyalaya+Pune",
      description:
        "Kanyadaan and Saptapadi: the sacred rituals that unite the couple.",
    },
    {
      id: "reception",
      art: "reception",
      name: "Reception",
      marathi: "रिसेप्शन",
      start: "2027-02-27T19:00:00+05:30",
      tagline: "An Evening of Celebration",
      venue: "Venue name, Pune",
      mapUrl: "https://maps.google.com/?q=Shree+Mangal+Karyalaya+Pune",
      description:
        "An evening of good food, music and blessings with everyone we love.",
    },
  ],
  // Placeholder families. `photo` is optional (put the file in /public/family).
  families: [
    {
      side: "Bride's Family",
      marathi: "वधू पक्ष",
      surname: "Bride Surname Family",
      parents: ["Mr. Father Name", "Mrs. Mother Name"],
      message: "A personal message from the bride's family goes here.",
      members: ["Grandparents' names", "Siblings' names", "Uncles & Aunts"],
      photo: undefined as string | undefined,
    },
    {
      side: "Groom's Family",
      marathi: "वर पक्ष",
      surname: "Groom Surname Family",
      parents: ["Mr. Father Name", "Mrs. Mother Name"],
      message: "A personal message from the groom's family goes here.",
      members: ["Grandparents' names", "Siblings' names", "Uncles & Aunts"],
      photo: undefined as string | undefined,
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
  travel: [
    { mode: "By air", detail: "Nearest airport: City Airport, about 25 km (45 min by taxi)." },
    { mode: "By rail", detail: "Nearest station: City Junction, about 8 km (20 min by auto or taxi)." },
    { mode: "By road", detail: "Well connected by highway; cabs and autos are readily available." },
  ],
  stays: [
    { name: "Hotel One", distance: "1.2 km from venue", tier: "Premium", phone: "+910000000001", link: "" },
    { name: "Hotel Two", distance: "3 km from venue", tier: "Mid-range", phone: "+910000000002", link: "" },
    { name: "Guest House", distance: "500 m from venue", tier: "Budget", phone: "", link: "" },
  ] as { name: string; distance: string; tier: string; phone: string; link: string }[],
  thankYouMessage:
    "Your presence, love and blessings mean more to us than words can express. We cannot wait to celebrate this beautiful beginning with you.",
  finalNote: "Until we celebrate together, with all our love.",
  hashtag: "#SreyashWedsSayeli",
  // Placeholder contacts. Use digits with country code, no spaces (e.g. +919876543210).
  contacts: [
    { name: "Contact Person 1", role: "Bride's family", phone: "+910000000011" },
    { name: "Contact Person 2", role: "Groom's family", phone: "+910000000012" },
    { name: "Contact Person 3", role: "Travel & stay help", phone: "+910000000013" },
  ],
  // Approved blessings shown on the wall. SAMPLE entries: replace with real, moderated ones.
  blessings: [
    { name: "Sample Guest", message: "May your journey together be filled with love, laughter and endless joy." },
    { name: "Sample Relative", message: "Ganpati Bappa Morya! Wishing you a lifetime of happiness and togetherness." },
    { name: "Sample Friend", message: "So happy for you both. Can't wait to celebrate with you!" },
  ],
  // Add real photos by setting `src` (put files in /public/gallery). Without `src`, a placeholder tile shows.
  gallery: [
    { alt: "Engagement portrait", caption: "Engagement", ratio: "3/4", tone: "wine" },
    { alt: "Pre-wedding photograph", caption: "Pre-wedding", ratio: "1/1", tone: "olive" },
    { alt: "Couple portrait", caption: "Together", ratio: "4/5", tone: "blush" },
    { alt: "Candid moment", caption: "Candid", ratio: "4/3", tone: "gold" },
    { alt: "Family photograph", caption: "Family", ratio: "4/3", tone: "olive" },
    { alt: "Couple at sunset", caption: "Golden hour", ratio: "3/4", tone: "wine" },
    { alt: "Ring ceremony", caption: "The ring", ratio: "1/1", tone: "gold" },
    { alt: "Laughing together", caption: "Laughter", ratio: "4/5", tone: "blush" },
  ] as { alt: string; caption: string; ratio: string; tone: string; src?: string }[],
  // ISO string with explicit offset so the countdown is correct for any viewer (IST here).
  // Date is Sunday 28 Feb 2027; the 11:30 AM start time is a placeholder until confirmed.
  date: "2027-02-28T11:30:00+05:30",
  timeZone: "Asia/Kolkata",
  guestParam: "guest", // ?guest=Priya+Sharma
  guestFallback: "Guest",
} as const;

/** [first, second] names in the order they appear on the invitation. */
export const coupleOrder: readonly [string, string] =
  wedding.couple.showFirst === "groom"
    ? [wedding.couple.groom, wedding.couple.bride]
    : [wedding.couple.bride, wedding.couple.groom];
