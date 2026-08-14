export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const faqItems: FaqItem[] = [
  {
    id: "faq-1",
    question: "Is TOGT an officially accredited travel agency?",
    answer:
      "Yes, TOGT is an IATA (International Air Transport Association) accredited member agency, giving us direct access to official airline ticketing systems.",
  },
  {
    id: "faq-2",
    question: "What Umrah package options are available?",
    answer:
      "We offer Economy, VIP, and Honeymoon packages, plus a fully Custom option where you choose hotel tier, transport, and group size.",
  },
  {
    id: "faq-3",
    question: "Can I gift an Umrah package to someone else?",
    answer:
      "Yes! You can send a Full Gift (100% paid by you) or a Half Gift (you pay 50%, recipient pays the remaining 50% before travel).",
  },
  {
    id: "faq-4",
    question: "How long does visa processing take?",
    answer:
      "Processing times vary by visa type and destination country, but we keep you updated at every step \u2014 from document collection to embassy submission and collection.",
  },
  {
    id: "faq-5",
    question: "Do you offer tours for foreign visitors to Ethiopia?",
    answer:
      "Yes, our airport-to-airport service covers pickup, multi-lingual guided tours, accommodation, and departure assistance for international visitors.",
  },
  {
    id: "faq-6",
    question: "Can I request a refund for my flight ticket?",
    answer:
      "Refunds are processed according to IATA regulations and airline-specific rules. Our ticket office will explain your ticket's refund eligibility and expected processing time (typically 7-30 business days).",
  },
];
