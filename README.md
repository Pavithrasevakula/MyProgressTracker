# MyProgressTrack

A comprehensive daily planner and progress tracker with Firebase authentication and cloud sync.

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
├── index.html              # Main app
├── auth.html               # Google sign-in page
├── firebase-config.js      # Firebase configuration
├── icon.png                # App icon
├── manifest.webmanifest    # PWA manifest
├── sw.js                   # Service worker
└── *.md                    # Documentation
```

## Features

- 📚 **Academics**: Study log, syllabus tracker, assignments
- 💼 **Placements**: Prep log, topic tracker, applications
- 🏛️ **SSC CGL**: Study log, mock tests, section progress
- ✅ **Daily Habits**: Track routine tasks with calendar view
- 📝 **Diary**: Personal reflection and daily journaling
- 📊 **Analytics**: Activity heatmap, streaks, progress charts
- ☁️ **Cloud Sync**: Automatic backup and multi-device sync
- **Guided onboarding**: Configure focus areas and planning style after first sign-in
- **Plan my day**: Turn priorities into realistic, time-bounded tasks
- **Focused navigation**: A concise workspace sidebar keeps the main actions easy to find
- **Automatic cloud sync**: Enabled by default for signed-in Google accounts, with offline-first local saving and real-time updates across devices

## 🐛 Troubleshooting

Check `TEST_NOW.md` for common issues and solutions.

## 💬 Support

- Browser Console (F12) shows helpful logs
- Check documentation files for detailed guides
- Firebase Console → Authentication → Users to verify accounts
