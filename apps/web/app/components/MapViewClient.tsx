import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";

// Fix Leaflet's default icon issue in bundlers
function fixLeafletIcon() {
  // @ts-expect-error - leaflet icon fix
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
}

const CATEGORY_COLORS: Record<string, string> = {
  ACCOMMODATION: "#6366f1",
  FOOD: "#f59e0b",
  ACTIVITY: "#10b981",
  TRANSPORT: "#0ea5e9",
  REFLECTION: "#8b5cf6",
  OTHER: "#78716c",
};

function createCategoryIcon(category: string) {
  const color = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.OTHER;
  return L.divIcon({
    html: `<div style="
      background: ${color};
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    className: "",
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

export interface MemoryPin {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  category: string;
  locationName?: string | null;
  date: Date | string;
}

export function MapClient({
  pins,
  tripId,
}: {
  pins: MemoryPin[];
  tripId: string;
}) {
  useEffect(() => {
    fixLeafletIcon();
  }, []);

  // Filter pins with valid coordinates
  const validPins = pins.filter((p) => p.latitude !== 0 || p.longitude !== 0);

  if (validPins.length === 0) {
    return (
      <div className="h-[500px] rounded-xl bg-muted flex flex-col items-center justify-center gap-3">
        <svg
          className="w-12 h-12 text-muted-foreground/50"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <div className="text-center">
          <p className="font-medium text-sm">No locations mapped</p>
          <p className="text-muted-foreground text-xs mt-1 max-w-xs">
            Add a location when creating a memory to see your travel route here.
          </p>
        </div>
      </div>
    );
  }

  // Center map on the average coordinates of all pins
  const avgLat =
    validPins.reduce((sum, p) => sum + p.latitude, 0) / validPins.length;
  const avgLng =
    validPins.reduce((sum, p) => sum + p.longitude, 0) / validPins.length;

  // Route polyline (chronological order)
  const routeCoords = [...validPins]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((p) => [p.latitude, p.longitude] as [number, number]);

  return (
    <div className="h-[500px] rounded-xl overflow-hidden border border-border">
      <MapContainer
        center={[avgLat, avgLng]}
        zoom={8}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* Travel route polyline */}
        {routeCoords.length > 1 && (
          <Polyline
            positions={routeCoords}
            color="#f97316"
            weight={2}
            opacity={0.6}
            dashArray="5, 5"
          />
        )}
        {/* Memory pins */}
        {validPins.map((pin) => (
          <Marker
            key={pin.id}
            position={[pin.latitude, pin.longitude]}
            icon={createCategoryIcon(pin.category)}
          >
            <Popup>
              <div className="min-w-[160px]">
                <p className="font-semibold text-sm">{pin.title}</p>
                {pin.locationName && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {pin.locationName}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(pin.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <a
                  href={`/trips/${tripId}/memories/${pin.id}`}
                  className="text-xs text-blue-600 hover:underline mt-1 block"
                >
                  View memory →
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
