# Google Authentication Setup

MyProgressTrack uses Google Authentication as the only sign-in method. The same Google account loads the same planner data on every device.

## 1. Enable Google sign-in

1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Select `myprogresstracker-1708a`.
3. Open **Authentication → Sign-in method**.
4. Enable **Google** and choose a project support email.
5. Add the domains where the app is hosted under **Authentication → Settings → Authorized domains**.

## 2. Configure Firestore rules

Publish these rules in **Firestore Database → Rules**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/planner/{document=**} {
      allow read, write: if request.auth != null
        && request.auth.uid == userId;
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## 3. User data model

Each Google account has one private planner document:

```text
/users/{firebaseUserId}/planner/data
  state: { ...planner data... }
  profile: { ...profile data... }
  updatedAt: ISO timestamp
```

The Firebase user ID comes from Google Authentication. It is never entered, copied, or shared by the user.

## 4. How users access their data

1. Open `auth.html`.
2. Choose **Continue with Google**.
3. Select the same Google account on every device.
4. Open the planner.

The planner loads the account's Firestore data, saves changes automatically, and listens for changes made on other devices.

## 5. Backup and offline behavior

- The app keeps a local browser cache for fast startup and temporary offline work.
- Cloud data remains the shared source of truth after Google sign-in.
- Use **Settings → Account & Data → Download Backup** for a portable JSON backup.
- When offline, changes remain local and are uploaded after the connection returns.

## 6. Troubleshooting

### Google sign-in fails

- Confirm Google is enabled in Firebase Authentication.
- Confirm the app's hosting domain is an authorized domain.
- Allow popups for the app.

### Permission denied

- Confirm the Firestore rules above are published.
- Confirm the user is signed in with Google.

### Data is missing on another device

- Confirm both devices use the same Google account.
- Wait for the planner to finish loading cloud data.
- Check the sync status in the sidebar.
