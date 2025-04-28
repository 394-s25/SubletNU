import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvent } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({ iconUrl, shadowUrl: iconShadow });
L.Marker.prototype.options.icon = DefaultIcon;

const defaultCenter = { lat: 42.055984, lng: -87.675171 };

function FlyAndHighlight({ selectedMarker }) {
  const map = useMap();

  useEffect(() => {
    if (selectedMarker?.lat && selectedMarker?.lng) {
      console.log("[Fly] Jumping to:", selectedMarker);
      map.flyTo([selectedMarker.lat, selectedMarker.lng], 17, { duration: 1.2 });
    }
  }, [selectedMarker, map]);

  return null;
}

export default function LeafletMapBox({ listings, selectedMarker, setSelectedMarker }) {
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    console.log("[MapBox] Updated listings:", listings);
    setMarkers(listings);
  }, [listings]);

  return (
    <MapContainer
      center={defaultCenter}
      zoom={14}
      scrollWheelZoom
      style={{ width: "100%", height: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
      />

      {markers.map((marker, idx) => (
        <Marker
          key={idx}
          position={[marker.lat, marker.lng]}
          eventHandlers={{
            click: () => {
              console.log("[Marker Click] Selected:", marker);
              setSelectedMarker(marker);
            }
          }}
        >
          <Popup>
            <strong>{marker.title || "Untitled"}</strong><br />
            {marker.location}<br />
            {marker.startDate} → {marker.endDate}<br />
            <strong>${marker.price}/month</strong>
          </Popup>
        </Marker>
      ))}

      <FlyAndHighlight selectedMarker={selectedMarker} />
    </MapContainer>
  );
}
