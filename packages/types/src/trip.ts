export interface Trip {
  id: string;
  title: string;
  description: string | null;
  slug: string | null;
  isPublic: boolean;
  startDate: Date | null;
  endDate: Date | null;
  coverImage: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
