# Slugs are frozen at the moment of first publication

Trip and Memory slugs are generated from the title when `isPublic` is first set to true and never updated after that. Renaming a Trip or Memory title does not change its slug.

Stable public URLs matter more than keeping the slug in sync with the title. Once a user shares a link, anyone who bookmarks or pastes it expects it to keep working. Mutable slugs would silently break shared links on every rename. The user can always see (and won't expect to change) the slug via the edit form — the title is their display name, the slug is the world's reference.

## Consequences

- Slug generation logic must check for uniqueness at publish time (per-user for Trips, per-trip for Memories) and never run again on subsequent edits.
- The edit form should display the slug as a read-only field once set, so users know what their public URL is.
- If a user wants a different slug, the only path is unpublish → change title → republish (which generates a new slug). This is intentional.
