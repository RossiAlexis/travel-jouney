export interface Memory {
  id: string;
  title: string;
  content: string | null;
  slug: string | null;
  date: Date | null;
  rating: number | null;
  tripId: string;
  createdAt: Date;
  updatedAt: Date;
}
