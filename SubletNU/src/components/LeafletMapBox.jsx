import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({ iconUrl, shadowUrl: iconShadow });
L.Marker.prototype.options.icon = DefaultIcon;

const containerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = { lat: 42.055984, lng: -87.675171 };

function FlyToMarker({ selectedMarker }) {
  const map = useMap();

  useEffect(() => {
    if (selectedMarker?.lat && selectedMarker?.lng) {
      console.log("[FlyToMarker] Flying to:", selectedMarker);
      map.flyTo([selectedMarker.lat, selectedMarker.lng], 17, { duration: 1.5 });
    }
  }, [selectedMarker, map]);

  return null; // 不渲染任何元素
}

export default function LeafletMapBox({ setSelectedMarker, selectedMarker, listings }) {
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    console.log("[mapbox] Input listings:", listings);
    setMarkers(listings);
  }, [listings]);

  return (
    <MapContainer
      center={defaultCenter}
      zoom={14}
      scrollWheelZoom
      style={containerStyle}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
      />

      {markers.map((marker, idx) => (
        <Marker
          key={idx}
          position={[marker.lat, marker.lng]}
        >
          <Popup>
            <strong>{marker.title || "Untitled"}</strong><br />
            {marker.location}<br />
            {marker.startDate} → {marker.endDate}<br />
            <strong>${marker.price}/month</strong><br />
            <button onClick={() => setSelectedMarker(marker)}>Locate</button>
          </Popup>
        </Marker>
      ))}

      {/* 加上动态 FlyTo 控制 */}
      <FlyToMarker selectedMarker={selectedMarker} />
    </MapContainer>
  );
}
