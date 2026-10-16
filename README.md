# MyProgressTrack

MyProgressTrack is a Google-authenticated student workspace for planning study time, managing assignments, tracking subject progress, building routines, and reflecting on each day.

## What it includes

- **Today** — a calm daily overview with priorities, deadlines, habits, and weekly study time.
- **Daily plan** — build a short, ranked plan from open tasks without changing their deadlines.
- **Tasks & deadlines** — search tasks by title, notes, or subject; filter by date and status; switch between list and calendar views; and export open, dated tasks to a calendar.
- **Subjects** — select a subject to view, add, and edit its tasks directly within that subject card.
- **Today priorities** — opt specific tasks into the top-priorities list instead of automatically including every task.
- **Progress** — review completion, study minutes, routine check-ins, and recent activity across tasks, study sessions, and habits.
- **Focus sprints** — run a lightweight 25-minute Pomodoro with automatic study-time logging and breaks.
- **Weekly review insights** — get an actionable next step based on overdue work and recent focus time.
- **Journal** — save short daily reflections and next steps.
- **Settings** — manage habits, weekly study targets, reminder times and days, themes, profile details, downloadable backups, quick local snapshots, and sync. Profile and target changes apply when saved; other preferences save immediately and sync to the signed-in account.
- **Google sign-in and automatic cloud sync** — data is stored in Firestore under the signed-in account and synchronized across devices.
- **Offline-first PWA** — local changes remain available offline and sync when the connection returns.
- **Persistent preferences** — deleted subjects remain deleted, reminder preferences survive refresh and sync, and the interface supports light, dark, and system themes.
- **Account-wide live sync** — newer changes from any signed-in device are applied automatically without a conflict confirmation prompt.
- **Responsive navigation** — a persistent mobile bottom bar keeps every workspace section within easy reach.

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
