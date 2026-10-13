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
- [ ] Enabling browser reminders remains enabled after a page refresh and after signing in again.
- [ ] Disabling browser reminders remains disabled after a page refresh and after signing in again.
- [ ] Changing the reminder time remains unchanged after a page refresh and on another signed-in device.
- [ ] Invalid backup files are rejected without replacing current data.
- [ ] A multi-device conflict offers a cloud/local choice.
- [ ] Smart reminders skip days with a configured check-in.
- [ ] Daily plan ranks open tasks by priority and deadline.
- [ ] Recurring tasks create the next occurrence when completed.
- [ ] Calendar export opens correctly in a calendar application.
- [ ] Backup snapshots can be saved and restored.
- [ ] Streak and focus analytics update after a habit check-in or focus sprint.
- [ ] Push setup refuses safely when no public VAPID key is configured.
- [ ] A deleted subject stays deleted after refresh, sign-in, and cloud sync.
- [ ] Enabling reminders stays enabled after refresh until manually disabled.
- [ ] Theme selection remains after refresh and follows the selected light, dark, or system mode.
- [ ] Settings cards remain readable and aligned on desktop, tablet, and mobile widths.
- [ ] A newer change from another signed-in device syncs automatically without a confirmation dialog.
- [ ] Settings use a compact two-column layout on desktop and stack cleanly on mobile.

## Responsive UI

- [ ] Test desktop width.
- [ ] Test tablet width.
- [ ] Test a narrow phone width.
- [ ] Open and close the mobile navigation.
- [ ] Open and close each modal.
- [ ] Press Escape to close an open modal.
- [ ] Tables scroll horizontally without breaking the page.
