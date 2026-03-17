export interface Memory {
  id: string;
  title: string;
  content: string | null;
  slug: string | null;
  date: Date | null;
  rating: number | null;
  tripId: string;
  userId: string;
  locationName: string | null;
  locationAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  placeId: string | null;
  category: "ACCOMMODATION" | "FOOD" | "ACTIVITY" | "TRANSPORT" | "REFLECTION" | "OTHER";
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}
