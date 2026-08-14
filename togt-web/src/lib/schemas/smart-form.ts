import { z } from "zod";

// These schemas mirror the NestJS DTOs that will validate `POST /api/service-requests`
// (and the service-line-specific endpoints) once the backend is wired up (Phase 2).
// See docs/database-schema.md for the full field mapping.

const contactBase = {
  fullName: z.string().min(2),
  phone: z.string().min(6),
  email: z.string().email(),
};

export const ticketFormSchema = z.object({
  ...contactBase,
  passportNumber: z.string().min(4),
  passportExpiry: z.string().min(1),
  dob: z.string().min(1),
  nationality: z.string().min(2),
  origin: z.string().min(2),
  destination: z.string().min(2),
  departureDate: z.string().min(1),
  returnDate: z.string().optional(),
  cabinClass: z.enum(["economy", "business", "first"]),
  passengerCount: z.number().int().min(1),
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

export const touristFormSchema = z.object({
  ...contactBase,
  packageId: z.string().optional(),
  route: z.string().min(1),
  arrivalDate: z.string().min(1),
  departureDate: z.string().min(1),
  preferredLanguage: z.string().min(1),
  interests: z.string().optional(),
  numberOfTravelers: z.number().int().min(1),
  nationality: z.string().min(2),
});
export type TouristFormValues = z.infer<typeof touristFormSchema>;

export const visaFormSchema = z.object({
  ...contactBase,
  visaType: z.enum(["visit", "medical", "family"]),
  destinationCountry: z.string().min(2),
  purposeDetails: z.string().min(4),
  sponsorRelationship: z.string().optional(),
  hospitalName: z.string().optional(),
  passportNumber: z.string().min(4),
  passportExpiry: z.string().min(1),
});
export type VisaFormValues = z.infer<typeof visaFormSchema>;

export const contactFormSchema = z.object({
  ...contactBase,
  subject: z.string().min(2),
  message: z.string().min(5),
});
export type ContactFormValues = z.infer<typeof contactFormSchema>;
