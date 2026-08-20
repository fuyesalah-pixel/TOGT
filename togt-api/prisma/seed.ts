/* eslint-disable no-console */
import { PrismaClient, PackageType, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding TOGT database...');

  // ── Users ────────────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@togt.com' },
    update: { role: Role.ADMIN },
    create: {
      email: 'admin@togt.com',
      googleId: 'seed-admin',
      fullName: 'TOGT Administrator',
      role: Role.ADMIN,
    },
  });

  const worker = await prisma.user.upsert({
    where: { email: 'worker@togt.com' },
    update: {},
    create: {
      email: 'worker@togt.com',
      googleId: 'seed-worker',
      fullName: 'Wubit Alemu',
      role: Role.WORKER,
      phone: '+251911000001',
    },
  });

  const guide = await prisma.user.upsert({
    where: { email: 'guide@togt.com' },
    update: {},
    create: {
      email: 'guide@togt.com',
      googleId: 'seed-guide',
      fullName: 'Ahmed Hassan',
      role: Role.GUIDE,
      phone: '+251911000002',
    },
  });

  const tech = await prisma.user.upsert({
    where: { email: 'tech@togt.com' },
    update: { role: Role.TECH },
    create: {
      email: 'tech@togt.com',
      googleId: 'seed-tech',
      fullName: 'TOGT Tech',
      role: Role.TECH,
    },
  });

  const customers = await Promise.all(
    [
      { email: 'customer1@togt.com', fullName: 'Fatima Ali', phone: '+251911000011' },
      { email: 'customer2@togt.com', fullName: 'Daniel Tesfaye', phone: '+251911000012' },
      { email: 'customer3@togt.com', fullName: 'Sara Mohammed', phone: '+251911000013' },
    ].map((c, i) =>
      prisma.user.upsert({
        where: { email: c.email },
        update: {},
        create: { ...c, googleId: `seed-customer-${i + 1}`, role: Role.CUSTOMER },
      }),
    ),
  );

  // ── Packages (from the former frontend mock catalog) ─────────────────────
  const packages: Array<{
    title: string;
    type: PackageType;
    price: number;
    currency: string;
    duration: string;
    image: string;
    destination?: string;
    includes: string[];
    excludes: string[];
    description: string;
  }> = [
    {
      title: 'Economy Umrah - 10 Days',
      type: PackageType.UMRAH_ECONOMY,
      price: 45000,
      currency: 'ETB',
      duration: '10 days',
      image: '/images/packages/umrah-economy.jpg',
      includes: [
        'Round-trip airfare (Ethiopian Airlines)',
        'Umrah visa processing',
        'Shared hotel room (10 min walk to Haram)',
        'Group transport in Saudi Arabia',
        'Imam guidance throughout the journey',
        'Daily breakfast and dinner',
        'Pre-departure training session',
      ],
      excludes: ['Personal expenses and souvenirs', 'Lunch meals', 'Excess baggage fees', 'Travel insurance', 'Any optional excursions'],
      description:
        'Experience the spiritual journey of Umrah with our comprehensive economy package. Comfortable shared accommodation, group transportation, and continuous guidance from experienced Imams.',
    },
    {
      title: 'VIP Umrah - 12 Days',
      type: PackageType.UMRAH_VIP,
      price: 95000,
      currency: 'ETB',
      duration: '12 days',
      image: '/images/packages/umrah-vip.jpg',
      includes: [
        'Round-trip airfare (Ethiopian Airlines)',
        '5-star hotel adjacent to Haram',
        'Private air-conditioned vehicle',
        'Dedicated personal Imam',
        'All meals (breakfast, lunch, dinner)',
        'Umrah visa processing',
        'VIP fast-track services at airports',
        'Exclusive Ziyarah tours',
      ],
      excludes: ['Personal expenses and shopping', 'Business class upgrade', 'Travel insurance'],
      description:
        'The VIP Umrah package is crafted for pilgrims who seek the highest standard of comfort and personalized care on their spiritual journey.',
    },
    {
      title: 'Honeymoon Umrah - 14 Days',
      type: PackageType.UMRAH_HONEYMOON,
      price: 130000,
      currency: 'ETB',
      duration: '14 days',
      image: '/images/packages/umrah-honeymoon.jpg',
      includes: [
        'Round-trip airfare for two',
        'Premium couple suite near Haram',
        'Private transport throughout',
        'Dedicated Imam + relationship counselor',
        'All meals at premium restaurants',
        'Umrah visa for both',
        'Couple Ziyarah tours',
        'Special Dua ceremony arrangement',
      ],
      excludes: ['Personal shopping', 'Optional excursions outside itinerary', 'Travel insurance'],
      description:
        'Begin your life together with a blessed spiritual journey. A deeply special experience designed for newlywed couples in the holiest cities on earth.',
    },
    {
      title: 'Northern Circuit Explorer - 7 Days',
      type: PackageType.DOMESTIC_PREBUILT,
      price: 28000,
      currency: 'ETB',
      duration: '7 days / 6 nights',
      image: '/images/packages/domestic-northern.jpg',
      includes: [
        'Round-trip domestic flights',
        '3-star hotel accommodation (6 nights)',
        'All ground transportation',
        'English & Amharic speaking guide',
        'Lalibela rock-hewn churches entrance',
        'Gondar Fasil Ghebbi entrance',
        'Axum obelisk sites tour',
        'Bahir Dar & Blue Nile Falls visit',
      ],
      excludes: ['International flights', 'Lunches and dinners', 'Personal expenses', 'Travel insurance', 'Optional cultural shows'],
      description:
        "Discover the ancient heart of Ethiopia — Lalibela's rock-hewn churches, Gondar's castles, Axum's obelisks, and the Blue Nile Falls.",
    },
    {
      title: 'Southern Adventure - 5 Days',
      type: PackageType.DOMESTIC_PREBUILT,
      price: 19500,
      currency: 'ETB',
      duration: '5 days / 4 nights',
      image: '/images/packages/domestic-southern.jpg',
      includes: [
        'Comfortable overland transport (4WD)',
        '3-star hotel accommodation (4 nights)',
        'Amharic & English speaking guide',
        'Hawassa fish market tour',
        'Arba Minch boat tour (Nechisar NP)',
        'Omo Valley tribal village visits',
        'All breakfasts',
      ],
      excludes: ['Flights (overland tour)', 'Lunches and dinners', 'Photography fees at tribal villages', 'Personal expenses', 'Travel insurance'],
      description:
        "Journey into Ethiopia's spectacular south — stunning lakes, diverse wildlife, and fascinating indigenous cultures of the Omo Valley.",
    },
    {
      title: 'Historical Northern Circuit - 10 Days',
      type: PackageType.TOURIST_PREBUILT,
      price: 1450,
      currency: 'USD',
      duration: '10 days / 9 nights',
      image: '/images/packages/tourist-historical.jpg',
      includes: [
        'All domestic flights within Ethiopia',
        '4-star hotel accommodation (9 nights)',
        'Multi-lingual guide (English, French, German)',
        'Airport transfers (international + domestic)',
        'All UNESCO site entrance fees',
        'Daily breakfast',
        'Welcome and farewell dinners',
        'Bottled water throughout',
      ],
      excludes: ['International flights to/from Addis Ababa', 'Visa on arrival fee (~$52 USD)', 'Lunches and most dinners', 'Personal expenses', 'Travel insurance', 'Tips for guide and driver'],
      description:
        "Ethiopia's Northern Historical Circuit — a living museum spanning 3,000 years of continuous civilization, at international standard.",
    },
    {
      title: 'Addis Ababa City Tour - 3 Days',
      type: PackageType.TOURIST_PREBUILT,
      price: 480,
      currency: 'USD',
      duration: '3 days / 2 nights',
      image: '/images/packages/tourist-city.jpg',
      includes: [
        'Airport pickup and drop-off',
        '4-star city hotel (2 nights)',
        'Multi-lingual guide (English, French)',
        'National Museum (Lucy fossil) entrance',
        'Ethnological Museum entrance',
        'Mercato market guided tour',
        'Ethiopian coffee ceremony experience',
        'All breakfasts',
      ],
      excludes: ['International flights', 'Lunches and dinners', 'Personal shopping', 'Travel insurance'],
      description:
        'A comprehensive 3-day introduction to Addis Ababa — from the Lucy fossil to the vast Mercato and a traditional coffee ceremony.',
    },
    {
      title: 'Dubai Getaway - 5 Days',
      type: PackageType.FOREIGN_PREBUILT,
      price: 45000,
      currency: 'ETB',
      duration: '5 days / 4 nights',
      image: '/images/packages/dubai.jpg',
      destination: 'United Arab Emirates',
      includes: [
        'Round-trip airfare (Ethiopian Airlines)',
        '4-star hotel in central Dubai (4 nights)',
        'Airport transfers in Dubai',
        'Burj Khalifa observation deck entry',
        'Desert safari with BBQ dinner',
        'Daily breakfast',
      ],
      excludes: ['UAE visa fee (~$90 USD)', 'Lunches and most dinners', 'Personal shopping', 'Travel insurance', 'Optional tour add-ons'],
      description:
        'Experience the luxury and wonder of Dubai on this 5-day curated getaway from Addis Ababa — Burj Khalifa, desert safari, and more.',
    },
    {
      title: 'Istanbul Adventure - 7 Days',
      type: PackageType.FOREIGN_PREBUILT,
      price: 65000,
      currency: 'ETB',
      duration: '7 days / 6 nights',
      image: '/images/packages/istanbul.jpg',
      destination: 'Turkey',
      includes: [
        'Round-trip airfare',
        '4-star hotel in Sultanahmet (6 nights)',
        'Airport transfers in Istanbul',
        'Hagia Sophia, Blue Mosque, Topkapi Palace entry',
        'Bosphorus cruise',
        'Daily breakfast',
        'English-speaking local guide',
      ],
      excludes: ['Turkey e-visa fee (~$50 USD)', 'Lunches and most dinners', 'Personal shopping', 'Travel insurance'],
      description:
        'Discover the magic of Istanbul, the only city spanning two continents — Byzantine glory, Ottoman elegance, and the Bosphorus.',
    },
    {
      title: 'European Highlights - 14 Days',
      type: PackageType.FOREIGN_PREBUILT,
      price: 250000,
      currency: 'ETB',
      duration: '14 days / 13 nights',
      image: '/images/packages/europe.jpg',
      destination: 'Europe',
      includes: [
        'Round-trip airfare (Addis Ababa → Europe)',
        '4-star hotels in each city (13 nights)',
        'Inter-city flights within Europe',
        'Schengen visa processing support',
        'Expert multi-lingual tour guide',
        'All UNESCO site entrance fees',
        'Daily breakfast + welcome & farewell dinners',
        'High-speed train between select cities',
      ],
      excludes: ['Schengen visa fee (~€80 EUR)', 'Lunches and most dinners', 'Personal shopping', 'Travel insurance', 'Optional museum entries'],
      description:
        'The very best of Europe in one 14-day journey — Italy, France, Switzerland, Germany, and the Netherlands with expert guides.',
    },
  ];

  const createdPackages = [] as Array<{ id: string; title: string }>;
  for (const pkg of packages) {
    const existing = await prisma.package.findFirst({ where: { title: pkg.title } });
    if (existing) {
      const refreshed = await prisma.package.update({ where: { id: existing.id }, data: { image: pkg.image, images: [pkg.image], includes: pkg.includes, excludes: pkg.excludes } });
      createdPackages.push(refreshed);
      continue;
    }
    const created = await prisma.package.create({
      data: { ...pkg, maxMembers: 50, createdById: admin.id },
    });
    createdPackages.push(created);
  }

  if ((await prisma.fAQItem.count()) === 0) {
    await prisma.fAQItem.createMany({
      data: [
        { question: 'Is TOGT an officially accredited travel agency?', answer: 'Yes, TOGT is an IATA-accredited member agency with access to official airline ticketing systems.', category: 'General', order: 1, createdById: admin.id },
        { question: 'What Umrah package options are available?', answer: 'We offer Economy, VIP, Honeymoon, and custom Umrah packages.', category: 'Umrah', order: 2, createdById: admin.id },
        { question: 'How long does visa processing take?', answer: 'Processing times vary by visa type and destination. Our team keeps you updated through every step.', category: 'Visa', order: 3, createdById: admin.id },
      ],
    });
  }

  if ((await prisma.galleryItem.count()) === 0) {
    await prisma.galleryItem.createMany({
      data: [
        { title: 'Umrah Journey', category: 'UMRAH', location: 'Makkah & Madinah', date: 'December 2026', description: 'A guided spiritual journey with accommodation, transport, and dedicated support.', images: ['/images/packages/umrah-economy.jpg'], createdById: admin.id },
        { title: 'Lalibela Rock Churches Tour', category: 'DOMESTIC', location: 'Lalibela, Ethiopia', date: 'January 2026', description: 'Explore the extraordinary rock-hewn churches of Lalibela with an expert guide.', images: ['/images/gallery/lalibela-2026.jpg'], createdById: admin.id },
      ],
    });
  }

  // ── Sample service requests ───────────────────────────────────────────────
  const existingRequests = await prisma.serviceRequest.count();
  if (existingRequests === 0) {
    const req1 = await prisma.serviceRequest.create({
      data: {
        userId: customers[0].id,
        serviceType: 'UMRAH',
        status: 'IN_PROGRESS',
        packageId: createdPackages[0]?.id,
        assignedToId: worker.id,
        formData: { travelers: 2, departureMonth: 'December 2026', hotelTier: 'economy' },
      },
    });
    await prisma.serviceRequest.create({
      data: {
        userId: customers[1].id,
        serviceType: 'VISA',
        status: 'PENDING',
        formData: { visaType: 'visit', destination: 'United Arab Emirates' },
      },
    });
    await prisma.serviceRequest.create({
      data: {
        userId: customers[2].id,
        serviceType: 'DOMESTIC',
        status: 'COMPLETED',
        packageId: createdPackages[3]?.id,
        assignedToId: worker.id,
        completedAt: new Date(),
        formData: { travelers: 4, departureDate: '2026-01-10' },
      },
    });

    await prisma.progressHistory.createMany({
      data: [
        { serviceRequestId: req1.id, statusFrom: 'PENDING', statusTo: 'ACCEPTED', changedById: worker.id, notes: 'Documents verified' },
        { serviceRequestId: req1.id, statusFrom: 'ACCEPTED', statusTo: 'IN_PROGRESS', changedById: worker.id, notes: 'Visa application submitted' },
      ],
    });
  }

  // ── Sample group ─────────────────────────────────────────────────────────
  const existingGroups = await prisma.group.count();
  if (existingGroups === 0) {
    await prisma.group.create({
      data: {
        name: 'December 2026 Umrah Group',
        packageId: createdPackages[0]?.id,
        startDate: new Date('2026-12-15'),
        endDate: new Date('2026-12-25'),
        createdById: admin.id,
        members: {
          create: [
            { userId: guide.id, role: 'GUIDE' },
            { userId: customers[0].id, role: 'MEMBER' },
            { userId: customers[1].id, role: 'MEMBER' },
          ],
        },
      },
    });
  }

  const seededGroup = await prisma.group.findFirst({ orderBy: { createdAt: 'asc' } });
  if (seededGroup && (await prisma.tourPlanStep.count({ where: { groupId: seededGroup.id } })) === 0) {
    await prisma.tourPlanStep.createMany({
      data: [
        { groupId: seededGroup.id, title: 'Airport pickup', estimatedAt: new Date('2026-12-15T06:00:00Z'), status: 'UPCOMING' },
        { groupId: seededGroup.id, title: 'Hotel check-in', estimatedAt: new Date('2026-12-15T11:00:00Z'), status: 'UPCOMING' },
        { groupId: seededGroup.id, title: 'First Umrah orientation', estimatedAt: new Date('2026-12-16T08:00:00Z'), status: 'UPCOMING' },
      ],
    });
  }

  // ── Sample reviews (some approved/visible) ────────────────────────────────
  const existingReviews = await prisma.review.count();
  if (existingReviews === 0) {
    await prisma.review.createMany({
      data: [
        {
          userId: customers[0].id,
          rating: 5,
          reviewText: 'An unforgettable spiritual journey. The Imam guide and hotel near the Haram made everything seamless.',
          isVisible: true,
        },
        {
          userId: customers[1].id,
          rating: 5,
          reviewText: 'Got my ticket reissued within a day. Transparent pricing and great customer service.',
          isVisible: true,
        },
        {
          userId: customers[2].id,
          rating: 5,
          reviewText: 'Our trip to Lalibela was so well organized. The guide was knowledgeable and the whole family loved it.',
          isVisible: true,
        },
        {
          userId: customers[0].id,
          rating: 4,
          reviewText: 'Affordable and well organized. Will book again for Hajj season.',
          isVisible: false,
        },
      ],
    });
  }

  console.log('Seed complete:', {
    admin: admin.email,
    worker: worker.email,
    guide: guide.email,
    tech: tech.email,
    customers: customers.length,
    packages: createdPackages.length,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
