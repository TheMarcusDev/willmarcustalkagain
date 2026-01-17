import React, { useState } from "react";
import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps";

const MapStage = ({ onSelect }) => {
  const ApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const [marker, setMarker] = useState(null);

  const resolveLatLng = (evt) => {
    // wrapper emits MapMouseEvent with detail.latLng (a LatLngLiteral),
    // but be defensive: accept evt.detail.latLng or evt.latLng or google maps LatLng obj.
    const raw = evt?.detail?.latLng ?? evt?.latLng ?? null;
    if (!raw) return null;
    if (typeof raw.lat === "function") {
      return { lat: raw.lat(), lng: raw.lng() };
    }
    // assume LatLngLiteral { lat: number, lng: number }
    return raw;
  };

  const handleMapClick = (evt) => {
    const pos = resolveLatLng(evt);
    if (!pos) return;
    setMarker(pos);
    if (typeof onSelect === "function") onSelect(pos);
  };

  return (
    <APIProvider apiKey={ApiKey}>
      <Map
        style={{
          filter: "hue-rotate(290deg) brightness(1.3) saturate(250%)",
        }}
        defaultCenter={{ lat: 0, lng: 0 }}
        defaultZoom={3}
        colorScheme="DARK"
        disableDefaultUI
        onClick={handleMapClick}
      >
        {marker && <Marker position={marker} />}
      </Map>
    </APIProvider>
  );
};

export default MapStage;
