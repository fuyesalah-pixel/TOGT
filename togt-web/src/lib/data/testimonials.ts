export interface Testimonial {
  id: string;
  name: string;
  service: string;
  rating: number;
  text: string;
}

export const testimonials: Testimonial[] = [
  { id: "t1", name: "Fatima A.", service: "VIP Umrah Package", rating: 5, text: "An unforgettable spiritual journey. The Imam guide and hotel near the Haram made everything seamless." },
  { id: "t2", name: "Daniel T.", service: "Ticket Office", rating: 5, text: "Got my ticket reissued within a day. Transparent pricing and great customer service." },
  { id: "t3", name: "Sara M.", service: "Domestic Tour - Lalibela", rating: 5, text: "Our school trip to Lalibela was so well organized. The guide was knowledgeable and the kids loved it." },
  { id: "t4", name: "James K.", service: "Foreigner Tour", rating: 4, text: "Airport pickup to departure, everything was handled perfectly. Ethiopia is beautiful!" },
  { id: "t5", name: "Amina H.", service: "Visa Processing", rating: 5, text: "TOGT handled my medical visa application with such care. Approved faster than I expected." },
  { id: "t6", name: "Robel G.", service: "Honeymoon Umrah Gift", rating: 5, text: "I gifted this package to my parents. The half-gift option made it affordable and meaningful." },
  { id: "t7", name: "Liya B.", service: "Corporate Trip", rating: 5, text: "Our company retreat to Hawassa was flawless \u2014 professional service from start to finish." },
  { id: "t8", name: "Omar S.", service: "Economy Umrah Package", rating: 4, text: "Affordable and well organized. Will book again for Hajj season." },
  { id: "t9", name: "Emily R.", service: "Foreigner Tour", rating: 5, text: "Our multi-lingual guide made the Northern Circuit tour magical. Highly recommend TOGT!" },
];
