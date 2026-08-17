import { z } from "zod";

const contactBase = {
  fullName: z.string().min(2),
  phone: z.string().min(6),
  email: z.string().email(),
};

export const AIRLINES = [
  "Ethiopian Airlines", "Emirates", "Qatar Airways", "Turkish Airlines", "Saudia",
  "FlyDubai", "EgyptAir", "Kenya Airways", "Lufthansa", "Air France",
  "British Airways", "Delta Air Lines", "American Airlines", "United Airlines",
  "KLM Royal Dutch Airlines", "Singapore Airlines", "Etihad Airways", "Air Canada",
  "Qantas", "Swiss International Air Lines", "Austrian Airlines", "Brussels Airlines",
  "Aegean Airlines", "Air India", "All Nippon Airways (ANA)", "Asiana Airlines",
  "Cathay Pacific", "China Eastern Airlines", "China Southern Airlines", "Garuda Indonesia",
  "Japan Airlines", "Korean Air", "Malaysia Airlines", "Philippine Airlines",
  "Thai Airways", "Vietnam Airlines", "Air New Zealand", "Avianca",
  "Azul Brazilian Airlines", "Copa Airlines", "LATAM Airlines", "Aeromexico",
  "Air Astana", "Air Mauritius", "Royal Air Maroc", "RwandAir",
  "South African Airways", "Oman Air", "Gulf Air", "Kuwait Airways",
] as const;

export const COUNTRIES = [
  "Ethiopia", "United Arab Emirates", "Saudi Arabia", "Turkey", "India",
  "China", "Thailand", "United States", "United Kingdom", "Canada",
  "Germany", "France", "Italy", "Qatar", "Kuwait", "Egypt", "Kenya",
  "Djibouti", "South Africa", "Morocco", "Tanzania", "Rwanda", "Uganda",
  "Sudan", "Somalia", "Eritrea", "Yemen", "Oman", "Bahrain", "Jordan",
  "Lebanon", "Iran", "Iraq", "Pakistan", "Bangladesh", "Sri Lanka",
  "Nepal", "Maldives", "Indonesia", "Malaysia", "Singapore", "Philippines",
  "Vietnam", "Cambodia", "Laos", "Myanmar", "Mongolia", "Japan", "South Korea",
  "Australia", "New Zealand", "Brazil", "Argentina", "Chile", "Colombia",
  "Peru", "Mexico", "Cuba", "Jamaica", "Spain", "Portugal", "Netherlands",
  "Belgium", "Sweden", "Norway", "Denmark", "Finland", "Switzerland",
  "Austria", "Greece", "Poland", "Czech Republic", "Hungary", "Romania",
  "Bulgaria", "Croatia", "Serbia", "Ireland", "Iceland", "Russia", "Ukraine",
  "Belarus", "Estonia", "Latvia", "Lithuania", "Belize", "Costa Rica",
  "Guatemala", "Honduras", "Nicaragua", "Panama", "Dominican Republic",
  "Puerto Rico", "Venezuela", "Bolivia", "Ecuador", "Paraguay", "Uruguay",
] as const;

export const NATIONALITIES = [...COUNTRIES];

export const ticketFormSchema = z.object({
  ...contactBase,
  passportNumber: z.string().min(4),
  passportIssuedDate: z.string().min(1),
  passportExpiry: z.string().min(1),
  dob: z.string().min(1),
  nationality: z.string().min(2),
  origin: z.string().min(2),
  destination: z.string().min(2),
  departureDate: z.string().min(1),
  returnDate: z.string().optional(),
  cabinClass: z.enum(["economy", "premium_economy", "business", "first"]),
  passengerCount: z.number().int().min(1),
  children: z.number().int().min(0),
  infants: z.number().int().min(0),
  airlinePreference: z.string().min(1),
  specialRequirements: z.string().optional(),
});
export type TicketFormValues = z.infer<typeof ticketFormSchema>;

export const umrahFormSchema = z
  .object({
    ...contactBase,
    packageId: z.string().optional(),
    packageType: z.enum(["umrah_economy", "umrah_vip", "umrah_honeymoon", "umrah_custom"]),
    hotelTier: z.string().optional(),
    transportType: z.string().optional(),
    groupSize: z.number().int().min(1),
    includeImam: z.boolean(),
    preferredDates: z.string().min(1),
    numberOfTravelers: z.number().int().min(1),
    passportNumber: z.string().min(4),
    passportExpiry: z.string().min(1),
    mahramRelationship: z.string().optional(),
    isGift: z.boolean(),
    giftType: z.enum(["full", "half"]).optional(),
    recipientName: z.string().optional(),
    recipientPhone: z.string().optional(),
    recipientEmail: z.string().optional(),
  })
  .refine(
    (data) => !data.isGift || (data.giftType && data.recipientName && data.recipientPhone),
    { message: "Recipient details are required for gift bookings", path: ["recipientName"] }
  );
export type UmrahFormValues = z.infer<typeof umrahFormSchema>;

export const domesticFormSchema = z.object({
  ...contactBase,
  packageId: z.string().optional(),
  segment: z.enum(["school", "honeymoon", "friends", "corporate", "custom"]),
  destinations: z.string().min(1),
  dates: z.string().min(1),
  groupSize: z.number().int().min(1),
  transportPreference: z.string().optional(),
  hotelTier: z.string().optional(),
});
export type DomesticFormValues = z.infer<typeof domesticFormSchema>;

export const touristFormSchema = z
  .object({
    ...contactBase,
    packageId: z.string().optional(),
    route: z.string().min(1),
    arrivalDate: z.string().min(1),
    departureDate: z.string().min(1),
    preferredLanguage: z.string().min(1),
    interests: z.string().optional(),
    numberOfTravelers: z.number().int().min(1),
    nationality: z.string().min(2),
    needTicket: z.boolean(),
    ticketAirline: z.string().optional(),
    ticketCabinClass: z.enum(["economy", "premium_economy", "business", "first"]).optional(),
    ticketDepartureDate: z.string().optional(),
    ticketReturnDate: z.string().optional(),
    ticketPassportIssuedDate: z.string().optional(),
    ticketChildren: z.number().int().min(0).optional(),
    ticketInfants: z.number().int().min(0).optional(),
  })
  .refine(
    (data) =>
      !data.needTicket ||
      (data.ticketAirline && data.ticketCabinClass && data.ticketDepartureDate && data.ticketReturnDate),
    {
      message: "Flight details are required when booking a ticket",
      path: ["ticketAirline"],
    }
  );
export type TouristFormValues = z.infer<typeof touristFormSchema>;

export const visaFormSchema = z
  .object({
    ...contactBase,
    visaType: z.enum(["visit", "educational", "merchant", "medical", "family"]),
    nationality: z.string().min(2),
    destinationCountry: z.string().min(2),
    purposeDetails: z.string().min(4),
    sponsorRelationship: z.string().optional(),
    hospitalName: z.string().optional(),
    passportNumber: z.string().min(4),
    passportIssuedDate: z.string().min(1),
    passportExpiry: z.string().min(1),
    needTicket: z.boolean(),
    ticketAirline: z.string().optional(),
    ticketCabinClass: z.enum(["economy", "premium_economy", "business", "first"]).optional(),
    ticketDepartureDate: z.string().optional(),
    ticketReturnDate: z.string().optional(),
  })
  .refine(
    (data) =>
      !data.needTicket ||
      (data.ticketAirline && data.ticketCabinClass && data.ticketDepartureDate && data.ticketReturnDate),
    {
      message: "Flight details are required when booking a ticket",
      path: ["ticketAirline"],
    }
  );
export type VisaFormValues = z.infer<typeof visaFormSchema>;

export const foreignTravelFormSchema = z.object({
  ...contactBase,
  destinationCountry: z.string().min(2),
  departureDate: z.string().min(1),
  returnDate: z.string().min(1),
  adults: z.number().int().min(1),
  children: z.number().int().min(0),
  infants: z.number().int().min(0),
  cabinClass: z.enum(["economy", "premium_economy", "business", "first"]),
  airlinePreference: z.string().min(1),
  passportNumber: z.string().min(4),
  passportIssuedDate: z.string().min(1),
  passportExpiry: z.string().min(1),
  additionalRequirements: z.string().optional(),
});
export type ForeignTravelFormValues = z.infer<typeof foreignTravelFormSchema>;

export const contactFormSchema = z.object({
  ...contactBase,
  subject: z.string().min(2),
  message: z.string().min(5),
});
export type ContactFormValues = z.infer<typeof contactFormSchema>;
