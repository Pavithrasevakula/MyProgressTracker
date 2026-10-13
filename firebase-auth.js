// Firebase Authentication & Real-time Sync Manager

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Initialize Firebase (once)
if (!window.firebaseApp) {
  window.firebaseApp = initializeApp(window.FIREBASE_CONFIG);
}

const auth = getAuth(window.firebaseApp);
const db = getFirestore(window.firebaseApp);

// Global state
window.currentUser = null;
window.userDocRef = null;
window.syncUnsubscribe = null;
window.localChangesPending = false;

console.log(' Auth manager initialized');

function setAppLoading(visible) {
  const loading = document.getElementById('appLoading');
  if (loading) loading.hidden = !visible;
}

function updateConnectivity() {
  const sync = document.getElementById('syncStatus');
  if (!sync) return;
  sync.classList.toggle('offline', !navigator.onLine);
  if (!navigator.onLine) {
    const label = document.getElementById('syncLabel') || sync;
    label.textContent = 'Offline — changes stay on this device';
  }
}

window.addEventListener('online', () => {
  updateConnectivity();
  if (window.userDocRef) saveToCloud();
});
window.addEventListener('offline', updateConnectivity);
updateConnectivity();

// Authentication State Listener
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    // Not logged in → redirect to auth page
    console.log(' No user - redirecting to auth.html');
    window.location.href = 'auth.html';
    return;
  }
  
  console.log(' User authenticated:', user.uid);
  
  // Store user info globally
  window.currentUser = user;
  window.userDocRef = doc(db, 'users', user.uid, 'planner', 'data');
  
  // Update UI with user info
  addUserInfoToUI(user);
  
  // Load user data from Firestore
  await loadCloudData();
  
  // Setup real-time sync listener
  setupRealtimeSync();
  
  // Update sync status
  updateSyncStatus('● Synced with cloud');
  setAppLoading(false);
  if (!window.state?.profile?.onboardingComplete) {
    setTimeout(() => window.openOnboarding?.(), 350);
  }
});

// Add User Info to UI
function addUserInfoToUI(user) {
  const firstName=(user.displayName||user.email.split('@')[0]).trim().split(/\s+/)[0]||'Account';
  const name=document.getElementById('profileFirstName'),menuName=document.getElementById('profileMenuName'),email=document.getElementById('profileMenuEmail');
  if(name)name.textContent=firstName;
  if(menuName)menuName.textContent=user.displayName||firstName;
  if(email)email.textContent=user.email||'';
}
window.toggleProfileMenu=()=>{
  const menu=document.getElementById('profileDropdown'),trigger=document.querySelector('.profile-trigger');
  if(!menu)return;
  const open=menu.hidden;
  menu.hidden=!open;
  if(trigger)trigger.setAttribute('aria-expanded',String(open));
};
window.closeProfileMenu=()=>{
  const menu=document.getElementById('profileDropdown'),trigger=document.querySelector('.profile-trigger');
  if(menu)menu.hidden=true;
  if(trigger)trigger.setAttribute('aria-expanded','false');
};
document.addEventListener('click',event=>{if(!event.target.closest('#profileMenu'))window.closeProfileMenu?.()});

// Load Data from Firestore
async function loadCloudData() {
  try {
    console.log(' Loading data from Firestore...');
    
    const docSnap = await getDoc(window.userDocRef);
    
    if (docSnap.exists()) {
      const cloudData = docSnap.data();
      
      if (cloudData.state) {
        const localChangeAt = localStorage.getItem('plannerLocalChangeAt') || '';
        const cloudTime = cloudData.updatedAt || '';
        if (localChangeAt && (!cloudTime || localChangeAt > cloudTime)) {
          window.localChangesPending = true;
          await saveToCloud();
          updateSyncStatus('● Local changes synced');
          return;
        }
        const completedLocally = window.state.profile?.onboardingComplete === true;
        const cloudHasCompletion = cloudData.state.profile?.onboardingComplete === true;
        // Merge cloud data with current state
        Object.assign(window.state, cloudData.state);
        window.state.profile ??= {};
        const hasPlannerActivity = Object.keys(window.state.daily || {}).length > 0
          || (window.state.tasks || []).length > 0
          || (window.state.goals || []).length > 0
          || (window.state.academics?.logs || []).length > 0
          || (window.state.timeLogs || []).length > 0;
        if (completedLocally || window.state.profile.onboardingComplete === true || hasPlannerActivity) {
          window.state.profile.onboardingComplete = true;
        } else {
          window.state.profile.onboardingComplete = false;
        }
        
        // Save to localStorage
        localStorage.setItem('dailyPlannerState', JSON.stringify(window.state));
        localStorage.setItem('lastCloudSync', cloudData.updatedAt || new Date().toISOString());
        if (window.state.profile.onboardingComplete === true && !cloudHasCompletion) {
          await saveToCloud();
        }
        
        console.log(' Data loaded from cloud');
        
        // Re-render all UI
        if (typeof window.renderAll === 'function') {
          window.renderAll();
        }
      }
    } else {
      // First time user - save initial state to cloud
      console.log(' First time user - uploading initial data...');
      await saveToCloud();
    }
    
    updateSyncStatus('● Cloud synced');
    
  } catch (error) {
    console.error(' Error loading cloud data:', error);
    updateSyncStatus('● Sync error');
    
    if (typeof window.toast === 'function') {
      window.toast('Using local data. Cloud sync will retry.', 3000);
    }
    setAppLoading(false);
  }
}

// Save Data to Firestore
async function saveToCloud() {
  if (!window.userDocRef || !window.state) {
    console.warn(' Cannot save - no user or state');
    return;
  }
  if (!navigator.onLine) {
    updateSyncStatus('Offline — changes stay on this device');
    return;
  }
  
  try {
    updateSyncStatus('Saving to cloud…');
    const timestamp = new Date().toISOString();
    
    await setDoc(window.userDocRef, {
      state: window.state,
      profile: window.state.profile || {},
      updatedAt: timestamp,
      lastSync: timestamp
    }, { merge: true });
    
    localStorage.setItem('lastCloudSync', timestamp);
    localStorage.removeItem('plannerLocalChangeAt');
    window.localChangesPending = false;
    updateSyncStatus('● Cloud synced');
    
    console.log(' Data saved to cloud');
    
  } catch (error) {
    console.error(' Error saving to cloud:', error);
    updateSyncStatus('● Sync error');
  }
}

// Real-time Sync (listen for changes from other devices)
function setupRealtimeSync() {
  if (!window.userDocRef) return;
  
  // Cleanup old listener if exists
  if (window.syncUnsubscribe) {
    window.syncUnsubscribe();
  }
  
  console.log(' Setting up real-time sync...');
  
  window.syncUnsubscribe = onSnapshot(
    window.userDocRef,
    (doc) => {
      if (!doc.exists()) return;
      
      const cloudData = doc.data();
      const cloudTime = cloudData.updatedAt || '';
      const localTime = localStorage.getItem('lastCloudSync') || '';
      
      // Only update if cloud data is newer
      if (cloudTime > localTime && cloudData.state) {
        if (window.localChangesPending) {
          const useCloudVersion = confirm('This workspace changed on another device.\n\nChoose OK to use the cloud version, or Cancel to keep this device and upload your changes.');
          if (!useCloudVersion) {
            saveToCloud();
            return;
          }
        }
        console.log(' Syncing data from another device...');
        
        Object.assign(window.state, cloudData.state);
        localStorage.setItem('dailyPlannerState', JSON.stringify(window.state));
        localStorage.setItem('lastCloudSync', cloudTime);
        
        // Re-render UI
        if (typeof window.renderAll === 'function') {
          window.renderAll();
        }
        
        updateSyncStatus('● Synced from another device');
        
        if (typeof window.toast === 'function') {
          window.toast(' Data synced from another device', 2000);
        }
      }
    },
    (error) => {
      console.error(' Real-time sync error:', error);
      updateSyncStatus('● Sync error');
    }
  );
  
  console.log(' Real-time sync active');
}

// Sign Out Function
window.signOutUser = async function() {
  if (!confirm('Sign out of your account?\n\nYour data is safely stored in the cloud.')) {
    return;
  }
  
  try {
    console.log(' Signing out...');
    
    // Cleanup sync listener
    if (window.syncUnsubscribe) {
      window.syncUnsubscribe();
      window.syncUnsubscribe = null;
    }
    
    // Sign out from Firebase
    await signOut(auth);
    
    // Clear local data
    localStorage.clear();
    
    // Redirect to auth page
    window.location.href = 'auth.html';
    
  } catch (error) {
    console.error(' Sign out error:', error);
    
    if (typeof window.toast === 'function') {
      window.toast('Could not sign out. Please try again.', 3000);
    }
  }
};

// Override saveLocal to Also Save to Cloud
let cloudSaveTimer;
const originalSaveLocal = window.saveLocal;

window.saveLocal = function() {
  // Call original save to localStorage
  if (typeof originalSaveLocal === 'function') {
    originalSaveLocal();
  } else {
    // Fallback if saveLocal doesn't exist yet
    try {
      localStorage.setItem('dailyPlannerState', JSON.stringify(window.state));
    } catch (e) {
      console.error('Save error:', e);
    }
  }
  
  window.localChangesPending = true;
  localStorage.setItem('plannerLocalChangeAt', new Date().toISOString());
  // Debounced cloud save (wait 1 second after last change)
  clearTimeout(cloudSaveTimer);
  cloudSaveTimer = setTimeout(saveToCloud, 1000);
};

// Helper: Update Sync Status Label
function updateSyncStatus(text) {
  const el = document.getElementById('syncLabel') || document.getElementById('syncStatus');
  if (el) el.textContent = text;
  updateConnectivity();
}

// Export Functions for Manual Use
window.forceCloudSync = saveToCloud;
window.reloadFromCloud = loadCloudData;

console.log(' Auth integration complete - ready to sync!');
