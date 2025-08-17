const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const fs = admin.firestore();
const rtdb = admin.database();

// 1) Setear rol admin (ejecuta manualmente con callable o desde consola)
exports.setAdminRole = functions.https.onCall(async (data, context) => {
  // Requiere que el llamador ya sea admin
  const callerToken = await admin.auth().verifyIdToken(context.auth.token);
  if (callerToken.role !== 'admin') throw new functions.https.HttpsError('permission-denied');

  const uid = data.uid;
  await admin.auth().setCustomUserClaims(uid, { role: 'admin' });
  return { ok: true };
});

// 2) Espejar updates de /drivers a Firestore (throttle por driver)
const lastWrite = new Map(); // memoria efímera; en prod usar TTL cache (memcache) o limitar por tiempo
exports.mirrorDriverToFirestore = functions.database.ref('/drivers/{driverId}')
  .onWrite(async (change, context)=>{
    const driverId = context.params.driverId;
    const after = change.after.val();
    if (!after) return null;

    const now = Date.now();
    const prev = lastWrite.get(driverId) || 0;
    if (now - prev < 15000) return null; // 15s throttle
    lastWrite.set(driverId, now);

    const day = buildDayKey(now); // dYYYYMMDD
    const col = fs.collection('tracks').doc(driverId).collection(day);
    await col.add({
      ts: after.lastUpdate || now,
      lat: after.lat, lng: after.lng,
      speed: after.speed || 0,
      status: after.status || 'EN_RUTA'
    });
    return null;
  });

function buildDayKey(ts){
  const d = new Date(ts);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth()+1).padStart(2,'0');
  const dd = String(d.getUTCDate()).padStart(2,'0');
  return `d${yyyy}${mm}${dd}`;
}
