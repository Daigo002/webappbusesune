// /admin/assets/js/auth.js
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

export async function signIn(auth, email, password){
  try { await signInWithEmailAndPassword(auth, email, password); return { ok:true }; }
  catch (e) { return { ok:false, error:e.message }; }
}

// Si ya hay sesión, redirige (para login.html)
export function requireNoSession(auth, redirectUrl){
  onAuthStateChanged(auth, (u)=>{ if (u) location.href = redirectUrl; });
}

// Exige sesión (para index.html y reports.html)
export function requireSession(auth, loginUrl){
  return new Promise((resolve)=>{
    onAuthStateChanged(auth, (u)=>{
      if (!u) { location.href = loginUrl; return; }
      resolve(true);
    });
  });
}

export async function signOutNow(auth){
  await signOut(auth);
  location.href = '/admin/login.html';
}
