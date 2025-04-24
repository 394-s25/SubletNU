import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet's default icon issues
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
});
L.Marker.prototype.options.icon = DefaultIcon;

const containerStyle = {
  width: "100%",
  height: "100%",
};

const center = {
  lat: 42.055984,
  lng: -87.675171,
};

export default function LeafletMapBox({ setSelectedMarker, listings }) {
  const [markers, setMarkers] = useState([]);
  const [selected, setSelected] = useState({}); // the marker object

  const handleMarkerClick = (marker) => {
    try {
      setSelectedMarker(marker);
      setSelected(marker);
    } catch (error) {
      console.error("Map click error:", error);
    }
  };

  useEffect(() => {
    const fetchCoordinates = async () => {
      const results = [];

      for (const listing of listings) {
        if (!listing.location) continue;
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          listing.location
        )}&format=json&limit=1`;

        try {
          const res = await fetch(url, {
            headers: {
              'User-Agent': 'sublet-nu-app/1.0 (minxin@northwestern.edu)',
            },
          });
          const data = await res.json();

          if (data.length > 0) {
            results.push({
              lat: parseFloat(data[0].lat),
              lng: parseFloat(data[0].lon),
              ...listing,
            });
          }
        } catch (err) {
          console.error("Geocode failed for:", listing.location, err);
        }
      }

      setMarkers(results);
    };

    fetchCoordinates();
  }, [listings]);

  return (
    <MapContainer center={center} zoom={14} scrollWheelZoom style={containerStyle}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
      />

      {markers.map((marker, index) => (
        <Marker 
          key={index} 
          position={[marker.lat, marker.lng]}
          >
          <Popup>
            <strong>{marker.title || "Untitled"}</strong><br />
            {marker.location}<br />
            {marker.startDate} → {marker.endDate}<br />
            <strong>${marker.price}/month</strong><br />
            <button onClick={() => setSelectedMarker(marker)}>Read More</button>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
  

