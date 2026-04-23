const STORAGE_KEY = "life-reset-personal-v2";
const TOTAL_DAYS = 66;
const REMINDER_CHECK_INTERVAL_MS = 30000;

const BOOK_SUMMARIES = [
  {
    title: "Atomic Habits",
    insight: "You do not rise to goals. You fall to systems and identity-backed repetition."
  },
  {
    title: "Deep Work",
    insight: "Focus is a competitive advantage. Protect it before trying to optimize it."
  },
  {
    title: "Meditations",
    insight: "The event is not the problem. Your judgment of it usually is."
  },
  {
    title: "Can't Hurt Me",
    insight: "Most limits are negotiated long before they are real."
  }
];

const CHECKPOINTS = [
  "Day 1-7: Reduce chaos and prove you can show up on command.",
  "Day 8-21: The system should start carrying you when motivation drops.",
  "Day 22-42: Protect the floor. Bad days still count when you keep them tight.",
  "Day 43-66: Raise the standard. You are reinforcing identity now, not testing interest."
];

const WEEKLY_TITLES = [
  "Foundation",
  "Stability",
  "Capacity",
  "Pressure",
  "Consistency",
  "Expansion",
  "Identity",
  "Finish Strong",
  "Lock It In",
  "Final Push"
];

const appState = loadState();

const elements = {
  navPills: Array.from(document.querySelectorAll(".nav-pill")),
  tabPanels: Array.from(document.querySelectorAll(".tab-panel")),
  tabJumpButtons: Array.from(document.querySelectorAll("[data-tab-jump]")),
  onboardingForm: document.querySelector("#onboardingForm"),
  journalForm: document.querySelector("#journalForm"),
  reminderForm: document.querySelector("#reminderForm"),
  reminderEnabled: document.querySelector("#reminderEnabled"),
  reminderTime: document.querySelector("#reminderTime"),
  reminderMessage: document.querySelector("#reminderMessage"),
  reminderPreview: document.querySelector("#reminderPreview"),
  reminderPreviewText: document.querySelector("#reminderPreviewText"),
  testReminder: document.querySelector("#testReminder"),
  loadDemo: document.querySelector("#loadDemo"),
  exportData: document.querySelector("#exportData"),
  importData: document.querySelector("#importData"),
  importStatus: document.querySelector("#importStatus"),
  resetData: document.querySelector("#resetData"),
  resetStatus: document.querySelector("#resetStatus"),
  weeklyBreakdown: document.querySelector("#weeklyBreakdown"),
  programSummary: document.querySelector("#programSummary"),
  questList: document.querySelector("#questList"),
  chartBars: document.querySelector("#chartBars"),
  chartSummary: document.querySelector("#chartSummary"),
  scheduleStatus: document.querySelector("#scheduleStatus"),
  firstRunGuide: document.querySelector("#firstRunGuide"),
  todayStateBadge: document.querySelector("#todayStateBadge"),
  todayStateText: document.querySelector("#todayStateText"),
  saveStatusHeadline: document.querySelector("#saveStatusHeadline"),
  saveStatusText: document.querySelector("#saveStatusText"),
  storageMode: document.querySelector("#storageMode"),
  saveTimestamp: document.querySelector("#saveTimestamp"),
  journalEntries: document.querySelector("#journalEntries"),
  completedDays: document.querySelector("#completedDays"),
  longestStreak: document.querySelector("#longestStreak"),
  entryCount: document.querySelector("#entryCount"),
  checkpointMessage: document.querySelector("#checkpointMessage"),
  heroDay: document.querySelector("#heroDay"),
  heroStreak: document.querySelector("#heroStreak"),
  heroXp: document.querySelector("#heroXp"),
  sidebarGoal: document.querySelector("#sidebarGoal"),
  sidebarStatus: document.querySelector("#sidebarStatus"),
  sidebarProgress: document.querySelector("#sidebarProgress"),
  currentWeekBadge: document.querySelector("#currentWeekBadge"),
  pomodoroTime: document.querySelector("#pomodoroTime"),
  pomodoroToggle: document.querySelector("#pomodoroToggle"),
  pomodoroReset: document.querySelector("#pomodoroReset"),
  workoutCount: document.querySelector("#workoutCount"),
  workoutMinus: document.querySelector("#workoutMinus"),
  workoutPlus: document.querySelector("#workoutPlus"),
  playMeditation: document.querySelector("#playMeditation"),
  stopMeditation: document.querySelector("#stopMeditation"),
  bookSummaryCards: document.querySelector("#bookSummaryCards"),
  temptationInput: document.querySelector("#temptationInput"),
  focusWallTrigger: document.querySelector("#focusWallTrigger"),
  focusWallMessage: document.querySelector("#focusWallMessage")
};

let pomodoroSecondsRemaining = 25 * 60;
let pomodoroInterval = null;
let reminderInterval = null;
let lastReminderMinute = "";

bindEvents();
renderBookSummaries();
render();
startReminderWatcher();

function bindEvents() {
  elements.navPills.forEach((button) => {
    button.addEventListener("click", () => setActiveTab(button.dataset.tab));
  });

  elements.tabJumpButtons.forEach((button) => {
    button.addEventListener("click", () => setActiveTab(button.dataset.tabJump));
  });

  elements.onboardingForm.addEventListener("submit", handleOnboardingSubmit);
  elements.journalForm.addEventListener("submit", handleJournalSubmit);
  elements.reminderForm.addEventListener("submit", handleReminderSubmit);
  elements.loadDemo.addEventListener("click", loadDemoState);
  elements.exportData.addEventListener("click", exportState);
  elements.importData.addEventListener("change", importStateFromFile);
  elements.resetData.addEventListener("click", resetAllData);
  elements.testReminder.addEventListener("click", () => showReminderNotification(true));
  elements.pomodoroToggle.addEventListener("click", togglePomodoro);
  elements.pomodoroReset.addEventListener("click", resetPomodoro);
  elements.workoutMinus.addEventListener("click", () => updateWorkoutCount(-1));
  elements.workoutPlus.addEventListener("click", () => updateWorkoutCount(1));
  elements.playMeditation.addEventListener("click", playMeditation);
  elements.stopMeditation.addEventListener("click", stopMeditation);
  elements.focusWallTrigger.addEventListener("click", showFocusWallMessage);
}

function setActiveTab(tabName) {
  elements.navPills.forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tabName);
  });
  elements.tabPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.panel === tabName);
  });
}

function getDefaultState() {
  return {
    profile: null,
    plan: [],
    dayStatus: {},
    journal: [],
    stats: {
      xp: 0,
      streak: 0,
      longestStreak: 0,
      completedDays: 0
    },
    reminder: {
      enabled: false,
      time: "21:00",
      message: "Finish your quests before the day closes."
    },
    tools: {
      workoutCount: 0
    },
    meta: {
      lastSavedAt: null
    }
  };
}

function loadState() {
  const saved = safeGetStorage(STORAGE_KEY);
  if (!saved) {
    return getDefaultState();
  }

  try {
    return { ...getDefaultState(), ...JSON.parse(saved) };
  } catch (error) {
    return getDefaultState();
  }
}

function saveState() {
  appState.meta = appState.meta || {};
  appState.meta.lastSavedAt = new Date().toISOString();
  safeSetStorage(STORAGE_KEY, JSON.stringify(appState));
}

function handleOnboardingSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const profile = Object.fromEntries(formData.entries());

  appState.profile = {
    ...profile,
    startDate: appState.profile?.startDate || new Date().toISOString()
  };
  appState.plan = buildPlan(profile);
  appState.dayStatus = {};
  appState.journal = [];
  appState.stats = {
    xp: 0,
    streak: 0,
    longestStreak: 0,
    completedDays: 0
  };
  saveState();
  render();
  setActiveTab("dashboard");
}

function handleJournalSubmit(event) {
  event.preventDefault();
  if (!appState.plan.length) {
    return;
  }

  const formData = new FormData(event.currentTarget);
  const entry = Object.fromEntries(formData.entries());
  appState.journal.unshift({
    ...entry,
    createdAt: new Date().toISOString(),
    day: getCurrentProgramDay()
  });
  saveState();
  event.currentTarget.reset();
  renderJournalEntries();
  renderMetrics();
}

function handleReminderSubmit(event) {
  event.preventDefault();
  appState.reminder.enabled = elements.reminderEnabled.checked;
  appState.reminder.time = elements.reminderTime.value || "21:00";
  appState.reminder.message = elements.reminderMessage.value.trim() || "Finish your quests before the day closes.";
  saveState();
  renderReminder();

  if (appState.reminder.enabled && "Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function buildPlan(profile) {
  return Array.from({ length: TOTAL_DAYS }, (_, index) => {
    const day = index + 1;
    const weekIndex = Math.min(Math.floor(index / 7), WEEKLY_TITLES.length - 1);
    const difficulty = Math.min(5, 1 + Math.floor(index / 14));
    return {
      day,
      week: weekIndex + 1,
      title: WEEKLY_TITLES[weekIndex],
      quests: createQuestSet(profile, day, difficulty)
    };
  });
}

function createQuestSet(profile, day, difficulty) {
  const waterTarget = profile.water === "low" ? 2.2 : profile.water === "okay" ? 2.8 : 3.3;
  const workoutMinutes =
    profile.fitness === "low" ? 16 + difficulty * 3 : profile.fitness === "medium" ? 24 + difficulty * 4 : 34 + difficulty * 5;
  const focusMinutes = profile.challenge === "focus" ? 35 + difficulty * 5 : 30 + difficulty * 5;
  const readingMinutes =
    profile.learning === "none" ? 10 + difficulty * 2 : profile.learning === "some" ? 18 + difficulty * 2 : 24 + difficulty * 3;
  const screenLimit = Math.max(1, Number(profile.screenTarget || 3) - Math.floor(day / 22) * 0.5);
  const sleepTarget =
    profile.sleep === "poor" ? "Sleep before 12:00 AM" : profile.sleep === "okay" ? "Sleep before 11:15 PM" : "Protect your current sleep standard";
  const coldExposure = day > 14 ? `${30 + difficulty * 15} sec cool finish` : "Optional cool finish";

  return [
    {
      id: `${day}-move`,
      label: `Train or move for ${workoutMinutes} minutes`,
      xp: 20 + difficulty * 3,
      note: "Body"
    },
    {
      id: `${day}-focus`,
      label: `Do a focused work block for ${focusMinutes} minutes`,
      xp: 18 + difficulty * 3,
      note: "Career or study"
    },
    {
      id: `${day}-learn`,
      label: `Read or learn for ${readingMinutes} minutes`,
      xp: 12 + difficulty * 2,
      note: "Mind"
    },
    {
      id: `${day}-water`,
      label: `Drink ${waterTarget.toFixed(1)}L of water`,
      xp: 10 + difficulty,
      note: "Recovery"
    },
    {
      id: `${day}-sleep`,
      label: sleepTarget,
      xp: 12 + difficulty,
      note: "Sleep"
    },
    {
      id: `${day}-screen`,
      label: `Keep entertainment screen time under ${screenLimit.toFixed(1)} hours`,
      xp: 16 + difficulty * 2,
      note: "Discipline"
    },
    {
      id: `${day}-shower`,
      label: `End your shower with ${coldExposure}`,
      xp: 8 + difficulty,
      note: "Edge"
    }
  ];
}

function getCurrentProgramDay() {
  if (!appState.profile?.startDate) {
    return Math.min(TOTAL_DAYS, (appState.stats.completedDays || 0) + 1);
  }

  const start = startOfLocalDay(new Date(appState.profile.startDate));
  const today = startOfLocalDay(new Date());
  const diffMs = today.getTime() - start.getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / 86400000));
  return Math.min(TOTAL_DAYS, diffDays + 1);
}

function getCurrentWeek() {
  return appState.plan[getCurrentProgramDay() - 1]?.week || 0;
}

function handleQuestToggle(day, questId) {
  if (!appState.dayStatus[day]) {
    appState.dayStatus[day] = { completedQuestIds: [] };
  }

  const completedQuestIds = appState.dayStatus[day].completedQuestIds;
  const quest = appState.plan[day - 1]?.quests.find((item) => item.id === questId);
  if (!quest) {
    return;
  }

  const existingIndex = completedQuestIds.indexOf(questId);
  if (existingIndex >= 0) {
    completedQuestIds.splice(existingIndex, 1);
    appState.stats.xp = Math.max(0, appState.stats.xp - quest.xp);
  } else {
    completedQuestIds.push(questId);
    appState.stats.xp += quest.xp;
  }

  recalculateStats();
  saveState();
  render();
}

function recalculateStats() {
  let completedDays = 0;
  for (const dayPlan of appState.plan) {
    const completedQuestIds = appState.dayStatus[dayPlan.day]?.completedQuestIds || [];
    if (completedQuestIds.length === dayPlan.quests.length) {
      completedDays += 1;
    }
  }

  const currentScheduledDay = getCurrentProgramDay();
  const effectiveDay = Math.min(currentScheduledDay, appState.plan.length);
  let activeStreak = 0;
  for (let day = effectiveDay; day >= 1; day -= 1) {
    const dayPlan = appState.plan[day - 1];
    const completedQuestIds = appState.dayStatus[day]?.completedQuestIds || [];
    if (dayPlan && completedQuestIds.length === dayPlan.quests.length) {
      activeStreak += 1;
    } else {
      break;
    }
  }

  let longestStreak = 0;
  let running = 0;
  for (let day = 1; day <= appState.plan.length; day += 1) {
    const dayPlan = appState.plan[day - 1];
    const completedQuestIds = appState.dayStatus[day]?.completedQuestIds || [];
    if (dayPlan && completedQuestIds.length === dayPlan.quests.length) {
      running += 1;
      longestStreak = Math.max(longestStreak, running);
    } else {
      running = 0;
    }
  }

  appState.stats.completedDays = completedDays;
  appState.stats.streak = activeStreak;
  appState.stats.longestStreak = longestStreak;
}

function render() {
  renderSummary();
  renderWeeklyBreakdown();
  renderQuestList();
  renderMetrics();
  renderChart();
  renderJournalEntries();
  renderTools();
  renderReminder();
  renderStorageInfo();
}

function renderSummary() {
  if (!appState.profile || !appState.plan.length) {
    elements.programSummary.textContent = "Create a plan to see your 66-day structure and progression.";
    elements.scheduleStatus.textContent = "Daily scheduling info will appear here after you create a plan.";
    elements.heroDay.textContent = "0 / 66";
    elements.heroStreak.textContent = "0";
    elements.heroXp.textContent = "0";
    elements.sidebarGoal.textContent = "Start your reset";
    elements.sidebarStatus.textContent = "Build your plan to unlock daily quests, streaks, and charts.";
    elements.sidebarProgress.style.width = "0%";
    elements.currentWeekBadge.textContent = "Week 0";
    elements.firstRunGuide.hidden = false;
    return;
  }

  const currentDay = getCurrentProgramDay();
  const progress = (appState.stats.completedDays / TOTAL_DAYS) * 100;
  const currentPlan = appState.plan[Math.min(currentDay - 1, appState.plan.length - 1)];
  const profile = appState.profile;

  elements.programSummary.innerHTML = `
    <strong>${escapeHtml(profile.name || "You")}</strong> are running a ${TOTAL_DAYS}-day reset focused on
    <strong>${escapeHtml(profile.goal)}</strong>. The current arc is
    <strong>${escapeHtml(currentPlan?.title || "Foundation")}</strong>, with progressive pressure on movement,
    focus, sleep, hydration, and screen control.
  `;

  elements.heroDay.textContent = `${currentDay} / ${TOTAL_DAYS}`;
  elements.heroStreak.textContent = String(appState.stats.streak);
  elements.heroXp.textContent = String(appState.stats.xp);
  elements.sidebarGoal.textContent = profile.goal;
  elements.sidebarStatus.textContent = `Primary weakness: ${readableChallenge(profile.challenge)}. Keep the floor high every day.`;
  elements.sidebarProgress.style.width = `${progress}%`;
  elements.currentWeekBadge.textContent = `Week ${currentPlan?.week || 0}`;
  elements.scheduleStatus.textContent = buildScheduleStatus();
  elements.firstRunGuide.hidden = true;
}

function renderWeeklyBreakdown() {
  if (!appState.plan.length) {
    elements.weeklyBreakdown.innerHTML = "<p class='empty-state'>Create a plan to see the weekly arc.</p>";
    return;
  }

  const weeks = [];
  for (let week = 1; week <= 10; week += 1) {
    const startDay = (week - 1) * 7 + 1;
    const endDay = Math.min(TOTAL_DAYS, week * 7);
    const title = appState.plan[startDay - 1]?.title || "Reset";
    weeks.push({ week, startDay, endDay, title });
  }

  elements.weeklyBreakdown.innerHTML = weeks
    .map(
      ({ week, startDay, endDay, title }) => `
        <article class="week-card">
          <strong>Week ${week}: ${escapeHtml(title)}</strong>
          <p>Days ${startDay}-${endDay}. Make the routine slightly harder without making it brittle.</p>
          <div class="week-day-strip">
            ${renderWeekDayChips(startDay, endDay)}
          </div>
        </article>
      `
    )
    .join("");
}

function renderQuestList() {
  if (!appState.plan.length) {
    elements.questList.textContent = "Your daily quests will appear here after you create a plan.";
    return;
  }

  const currentDay = getCurrentProgramDay();
  const dayPlan = appState.plan[currentDay - 1];
  if (!dayPlan) {
    elements.questList.innerHTML = "<div class='empty-state'>You finished the 66-day run. Export it, journal it, or regenerate a harder one.</div>";
    return;
  }

  const completedQuestIds = appState.dayStatus[currentDay]?.completedQuestIds || [];
  const dayState = getDayState(currentDay);
  elements.todayStateBadge.textContent = dayState.label;
  elements.todayStateBadge.className = `mini-badge ${dayState.className}`;
  elements.todayStateText.textContent = dayState.description;
  elements.questList.innerHTML = dayPlan.quests
    .map((quest) => {
      const checked = completedQuestIds.includes(quest.id);
      return `
        <article class="quest-card ${checked ? "completed" : ""}">
          <div class="quest-header">
            <div>
              <span class="quest-title">${escapeHtml(quest.label)}</span>
              <div class="quest-meta">${escapeHtml(quest.note)} | ${quest.xp} XP</div>
            </div>
            <label>
              <span class="visually-hidden">Complete quest</span>
              <input type="checkbox" data-day="${currentDay}" data-quest-id="${quest.id}" ${checked ? "checked" : ""} />
            </label>
          </div>
        </article>
      `;
    })
    .join("");

  elements.questList.querySelectorAll("input[type='checkbox']").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      handleQuestToggle(Number(checkbox.dataset.day), checkbox.dataset.questId);
    });
  });
}

function renderMetrics() {
  elements.completedDays.textContent = String(appState.stats.completedDays);
  elements.longestStreak.textContent = String(appState.stats.longestStreak);
  elements.entryCount.textContent = String(appState.journal.length);

  const currentDay = Math.max(1, getCurrentProgramDay());
  const checkpointIndex = currentDay <= 7 ? 0 : currentDay <= 21 ? 1 : currentDay <= 42 ? 2 : 3;
  elements.checkpointMessage.textContent = CHECKPOINTS[checkpointIndex];
}

function renderStorageInfo() {
  const storageMode = getStorageModeLabel();
  const savedTimestamp = appState.meta?.lastSavedAt
    ? `Last save: ${formatDateTime(appState.meta.lastSavedAt)}`
    : "No save recorded yet";
  elements.storageMode.textContent = storageMode;
  elements.saveTimestamp.textContent = savedTimestamp;
  elements.saveStatusHeadline.textContent = storageAvailable()
    ? "Saved automatically on this browser"
    : "Browser storage unavailable";
  elements.saveStatusText.textContent = storageAvailable()
    ? "This laptop and this browser hold the active copy of the data unless you export it."
    : "This browser is blocking local storage, so export and persistence may not work correctly.";
}

function buildScheduleStatus() {
  if (!appState.profile?.startDate) {
    return "Daily scheduling info will appear here after you create a plan.";
  }

  const currentDay = getCurrentProgramDay();
  const todayKey = getLocalDateKey(new Date());
  const todayStatus = appState.dayStatus[currentDay];
  const isTodayComplete =
    !!todayStatus &&
    todayStatus.completedQuestIds?.length === (appState.plan[currentDay - 1]?.quests.length || 0);
  const savedAt = appState.meta?.lastSavedAt
    ? `Last saved ${formatDateTime(appState.meta.lastSavedAt)}.`
    : "Saved automatically in this browser.";

  if (currentDay > TOTAL_DAYS) {
    return `Your 66-day run has reached the end of the schedule. ${savedAt}`;
  }

  if (isTodayComplete) {
    return `Today's plan for ${todayKey} is complete. When you open the app on the next calendar day, it will automatically show Day ${Math.min(TOTAL_DAYS, currentDay + 1)}. ${savedAt}`;
  }

  return `Today is scheduled as Day ${currentDay} (${todayKey}). Finish this day's quests and the app will automatically move to the next scheduled day tomorrow. ${savedAt}`;
}

function getDayState(day) {
  const currentDay = getCurrentProgramDay();
  const dayPlan = appState.plan[day - 1];
  const completedQuestIds = appState.dayStatus[day]?.completedQuestIds || [];
  const isComplete = !!dayPlan && completedQuestIds.length === dayPlan.quests.length;

  if (isComplete) {
    return {
      label: "Completed",
      className: "completed",
      description: `Day ${day} is complete and safely stored in this browser.`
    };
  }

  if (day < currentDay) {
    return {
      label: "Missed",
      className: "missed",
      description: `Day ${day} is behind schedule. You can still review it, but today has already advanced.`
    };
  }

  if (day === currentDay) {
    return {
      label: "Due today",
      className: "due",
      description: `This is the active calendar day in your 66-day run.`
    };
  }

  return {
    label: "Upcoming",
    className: "upcoming",
    description: `This day unlocks on its scheduled calendar date.`
  };
}

function renderWeekDayChips(startDay, endDay) {
  const chips = [];
  for (let day = startDay; day <= endDay; day += 1) {
    const dayState = getDayState(day);
    chips.push(
      `<span class="day-chip ${dayState.className}" title="${escapeHtml(dayState.description)}">Day ${day}: ${dayState.label}</span>`
    );
  }
  return chips.join("");
}

function renderChart() {
  const items = [];
  for (let day = Math.max(1, getCurrentProgramDay() - 13); day <= getCurrentProgramDay(); day += 1) {
    const dayPlan = appState.plan[day - 1];
    if (!dayPlan) {
      items.push({ height: 14, label: `Day ${day}`, empty: true });
      continue;
    }

    const completedQuestIds = appState.dayStatus[day]?.completedQuestIds || [];
    const completionRate = completedQuestIds.length / dayPlan.quests.length;
    items.push({
      height: Math.max(14, Math.round(completionRate * 190)),
      label: `Day ${day}`,
      empty: completionRate === 0
    });
  }

  elements.chartBars.innerHTML = items
    .map(
      (item) => `
        <div class="chart-bar ${item.empty ? "empty" : ""}" style="height:${item.height}px" title="${escapeHtml(item.label)}"></div>
      `
    )
    .join("");

  const average = items.length
    ? Math.round(
        items.reduce((sum, item) => sum + (item.empty ? 0 : item.height), 0) / items.length
      )
    : 0;
  elements.chartSummary.textContent = average > 0 ? `Average momentum score: ${average}` : "No data yet.";
}

function renderJournalEntries() {
  if (!appState.journal.length) {
    elements.journalEntries.textContent = "No entries yet.";
    return;
  }

  elements.journalEntries.innerHTML = appState.journal
    .slice(0, 8)
    .map(
      (entry) => `
        <article class="entry-card">
          <time>${formatDate(entry.createdAt)} | Day ${entry.day}</time>
          <div class="entry-mood">${escapeHtml(entry.mood)}</div>
          <p>${escapeHtml(entry.reflection)}</p>
        </article>
      `
    )
    .join("");
}

function renderTools() {
  elements.workoutCount.textContent = String(appState.tools.workoutCount);
  updatePomodoroDisplay();
}

function renderReminder() {
  const { enabled, time, message } = appState.reminder;
  elements.reminderEnabled.checked = enabled;
  elements.reminderTime.value = time;
  elements.reminderMessage.value = message;
  elements.reminderPreview.textContent = time;
  elements.reminderPreviewText.textContent = enabled
    ? "Browser reminder is enabled while this page is open."
    : "Local browser reminder is off.";
}

function renderBookSummaries() {
  elements.bookSummaryCards.innerHTML = BOOK_SUMMARIES.map(
    (summary) => `
      <article class="summary-card">
        <strong>${escapeHtml(summary.title)}</strong>
        <p>${escapeHtml(summary.insight)}</p>
      </article>
    `
  ).join("");
}

function togglePomodoro() {
  if (pomodoroInterval) {
    clearInterval(pomodoroInterval);
    pomodoroInterval = null;
    elements.pomodoroToggle.textContent = "Start";
    return;
  }

  pomodoroInterval = setInterval(() => {
    pomodoroSecondsRemaining -= 1;
    updatePomodoroDisplay();

    if (pomodoroSecondsRemaining <= 0) {
      clearInterval(pomodoroInterval);
      pomodoroInterval = null;
      pomodoroSecondsRemaining = 25 * 60;
      updatePomodoroDisplay();
      elements.pomodoroToggle.textContent = "Start";
      window.alert("Pomodoro complete. Take a short break.");
    }
  }, 1000);

  elements.pomodoroToggle.textContent = "Pause";
}

function resetPomodoro() {
  clearInterval(pomodoroInterval);
  pomodoroInterval = null;
  pomodoroSecondsRemaining = 25 * 60;
  elements.pomodoroToggle.textContent = "Start";
  updatePomodoroDisplay();
}

function updatePomodoroDisplay() {
  const minutes = String(Math.floor(pomodoroSecondsRemaining / 60)).padStart(2, "0");
  const seconds = String(pomodoroSecondsRemaining % 60).padStart(2, "0");
  elements.pomodoroTime.textContent = `${minutes}:${seconds}`;
}

function updateWorkoutCount(delta) {
  appState.tools.workoutCount = Math.max(0, appState.tools.workoutCount + delta);
  saveState();
  renderTools();
}

function playMeditation() {
  if (!("speechSynthesis" in window)) {
    window.alert("Speech synthesis is not supported in this browser.");
    return;
  }

  stopMeditation();
  const utterance = new SpeechSynthesisUtterance(
    "Sit tall. Inhale for four. Hold for four. Exhale for six. Relax your jaw. Relax your shoulders. Let the mind settle. Continue anyway."
  );
  utterance.rate = 0.88;
  utterance.pitch = 0.92;
  window.speechSynthesis.speak(utterance);
}

function stopMeditation() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

function showFocusWallMessage() {
  const temptation = elements.temptationInput.value.trim() || "that distraction";
  elements.focusWallMessage.textContent =
    `Before you open ${temptation}, do one breath cycle, one sip of water, and one useful action. Then decide with intent instead of drift.`;
}

function exportState() {
  const blob = new Blob([JSON.stringify(appState, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "life-reset-personal-export.json";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function importStateFromFile(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(String(reader.result));
      const merged = { ...getDefaultState(), ...imported };
      Object.assign(appState, merged);
      recalculateStats();
      saveState();
      render();
      elements.importStatus.textContent = `Imported ${file.name} successfully.`;
      elements.resetStatus.textContent = "No reset performed.";
    } catch (error) {
      elements.importStatus.textContent = "Import failed. Please choose a valid JSON export.";
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

function resetAllData() {
  const confirmed = window.confirm(
    "Reset all local data on this browser? This removes the current plan, journal, streaks, and settings unless you exported them."
  );
  if (!confirmed) {
    return;
  }

  safeRemoveStorage(STORAGE_KEY);
  const freshState = getDefaultState();
  Object.keys(appState).forEach((key) => {
    delete appState[key];
  });
  Object.assign(appState, freshState);
  elements.importStatus.textContent = "No import yet.";
  elements.resetStatus.textContent = "All local data was reset on this browser.";
  render();
  setActiveTab("dashboard");
}

function startReminderWatcher() {
  if (reminderInterval) {
    clearInterval(reminderInterval);
  }

  reminderInterval = setInterval(() => {
    const { enabled, time } = appState.reminder;
    if (!enabled || !time) {
      return;
    }

    const now = new Date();
    const currentMinute = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const reminderKey = `${now.toDateString()}-${currentMinute}`;
    if (currentMinute === time && reminderKey !== lastReminderMinute) {
      lastReminderMinute = reminderKey;
      showReminderNotification(false);
    }
  }, REMINDER_CHECK_INTERVAL_MS);
}

function showReminderNotification(isTest) {
  const title = isTest ? "Life Reset test reminder" : "Life Reset reminder";
  const body = appState.reminder.message || "Finish your quests before the day closes.";

  if ("Notification" in window) {
    if (Notification.permission === "granted") {
      new Notification(title, { body });
      return;
    }
    if (Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification(title, { body });
        } else {
          window.alert(body);
        }
      });
      return;
    }
  }

  window.alert(body);
}

function loadDemoState() {
  const demoProfile = {
    name: "Sid",
    goal: "Get leaner, reduce scrolling, and show up every day",
    challenge: "screen",
    fitness: "medium",
    sleep: "okay",
    water: "low",
    learning: "some",
    screenTarget: "3",
    startDate: new Date().toISOString()
  };

  appState.profile = demoProfile;
  appState.plan = buildPlan(demoProfile);
  appState.dayStatus = {};
  appState.journal = [
    {
      mood: "Proud",
      reflection: "Finished the hard work block before touching social media. The day felt lighter after that.",
      createdAt: new Date().toISOString(),
      day: 4
    },
    {
      mood: "Locked in",
      reflection: "Workout was short but clean. The win was starting on time.",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      day: 3
    }
  ];
  appState.reminder = {
    enabled: true,
    time: "21:00",
    message: "Finish your quests before the day closes."
  };
  appState.tools.workoutCount = 12;
  appState.stats = {
    xp: 0,
    streak: 0,
    longestStreak: 0,
    completedDays: 0
  };

  for (let day = 1; day <= 4; day += 1) {
    appState.dayStatus[day] = {
      completedQuestIds: appState.plan[day - 1].quests.map((quest) => quest.id)
    };
    appState.stats.xp += appState.plan[day - 1].quests.reduce((sum, quest) => sum + quest.xp, 0);
  }

  recalculateStats();
  saveState();
  render();
}

function storageAvailable() {
  try {
    const probeKey = "__life_reset_probe__";
    window.localStorage.setItem(probeKey, "1");
    window.localStorage.removeItem(probeKey);
    return true;
  } catch (error) {
    return false;
  }
}

function safeGetStorage(key) {
  if (!storageAvailable()) {
    return null;
  }
  return window.localStorage.getItem(key);
}

function safeSetStorage(key, value) {
  if (!storageAvailable()) {
    return false;
  }
  window.localStorage.setItem(key, value);
  return true;
}

function safeRemoveStorage(key) {
  if (!storageAvailable()) {
    return false;
  }
  window.localStorage.removeItem(key);
  return true;
}

function getStorageModeLabel() {
  const protocol = window.location.protocol === "file:" ? "Local file" : "Hosted website";
  return storageAvailable()
    ? `${protocol} | browser local storage`
    : `${protocol} | storage unavailable`;
}

function getLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfLocalDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function readableChallenge(value) {
  switch (value) {
    case "focus":
      return "focus";
    case "energy":
      return "low energy";
    case "consistency":
      return "consistency";
    case "screen":
      return "screen time";
    case "discipline":
      return "discipline";
    default:
      return "execution";
  }
}

function formatDate(isoDate) {
  return new Date(isoDate).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatDateTime(isoDate) {
  return new Date(isoDate).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
