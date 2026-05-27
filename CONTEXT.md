# Travel Journal

A personal travel journaling app where a user documents their trips through memories, photos, and expenses. Private by default, with selective public sharing.

## Language

### Core Concepts

**Trip**:
A travel journey with a defined title, timeframe, and status. The top-level container for all travel content — memories, destinations, and expenses belong to a Trip.
_Avoid_: Journey, travel, vacation

**Memory**:
A journal entry within a Trip. Captures a moment, experience, or reflection — with a date, category, optional location, rating, and photos. May be associated with a Destination or attached at the trip level.
_Avoid_: Entry, journal entry, post, log

**Destination**:
An ordered stop within a Trip — a specific place (city, region, venue) with its own dates and optional location coordinates. Memories can be attached to a Destination or left at the trip level.
_Avoid_: Stop, leg, place, location, stage

**Slug**:
A URL-safe identifier derived from the title at the moment of first publication. Trip slugs are unique per User. Memory slugs are unique per Trip. Slugs are frozen on first publication — renaming a Trip or Memory does not update its slug. Used to build public URLs: `/:username/:tripSlug` and `/:username/:tripSlug/:memorySlug`.
_Avoid_: Handle, URL, path, permalink

**Visibility**:
Whether a Trip (and its contents) is accessible to the public. A Trip is either private (default) or public. Trip visibility governs everything inside it — a private Trip means none of its Memories are publicly accessible regardless of a Memory's own `isPublic` flag. When a Trip is public, individual Memories can still be hidden via their own `isPublic` flag.
_Avoid_: Privacy, sharing, published, unlisted

**Trip Status**:
A manually-set signal on a Trip indicating where it is in its lifecycle: `PLANNED` (upcoming), `ONGOING` (actively being journaled), or `COMPLETED` (finished). Never auto-transitions — the user sets it intentionally. The app may show staleness hints when dates suggest the status is outdated.
_Avoid_: State, phase, stage

**Expense**:
A financial record belonging to a Trip. Has an amount, currency, category, date, and description. May optionally be linked to a specific Memory. Expenses are compared against the Trip's Budget.
_Avoid_: Cost, spend, transaction, payment

**Memory Category**:
A soft classification of what a Memory is about. Options: `ACCOMMODATION`, `FOOD`, `ACTIVITY`, `TRANSPORT`, `REFLECTION`, `OTHER`. `REFLECTION` is a catch-all for introspective or emotional moments where the feeling is the point, not a specific activity. Categories are organizational — there are no strict rules about which to pick.
_Avoid_: Tag, label, type

**Photo**:
An image attached to a Memory. Stored in R2, referenced by URL in the database. Has an optional caption and an order position within the Memory's photo set. Cover images on Trips and Destinations are plain URL fields — not Photos.
_Avoid_: Image, attachment, media

**Budget**:
An optional spending target set on a Trip. Denominated in the Trip's primary currency. Compared against the total of all Expenses to show how much of the budget remains or how much it has been exceeded.
_Avoid_: Limit, allowance, target

---

## Example dialogue

> "I want to show everything from my Southeast Asia trip on one public page."

You'd set the Trip's visibility to public, which makes all its Memories accessible. If there are specific Memories you don't want shown — maybe a private reflection — you can hide those individually while keeping the rest visible.

> "I added a $40 expense for the cooking class in Chiang Mai. Should I link it to the memory I wrote about it?"

You can — linking an Expense to a Memory is optional, but it helps you trace where the money went. The Expense category would be `ACTIVITY` since it was an activity, not food.

> "I renamed my trip from 'Thailand 2025' to 'Southeast Asia 2025' — will my shared link still work?"

Yes. The slug was generated when you first published the trip and it's frozen. Anyone who has your link still reaches the trip. The new title shows everywhere in the UI, but the URL doesn't change.

> "I have a memory about the whole trip — not any specific city, just how it changed me. Where does it go?"

It sits at the trip level, not attached to any Destination. Give it the `REFLECTION` category. It'll appear in the trip's timeline alongside the destination-linked memories.
