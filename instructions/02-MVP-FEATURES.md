# Phase 1: MVP Features

## Overview

This document outlines the Minimum Viable Product features. These are the essential functionalities needed for the app to be usable and valuable for personal travel journaling.

## Goal

Create a functional travel journal where users can:

- Organize multiple trips
- Document experiences with photos and text
- Track expenses
- View their journey on a timeline and map

**Timeline**: 2-4 weeks of development

---

## 1. User Authentication

### Requirements

- User registration with email and password
- Login/logout functionality
- Password reset capability
- Session management
- Protected routes

### User Stories

- As a new user, I can create an account with email and password
- As a registered user, I can log in to access my journals
- As a user, I can log out from any page
- As a user, I can reset my password if I forget it

### Technical Considerations

- Use secure password hashing (bcrypt or similar)
- Implement session-based auth
- HTTPS required for production
- Email verification (optional for MVP, recommended for Phase 2)

### Pages/Routes

- `/` - Landing/home page
- `/login` - Login form
- `/register` - Registration form
- `/forgot-password` - Password reset request
- `/reset-password/:token` - Password reset form
- `/dashboard` - Main dashboard with trip list
- `/profile` - User profile settings
- `/profile/edit` - Edit profile

---

## 2. Trip Management

### Requirements

- Create new trips
- Edit trip details
- Delete trips
- List all trips
- View individual trip

### User Stories

- As a user, I can create a new trip with title, dates, and destinations
- As a user, I can see a list of all my trips organized by status
- As a user, I can edit trip details at any time
- As a user, I can delete a trip (with confirmation)
- As a user, I can set a trip status (planned, ongoing, completed)
- As a user, I can upload a cover photo for my trip

### Trip Form Fields

- Title* (required)
- Description (optional)
- Start Date* (required)
- End Date (optional, can be left blank for ongoing trips)
- Status* (planned/ongoing/completed)
- Destinations (tags or text input) (optional for MVP)
- Cover Image (upload) (optional for MVP)
- Budget (optional)
- Currency (default to user preference or USD) (optional for MVP)

### Pages/Routes

- `/dashboard` - List of all trips
- `/trips/new` - Create new trip
- `/trips/:tripId` - View trip details with entries
- `/trips/:tripId/edit` - Edit trip

### UI Components Needed

- Trip card (for dashboard list)
- Trip form (create/edit)
- Trip header (title, dates, cover image)
- Status badge/selector
- Delete confirmation modal

---

## 3. Journal Entries

### Requirements

- Create entries with text and photos
- Edit entries
- Delete entries
- View entries in timeline
- Associate entries with specific date and location
- Categorize entries
- Rate experiences

### User Stories

- As a user, I can create a new entry for a specific day of my trip
- As a user, I can write rich text with formatting
- As a user, I can upload multiple photos to an entry
- As a user, I can add a location to my entry (manually or with map picker)
- As a user, I can categorize my entry (food, accommodation, activity, etc.)
- As a user, I can rate my experience with stars
- As a user, I can edit or delete my entries
- As a user, I can see all my entries in chronological order

### Entry Form Fields

- Title* (required)
- Content* (rich text editor, required)
- Date* (required)
- Location (optional)
  - Location name
  - Address (optional)
  - Coordinates (lat/lng)
- Category* (required dropdown)
- Rating (1-5 stars, optional)
- Photos (multiple upload)
  - Photo captions (optional)

### Pages/Routes

- `/trips/:tripId/entries/new` - Create new entry
- `/trips/:tripId/entries/:entryId` - View single entry
- `/trips/:tripId/entries/:entryId/edit` - Edit entry

### UI Components Needed

- Entry card (for timeline view)
- Entry form (create/edit)
- Rich text editor (Tiptap, Quill, or similar)
- Photo uploader (with drag & drop)
- Photo gallery
- Location picker (map integration)
- Category selector
- Star rating component
- Delete confirmation modal

### Technical Considerations

- Image optimization (compress before upload)
- Multiple image upload with progress indicator
- Rich text storage format (Markdown or JSON)
- Location geocoding/reverse geocoding

---

## 4. Expense Tracking

### Requirements

- Add expenses to trips
- Categorize expenses
- View total spending per trip
- View spending by category
- Edit/delete expenses

### User Stories

- As a user, I can add an expense with amount, category, and description
- As a user, I can see my total spending for a trip
- As a user, I can see spending breakdown by category
- As a user, I can edit or delete expenses
- As a user, I can optionally link an expense to a journal entry
- As a user, I can see if I'm over/under budget

### Expense Form Fields

- Amount* (required, number)
- Currency* (required, with conversion display)
- Category* (required dropdown)
- Description* (required)
- Date* (required)
- Link to Entry (optional)

### Pages/Routes

- `/trips/:tripId/expenses` - Expense list and summary
- `/trips/:tripId` - Main trip view with tabs:
  - Timeline (default)
  - Map
  - Gallery
  - Expenses

### UI Components Needed

- Expense form (create/edit)
- Expense list item
- Expense summary card (totals by category)
- Budget progress indicator
- Category icon/badge
- Delete confirmation modal

### Technical Considerations

- Store amounts in cents to avoid floating point issues
- Currency conversion (can use fixed rates or API for MVP)
- Expense calculations and aggregations

---

## 5. Visualization

### Requirements

- Timeline view of entries
- Map view showing visited locations
- Photo gallery per trip

### User Stories

- As a user, I can see my entries in a chronological timeline
- As a user, I can see all my visited locations on a map
- As a user, I can view all photos from a trip in a gallery
- As a user, I can click on a map marker to see the related entry

### Timeline View

- Chronological list of entries
- Group by date or location
- Show entry preview (title, photos, excerpt)
- Click to view full entry

### Map View

- Interactive map (Leaflet, Mapbox, or Google Maps)
- Markers for each entry with location
- Clicking marker shows entry preview
- Route line connecting locations (optional for MVP)

### Gallery View

- Grid of all photos from the trip
- Click to open lightbox/fullscreen view
- Show photo caption and associated entry

### Pages/Routes

- `/trips/:id` - Main trip view with tabs:
  - Timeline (default)
  - Map
  - Gallery
  - Expenses

### UI Components Needed

- Timeline component
- Map component with markers
- Photo grid/gallery
- Lightbox/modal for full-size photos
- Tab navigation

### Technical Considerations

- Map library choice (Leaflet is free, Mapbox has better styling)
- Image lazy loading for performance
- Map marker clustering for many entries

---

## 6. Basic Navigation & Layout

### Requirements

- Responsive layout (mobile and desktop)
- Navigation header
- User menu
- Breadcrumbs
- Loading states
- Error handling

### Pages/Routes

- `/` - Landing/home page (or redirect to dashboard if logged in)
- `/dashboard` - Main dashboard with trip list
- `/profile` - User profile settings
- `/profile/edit` - Edit profile

### UI Components Needed

- App shell/layout
- Header with logo and nav
- User menu dropdown
- Sidebar (optional)
- Breadcrumb navigation
- Loading spinner/skeleton
- Error message component
- Empty state illustrations

---

## MVP Features NOT Included

To keep scope manageable, Phase 1 will NOT include:

- Public sharing (all content is private)
- AI/MCP integration
- Social features
- Collaboration
- Export functionality
- Offline support
- Advanced search
- Statistics/analytics
- Wishlist/planning features

These will be added in Phase 2 and 3.

---

## Technical Stack for Phase 1

### Frontend

- React Router (framework mode)
- TypeScript
- Tailwind CSS v4
- shadcn/ui for components
- Conform for forms with Zod validation
- Tiptap or similar for rich text

### Backend

- Node.js into React Router
- SQLite for database
- Prisma ORM
- Multer or similar for file uploads
- Local filesystem for images (dev), Cloudinary or S3 (production)

---

## Success Criteria

Phase 1 is complete when:

- [ ] Users can register and authenticate
- [ ] Users can create and manage multiple trips
- [ ] Users can create journal entries with photos and location
- [ ] Users can track expenses per trip
- [ ] Users can view their journey on a timeline
- [ ] Users can view their locations on a map
- [ ] The app is responsive on mobile and desktop
- [ ] All data is persisted and properly associated
- [ ] Basic error handling is in place

---

## Next Steps After MVP

Once Phase 1 is complete and tested:

1. User testing with real travel data
2. Bug fixes and polish
3. Performance optimization
4. Plan Phase 2 features (MCP, public sharing)