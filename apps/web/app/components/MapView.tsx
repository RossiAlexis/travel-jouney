import { useEffect, useState } from "react";
import type { MemoryPin } from "./MapViewClient";

export type { MemoryPin };

export function MapView({
  pins,
  tripId,
}: {
  pins: MemoryPin[];
  tripId: string;
}) {
  const [MapComponent, setMapComponent] = useState<React.ComponentType<{
    pins: MemoryPin[];
    tripId: string;
  }> | null>(null);

  useEffect(() => {
    import("./MapViewClient").then((m) => {
      setMapComponent(() => m.MapClient);
    });
  }, []);

  if (!MapComponent) {
    return (
      <div className="h-[500px] rounded-xl bg-muted animate-pulse" />
    );
  }

  return <MapComponent pins={pins} tripId={tripId} />;
}
