// Mock package data for the homepage & Smart Form prefill logic.
// This will be replaced by `GET /api/packages` once the NestJS backend is wired up (Phase 2).

export type PackageType =
  | "umrah_economy"
  | "umrah_vip"
  | "umrah_honeymoon"
  | "domestic_prebuilt"
  | "tourist_prebuilt";

export interface PackageItineraryDay {
  day: number;
  title: string;
  description: string;
}

export interface PackageDetails {
  duration?: string;
  groupSize?: string;
  departureDate?: string;
  returnDate?: string;
  hotel?: string;
  transport?: string;
  guide?: string;
  meals?: string;
  visa?: string;
  [key: string]: string | undefined;
}

export interface MockPackage {
  id: string;
  type: PackageType;
  title: string;
  price: number;
  currency: string;
  durationDays: number;
  includes: string[];
  image: string;
  excluded: string[];
  fullDescription: string;
  images: string[];
  details: PackageDetails;
  highlights: string[];
  itinerary?: PackageItineraryDay[];
}

export const mockPackages: MockPackage[] = [
  {
    id: "umrah-economy-1",
    type: "umrah_economy",
    title: "Economy Umrah - 10 Days",
    price: 45000,
    currency: "ETB",
    durationDays: 10,
    image: "/images/hero/hero-umra-2nd.jpg",
    images: ["/images/hero/hero-umra-2nd.jpg", "/images/hero/hero-benuna-image-domesetic-1st.jpg"],
    includes: [
      "Round-trip airfare (Ethiopian Airlines)",
      "Umrah visa processing",
      "Shared hotel room (10 min walk to Haram)",
      "Group transport in Saudi Arabia",
      "Imam guidance throughout the journey",
      "Daily breakfast and dinner",
      "Pre-departure training session",
    ],
    excluded: [
      "Personal expenses and souvenirs",
      "Lunch meals",
      "Excess baggage fees",
      "Travel insurance",
      "Any optional excursions",
    ],
    fullDescription:
      "Experience the spiritual journey of Umrah with our comprehensive economy package. Designed for pilgrims seeking a meaningful experience at an affordable price, this package includes comfortable shared accommodation, group transportation, and continuous guidance from our experienced Imams. Every detail is handled so you can focus entirely on your worship and spiritual growth.",
    highlights: [
      "IATA-certified agency — your travel is fully protected",
      "Experienced Imam guidance in Arabic, Amharic & English",
      "GPS group tracking for family peace of mind",
      "24/7 on-ground support in Saudi Arabia",
      "Pre-departure orientation included",
    ],
    details: {
      duration: "10 days",
      groupSize: "50 pilgrims maximum",
      departureDate: "December 15, 2026",
      returnDate: "December 25, 2026",
      hotel: "4-star hotel, 800m from Haram",
      transport: "Private air-conditioned buses",
      guide: "Experienced Imam (Arabic, Amharic, English)",
      meals: "Breakfast and dinner included",
      visa: "Umrah visa processing included",
    },
    itinerary: [
      { day: 1,  title: "Departure",        description: "Depart from Addis Ababa Bole International Airport to Jeddah" },
      { day: 2,  title: "Arrival & Rest",   description: "Arrive in Jeddah, transfer to Makkah hotel and settle in" },
      { day: 3,  title: "First Umrah",      description: "Guided Umrah rituals with Imam — Ihram, Tawaf, Sa'i" },
      { day: 4,  title: "Ziyarah Makkah",   description: "Visit holy sites in Makkah including Jabal Al-Nour" },
      { day: 5,  title: "Madinah Travel",   description: "Travel to Madinah, check in to hotel near Prophet's Mosque" },
      { day: 6,  title: "Madinah Prayers",  description: "Prayers at Al-Masjid an-Nabawi, visit Quba Mosque" },
      { day: 7,  title: "Madinah Ziyarah",  description: "Visit Uhud Mountain and other sacred sites in Madinah" },
      { day: 8,  title: "Return to Makkah", description: "Return to Makkah for additional worship time" },
      { day: 9,  title: "Second Umrah",     description: "Perform second Umrah (optional) and personal time" },
      { day: 10, title: "Return Home",      description: "Transfer to Jeddah airport, depart to Addis Ababa" },
    ],
  },
  {
    id: "umrah-vip-1",
    type: "umrah_vip",
    title: "VIP Umrah - 12 Days",
    price: 95000,
    currency: "ETB",
    durationDays: 12,
    image: "/images/hero/hero-umra-2nd.jpg",
    images: ["/images/hero/hero-umra-2nd.jpg"],
    includes: [
      "Round-trip airfare (Ethiopian Airlines)",
      "5-star hotel adjacent to Haram",
      "Private air-conditioned vehicle",
      "Dedicated personal Imam",
      "All meals (breakfast, lunch, dinner)",
      "Umrah visa processing",
      "VIP fast-track services at airports",
      "Exclusive Ziyarah tours",
    ],
    excluded: [
      "Personal expenses and shopping",
      "Business class upgrade (available at extra cost)",
      "Travel insurance",
    ],
    fullDescription:
      "The VIP Umrah package is crafted for pilgrims who seek the highest standard of comfort and personalized care on their spiritual journey. Stay in a 5-star hotel steps from the Haram, travel in private vehicles, and benefit from a dedicated Imam assigned solely to your group. Every moment is tailored to deepen your spiritual experience without any worldly inconvenience.",
    highlights: [
      "5-star hotel directly adjacent to the Haram",
      "Private vehicle — no shared transportation",
      "Dedicated Imam available around the clock",
      "All meals included at premium restaurants",
      "Exclusive small group (max 20) for intimate guidance",
    ],
    details: {
      duration: "12 days",
      groupSize: "20 pilgrims maximum",
      departureDate: "December 10, 2026",
      returnDate: "December 22, 2026",
      hotel: "5-star, directly adjacent to Haram",
      transport: "Private air-conditioned vehicle",
      guide: "Dedicated personal Imam",
      meals: "All meals included",
      visa: "Umrah visa processing included",
    },
    itinerary: [
      { day: 1,  title: "VIP Departure",    description: "Private airport lounge access, depart Addis Ababa" },
      { day: 2,  title: "Arrival Makkah",   description: "VIP transfer to 5-star hotel adjacent to Haram" },
      { day: 3,  title: "First Umrah",      description: "Private guided Umrah rituals at preferred time" },
      { day: 4,  title: "Makkah Worship",   description: "Personal worship time, exclusive Ziyarah tour" },
      { day: 5,  title: "Makkah Ziyarah",   description: "Visit Jabal Al-Nour, Jabal Thawr, historical sites" },
      { day: 6,  title: "Second Umrah",     description: "Second Umrah performance, Tawaf al-Nafl" },
      { day: 7,  title: "Madinah Transfer", description: "Private transfer to Madinah, 5-star hotel check-in" },
      { day: 8,  title: "Nabawi Mosque",    description: "Extended prayers at Prophet's Mosque with Imam" },
      { day: 9,  title: "Madinah Ziyarah",  description: "Exclusive guided tour of Quba, Uhud, Qiblatayn" },
      { day: 10, title: "Free Worship Day", description: "Personal worship and reflection time in Madinah" },
      { day: 11, title: "Return to Makkah", description: "Return for final Tawaf al-Wida" },
      { day: 12, title: "VIP Return",       description: "Private transfer to Jeddah, depart to Addis Ababa" },
    ],
  },
  {
    id: "umrah-honeymoon-1",
    type: "umrah_honeymoon",
    title: "Honeymoon Umrah - 14 Days",
    price: 130000,
    currency: "ETB",
    durationDays: 14,
    image: "/images/hero/hero-umra-2nd.jpg",
    images: ["/images/hero/hero-umra-2nd.jpg"],
    includes: [
      "Round-trip airfare for two",
      "Premium couple suite near Haram",
      "Private transport throughout",
      "Dedicated Imam + relationship counselor",
      "All meals at premium restaurants",
      "Umrah visa for both",
      "Couple Ziyarah tours",
      "Special Dua ceremony arrangement",
    ],
    excluded: [
      "Personal shopping",
      "Optional excursions outside itinerary",
      "Travel insurance",
    ],
    fullDescription:
      "Begin your life together with a blessed spiritual journey. The Honeymoon Umrah package is a deeply special experience designed for newlywed couples seeking both spiritual growth and romantic connection in the holiest cities on earth. You will share Umrah rituals, guided prayers, and meaningful moments together under the care of a dedicated Imam and counselor.",
    highlights: [
      "Exclusively designed for newlywed couples",
      "Premium couple suite with Haram views",
      "Joint Umrah rituals with dedicated Imam",
      "Marital blessing Dua ceremony",
      "Private romantic dinners arranged",
    ],
    details: {
      duration: "14 days",
      groupSize: "Couples only (max 10 couples)",
      departureDate: "January 5, 2027",
      returnDate: "January 19, 2027",
      hotel: "Premium couple suite, Haram view",
      transport: "Private vehicle for couple",
      guide: "Imam + certified Islamic marriage counselor",
      meals: "All meals at premium restaurants",
      visa: "Umrah visa for both partners included",
    },
  },
  {
    id: "domestic-1",
    type: "domestic_prebuilt",
    title: "Northern Circuit Explorer - 7 Days",
    price: 28000,
    currency: "ETB",
    durationDays: 7,
    image: "/images/hero/hero-benuna-image-domesetic-1st.jpg",
    images: ["/images/hero/hero-benuna-image-domesetic-1st.jpg"],
    includes: [
      "Round-trip domestic flights",
      "3-star hotel accommodation (6 nights)",
      "All ground transportation",
      "English & Amharic speaking guide",
      "Lalibela rock-hewn churches entrance",
      "Gondar Fasil Ghebbi entrance",
      "Axum obelisk sites tour",
      "Bahir Dar & Blue Nile Falls visit",
    ],
    excluded: [
      "International flights",
      "Lunches and dinners (except welcome dinner)",
      "Personal expenses",
      "Travel insurance",
      "Optional cultural shows",
    ],
    fullDescription:
      "Discover the ancient heart of Ethiopia on our most popular domestic tour. The Northern Circuit takes you through four UNESCO World Heritage Sites — Lalibela's stunning rock-hewn churches, Gondar's medieval castles, Axum's towering obelisks, and the breathtaking Blue Nile Falls near Bahir Dar. Led by expert local guides, this tour immerses you in 3,000 years of Ethiopian civilization.",
    highlights: [
      "4 UNESCO World Heritage Sites in one journey",
      "Expert local guides with deep cultural knowledge",
      "Comfortable 3-star hotels throughout",
      "Small group (max 16) for personal experience",
      "Fully customizable add-ons available",
    ],
    details: {
      duration: "7 days / 6 nights",
      groupSize: "16 travelers maximum",
      departureDate: "Every Saturday from Addis Ababa",
      hotel: "3-star hotels in each city",
      transport: "Private 4WD vehicles + domestic flights",
      guide: "English & Amharic speaking expert guide",
      meals: "Breakfast daily + welcome dinner",
      visa: "Not required for Ethiopian nationals",
    },
    itinerary: [
      { day: 1, title: "Addis → Lalibela",  description: "Morning flight to Lalibela. Check in and afternoon rest." },
      { day: 2, title: "Lalibela Churches",  description: "Full day guided tour of all 11 rock-hewn churches." },
      { day: 3, title: "Lalibela → Gondar",  description: "Morning flight to Gondar. Visit Fasil Ghebbi castles." },
      { day: 4, title: "Gondar → Axum",      description: "Morning flight to Axum. Tour obelisks and ancient ruins." },
      { day: 5, title: "Axum → Bahir Dar",   description: "Morning flight to Bahir Dar. Lake Tana boat trip." },
      { day: 6, title: "Blue Nile Falls",     description: "Visit Blue Nile Falls, afternoon at leisure." },
      { day: 7, title: "Bahir Dar → Addis",  description: "Morning flight back to Addis Ababa." },
    ],
  },
  {
    id: "domestic-2",
    type: "domestic_prebuilt",
    title: "Southern Adventure - 5 Days",
    price: 19500,
    currency: "ETB",
    durationDays: 5,
    image: "/images/hero/hero-benuna-image-domesetic-1st.jpg",
    images: ["/images/hero/hero-benuna-image-domesetic-1st.jpg"],
    includes: [
      "Comfortable overland transport (4WD)",
      "3-star hotel accommodation (4 nights)",
      "Amharic & English speaking guide",
      "Hawassa fish market tour",
      "Arba Minch boat tour (Nechisar NP)",
      "Omo Valley tribal village visits",
      "All breakfasts",
    ],
    excluded: [
      "Flights (overland tour)",
      "Lunches and dinners",
      "Photography fees at tribal villages",
      "Personal expenses",
      "Travel insurance",
    ],
    fullDescription:
      "Journey into Ethiopia's spectacular south — a region of stunning lakes, diverse wildlife, and some of Africa's most fascinating indigenous cultures. From the fish markets of Hawassa to the crocodile-filled waters of Arba Minch and the vibrant tribal cultures of the Omo Valley, this adventure offers experiences found nowhere else on earth.",
    highlights: [
      "Authentic Omo Valley tribal cultural encounters",
      "Crocodile and hippo boat safari in Arba Minch",
      "Fresh tilapia breakfast at Hawassa fish market",
      "Stunning Rift Valley lake landscapes",
      "Small group (max 12) for intimate experience",
    ],
    details: {
      duration: "5 days / 4 nights",
      groupSize: "12 travelers maximum",
      departureDate: "Every Wednesday from Addis Ababa",
      hotel: "3-star lodge/hotel accommodation",
      transport: "Private 4WD overland vehicle",
      guide: "Expert local guide (Amharic & English)",
      meals: "All breakfasts included",
    },
    itinerary: [
      { day: 1, title: "Addis → Hawassa",      description: "Drive south to Hawassa. Visit the famous fish market." },
      { day: 2, title: "Hawassa → Arba Minch", description: "Drive to Arba Minch. Afternoon boat safari." },
      { day: 3, title: "Nechisar Park",         description: "Game drive in Nechisar National Park." },
      { day: 4, title: "Omo Valley",            description: "Tribal village visits — Dorze, Konso." },
      { day: 5, title: "Return to Addis",       description: "Drive back to Addis Ababa via Shashemene." },
    ],
  },
  {
    id: "tourist-1",
    type: "tourist_prebuilt",
    title: "Historical Northern Circuit - 10 Days",
    price: 1450,
    currency: "USD",
    durationDays: 10,
    image: "/images/hero/hero-tecketing-3rd.jpg",
    images: ["/images/hero/hero-tecketing-3rd.jpg"],
    includes: [
      "All domestic flights within Ethiopia",
      "4-star hotel accommodation (9 nights)",
      "Multi-lingual guide (English, French, German)",
      "Airport transfers (international + domestic)",
      "All UNESCO site entrance fees",
      "Daily breakfast",
      "Welcome and farewell dinners",
      "Bottled water throughout",
    ],
    excluded: [
      "International flights to/from Addis Ababa",
      "Visa on arrival fee (~$52 USD)",
      "Lunches and most dinners",
      "Personal expenses",
      "Travel insurance (strongly recommended)",
      "Tips for guide and driver",
    ],
    fullDescription:
      "Ethiopia's Northern Historical Circuit is one of Africa's greatest journeys — a living museum spanning 3,000 years of continuous civilization. As an international visitor, you will experience world-class archaeological sites, medieval castles, ancient obelisks, and the extraordinary rock-hewn churches of Lalibela. Our international-standard package ensures comfort, deep cultural insight, and seamless logistics throughout.",
    highlights: [
      "4 UNESCO World Heritage Sites",
      "International-standard 4-star accommodation",
      "Multi-lingual expert guide",
      "Full entrance fees and airport transfers included",
      "Small group (max 12) for personalized experience",
    ],
    details: {
      duration: "10 days / 9 nights",
      groupSize: "12 international travelers maximum",
      departureDate: "Available year-round (weekly departures)",
      hotel: "4-star hotels throughout",
      transport: "Private vehicles + domestic flights",
      guide: "Multi-lingual expert guide (English/French/German)",
      meals: "Breakfast daily + welcome & farewell dinners",
      visa: "Visa on arrival available (~$52 USD, not included)",
    },
    itinerary: [
      { day: 1,  title: "Arrive Addis Ababa", description: "Airport welcome, transfer to hotel. Evening orientation." },
      { day: 2,  title: "Addis City Tour",    description: "National Museum, Mercato, ethnological museum tour." },
      { day: 3,  title: "Addis → Lalibela",  description: "Morning flight to Lalibela. Afternoon rest." },
      { day: 4,  title: "Lalibela Day 1",     description: "Northern group of rock-hewn churches with expert guide." },
      { day: 5,  title: "Lalibela Day 2",     description: "Southern group of churches, Bete Giyorgis (St. George)." },
      { day: 6,  title: "Lalibela → Gondar",  description: "Flight to Gondar. Royal Enclosure (Fasil Ghebbi) tour." },
      { day: 7,  title: "Gondar → Axum",      description: "Flight to Axum. Ancient obelisks and Queen of Sheba." },
      { day: 8,  title: "Axum → Bahir Dar",   description: "Flight to Bahir Dar. Lake Tana and island monasteries." },
      { day: 9,  title: "Blue Nile Falls",     description: "Blue Nile Falls excursion. Farewell dinner." },
      { day: 10, title: "Departure",          description: "Transfer to Addis Ababa airport for departure." },
    ],
  },
  {
    id: "tourist-2",
    type: "tourist_prebuilt",
    title: "Addis Ababa City Tour - 3 Days",
    price: 480,
    currency: "USD",
    durationDays: 3,
    image: "/images/hero/hero-tecketing-3rd.jpg",
    images: ["/images/hero/hero-tecketing-3rd.jpg"],
    includes: [
      "Airport pickup and drop-off",
      "4-star city hotel (2 nights)",
      "Multi-lingual guide (English, French)",
      "National Museum (Lucy fossil) entrance",
      "Ethnological Museum entrance",
      "Mercato market guided tour",
      "Ethiopian coffee ceremony experience",
      "All breakfasts",
    ],
    excluded: [
      "International flights",
      "Lunches and dinners",
      "Personal shopping",
      "Travel insurance",
    ],
    fullDescription:
      "Addis Ababa, one of Africa's most vibrant capitals, offers an incredible wealth of history, culture, and modern energy in a compact city experience. This 3-day tour gives international visitors a comprehensive introduction to Ethiopia's capital — from the 3.2 million year old Lucy fossil at the National Museum to the vast Mercato, Africa's largest open-air market, and a traditional Ethiopian coffee ceremony.",
    highlights: [
      "See Lucy — the world's most famous early human fossil",
      "Africa's largest market — Mercato — guided walk",
      "Authentic Ethiopian coffee ceremony",
      "Expert multi-lingual guide throughout",
      "Perfect introduction before longer Ethiopia tours",
    ],
    details: {
      duration: "3 days / 2 nights",
      groupSize: "10 travelers maximum",
      departureDate: "Daily departures available",
      hotel: "4-star city center hotel",
      transport: "Private air-conditioned vehicle",
      guide: "Expert guide (English & French)",
      meals: "All breakfasts included",
      visa: "Visa on arrival (~$52 USD, not included)",
    },
    itinerary: [
      { day: 1, title: "Arrival & Museum",  description: "Airport pickup, National Museum (Lucy), hotel check-in." },
      { day: 2, title: "Culture & Markets", description: "Mercato, Ethnological Museum, coffee ceremony experience." },
      { day: 3, title: "Departure",         description: "Final city drive, airport transfer." },
    ],
  },
];

export function getPackageById(id: string): MockPackage | undefined {
  return mockPackages.find((p) => p.id === id);
}
