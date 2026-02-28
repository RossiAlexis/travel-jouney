export interface Location {
  id: string;
  name: string;
  country: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
}
