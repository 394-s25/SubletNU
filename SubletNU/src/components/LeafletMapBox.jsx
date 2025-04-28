import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
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

export default function LeafletMapBox({ setSelectedMarker, listings, selectedMarker }) {
  const [markers, setMarkers] = useState([]);
  const mapRef = useRef(); // 👉 添加地图引用

  useEffect(() => {
    const fetchCoordinates = async () => {
      const results = [];
      console.log("mapbox inputed:", listings);

      for (const listing of listings) {
        if (!listing.location) continue;
        if (listing.lat && listing.lng) {
          results.push(listing);
          continue;
        }
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

      console.log("mapbox markers:", results);
      setMarkers(results);
    };

    fetchCoordinates();
  }, [listings]);

  
  useEffect(() => {
    if (selectedMarker && selectedMarker.lat && selectedMarker.lng && mapRef.current) {
      mapRef.current.flyTo([selectedMarker.lat, selectedMarker.lng], 16, {
        duration: 1.5,
      });
    }
  }, [selectedMarker]);

  return (
    <MapContainer
      center={center}
      zoom={14}
      scrollWheelZoom
      style={containerStyle}
      whenCreated={(mapInstance) => { mapRef.current = mapInstance; }}
    >
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
            <button onClick={() => setSelectedMarker(marker)}>Locate</button>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
