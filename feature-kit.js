/* Advanced planning, reminders, analytics, backups, and calendar tools. */
(function () {
  const wait = setInterval(() => {
    if (!window.state || !window.saveLocal) return;
    clearInterval(wait);
    init();
  }, 50);

  function init() {
    const settings = window.state.settings;
    settings.smartReminders ??= true;
    settings.skipReminderAfterCheckIn ??= true;
    settings.reminderDays ??= [1, 2, 3, 4, 5];
    settings.pushEnabled ??= false;
    settings.calendarConnected ??= false;
    settings.theme ??= "light";
    applyTheme(settings.theme);
    const systemTheme = window.matchMedia?.("(prefers-color-scheme: dark)");
    systemTheme?.addEventListener?.("change", () => {
      if (window.state.settings.theme === "system") applyTheme("system");
    });
    window.renderAdvancedFeatures = render;
    render();
    window.renderAll?.();
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("sw.js").catch(error => console.error("Could not register service worker", error));
    }
    setInterval(checkSmartReminder, 60000);
    checkSmartReminder();
  }

  function save(message) {
    window.saveLocal();
    render();
    if (message) window.toast?.(message);
  }

  function dateKey(date) {
    const d = date || new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function hasCheckedInToday() {
    const today = dateKey();
    return window.state.timeLogs.some(log => log.date === today)
      || window.state.habits.some(habit => habit.done?.[today])
      || Object.values(window.state.daily).some(day => day.journal && (day.journal.wins || day.journal.learn));
  }

  function render() {
    const root = document.getElementById("advancedFeatures");
    const s = window.state.settings;
    const appearance = document.getElementById("appearanceControl");
    if (appearance) {
      appearance.innerHTML = `<label class="sr-only" for="themeMode">Theme</label><select class="field" id="themeMode" onchange="setTheme(this.value)"><option value="light" ${s.theme === "light" ? "selected" : ""}>Light theme</option><option value="dark" ${s.theme === "dark" ? "selected" : ""}>Dark theme</option><option value="system" ${s.theme === "system" ? "selected" : ""}>Use system theme</option></select>`;
    }
    if (!root) return;
    const streak = calculateStreak();
    const analytics = calculateAnalytics();
    root.innerHTML = `
      <label for="themeMode">Appearance<select class="field" id="themeMode" onchange="setTheme(this.value)"><option value="light" ${s.theme === "light" ? "selected" : ""}>Light theme</option><option value="dark" ${s.theme === "dark" ? "selected" : ""}>Dark theme</option><option value="system" ${s.theme === "system" ? "selected" : ""}>Use system theme</option></select></label>
      <label class="setting-check"><input type="checkbox" ${s.smartReminders ? "checked" : ""} onchange="toggleSmartReminders(this.checked)"> Smart reminders</label>
      <label class="setting-check"><input type="checkbox" ${s.skipReminderAfterCheckIn ? "checked" : ""} onchange="toggleReminderSkip(this.checked)"> Skip after a check-in</label>
      <label for="reminderDays">Reminder days<select class="field" id="reminderDays" multiple onchange="saveReminderDays(this)">${[["1","Mon"],["2","Tue"],["3","Wed"],["4","Thu"],["5","Fri"],["6","Sat"],["0","Sun"]].map(([value,label]) => `<option value="${value}" ${s.reminderDays.includes(Number(value)) ? "selected" : ""}>${label}</option>`).join("")}</select></label>
      <div class="setting-note">Current streak: ${streak} day${streak === 1 ? "" : "s"} · ${analytics.minutes} focused minutes · ${analytics.subjects} active subjects</div>
      <button class="button secondary" onclick="suggestDailyPlan()">Build today's plan</button>
      <button class="button secondary" onclick="downloadCalendar()">Export calendar (.ics)</button>
      <button class="button text-button" onclick="createBackupSnapshot()">Save backup snapshot</button>
      <button class="button text-button" onclick="restoreBackupSnapshot()">Restore latest snapshot</button>
      <button class="button text-button" onclick="setupPushNotifications()">Set up background notifications</button>
      <span class="setting-note" id="advancedStatus">${s.pushEnabled ? "Background notifications configured on this device." : "Background notifications need a VAPID public key and push endpoint."}</span>
    `;
  }

  function calculateStreak() {
    let streak = 0;
    const cursor = new Date();
    while (true) {
      const key = dateKey(cursor);
      const active = window.state.timeLogs.some(log => log.date === key && Number(log.minutes) > 0)
        || window.state.habits.some(habit => habit.done?.[key])
        || window.state.tasks.some(task => task.status === "done" && task.completedAt && dateKey(new Date(task.completedAt)) === key);
      if (!active) break;
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  function calculateAnalytics() {
    const logs = window.state.timeLogs;
    const subjects = new Set(logs.map(log => log.subjectId).filter(Boolean));
    return { minutes: logs.reduce((total, log) => total + Number(log.minutes || 0), 0), subjects: subjects.size };
  }

  window.toggleSmartReminders = enabled => {
    window.state.settings.smartReminders = enabled;
    save(enabled ? "Smart reminders enabled" : "Smart reminders disabled");
  };
  window.setTheme = theme => {
    if (!["light", "dark", "system"].includes(theme)) return;
    window.state.settings.theme = theme;
    applyTheme(theme);
    save("Theme preference saved");
  };
  function applyTheme(theme) {
    const dark = theme === "dark" || (theme === "system" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#101522" : "#f3f5f2");
  }
  window.toggleReminderSkip = enabled => {
    window.state.settings.skipReminderAfterCheckIn = enabled;
    save("Reminder rule saved");
  };
  window.saveReminderDays = select => {
    const dayInputs = select.querySelectorAll("[data-reminder-day]");
    window.state.settings.reminderDays = dayInputs.length
      ? Array.from(dayInputs).filter(input => input.checked).map(input => Number(input.dataset.reminderDay))
      : Array.from(select.selectedOptions).map(option => Number(option.value));
    save("Reminder days saved");
  };

  function checkSmartReminder() {
    const s = window.state.settings;
    if (!s.remindersEnabled || !s.smartReminders || !("Notification" in window) || Notification.permission !== "granted") return;
    const now = new Date();
    if (!s.reminderDays.includes(now.getDay())) return;
    if (s.skipReminderAfterCheckIn && hasCheckedInToday()) return;
    const time = s.reminderTime || "18:00";
    const current = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    if (current !== time || localStorage.getItem("studyReminderDate") === dateKey()) return;
    const task = window.state.tasks.filter(item => item.status !== "done").sort((a, b) => {
      const aOverdue = a.due && a.due < dateKey(), bOverdue = b.due && b.due < dateKey();
      const priority = { high: 0, medium: 1, low: 2 };
      return Number(bOverdue) - Number(aOverdue)
        || (priority[a.priority] ?? 3) - (priority[b.priority] ?? 3)
        || String(a.due || "9999-12-31").localeCompare(String(b.due || "9999-12-31"));
    })[0];
    try {
      new Notification(task ? `Next step: ${task.title}` : "A small study check-in?", { body: "Take one focused step in MyProgressTrack." });
      localStorage.setItem("studyReminderDate", dateKey());
    } catch (error) {
      console.error("Could not show browser reminder", error);
    }
  }

  window.suggestDailyPlan = () => {
    const open = window.state.tasks.filter(task => task.status !== "done").sort((a, b) => {
      const priority = { high: 0, medium: 1, low: 2 };
      const aOverdue = a.due && a.due < dateKey(), bOverdue = b.due && b.due < dateKey();
      return Number(bOverdue) - Number(aOverdue)
        || (priority[a.priority] ?? 3) - (priority[b.priority] ?? 3)
        || String(a.due || "9999-12-31").localeCompare(String(b.due || "9999-12-31"));
    });
    const today = dateKey();
    window.state.daily[today] ??= {};
    window.state.daily[today].plannedTaskIds = open.slice(0, 3).map(task => task.id);
    window.state.daily[today].planGeneratedAt = new Date().toISOString();
    save("Today's plan created from your priorities");
    window.go?.("today");
  };

  window.downloadCalendar = () => {
    const events = window.state.tasks.filter(task => task.due && task.status !== "done").map(task => {
      const next = new Date(`${task.due}T09:00:00`);
      const end = new Date(next.getTime() + Number(task.minutes || 30) * 60000);
      const stamp = value => value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
      return `BEGIN:VEVENT\nUID:${task.id}@myprogresstrack\nDTSTART:${stamp(next)}\nDTEND:${stamp(end)}\nSUMMARY:${escapeICS(task.title)}\nDESCRIPTION:${escapeICS(task.notes || "")}\nEND:VEVENT`;
    });
    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//MyProgressTrack//Planner//EN\n${events.join("\n")}\nEND:VCALENDAR`;
    const blob = new Blob([ics], { type: "text/calendar" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob); link.download = "myprogresstrack-calendar.ics"; link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  };
  function escapeICS(value) { return String(value).replace(/[\\;,]/g, match => `\\${match}`).replace(/\n/g, "\\n"); }

  window.createBackupSnapshot = () => {
    try {
      const snapshots = JSON.parse(localStorage.getItem("plannerBackupSnapshots") || "[]");
      if (!Array.isArray(snapshots)) throw new Error("Backup snapshots are not a list");
      snapshots.unshift({ savedAt: new Date().toISOString(), state: JSON.parse(JSON.stringify(window.state)) });
      localStorage.setItem("plannerBackupSnapshots", JSON.stringify(snapshots.slice(0, 5)));
      save("Backup snapshot saved");
    } catch (error) {
      console.error("Could not save backup snapshot", error);
      window.toast?.("Could not save a backup snapshot. Download a backup file instead.");
    }
  };
  window.restoreBackupSnapshot = () => {
    try {
      const snapshots = JSON.parse(localStorage.getItem("plannerBackupSnapshots") || "[]");
      const snapshot = Array.isArray(snapshots) ? snapshots[0] : null;
      const value = snapshot?.state;
      if (!value || !Array.isArray(value.tasks) || !Array.isArray(value.subjects)
        || !Array.isArray(value.habits) || !value.daily || typeof value.daily !== "object"
        || !value.settings || typeof value.settings !== "object") {
        window.toast?.("No valid backup snapshot is available.");
        return;
      }
      if (!confirm("Restore the latest backup snapshot? Your current workspace will be replaced.")) return;
      window.state = JSON.parse(JSON.stringify(value));
      window.saveLocal();
      window.renderAll();
      window.toast?.("Latest backup restored");
    } catch (error) {
      console.error("Could not restore backup snapshot", error);
      window.toast?.("Could not restore the backup snapshot.");
    }
  };

  window.setupPushNotifications = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) { window.toast?.("Push notifications are not supported in this browser."); return; }
    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    if (existing) { window.state.settings.pushEnabled = true; save("Background notifications are already configured"); return; }
    const key = window.PUSH_PUBLIC_KEY;
    if (!key) { window.toast?.("Add PUSH_PUBLIC_KEY and a push endpoint to enable background notifications."); return; }
    try {
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) });
      window.state.settings.pushSubscription = subscription.toJSON();
      window.state.settings.pushEnabled = true;
      save("Push subscription created; connect it to your push server");
    } catch (error) {
      console.error("Could not set up push notifications", error);
      window.toast?.("Could not set up background notifications. Check browser permission and try again.");
    }
  };
  function urlBase64ToUint8Array(value) {
    const padding = "=".repeat((4 - value.length % 4) % 4);
    const raw = atob((value + padding).replace(/-/g, "+").replace(/_/g, "/"));
    return Uint8Array.from([...raw].map(char => char.charCodeAt(0)));
  }
})();
