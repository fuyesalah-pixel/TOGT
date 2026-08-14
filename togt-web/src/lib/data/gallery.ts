export interface GalleryVideo {
  url: string;
  title: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  image: string;
  description: string;
  images: string[];
  videos: GalleryVideo[];
  date: string;
  location: string;
}

export const galleryItems: GalleryItem[] = [
  {
    id: "umrah-2026-dec",
    title: "Umrah Journey — December 2026",
    category: "UMRAH",
    image: "/images/hero/hero-umra-2nd.jpg",
    description:
      "Our December 2026 Umrah group of 45 pilgrims completed their spiritual journey with our experienced Imams. The group visited Makkah and Madinah over 10 days with full accommodation, transportation, and dedicated guidance from start to finish.",
    images: [
      "/images/hero/hero-umra-2nd.jpg",
      "/images/hero/hero-IATA-partner-4th.jfif",
    ],
    videos: [],
    date: "December 2026",
    location: "Makkah & Madinah, Saudi Arabia",
  },
  {
    id: "lalibela-2026",
    title: "Lalibela Rock Churches Tour",
    category: "DOMESTIC",
    image: "/images/hero/hero-benuna-image-domesetic-1st.jpg",
    description:
      "A school group of 30 students and 4 teachers from Addis Ababa explored the extraordinary rock-hewn churches of Lalibela — UNESCO World Heritage Site and one of Ethiopia's most iconic destinations. Students gained deep historical and cultural insight under expert guide supervision.",
    images: [
      "/images/hero/hero-benuna-image-domesetic-1st.jpg",
    ],
    videos: [],
    date: "January 2026",
    location: "Lalibela, Amhara Region, Ethiopia",
  },
  {
    id: "iata-partnership-2026",
    title: "IATA Partnership Ceremony",
    category: "EVENT",
    image: "/images/hero/hero-IATA-partner-4th.jfif",
    description:
      "TOGT Tour & Travel proudly renewed its IATA accreditation in 2026, reaffirming our commitment to professional, transparent, and certified travel services. The ceremony was attended by airline representatives and travel industry leaders.",
    images: [
      "/images/hero/hero-IATA-partner-4th.jfif",
    ],
    videos: [],
    date: "March 2026",
    location: "Addis Ababa, Ethiopia",
  },
  {
    id: "international-tours-2026",
    title: "International Tourist Packages",
    category: "TOURIST",
    image: "/images/hero/hero-tecketing-3rd.jpg",
    description:
      "International visitors from Europe, the Middle East, and the Americas explored Ethiopia through our premium tourist packages. From the ancient obelisks of Axum to the castles of Gondar, our multi-lingual guides delivered world-class service.",
    images: [
      "/images/hero/hero-tecketing-3rd.jpg",
      "/images/hero/hero-benuna-image-domesetic-1st.jpg",
    ],
    videos: [],
    date: "February 2026",
    location: "Northern Circuit, Ethiopia",
  },
  {
    id: "visa-success-2026",
    title: "Visa Processing Success Stories",
    category: "VISA",
    image: "/images/hero/hero-visa-proccess-5th.jpg",
    description:
      "Over 200 families received successful visa processing through TOGT in 2026. Our team handled visit, medical, and family visas for clients traveling to the UAE, Saudi Arabia, Turkey, and beyond — with a 98% approval rate.",
    images: [
      "/images/hero/hero-visa-proccess-5th.jpg",
    ],
    videos: [],
    date: "2026 Year in Review",
    location: "Addis Ababa, Ethiopia",
  },
  {
    id: "corporate-travel-2026",
    title: "Corporate Travel Program",
    category: "EVENT",
    image: "/images/hero/hero-tecketing-3rd.jpg",
    description:
      "TOGT managed corporate travel for several Ethiopian companies in 2026, providing seamless booking, group rates, and dedicated account management for business travelers flying to regional and international destinations.",
    images: [
      "/images/hero/hero-tecketing-3rd.jpg",
    ],
    videos: [],
    date: "Throughout 2026",
    location: "Multiple Destinations",
  },
];

// Category badge colors
export const CATEGORY_COLORS: Record<string, string> = {
  UMRAH:    "#FF9300",
  DOMESTIC: "#276749",
  TOURIST:  "#553C9A",
  EVENT:    "#1F67B1",
  VISA:     "#C53030",
};
