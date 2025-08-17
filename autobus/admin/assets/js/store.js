import { rtdb, ref, onValue } from './firebase.js';

// ⬇️ leer EN VIVO desde /buses
// leer EN VIVO desde /buses/{driverId}/{RutaX}
export function subscribeBuses(cb){
  onValue(ref(rtdb, '/buses'), (snap)=>{
    const drivers = snap.val() || {};
    Object.keys(drivers).forEach(driverId=>{
      const rutas = drivers[driverId];
      Object.keys(rutas).forEach(rutaId=>{
        const d = rutas[rutaId];
        if (!d || d.lat==null || d.lng==null) return;
        cb({
          driverId,
          rutaId,
          alias: `${driverId} – ${rutaId}`,
          routeName: rutaId,
          lat: d.lat,
          lng: d.lng,
          status: d.status,
          lastUpdate: d.timestamp
        });
      });
    });
  });
}

export function buildDailyKey(ts){
  const d = new Date(ts);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth()+1).padStart(2,'0');
  const dd = String(d.getUTCDate()).padStart(2,'0');
  return `d${yyyy}${mm}${dd}`;
}

// Consulta tracks por rango [from, to], inclusive. Fechas en formato YYYY-MM-DD.
export async function queryTracksRange({ from, to, driverId=null }){
  const start = new Date(from + 'T00:00:00Z');
  const end   = new Date(to   + 'T23:59:59Z');

  // días cubiertos
  const days = [];
  let cur = new Date(start);
  while (cur <= end) {
    days.push(buildDailyKey(cur.getTime()));
    cur.setUTCDate(cur.getUTCDate()+1);
  }

  // juntamos resultados
  const rows = [];
  for (const day of days) {
    // colección: tracks/{driverId}/dYYYYMMDD (si no filtras driver, iterarías conductores: aquí simplifico)
    if (driverId) {
      const col = collection(fs, `tracks/${driverId}/${day}`);
      const snap = await getDocs(col);
      snap.forEach(doc=>{
        const r = doc.data();
        if (r.ts >= start.getTime() && r.ts <= end.getTime()) {
          rows.push({ ...r, day, driverId });
        }
      });
    } else {
      // Si necesitas “todos”, crea un índice o lista de drivers (p.ej. colección driversIndex)
      // Aquí dejamos el hook para ampliarlo luego.
    }
  }
  rows.sort((a,b)=>a.ts-b.ts);
  return rows;
}
