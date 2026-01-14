# UI Components Guide

## Overview
This document outlines the reusable UI components needed for the Travel Journal application. These components should be built with accessibility, responsiveness, and reusability in mind.

## Design System Foundations

### Colors
Define a color palette (example):
- Primary: Travel/adventure theme (e.g., ocean blue, sunset orange)
- Secondary: Complementary accent
- Neutral: Grays for text and backgrounds
- Semantic: Success, warning, error, info
- Background: Light and dark mode variants

### Typography
- Headings: Bold, clear hierarchy (H1-H6)
- Body: Readable (16px base, 1.5 line height)
- Mono: For code/technical content
- Font families: System fonts or web fonts (e.g., Inter, Poppins)

### Spacing
- Use consistent spacing scale (4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px)
- Tailwind's default spacing works well

### Border Radius
- Small: 4px (inputs, badges)
- Medium: 8px (cards, buttons)
- Large: 12px (modals, large cards)
- Full: For avatars and circular elements

---

## Layout Components

### 1. AppShell

The main application wrapper.

**Props:**
```typescript
interface AppShellProps {
  children: React.ReactNode;
  user?: User;
  showSidebar?: boolean;
}
```

**Features:**
- Responsive header
- Optional sidebar
- Main content area
- Footer
- User menu dropdown

**Usage:**
```tsx
<AppShell user={currentUser} showSidebar={true}>
  <Outlet />
</AppShell>
```

### 2. Header

Top navigation bar.

**Features:**
- Logo/home link
- Navigation links
- User avatar/menu
- Mobile hamburger menu
- Search (future)

**Responsive:**
- Desktop: Full horizontal nav
- Mobile: Hamburger menu, logo centered

### 3. Sidebar

Optional sidebar navigation.

**Features:**
- Current trip selector
- Quick actions
- Recent entries
- Collapsible on mobile

### 4. Container

Content wrapper with max-width.

**Variants:**
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `full`: No max-width

---

## Core Components

### 5. Button

**Variants:**
- `primary`: Main actions
- `secondary`: Alternative actions
- `ghost`: Minimal style
- `danger`: Destructive actions
- `link`: Text link style

**Sizes:**
- `sm`: Compact
- `md`: Default
- `lg`: Prominent

**Props:**
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  children: React.ReactNode;
}
```

### 6. Input

Text input field.

**Props:**
```typescript
interface InputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  ...other HTML input props
}
```

**Features:**
- Floating label (optional)
- Error state with message
- Helper text
- Icon support
- Focus states

### 7. TextArea

Multi-line text input.

**Props:** Similar to Input, plus:
```typescript
interface TextAreaProps extends InputProps {
  rows?: number;
  maxLength?: number;
  showCharCount?: boolean;
}
```

### 8. Select

Dropdown selector.

**Props:**
```typescript
interface SelectProps {
  label?: string;
  error?: string;
  options: Array<{value: string; label: string}>;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
}
```

### 9. Modal

Overlay dialog.

**Props:**
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  footer?: React.ReactNode;
}
```

**Features:**
- Backdrop (click to close)
- ESC key to close
- Focus trap
- Scroll lock on body
- Animation (fade + scale)

### 10. Card

Content container.

**Props:**
```typescript
interface CardProps {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: boolean;
  hoverable?: boolean;
  onClick?: () => void;
}
```

**Variants:**
- Default card
- Interactive card (hover effect)
- Outlined card (border, no shadow)

---

## Form Components

### 11. FormField

Wrapper for form inputs with label and error.

**Usage:**
```tsx
<FormField label="Trip Title" error={errors.title}>
  <Input {...register('title')} />
</FormField>
```

### 12. DatePicker

Calendar date selector.

**Props:**
```typescript
interface DatePickerProps {
  label?: string;
  value?: Date;
  onChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  error?: string;
}
```

**Features:**
- Calendar popup
- Manual input
- Date validation
- Range selection (for start/end dates)

### 13. FileUpload

File input with drag & drop.

**Props:**
```typescript
interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  onUpload: (files: File[]) => void;
  preview?: boolean;
  label?: string;
}
```

**Features:**
- Drag & drop zone
- File type validation
- Size validation
- Preview thumbnails
- Progress indicator
- Remove uploaded files

### 14. ImageUpload

Specialized for images with preview.

**Features:**
- Multiple image upload
- Image preview grid
- Reorder images (drag)
- Caption per image
- Compress before upload
- Crop functionality (optional)

### 15. RichTextEditor

WYSIWYG editor for entry content.

**Props:**
```typescript
interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}
```

**Features:**
- Bold, italic, underline
- Headings
- Lists (ordered, unordered)
- Links
- Images
- Block quotes
- Code blocks
- Markdown shortcuts
- Toolbar

**Recommended Library:** Tiptap or similar

---

## Trip & Entry Components

### 16. TripCard

Display trip in list/grid.

**Props:**
```typescript
interface TripCardProps {
  trip: Trip;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}
```

**Display:**
- Cover image
- Title
- Date range
- Status badge
- Destination tags
- Entry count
- Expense total (optional)
- Action menu (3 dots)

### 17. EntryCard

Display entry in timeline.

**Props:**
```typescript
interface EntryCardProps {
  entry: Entry;
  onClick?: () => void;
  showTrip?: boolean; // if showing across multiple trips
}
```

**Display:**
- Date badge
- Featured photo
- Title
- Excerpt (first 150 chars)
- Location badge
- Category badge
- Rating stars
- "Read more" link

### 18. TripHeader

Header for trip detail page.

**Display:**
- Cover image (full width)
- Title overlay
- Date range
- Status badge
- Action buttons (edit, share, delete)
- Breadcrumb navigation

### 19. EntryDetail

Full entry view.

**Display:**
- Date and location
- Title
- Category badge
- Rating
- Full content (rich text)
- Photo gallery
- Map (if location available)
- Edit/delete buttons (if owner)

### 20. Timeline

Chronological list of entries.

**Features:**
- Date separators
- Entry cards
- Infinite scroll or pagination
- Filter by category
- Sort options

---

## Map Components

### 21. Map

Interactive map display.

**Props:**
```typescript
interface MapProps {
  center?: [number, number]; // [lat, lng]
  zoom?: number;
  markers?: Array<{
    position: [number, number];
    entry: Entry;
  }>;
  onMarkerClick?: (entry: Entry) => void;
  showRoute?: boolean;
}
```

**Features:**
- Clickable markers
- Popup previews
- Route line (optional)
- Clustering for many markers
- Zoom controls
- Full screen toggle

**Recommended Library:** Leaflet with React-Leaflet

### 22. LocationPicker

Map for selecting a location.

**Props:**
```typescript
interface LocationPickerProps {
  value?: Location;
  onChange: (location: Location) => void;
}
```

**Features:**
- Search places
- Click map to select
- Drag marker
- Reverse geocoding (get address from coordinates)

---

## Media Components

### 23. PhotoGallery

Grid of photos.

**Props:**
```typescript
interface PhotoGalleryProps {
  photos: Photo[];
  onPhotoClick?: (photo: Photo, index: number) => void;
  columns?: 2 | 3 | 4;
}
```

**Features:**
- Responsive grid (masonry or equal)
- Lazy loading
- Click to open lightbox

### 24. Lightbox

Full-screen photo viewer.

**Props:**
```typescript
interface LightboxProps {
  photos: Photo[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}
```

**Features:**
- Navigate next/previous
- Captions
- Zoom
- Close button
- Keyboard navigation (arrow keys, ESC)
- Swipe on mobile

---

## Expense Components

### 25. ExpenseList

List of expenses with summary.

**Props:**
```typescript
interface ExpenseListProps {
  expenses: Expense[];
  onAdd?: () => void;
  onEdit?: (expense: Expense) => void;
  onDelete?: (expense: Expense) => void;
}
```

**Display:**
- List of expenses
- Total by category
- Grand total
- Budget comparison (if budget set)
- Add expense button

### 26. ExpenseSummary

Visual breakdown of expenses.

**Display:**
- Total spent
- Spending by category (chart)
- Budget progress bar
- Top expenses

---

## Utility Components

### 27. Badge

Small label for categories, status, etc.

**Variants:**
- `default`, `primary`, `success`, `warning`, `error`

**Usage:**
```tsx
<Badge variant="primary">Food</Badge>
<Badge variant="success">Completed</Badge>
```

### 28. Avatar

User profile picture.

**Props:**
```typescript
interface AvatarProps {
  src?: string;
  name: string; // for initials fallback
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}
```

**Features:**
- Image display
- Initials fallback
- Online status indicator (optional)

### 29. LoadingSpinner

Loading indicator.

**Variants:**
- Inline spinner
- Full page overlay
- Skeleton loaders for content

### 30. EmptyState

Show when no content exists.

**Props:**
```typescript
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

**Usage:**
```tsx
<EmptyState
  icon={<PlusIcon />}
  title="No trips yet"
  description="Start documenting your travels"
  action={{label: "Create Trip", onClick: handleCreate}}
/>
```

### 31. ConfirmDialog

Confirmation modal for destructive actions.

**Props:**
```typescript
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}
```

### 32. Toast/Notification

Temporary notification messages.

**Types:**
- Success
- Error
- Warning
- Info

**Position:** Top-right (default) or customizable

**Features:**
- Auto-dismiss
- Close button
- Action button (optional)

### 33. Tabs

Tab navigation.

**Usage:**
```tsx
<Tabs defaultValue="timeline">
  <TabsList>
    <TabsTrigger value="timeline">Timeline</TabsTrigger>
    <TabsTrigger value="map">Map</TabsTrigger>
    <TabsTrigger value="gallery">Gallery</TabsTrigger>
  </TabsList>
  <TabsContent value="timeline">
    <Timeline entries={entries} />
  </TabsContent>
  <TabsContent value="map">
    <Map markers={markers} />
  </TabsContent>
  <TabsContent value="gallery">
    <PhotoGallery photos={photos} />
  </TabsContent>
</Tabs>
```

### 34. StarRating

5-star rating component.

**Props:**
```typescript
interface StarRatingProps {
  value: number; // 0-5
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}
```

**Features:**
- Interactive (if not readonly)
- Half stars (optional)
- Hover preview

---

## Component Library Recommendation

Consider using a headless UI library for accessibility and behavior:
- **Radix UI** (headless, unstyled)
- **Headless UI** (by Tailwind team)
- **shadcn/ui** (pre-styled with Radix + Tailwind)

Benefits:
- Accessibility built-in
- Keyboard navigation
- Focus management
- ARIA attributes
- Consistent behavior

---

## Implementation Priority

### Phase 1 (MVP)
1. **Layout**: AppShell, Header, Container
2. **Core**: Button, Input, TextArea, Select, Modal, Card
3. **Forms**: FormField, DatePicker, FileUpload, ImageUpload, RichTextEditor
4. **Trip/Entry**: TripCard, EntryCard, TripHeader, EntryDetail, Timeline
5. **Map**: Map, LocationPicker
6. **Media**: PhotoGallery, Lightbox
7. **Expense**: ExpenseList, ExpenseSummary
8. **Utility**: Badge, Avatar, LoadingSpinner, EmptyState, ConfirmDialog, Toast, Tabs, StarRating

### Phase 2
- Enhanced map features
- Advanced filtering
- Better analytics visualizations
- Public view optimized components

---

## Accessibility Checklist

Every component should:
- [ ] Support keyboard navigation
- [ ] Have proper ARIA labels
- [ ] Include focus indicators
- [ ] Work with screen readers
- [ ] Have sufficient color contrast
- [ ] Support reduced motion preferences
- [ ] Have semantic HTML

---

## Testing Strategy

Each component should have:
1. **Unit tests**: Component renders correctly
2. **Interaction tests**: User interactions work
3. **Accessibility tests**: ARIA, keyboard navigation
4. **Visual regression tests**: Storybook snapshots

---

## Documentation

For each component, document:
- **Purpose**: What it does
- **Props**: All available props with types
- **Usage examples**: Code snippets
- **Variants**: Different styles/sizes
- **Accessibility**: Keyboard shortcuts, ARIA
- **Dependencies**: External libraries used

Use Storybook for component development and documentation.