# MyProgressTrack

A focused student workspace for planning tasks, logging study sessions, building routines, and seeing steady progress.

## 🚀 Quick Start

1. **Sign In**: Open `auth.html` and continue with your Google account
2. **Start Tracking**: Use the app to log study time, habits, goals, and diary entries
3. **Multi-Device**: Sign in on any device with the same account - your data syncs automatically!

## 🔐 Authentication & Cloud Sync

### First Time Setup:

1. **Firebase Console Setup** (one-time):
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create/select your project
   - Enable **Authentication** → Google
   - Update **Firestore Rules**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/planner/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

2. **Update Firebase Config**:
   - Edit `firebase-config.js` with your Firebase project details
   - This file contains public values (safe to commit)

3. **Test It**:
   - Open `auth.html` in browser
   - Continue with Google
   - Start using the app!

### Features:
- ✅ Google Sign-In (one-click)
- ✅ Automatic cloud sync
- ✅ Real-time sync across devices
- ✅ Secure data storage

## 📱 Install as a Phone App (PWA)

Host these files on any web server (GitHub Pages works):
- `index.html`, `auth.html`
- `manifest.webmanifest`
- `sw.js`
- `icon.png`
- `firebase-config.js`

Open on your phone → browser menu → "Add to Home screen" / "Install app"

Requirements:
- Must be served over HTTPS (GitHub Pages is HTTPS by default)
- Sign in once, and you're set!

## 📖 Documentation

- **`TEST_NOW.md`** - Step-by-step testing guide
- **`AUTHENTICATION_SETUP.md`** - Detailed authentication setup

## 🔒 Privacy & Security

- Your data is stored securely in Firestore
- Only you can access your data (enforced by Firestore Rules)
- Google Sign-In uses OAuth 2.0 standard
- All data encrypted in transit (HTTPS)

## 📁 File Structure

```
MyProgressTracker/
├── index.html              # App markup and page templates
├── styles.css              # Shared planner styles and responsive layout
├── app-shell.js            # Shared shell and modal enhancements
├── firebase-auth.js        # Google authentication and Firestore sync
├── planner.js              # Planner state, rendering, and interactions
├── auth.html               # Google sign-in markup
├── auth.css                # Sign-in page styles
├── auth.js                 # Sign-in and Firebase account creation
├── firebase-config.js      # Firebase configuration
├── icon.png                # App icon
├── manifest.webmanifest    # PWA manifest
├── sw.js                   # Service worker
└── *.md                    # Documentation
```

The app keeps its HTML templates separate from styling and behavior so each area
can be changed and tested without editing one very large file. Firebase setup
and planner logic remain separate modules, while the service worker caches all
of the app-shell assets for offline use.

## Features

- **Today**: A calm command center for priorities, today's tasks, and routine check-in
- **Tasks**: Due dates, durations, areas, completion, and High/Medium/Low priorities
- **Study**: Focused session logging, subject summaries, and recent work
- **Routine**: Lightweight habits and weekly consistency
- **Progress**: Completed work, study totals, weekly activity, and subject balance
- **Diary**: Short daily reflection with wins, learning, and next steps
- **Cloud sync**: Google account authentication, offline-first saving, and multi-device updates
- **Responsive PWA**: Designed for desktop, tablet, and phone use

The product intentionally avoids separate exam-specific dashboards. Students can use
the same task, study, routine, and progress tools for classes, projects, placements,
personal goals, and any future learning plan.

## 🐛 Troubleshooting

Check `TEST_NOW.md` for common issues and solutions.

## 💬 Support

- Browser Console (F12) shows helpful logs
- Check documentation files for detailed guides
- Firebase Console → Authentication → Users to verify accounts
