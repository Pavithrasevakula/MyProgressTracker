# MyProgressTrack

MyProgressTrack is a Google-authenticated student workspace for planning study time, managing assignments, tracking subject progress, building routines, and reflecting on each day.

## What it includes

- **Today** — a calm daily overview with priorities, deadlines, habits, and weekly study time.
- **Tasks & deadlines** — create tasks with subjects, due dates, priority, notes, estimated time, and completion state.
- **Subjects** — organize academic work by subject and see subject-level progress.
- **Progress** — review completion, study minutes, routine check-ins, and recent activity.
- **Focus sprints** — run a lightweight 25-minute Pomodoro with automatic study-time logging and breaks.
- **Weekly review insights** — get an actionable next step based on overdue work and recent focus time.
- **Journal** — save short daily reflections and next steps.
- **Settings** — manage habits, weekly study targets, optional browser reminders, profile details, backup, and sync.
- **Google sign-in and automatic cloud sync** — data is stored in Firestore under the signed-in account and synchronized across devices.
- **Offline-first PWA** — local changes remain available offline and sync when the connection returns.

## Run locally

Serve the project over HTTP or HTTPS. Firebase Authentication does not work correctly from `file://`.

1. Enable Google sign-in and Firestore in Firebase.
2. Add the project values to `firebase-config.js`.
3. Add your local or deployed domain to Firebase Authentication's authorized domains.
4. Open `auth.html`.

## Firestore rules

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

## Structure

```
index.html          Main workspace markup
styles.css          Responsive visual system
planner.js          State, migration, rendering, and interactions
firebase-auth.js    Google authentication and Firestore sync
app-shell.js        Shared account and sync modal behavior
auth.html           Sign-in page
auth.css            Sign-in styles
auth.js             Sign-in behavior
firebase-config.js  Public Firebase configuration
sw.js               Offline app-shell cache
manifest.webmanifest PWA metadata
```
