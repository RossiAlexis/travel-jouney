# Trip visibility governs all content inside it

A Trip's `isPublic` flag is the authoritative gate for public access. When a Trip is private, none of its Memories, Destinations, or Expenses are publicly accessible — regardless of any `isPublic` flag on the Memory itself. The Memory-level `isPublic` flag is only meaningful when the parent Trip is already public, allowing selective hiding of specific memories from an otherwise public trip.

We chose Trip-governs over Memory-level independence because the app's core promise is "private by default, selective sharing." Allowing individual Memories to be public inside a private Trip would create a confusing model where content leaks out of a container the user believes is private. The simpler mental model — make the Trip public first, then hide what you don't want shown — matches how travelers think about sharing a journey.

## Consequences

All public route handlers must check Trip `isPublic` first before evaluating Memory `isPublic`. The Memory `isPublic` field alone is never sufficient to grant access.
