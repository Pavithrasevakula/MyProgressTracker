import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup }
from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc }
from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Initialize Firebase
const app = initializeApp(window.FIREBASE_CONFIG);
const auth = getAuth(app);
const db = getFirestore(app);

function showError(msg) {
  const el = document.getElementById('errorMsg');
  el.textContent = msg;
  el.classList.add('show');
}

function hideError() {
  document.getElementById('errorMsg').classList.remove('show');
}

function showLoading() {
  document.getElementById('loading').classList.add('show');
  document.querySelectorAll('.btn').forEach(b => b.disabled = true);
}

function hideLoading() {
  document.getElementById('loading').classList.remove('show');
  document.querySelectorAll('.btn').forEach(b => b.disabled = false);
}

// Google Sign In
window.signInWithGoogle = async function() {
  hideError();
  showLoading();
  
  const provider = new GoogleAuthProvider();
  
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    console.log('Google sign in:', user.uid);
    
    // Create the user's shared planner document on first Google sign-in.
    const docRef = doc(db, 'users', user.uid, 'planner', 'data');
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      await setDoc(docRef, {
        profile: { name: user.displayName || 'User' },
        createdAt: new Date().toISOString(),
        lastSync: new Date().toISOString()
      });
    }
    
    // Redirect to main app
    window.location.href = 'index.html';
  } catch (error) {
    console.error('Google sign in error:', error);
    let msg = 'Google sign in failed. Please try again.';
    if (error.code === 'auth/popup-closed-by-user') msg = 'Sign in cancelled.';
    if (error.code === 'auth/popup-blocked') msg = 'Popup blocked. Please allow popups for this site.';
    showError(msg);
    hideLoading();
  }
}

// Check if already signed in
auth.onAuthStateChanged((user) => {
  if (user && !window.location.search.includes('force')) {
    // Already signed in, redirect to main app
    window.location.href = 'index.html';
  }
});
