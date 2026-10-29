import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { metaOf } from '../utils/booking';

const TILES = `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${import.meta.env.VITE_CARTO_KEY}`;
const ATTRIBUTION =
  '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com">CARTO</a>';

// A teardrop pin in the building's colour, with its name beside it
function makeIcon(b) {
  const wrap = document.createElement('div');
  wrap.className = 'pin';
  wrap.style.setProperty('--pin', metaOf(b.type).color);
  const drop = document.createElement('span');
  drop.className = 'pin-drop';
  const label = document.createElement('span');
  label.className = 'pin-label';
  label.textContent = b.name;
  wrap.append(drop, label);
  return L.divIcon({ html: wrap, className: 'pin-icon', iconSize: [0, 0], iconAnchor: [0, 0] });
}

function popupContent(b, onOpen) {
  const box = document.createElement('div');
  box.className = 'map-popup';
  const name = document.createElement('strong');
  name.textContent = b.name;
  const meta = document.createElement('span');
  meta.textContent = `${metaOf(b.type).label}, ${b.city}`;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn btn-primary';
  btn.textContent = 'View bays';
  btn.addEventListener('click', onOpen);
  box.append(name, meta, btn);
  return box;
}

export default function BuildingMap({ buildings, userPos, activeId, onActive, onOpen }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const markersRef = useRef(new Map());
  const callbacks = useRef({ onActive, onOpen });
  callbacks.current = { onActive, onOpen };

  // Create the map once
  useEffect(() => {
    const map = L.map(elRef.current, { scrollWheelZoom: true }).setView([22.9, 78.6], 5);
    L.tileLayer(TILES, { maxZoom: 19, subdomains: 'abcd', attribution: ATTRIBUTION }).addTo(map);
    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);
    const t = setTimeout(() => map.invalidateSize(), 0);
    return () => {
      clearTimeout(t);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Draw the pins whenever the list changes
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    markersRef.current.clear();

    const points = [];
    buildings.forEach((b) => {
      if (typeof b.latitude !== 'number' || typeof b.longitude !== 'number') return;
      const marker = L.marker([b.latitude, b.longitude], { icon: makeIcon(b), title: b.name, riseOnHover: true });
      marker.on('click', () => callbacks.current.onActive(b.id));
      marker.bindPopup(popupContent(b, () => callbacks.current.onOpen(b)), { closeButton: false, offset: [0, -34] });
      marker.addTo(layer);
      markersRef.current.set(b.id, marker);
      points.push([b.latitude, b.longitude]);
    });

    if (userPos) {
      L.circleMarker([userPos.lat, userPos.lng], {
        radius: 8, color: '#fff', weight: 3, fillColor: '#2563eb', fillOpacity: 1,
      }).bindTooltip('You are here').addTo(layer);
    }

    // No animation: Leaflet ignores a new view while a zoom animation is still running,
    // and the list is replaced several times in a row (loading, then results).
    if (points.length === 1) map.setView(points[0], 15, { animate: false });
    else if (points.length > 1) map.fitBounds(points, { padding: [70, 70], maxZoom: 15, animate: false });
    else if (userPos) map.setView([userPos.lat, userPos.lng], 13, { animate: false });
  }, [buildings, userPos]);

  // Highlight the pin of the card being hovered
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const el = marker.getElement()?.querySelector('.pin');
      if (el) el.classList.toggle('is-active', id === activeId);
      marker.setZIndexOffset(id === activeId ? 1000 : 0);
    });
  }, [activeId, buildings]);

  return <div ref={elRef} className="map" role="region" aria-label="Map of parking buildings" />;
}
