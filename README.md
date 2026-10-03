# MyProgressTrack

Single-file planner. Open `MyProgressTrack.html` (rename to `index.html` for GitHub Pages).

## Cloud sync (optional, no login)
1. Firebase console -> create project -> Build -> Firestore Database (production mode).
2. Project settings -> add a Web app -> copy apiKey, authDomain, projectId, appId.
3. In the app: Cloud Sync -> paste them. A private random **sync key** is generated; copy that same key into the app on your other devices.
4. Firestore -> Rules, paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /planners/{key} {
      allow get, create, update: if true;   // needs the unguessable key
      allow list, delete: if false;         // nobody can browse or wipe
    }
  }
}
```

## Keeping details out of GitHub
- Details typed in the app live only in your browser (localStorage).
- Or use `config.js` (copy of `config.example.js`); it is git-ignored. Note GitHub Pages will not serve it, so on Pages use the in-app form.
- Never commit your exported backup JSON (your diary is in it); `.gitignore` already skips `*.json`.

## Install as a phone app (PWA)
Host these files together (GitHub Pages works): `index.html`, `manifest.webmanifest`, `sw.js`, `icon-192.png`, `icon-512.png`.
Open the site on your phone -> browser menu -> "Add to Home screen" / "Install app".
It must be served over https (GitHub Pages is). Opening the file directly from disk works as a normal page, just not installable.
Daily reminder (Settings -> Daily targets) fires only while the app is open or running in the background; fully-closed push notifications would need a server, which this app deliberately doesn't have.

## Update: auto-config
Fill `firebase-config.js` once (public values, safe to commit). On each new device open the app, click Cloud Sync -> "Copy phone setup link" on your first device, and open that link on the new one. The link holds your private sync key: send it only to yourself.
