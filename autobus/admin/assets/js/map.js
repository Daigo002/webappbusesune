let markers = new Map();
let polylines = new Map();
let tracks = new Map(); // driverId -> array puntos

function colorByStatus(s) {
  if (s==='EN_RUTA') return '#16a34a';
  if (s==='DETENIDO') return '#f59e0b';
  if (s==='SOS') return '#ef4444';
  if (s==='SIN_SENAL') return '#6b7280';
  return '#3b82f6';
}

export function initMap(latlng=[-12.056,-77.084], zoom=12){
  const map = L.map('map').setView(latlng, zoom);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom:19, attribution:'&copy; OpenStreetMap'
  }).addTo(map);
  return map;
}

export function upsertBusMarker(map, d){
  const key = d.driverId + '-' + d.rutaId;   // id único
  let m = markers.get(key);
  if (!m) {
    m = L.circleMarker([d.lat, d.lng], {
      radius: 8,
      color: colorByStatus(d.status),
      fillColor: colorByStatus(d.status),
      fillOpacity: 0.9,
      weight: 2
    }).addTo(map);
    m.bindPopup('Cargando...');
    markers.set(key, m);
  } else {
    m.setLatLng([d.lat, d.lng]);
    m.setStyle({ color: colorByStatus(d.status), fillColor: colorByStatus(d.status) });
  }

  m.setPopupContent(`<b>${d.alias}</b><br>
    Ruta: ${d.routeName}<br>
    Estado: ${d.status||'—'}<br>
    Último: ${d.lastUpdate ? new Date(d.lastUpdate).toLocaleTimeString():'—'}`);
}


export function fitAll(map){
  const group = L.featureGroup([...markers.values()]);
  if (group.getLayers().length) map.fitBounds(group.getBounds(), { padding:[30,30] });
}
