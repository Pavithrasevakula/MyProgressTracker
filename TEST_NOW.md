# MyProgressTrack launch checklist

## Firebase setup

- [ ] Google sign-in is enabled in Firebase Authentication.
- [ ] The hosted domain is listed as an authorized domain.
- [ ] Firestore rules restrict access to the signed-in user's UID.

## Authentication

- [ ] Open `auth.html`.
- [ ] Click **Continue with Google**.
- [ ] Select the intended Google account.
- [ ] The planner opens after authentication.
- [ ] The account name appears in the top bar.
- [ ] Sign out returns to the Google sign-in page.

## Cloud data

- [ ] Existing planner data appears after login.
- [ ] A new habit or study session saves after a short delay.
- [ ] Refreshing the page preserves the data.
- [ ] Signing in on another device shows the same data.
- [ ] A change on one device appears on the other.
- [ ] Offline edits remain available locally and sync after reconnecting.
- [ ] Download Backup creates a JSON file.
- [ ] Deleting the last daily habit keeps the routine empty after reload.
- [ ] Recurring tasks create only the next occurrence after completion.
- [ ] Task subtasks can be checked independently and reset for recurring copies.
- [ ] Overdue tasks can be filtered, carried to today, and rescheduled.
- [ ] Calendar and list task views show the same task data.
- [ ] Focus sprints record study minutes and update progress.
- [ ] Browser reminders remain off unless explicitly enabled.
- [ ] Invalid backup files are rejected without replacing current data.
- [ ] A multi-device conflict offers a cloud/local choice.

## Responsive UI

- [ ] Test desktop width.
- [ ] Test tablet width.
- [ ] Test a narrow phone width.
- [ ] Open and close the mobile navigation.
- [ ] Open and close each modal.
- [ ] Press Escape to close an open modal.
- [ ] Tables scroll horizontally without breaking the page.
