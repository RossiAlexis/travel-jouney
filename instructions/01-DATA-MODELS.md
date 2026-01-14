# Data Models

## Overview

This document defines the core data models for the Travel Journal application. These models should guide database schema design and TypeScript interfaces. Every type or interface should be inferred from a zod schema or the prisma schema.

## User

Represents a user of the application.

```typescript
interface User {
  id: string;
  email: string;
  passwordHash: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Fields\

- `id`: Unique identifier (UUID)
- `email`: User's email (unique, for login)
- `passwordHash`: Hashed password
- `username`: Unique username for public profile URLs
- `displayName`: Name shown publicly
- `avatar`: URL to profile picture
- `bio`: Short biography for public profile
- `createdAt`: Account creation timestamp
- `updatedAt`: Last update timestamp

---

## Trip

Represents a travel journey with multiple entries.

```typescript
interface Trip {
  id: string;
  userId: string;
  title: string;
  description?: string;
  coverImage?: string;
  startDate: Date;
  endDate?: Date;
  status: 'planned' | 'ongoing' | 'completed';
  isPublic: boolean;
  destinations: Location[]; // Array of main destinations
  budget?: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Fields

- `id`: Unique identifier (UUID)
- `userId`: Owner of the trip
- `title`: Trip name (e.g., "Southeast Asia Adventure 2024")
- `description`: Optional longer description
- `coverImage`: Main photo for the trip
- `startDate`: When the trip starts/started
- `endDate`: When the trip ends/ended (null for ongoing)
- `status`: Current status of the trip
- `isPublic`: Whether the trip is publicly viewable
- `destinations`: Main cities/countries visited
- `budget`: Total budget (optional)
- `currency`: Currency code (ISO 4217, e.g., "USD")
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

### Relationships

- Belongs to one User
- Has many Entries
- Has many Expenses

---

## Entry

Represents a journal entry for a specific day/experience.

```typescript
interface Entry {
  id: string;
  tripId: string;
  userId: string;
  title: string;
  content: string; // Rich text/markdown
  date: Date;
  location?: Location;
  category: EntryCategory;
  rating?: number; // 1-5 stars
  photos: Photo[];
  isPublic: boolean; // Can override trip's public setting
  createdAt: Date;
  updatedAt: Date;
}

type EntryCategory = 
  | 'accommodation'
  | 'food'
  | 'activity'
  | 'transport'
  | 'reflection'
  | 'other';

interface Location {
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  placeId?: string; // For mapping services
}

interface Photo {
  id: string;
  url: string;
  thumbnail?: string;
  caption?: string;
  order: number;
}
```

### Fields

- `id`: Unique identifier (UUID)
- `tripId`: Associated trip
- `userId`: Author (for collaboration features)
- `title`: Entry headline
- `content`: Main text content (supports markdown/rich text)
- `date`: Date of the experience
- `location`: Geographic location data (optional)
- `category`: Type of entry for filtering/organization
- `rating`: Optional rating (1-5 stars)
- `photos`: Array of associated photos
- `isPublic`: Entry-level privacy override
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

### Relationships

- Belongs to one Trip
- Belongs to one User
- Has many Photos

---

## Expense

Represents a travel expense/cost.

```typescript
interface Expense {
  id: string;
  tripId: string;
  userId: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  description: string;
  date: Date;
  entryId?: string; // Optional link to related entry
  createdAt: Date;
  updatedAt: Date;
}

type ExpenseCategory =
  | 'accommodation'
  | 'food'
  | 'transport'
  | 'activities'
  | 'shopping'
  | 'other';
```

### Fields

- `id`: Unique identifier (UUID)
- `tripId`: Associated trip
- `userId`: Who recorded the expense
- `amount`: Cost amount
- `currency`: Currency code (ISO 4217)
- `category`: Expense type for budgeting
- `description`: What was purchased/paid for
- `date`: Date of expense
- `entryId`: Optional link to related journal entry
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

### Relationships

- Belongs to one Trip
- Belongs to one User
- Optionally belongs to one Entry

---

## Database Relationships Summary

```
User
  └── has many Trips
  └── has many Entries
  └── has many Expenses

Trip
  └── belongs to User
  └── has many Entries
  └── has many Expenses

Entry
  └── belongs to Trip
  └── belongs to User
  └── has many Photos (embedded)
  └── has one Location (embedded)

Expense
  └── belongs to Trip
  └── belongs to User
  └── optionally belongs to Entry
```

---

## Indexes to Consider

For optimal query performance:

- `User.email` (unique)
- `User.username` (unique)
- `Trip.userId`
- `Trip.status`
- `Trip.isPublic`
- `Entry.tripId`
- `Entry.userId`
- `Entry.date`
- `Entry.category`
- `Expense.tripId`
- `Expense.date`

---

## Notes for Implementation

1. **UUIDs vs Auto-increment**: UUIDs recommended for distributed systems and public URLs
2. **Soft Deletes**: Consider adding `deletedAt` field for data recovery
3. **Timestamps**: Always include `createdAt` and `updatedAt`
4. **Currency Handling**: Store amounts as integers (cents) to avoid floating point issues
5. **Rich Text**: Consider using a standard format (Markdown, HTML, or JSON from editor like Tiptap)
6. **Photo Storage**: Store URLs only in DB, actual files in cloud storage (local for dev     )
7. **Location Data**: Consider using PostGIS if using PostgreSQL for geographic queries