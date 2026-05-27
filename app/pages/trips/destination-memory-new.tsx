// Re-export all exports from memory-new so the destination-scoped memory
// creation route shares the same implementation without causing a duplicate
// route-id conflict in React Router's manifest.
export { default, meta, loader, action } from "./memory-new";
