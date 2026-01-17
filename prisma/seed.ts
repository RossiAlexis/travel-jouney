import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

const USER_ID = "cmkdf4p3a0000sm90nid8odvs";

async function main() {
  console.log("🌱 Starting database seed...");

  // Create trips with entries and expenses
  const trips = [
    {
      id: "trip_japan_2024",
      title: "Japan Adventure",
      description:
        "Two weeks exploring the Land of the Rising Sun - from Tokyo's neon lights to Kyoto's ancient temples.",
      startDate: new Date("2024-03-15"),
      endDate: new Date("2024-03-29"),
      status: "COMPLETED" as const,
      isPublic: true,
      slug: "japan-adventure-2024",
      budget: 5000,
      currency: "USD",
      coverImage: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e",
      entries: [
        {
          id: "entry_tokyo_arrival",
          title: "Arriving in Tokyo",
          content:
            "<p>Finally landed at Narita Airport after a 14-hour flight. The efficiency of everything here is remarkable - from the airport trains to the vending machines on every corner. Checked into our hotel in Shinjuku and immediately went out to explore the neon-lit streets. The sensory overload is real!</p>",
          date: new Date("2024-03-15"),
          locationName: "Shinjuku, Tokyo",
          locationAddress: "Shinjuku City, Tokyo, Japan",
          latitude: 35.6938,
          longitude: 139.7034,
          category: "REFLECTION" as const,
          rating: 5,
        },
        {
          id: "entry_tsukiji",
          title: "Tsukiji Outer Market Food Tour",
          content:
            "<p>Started the day early at Tsukiji Outer Market. Had the freshest sushi I've ever tasted - the tuna melted in my mouth. Also tried tamagoyaki (Japanese omelette) fresh off the grill. The vendors were so friendly despite the language barrier.</p>",
          date: new Date("2024-03-16"),
          locationName: "Tsukiji Outer Market",
          locationAddress: "4 Chome-16-2 Tsukiji, Chuo City, Tokyo",
          latitude: 35.6654,
          longitude: 139.7707,
          category: "FOOD" as const,
          rating: 5,
        },
        {
          id: "entry_kyoto_temple",
          title: "Fushimi Inari Shrine",
          content:
            "<p>Walked through thousands of vermillion torii gates at Fushimi Inari. Started early to avoid crowds and it was magical watching the sunrise paint the gates golden. The hike to the top took about 2 hours but the views of Kyoto were worth every step.</p>",
          date: new Date("2024-03-20"),
          locationName: "Fushimi Inari Taisha",
          locationAddress: "68 Fukakusa Yabunouchicho, Fushimi Ward, Kyoto",
          latitude: 34.9671,
          longitude: 135.7727,
          category: "ACTIVITY" as const,
          rating: 5,
        },
      ],
      expenses: [
        {
          id: "exp_flight_japan",
          amount: 1200,
          currency: "USD",
          category: "TRANSPORT" as const,
          description: "Round-trip flight LAX to NRT",
          date: new Date("2024-03-15"),
        },
        {
          id: "exp_hotel_tokyo",
          amount: 180,
          currency: "USD",
          category: "ACCOMMODATION" as const,
          description: "Hotel Gracery Shinjuku (per night)",
          date: new Date("2024-03-15"),
        },
        {
          id: "exp_food_tsukiji",
          amount: 45,
          currency: "USD",
          category: "FOOD" as const,
          description: "Tsukiji market sushi breakfast",
          date: new Date("2024-03-16"),
        },
        {
          id: "exp_jrpass",
          amount: 280,
          currency: "USD",
          category: "TRANSPORT" as const,
          description: "7-day JR Pass",
          date: new Date("2024-03-18"),
        },
      ],
    },
    {
      id: "trip_iceland_2024",
      title: "Iceland Ring Road",
      description:
        "10 days driving around Iceland's famous Route 1, chasing waterfalls, glaciers, and the Northern Lights.",
      startDate: new Date("2024-09-10"),
      endDate: new Date("2024-09-20"),
      status: "COMPLETED" as const,
      isPublic: false,
      slug: "iceland-ring-road",
      budget: 4000,
      currency: "USD",
      coverImage: "https://images.unsplash.com/photo-1504893524553-b855bce32c67",
      entries: [
        {
          id: "entry_reykjavik",
          title: "First Day in Reykjavik",
          content:
            "<p>Arrived in Reykjavik and picked up our camper van. The air here is so crisp and clean. Walked around the colorful downtown, visited Hallgrímskirkja church and had a delicious lamb soup at a local café. Excited for the adventure ahead!</p>",
          date: new Date("2024-09-10"),
          locationName: "Reykjavik",
          locationAddress: "Reykjavik, Iceland",
          latitude: 64.1466,
          longitude: -21.9426,
          category: "REFLECTION" as const,
          rating: 4,
        },
        {
          id: "entry_golden_circle",
          title: "Golden Circle Day Trip",
          content:
            "<p>Did the famous Golden Circle today. Þingvellir National Park was incredible - standing between two tectonic plates! Watched Strokkur geyser erupt every few minutes and got completely soaked by the spray at Gullfoss waterfall. Iceland delivers!</p>",
          date: new Date("2024-09-11"),
          locationName: "Gullfoss Waterfall",
          locationAddress: "Gullfoss, Iceland",
          latitude: 64.3271,
          longitude: -20.1199,
          category: "ACTIVITY" as const,
          rating: 5,
        },
        {
          id: "entry_northern_lights",
          title: "Northern Lights Magic",
          content:
            "<p>Finally saw them! We parked the camper van by a remote lake and waited. Around midnight, the sky exploded in green and purple waves. No photo can capture how it felt to witness this natural phenomenon. Tears in my eyes, honestly.</p>",
          date: new Date("2024-09-15"),
          locationName: "Near Akureyri",
          locationAddress: "Akureyri, Iceland",
          latitude: 65.6885,
          longitude: -18.1262,
          category: "ACTIVITY" as const,
          rating: 5,
        },
      ],
      expenses: [
        {
          id: "exp_flight_iceland",
          amount: 650,
          currency: "USD",
          category: "TRANSPORT" as const,
          description: "Round-trip flight to Keflavik",
          date: new Date("2024-09-10"),
        },
        {
          id: "exp_camper",
          amount: 1400,
          currency: "USD",
          category: "ACCOMMODATION" as const,
          description: "Camper van rental (10 days)",
          date: new Date("2024-09-10"),
        },
        {
          id: "exp_fuel",
          amount: 350,
          currency: "USD",
          category: "TRANSPORT" as const,
          description: "Fuel for entire trip",
          date: new Date("2024-09-20"),
        },
      ],
    },
    {
      id: "trip_italy_2025",
      title: "Italian Summer",
      description:
        "Planning a romantic getaway through Tuscany, Rome, and the Amalfi Coast.",
      startDate: new Date("2025-06-15"),
      endDate: new Date("2025-06-28"),
      status: "PLANNED" as const,
      isPublic: false,
      slug: "italian-summer-2025",
      budget: 6000,
      currency: "EUR",
      entries: [],
      expenses: [
        {
          id: "exp_flight_italy",
          amount: 900,
          currency: "EUR",
          category: "TRANSPORT" as const,
          description: "Flight deposit",
          date: new Date("2025-01-10"),
        },
      ],
    },
  ];

  for (const tripData of trips) {
    const { entries, expenses, ...trip } = tripData;

    // Create trip
    await prisma.trip.upsert({
      where: { id: trip.id },
      update: {},
      create: {
        ...trip,
        userId: USER_ID,
      },
    });

    console.log(`  ✓ Created trip: ${trip.title}`);

    // Create entries for this trip
    for (const entry of entries) {
      await prisma.entry.upsert({
        where: { id: entry.id },
        update: {},
        create: {
          ...entry,
          tripId: trip.id,
          userId: USER_ID,
        },
      });
    }

    if (entries.length > 0) {
      console.log(`    → Added ${entries.length} journal entries`);
    }

    // Create expenses for this trip
    for (const expense of expenses) {
      await prisma.expense.upsert({
        where: { id: expense.id },
        update: {},
        create: {
          ...expense,
          tripId: trip.id,
          userId: USER_ID,
        },
      });
    }

    if (expenses.length > 0) {
      console.log(`    → Added ${expenses.length} expenses`);
    }
  }

  console.log("\n✅ Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

