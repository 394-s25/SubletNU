import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({ iconUrl, shadowUrl: iconShadow });
L.Marker.prototype.options.icon = DefaultIcon;

const defaultCenter = { lat: 42.055984, lng: -87.675171 };

// can be used to control map movement and popup
function FlyAndHighlight({ selectedMarker, markerRefs }) {
  const map = useMap();

  useEffect(() => {
    if (selectedMarker?.lat && selectedMarker?.lng) {
      console.log("[Fly] Jump to:", selectedMarker);
      map.flyTo([selectedMarker.lat, selectedMarker.lng], map.getZoom() > 15 ? map.getZoom() : 16, { duration: 1.2 });

      // open the popup for the selected marker
      const markerRef = markerRefs.current[selectedMarker.key];
      if (markerRef) {
        markerRef.openPopup();
      }
    }
  }, [selectedMarker, map, markerRefs]);

  return null;
}

export default function LeafletMapBox({ listings, selectedMarker, setSelectedMarker }) {
  const [markers, setMarkers] = useState([]);
  const markerRefs = useRef({}); 


  useEffect(() => {
    console.log("[MapBox] Updated listings:", listings.filter((item) => item.lat));
    setMarkers(listings.filter((item) => item.lat));
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
          key={marker.key || idx}
          position={[marker.lat, marker.lng]}
          eventHandlers={{
            click: () => {
              console.log("[Marker Click] Selected:", marker);
              setSelectedMarker(marker);
            }
          }}
          ref={(ref) => {
            if (ref) {
              markerRefs.current[marker.key] = ref;
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

       {/* //control map movement and popup */}
      <FlyAndHighlight selectedMarker={selectedMarker} markerRefs={markerRefs} />
    </MapContainer>
  );
}
