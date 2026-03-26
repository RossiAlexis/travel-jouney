/**
 * Writes d1/seed.sql for remote D1 (wrangler d1 execute --remote --file=d1/seed.sql).
 * Keeps the same demo user password as prisma/seed.ts: Password123!
 * PBKDF2 hash verified against app/lib/auth.server.ts (100k iter, SHA-256, 32 bytes).
 */
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const USER_ID = "seed_user_demo_001";
const PASSWORD_HASH =
  "pbkdf2:dHJhdmVsLWpvdXJuYWwtcw==:+SlKv4MM/Et8gjg5qRbszNlK4kLdt9QOWRt8zrv6Ew8=";

function q(v) {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "NULL";
  if (typeof v === "boolean") return v ? "1" : "0";
  if (v instanceof Date) return q(v.toISOString());
  return "'" + String(v).replace(/'/g, "''") + "'";
}

const trips = [
  {
    id: "trip_japan_2024",
    title: "Japan Adventure",
    description:
      "Two weeks exploring the Land of the Rising Sun - from Tokyo's neon lights to Kyoto's ancient temples.",
    startDate: new Date("2024-03-15"),
    endDate: new Date("2024-03-29"),
    status: "COMPLETED",
    isPublic: true,
    slug: "japan-adventure-2024",
    budget: 5000,
    currency: "USD",
    coverImage:
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e",
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
        category: "REFLECTION",
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
        category: "FOOD",
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
        category: "ACTIVITY",
        rating: 5,
      },
    ],
    expenses: [
      {
        id: "exp_flight_japan",
        amount: 1200,
        currency: "USD",
        category: "TRANSPORT",
        description: "Round-trip flight LAX to NRT",
        date: new Date("2024-03-15"),
      },
      {
        id: "exp_hotel_tokyo",
        amount: 180,
        currency: "USD",
        category: "ACCOMMODATION",
        description: "Hotel Gracery Shinjuku (per night)",
        date: new Date("2024-03-15"),
      },
      {
        id: "exp_food_tsukiji",
        amount: 45,
        currency: "USD",
        category: "FOOD",
        description: "Tsukiji market sushi breakfast",
        date: new Date("2024-03-16"),
      },
      {
        id: "exp_jrpass",
        amount: 280,
        currency: "USD",
        category: "TRANSPORT",
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
    status: "COMPLETED",
    isPublic: false,
    slug: "iceland-ring-road",
    budget: 4000,
    currency: "USD",
    coverImage:
      "https://images.unsplash.com/photo-1504893524553-b855bce32c67",
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
        category: "REFLECTION",
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
        category: "ACTIVITY",
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
        category: "ACTIVITY",
        rating: 5,
      },
    ],
    expenses: [
      {
        id: "exp_flight_iceland",
        amount: 650,
        currency: "USD",
        category: "TRANSPORT",
        description: "Round-trip flight to Keflavik",
        date: new Date("2024-09-10"),
      },
      {
        id: "exp_camper",
        amount: 1400,
        currency: "USD",
        category: "ACCOMMODATION",
        description: "Camper van rental (10 days)",
        date: new Date("2024-09-10"),
      },
      {
        id: "exp_fuel",
        amount: 350,
        currency: "USD",
        category: "TRANSPORT",
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
    status: "PLANNED",
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
        category: "TRANSPORT",
        description: "Flight deposit",
        date: new Date("2025-01-10"),
      },
    ],
  },
];

const now = new Date().toISOString();
const lines = [
  "-- Generated by scripts/generate-d1-seed.mjs — run: node scripts/generate-d1-seed.mjs",
  "-- Note: remote D1 rejects BEGIN TRANSACTION in batch SQL; statements run as one batch.",
  `INSERT OR REPLACE INTO "User" ("id","email","passwordHash","username","displayName","avatar","bio","createdAt","updatedAt") VALUES (${q(USER_ID)}, ${q("test@user.com")}, ${q(PASSWORD_HASH)}, ${q("testuser")}, ${q("Test User")}, NULL, ${q("A passionate traveler exploring the world one destination at a time.")}, ${q(now)}, ${q(now)});`,
  `INSERT OR REPLACE INTO "Account" ("id","userId","provider","providerAccountId","createdAt") VALUES (${q("seed_account_cred_1")}, ${q(USER_ID)}, ${q("credentials")}, ${q("test@user.com")}, ${q(now)});`,
];

for (const tripData of trips) {
  const { entries, expenses, ...trip } = tripData;
  lines.push(
    `INSERT OR REPLACE INTO "Trip" ("id","userId","title","description","coverImage","startDate","endDate","status","isPublic","slug","budget","currency","createdAt","updatedAt") VALUES (${q(trip.id)}, ${q(USER_ID)}, ${q(trip.title)}, ${q(trip.description)}, ${q(trip.coverImage)}, ${q(trip.startDate)}, ${q(trip.endDate)}, ${q(trip.status)}, ${q(trip.isPublic)}, ${q(trip.slug)}, ${q(trip.budget)}, ${q(trip.currency)}, ${q(now)}, ${q(now)});`
  );
  for (const e of entries) {
    lines.push(
      `INSERT OR REPLACE INTO "Entry" ("id","tripId","userId","title","content","date","locationName","locationAddress","latitude","longitude","placeId","category","rating","isPublic","slug","createdAt","updatedAt") VALUES (${q(e.id)}, ${q(trip.id)}, ${q(USER_ID)}, ${q(e.title)}, ${q(e.content)}, ${q(e.date)}, ${q(e.locationName)}, ${q(e.locationAddress)}, ${q(e.latitude)}, ${q(e.longitude)}, NULL, ${q(e.category)}, ${q(e.rating)}, ${q(false)}, NULL, ${q(now)}, ${q(now)});`
    );
  }
  for (const x of expenses) {
    lines.push(
      `INSERT OR REPLACE INTO "Expense" ("id","tripId","userId","entryId","amount","currency","category","description","date","createdAt","updatedAt") VALUES (${q(x.id)}, ${q(trip.id)}, ${q(USER_ID)}, NULL, ${q(x.amount)}, ${q(x.currency)}, ${q(x.category)}, ${q(x.description)}, ${q(x.date)}, ${q(now)}, ${q(now)});`
    );
  }
}

writeFileSync(resolve(root, "d1/seed.sql"), lines.join("\n") + "\n", "utf8");
console.log("Wrote d1/seed.sql");
