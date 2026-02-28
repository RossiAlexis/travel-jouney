# Public Sharing Features (Phase 2)

## Overview
This document outlines the public sharing functionality that allows users to share their travel journals with others. This is a Phase 2 feature, coming after the core private journaling MVP.

## Goals
- Allow users to selectively share trips publicly
- Create beautiful, read-only public views of trips
- Enable discovery of public travel journals
- Maintain privacy controls at both trip and entry level

---

## Privacy Model

### Hierarchy
```
User Account (Private)
  └── Trip (Private by default)
      └── Entry (Inherits trip privacy, can override)
      └── Entry (Inherits trip privacy, can override)
```

### Privacy Levels
1. **Private** (default): Only the user can see
2. **Unlisted**: Anyone with the link can view, but not discoverable
3. **Public**: Anyone can view and it's discoverable in search

### Privacy Controls
- Trip-level privacy setting (private/unlisted/public)
- Entry-level override (hide specific entries in public trips)
- User profile public/private setting
- Selective photo sharing (hide specific photos from entries)

---

## User Stories

### Content Creator Perspective
- As a user, I can make a trip public after I return and write all entries
- As a user, I can keep sensitive entries private even in a public trip
- As a user, I can create a public profile with bio and photo
- As a user, I can preview how my trip looks publicly before publishing
- As a user, I can unpublish a trip at any time
- As a user, I can see view statistics for my public trips

### Reader Perspective
- As a visitor, I can view public trips without creating an account
- As a visitor, I can see a profile page with all public trips from a user
- As a visitor, I can read entries in a clean, distraction-free format
- As a visitor, I can view photos in full size
- As a visitor, I can see a map of the journey
- As a visitor, I can share specific entries on social media

---

## Features

### 1. Public Trip View

#### URL Structure
```
https://traveljournal.com/@username
https://traveljournal.com/@username/trips/southeast-asia-2024
https://traveljournal.com/@username/trips/southeast-asia-2024/entries/day-5-bangkok
```

#### Public Trip Page Components
- **Hero Section**
  - Cover photo (large, immersive)
  - Trip title
  - Date range
  - Destination tags
  - Author info (avatar, name, link to profile)

- **Navigation**
  - Timeline (default view)
  - Map
  - Gallery
  - About (trip description)

- **Timeline View**
  - Chronological feed of entries
  - Entry card shows:
    - Date
    - Title
    - Featured photo
    - Location badge
    - Category badge
    - Short excerpt
    - "Read more" link

- **Entry Detail Page**
  - Full entry content
  - Photo gallery
  - Location on embedded map
  - Category and rating
  - Date
  - "Next entry" / "Previous entry" navigation
  - Share buttons

- **Map View**
  - Interactive map with all entry locations
  - Markers clustered by proximity
  - Click marker to see entry preview
  - Route line connecting locations (chronologically)

- **Gallery View**
  - All photos from the trip
  - Masonry or grid layout
  - Click to open lightbox
  - Photo caption and entry link

### 2. Public Profile Page

#### URL
```
https://traveljournal.com/@username
```

#### Components
- **Profile Header**
  - Avatar
  - Display name
  - Bio
  - Statistics:
    - Total trips
    - Countries visited
    - Total entries
  - Social links (optional)

- **Trips Grid**
  - Card for each public trip
  - Cover photo
  - Title
  - Date range
  - Destination badges
  - Entry count
  - View count (optional)

- **About Section** (optional)
  - Longer bio
  - Travel philosophy
  - Contact info

### 3. Privacy Management

#### Trip Settings Page
```
┌─ Trip Privacy ────────────────────────┐
│                                        │
│ ○ Private - Only you can see this     │
│ ○ Unlisted - Anyone with link can see │
│ ● Public - Visible to everyone        │
│                                        │
│ ☑ Allow search engines to index       │
│ ☑ Show in my public profile           │
│                                        │
│ [Preview Public View] [Save]          │
└────────────────────────────────────────┘
```

#### Entry-Level Privacy
- In public trips, show toggle per entry:
  - ☑ Include in public view
  - ☐ Keep this entry private
- Bulk select to hide multiple entries

#### User Profile Settings
```
┌─ Public Profile ──────────────────────┐
│                                        │
│ ☑ Enable public profile               │
│                                        │
│ Username: @yourusername                │
│ Display Name: Your Name                │
│ Bio: [text area]                       │
│ Avatar: [upload]                       │
│                                        │
│ Public profile URL:                    │
│ traveljournal.com/@yourusername        │
│                                        │
│ [Preview] [Save]                       │
└────────────────────────────────────────┘
```

### 4. Discovery Features

#### Public Trip Directory (Optional)
- Browse recent public trips
- Filter by:
  - Destination
  - Trip type
  - Date
- Sort by:
  - Most recent
  - Most viewed
  - Most photos

#### Search
- Search public trips by:
  - Destination
  - Keywords in title/content
  - Username

### 5. Sharing Tools

#### Social Sharing
- Share buttons on trip and entry pages
- Generate Open Graph meta tags for rich previews
- Pre-filled social media posts

#### Embed Code (Future)
- Embed trip widget on external websites
- Customizable appearance

#### Export
- PDF export of public trip
- Markdown export
- JSON export (for developers)

---

## Technical Implementation

### URL Routing
```typescript
// Public routes (no auth required)
/public/trips/:username/:tripSlug
/public/trips/:username/:tripSlug/entries/:entrySlug
/@:username
/@:username/:tripSlug
```

### Data Access Layer
```typescript
// Public data fetching
async function getPublicTrip(username: string, tripSlug: string) {
  // 1. Find user by username
  // 2. Find trip by slug
  // 3. Check if trip is public/unlisted
  // 4. Filter out private entries
  // 5. Return sanitized data
}
```

### SEO Considerations
- Server-side rendering for public pages
- Dynamic meta tags (title, description, og:image)
- Structured data (Schema.org Article/TravelAction)
- Sitemap generation for public trips
- robots.txt configuration

### Performance
- Aggressive caching for public pages
- CDN for images and static assets
- Lazy loading for photos
- Pagination for long trips

---

## UI/UX Considerations

### Design Principles for Public View
1. **Content-first**: Minimize navigation, focus on the story
2. **Immersive**: Large photos, clean typography
3. **Mobile-optimized**: Most readers will be on mobile
4. **Fast loading**: Optimize images, minimize JS
5. **Accessible**: Proper heading hierarchy, alt text, contrast

### Inspiration (Design References)
- Medium for reading experience
- Exposure.co for visual storytelling
- Steller for trip narratives
- Personal travel blogs

### Responsive Breakpoints
- Mobile: < 768px (single column, simplified nav)
- Tablet: 768px - 1024px (comfortable reading width)
- Desktop: > 1024px (wider layout, sidebar nav)

---

## Privacy & Security

### Considerations
1. **Email privacy**: Never expose user email publicly
2. **Location data**: Consider if exact coordinates should be public
3. **EXIF data**: Strip EXIF data from public photos
4. **Child safety**: Flag and review content with minors
5. **Content moderation**: Report/flag system for inappropriate content

### User Controls
- Easy toggle to make trip private again
- Delete options (soft delete, can restore)
- Block specific users from viewing (future)
- Download your data (GDPR compliance)

---

## Analytics & Insights (Optional)

For content creators:
- View count per trip
- Popular entries (most viewed)
- Referring sites
- Geographic distribution of viewers
- Time spent on trip

Privacy-focused: No personal data collection about viewers.

---

## Implementation Phases

### Phase 2A: Basic Sharing
- [ ] Public trip view (read-only)
- [ ] Entry detail pages
- [ ] Privacy controls (trip-level)
- [ ] Public profile page
- [ ] Username system
- [ ] Preview mode

### Phase 2B: Enhanced Sharing
- [ ] Entry-level privacy override
- [ ] Social sharing buttons
- [ ] Meta tags for social previews
- [ ] Public trip directory
- [ ] Search functionality

### Phase 2C: Discovery & Analytics
- [ ] View analytics
- [ ] Featured trips
- [ ] Trip recommendations
- [ ] Export options

---

## Testing Checklist

- [ ] Private trips are not accessible via public URL
- [ ] Private entries don't show in public trips
- [ ] Users can toggle privacy back and forth
- [ ] Public URLs work without authentication
- [ ] SEO meta tags are correct
- [ ] Social sharing previews look good
- [ ] Mobile responsive design works
- [ ] Images load quickly
- [ ] No private data (email, expenses) exposed
- [ ] Preview mode matches actual public view

---

## Open Questions

1. Should expenses be visible in public trips?
   - Recommendation: No, keep financial data private
   
2. Should there be comments on public trips?
   - Recommendation: Phase 3 feature, start without

3. Should users be able to follow other users?
   - Recommendation: Phase 3 feature

4. Should there be featured/curated trips?
   - Recommendation: Yes, but manual curation required

---

## Success Metrics

- % of users who make at least one trip public
- Average views per public trip
- Sharing rate (social shares per trip)
- Time spent on public trip pages
- User feedback on public view design