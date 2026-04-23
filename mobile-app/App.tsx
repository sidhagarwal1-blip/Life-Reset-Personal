import React, { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View
} from "react-native";

type Profile = {
  name: string;
  goal: string;
  challenge: string;
  fitness: string;
  sleep: string;
  water: string;
  learning: string;
  screenTarget: string;
};

type Quest = {
  id: string;
  label: string;
  xp: number;
  note: string;
};

type DayPlan = {
  day: number;
  week: number;
  title: string;
  quests: Quest[];
};

type JournalEntry = {
  mood: string;
  reflection: string;
  createdAt: string;
  day: number;
};

type AppState = {
  profile: Profile;
  plan: DayPlan[];
  dayStatus: Record<number, string[]>;
  journal: JournalEntry[];
  xp: number;
  streak: number;
  longestStreak: number;
  completedDays: number;
  reminderEnabled: boolean;
  reminderTime: string;
  reminderMessage: string;
};

const TOTAL_DAYS = 66;
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

const BOOKS = [
  { title: "Atomic Habits", insight: "Identity first. Systems make consistency easier." },
  { title: "Deep Work", insight: "Protect attention before optimizing output." },
  { title: "Meditations", insight: "Your response is the part you own." }
];

const initialProfile: Profile = {
  name: "Sid",
  goal: "Get leaner, focused, and more disciplined",
  challenge: "screen",
  fitness: "medium",
  sleep: "okay",
  water: "low",
  learning: "some",
  screenTarget: "3"
};

const initialState: AppState = {
  profile: initialProfile,
  plan: buildPlan(initialProfile),
  dayStatus: {},
  journal: [
    {
      mood: "Locked in",
      reflection: "The win was doing the hard block before touching the phone.",
      createdAt: new Date().toISOString(),
      day: 1
    }
  ],
  xp: 0,
  streak: 0,
  longestStreak: 0,
  completedDays: 0,
  reminderEnabled: true,
  reminderTime: "21:00",
  reminderMessage: "Finish your quests before the day closes."
};

function buildPlan(profile: Profile): DayPlan[] {
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

function createQuestSet(profile: Profile, day: number, difficulty: number): Quest[] {
  const waterTarget = profile.water === "low" ? 2.2 : profile.water === "okay" ? 2.8 : 3.3;
  const workoutMinutes =
    profile.fitness === "low" ? 16 + difficulty * 3 : profile.fitness === "medium" ? 24 + difficulty * 4 : 34 + difficulty * 5;
  const focusMinutes = profile.challenge === "focus" ? 35 + difficulty * 5 : 30 + difficulty * 5;
  const readingMinutes =
    profile.learning === "none" ? 10 + difficulty * 2 : profile.learning === "some" ? 18 + difficulty * 2 : 24 + difficulty * 3;
  const screenLimit = Math.max(1, Number(profile.screenTarget || 3) - Math.floor(day / 22) * 0.5);

  return [
    { id: `${day}-move`, label: `Train for ${workoutMinutes} min`, xp: 24, note: "Body" },
    { id: `${day}-focus`, label: `Focused block for ${focusMinutes} min`, xp: 21, note: "Focus" },
    { id: `${day}-learn`, label: `Read for ${readingMinutes} min`, xp: 14, note: "Mind" },
    { id: `${day}-water`, label: `Drink ${waterTarget.toFixed(1)}L`, xp: 12, note: "Recovery" },
    { id: `${day}-screen`, label: `Stay under ${screenLimit.toFixed(1)}h screen time`, xp: 18, note: "Discipline" }
  ];
}

function getStats(plan: DayPlan[], dayStatus: Record<number, string[]>) {
  let completedDays = 0;
  let streak = 0;
  let longestStreak = 0;

  for (let day = 1; day <= TOTAL_DAYS; day += 1) {
    const dayPlan = plan[day - 1];
    const completed = dayStatus[day]?.length === dayPlan?.quests.length;
    if (completed) {
      completedDays += 1;
      streak += 1;
      longestStreak = Math.max(longestStreak, streak);
    } else {
      streak = 0;
    }
  }

  return { completedDays, streak, longestStreak };
}

export default function App() {
  const [tab, setTab] = useState<"home" | "journey" | "tools" | "settings">("home");
  const [state, setState] = useState<AppState>(initialState);
  const [pomodoro, setPomodoro] = useState(25 * 60);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [reflection, setReflection] = useState("");
  const [mood, setMood] = useState("Locked in");

  const currentDay = Math.min(TOTAL_DAYS, state.completedDays + 1);
  const currentPlan = state.plan[currentDay - 1];
  const completionBars = useMemo(() => {
    return Array.from({ length: 14 }, (_, idx) => {
      const day = Math.max(1, currentDay - 13 + idx);
      const dayPlan = state.plan[day - 1];
      const completed = state.dayStatus[day]?.length || 0;
      const total = dayPlan?.quests.length || 1;
      return Math.max(0.08, completed / total);
    });
  }, [currentDay, state.dayStatus, state.plan]);

  useEffect(() => {
    if (!pomodoroRunning) {
      return;
    }

    const timer = setInterval(() => {
      setPomodoro((value) => {
        if (value <= 1) {
          setPomodoroRunning(false);
          return 25 * 60;
        }
        return value - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [pomodoroRunning]);

  function toggleQuest(questId: string) {
    setState((previous) => {
      const nextDayStatus = { ...previous.dayStatus };
      const current = new Set(nextDayStatus[currentDay] || []);
      const quest = currentPlan?.quests.find((item) => item.id === questId);
      if (!quest) {
        return previous;
      }

      let xp = previous.xp;
      if (current.has(questId)) {
        current.delete(questId);
        xp = Math.max(0, xp - quest.xp);
      } else {
        current.add(questId);
        xp += quest.xp;
      }

      nextDayStatus[currentDay] = Array.from(current);
      const stats = getStats(previous.plan, nextDayStatus);
      return { ...previous, dayStatus: nextDayStatus, xp, ...stats };
    });
  }

  function addJournalEntry() {
    if (!reflection.trim()) {
      return;
    }

    setState((previous) => ({
      ...previous,
      journal: [
        {
          mood,
          reflection,
          createdAt: new Date().toISOString(),
          day: currentDay
        },
        ...previous.journal
      ]
    }));
    setReflection("");
  }

  function exportPreview() {
    const exportObject = {
      profile: state.profile,
      stats: {
        xp: state.xp,
        streak: state.streak,
        longestStreak: state.longestStreak,
        completedDays: state.completedDays
      },
      reminder: {
        enabled: state.reminderEnabled,
        time: state.reminderTime,
        message: state.reminderMessage
      },
      journalEntries: state.journal.length
    };

    return JSON.stringify(exportObject, null, 2);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <View style={styles.shell}>
        <View style={styles.topCard}>
          <View>
            <Text style={styles.eyebrow}>Life Reset Personal</Text>
            <Text style={styles.heroTitle}>66 days to tighten your life.</Text>
            <Text style={styles.heroCopy}>
              This Expo scaffold mirrors the web version: onboarding, quests, streaks, charts,
              journal, tools, export, and reminder settings.
            </Text>
          </View>
          <View style={styles.topStats}>
            <Stat label="Day" value={`${currentDay}/66`} />
            <Stat label="Streak" value={String(state.streak)} />
            <Stat label="XP" value={String(state.xp)} />
          </View>
        </View>

        <View style={styles.tabRow}>
          {["home", "journey", "tools", "settings"].map((item) => (
            <Pressable
              key={item}
              onPress={() => setTab(item as typeof tab)}
              style={[styles.tabPill, tab === item && styles.tabPillActive]}
            >
              <Text style={styles.tabText}>{item}</Text>
            </Pressable>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {tab === "home" && (
            <>
              <Card title="Today" eyebrow="Daily quests">
                {currentPlan?.quests.map((quest) => {
                  const completed = state.dayStatus[currentDay]?.includes(quest.id);
                  return (
                    <Pressable
                      key={quest.id}
                      onPress={() => toggleQuest(quest.id)}
                      style={[styles.questRow, completed && styles.questRowDone]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.questTitle}>{quest.label}</Text>
                        <Text style={styles.questMeta}>{quest.note} | {quest.xp} XP</Text>
                      </View>
                      <View style={[styles.checkbox, completed && styles.checkboxDone]} />
                    </Pressable>
                  );
                })}
              </Card>

              <Card title="Consistency chart" eyebrow="Trends">
                <View style={styles.chartRow}>
                  {completionBars.map((value, index) => (
                    <View key={index} style={styles.chartColumn}>
                      <View style={[styles.chartBar, { height: 160 * value }]} />
                    </View>
                  ))}
                </View>
              </Card>

              <Card title="Program summary" eyebrow="Current arc">
                <Text style={styles.bodyCopy}>
                  {state.profile.name} is focused on {state.profile.goal}. Current week: {currentPlan?.week} and arc: {currentPlan?.title}.
                </Text>
              </Card>
            </>
          )}

          {tab === "journey" && (
            <>
              <Card title="Onboarding snapshot" eyebrow="Profile">
                <Text style={styles.bodyCopy}>Goal: {state.profile.goal}</Text>
                <Text style={styles.bodyCopy}>Challenge: {state.profile.challenge}</Text>
                <Text style={styles.bodyCopy}>Screen limit target: {state.profile.screenTarget}h</Text>
              </Card>

              <Card title="Weekly arc" eyebrow="Progression">
                {WEEKLY_TITLES.map((title, index) => (
                  <View key={title} style={styles.weekRow}>
                    <Text style={styles.questTitle}>Week {index + 1}: {title}</Text>
                    <Text style={styles.questMeta}>Keep the system slightly harder, not fragile.</Text>
                  </View>
                ))}
              </Card>

              <Card title="Journal" eyebrow="Document the journey">
                <TextInput value={mood} onChangeText={setMood} style={styles.input} placeholderTextColor="#8896a5" />
                <TextInput
                  value={reflection}
                  onChangeText={setReflection}
                  style={[styles.input, styles.textArea]}
                  multiline
                  placeholder="What worked today?"
                  placeholderTextColor="#8896a5"
                />
                <Pressable onPress={addJournalEntry} style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>Save entry</Text>
                </Pressable>

                {state.journal.slice(0, 4).map((entry, index) => (
                  <View key={`${entry.createdAt}-${index}`} style={styles.entryCard}>
                    <Text style={styles.entryMeta}>Day {entry.day} | {entry.mood}</Text>
                    <Text style={styles.bodyCopy}>{entry.reflection}</Text>
                  </View>
                ))}
              </Card>
            </>
          )}

          {tab === "tools" && (
            <>
              <Card title="Pomodoro" eyebrow="Focus">
                <Text style={styles.timerText}>
                  {String(Math.floor(pomodoro / 60)).padStart(2, "0")}:{String(pomodoro % 60).padStart(2, "0")}
                </Text>
                <View style={styles.inlineButtons}>
                  <Pressable onPress={() => setPomodoroRunning((value) => !value)} style={styles.primaryButton}>
                    <Text style={styles.primaryButtonText}>{pomodoroRunning ? "Pause" : "Start"}</Text>
                  </Pressable>
                  <Pressable onPress={() => { setPomodoro(25 * 60); setPomodoroRunning(false); }} style={styles.secondaryButton}>
                    <Text style={styles.secondaryButtonText}>Reset</Text>
                  </Pressable>
                </View>
              </Card>

              <Card title="Book summaries" eyebrow="Learning">
                {BOOKS.map((book) => (
                  <View key={book.title} style={styles.entryCard}>
                    <Text style={styles.questTitle}>{book.title}</Text>
                    <Text style={styles.bodyCopy}>{book.insight}</Text>
                  </View>
                ))}
              </Card>
            </>
          )}

          {tab === "settings" && (
            <>
              <Card title="Reminder settings" eyebrow="Notifications">
                <View style={styles.switchRow}>
                  <Text style={styles.bodyCopy}>Enable reminder</Text>
                  <Switch
                    value={state.reminderEnabled}
                    onValueChange={(value) => setState((previous) => ({ ...previous, reminderEnabled: value }))}
                  />
                </View>
                <TextInput
                  value={state.reminderTime}
                  onChangeText={(value) => setState((previous) => ({ ...previous, reminderTime: value }))}
                  style={styles.input}
                  placeholder="21:00"
                  placeholderTextColor="#8896a5"
                />
                <TextInput
                  value={state.reminderMessage}
                  onChangeText={(value) => setState((previous) => ({ ...previous, reminderMessage: value }))}
                  style={styles.input}
                  placeholder="Reminder message"
                  placeholderTextColor="#8896a5"
                />
              </Card>

              <Card title="Export preview" eyebrow="Local ownership">
                <Text style={styles.codePreview}>{exportPreview()}</Text>
                <Text style={styles.bodyCopy}>
                  Wire this to AsyncStorage, file export, and Expo notifications next. The structure is already in place.
                </Text>
              </Card>
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function Card({
  eyebrow,
  title,
  children
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.cardBody}>{children}</View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0b0f14"
  },
  shell: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12
  },
  topCard: {
    borderRadius: 28,
    padding: 22,
    backgroundColor: "#121821",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 18
  },
  eyebrow: {
    color: "#d8a95b",
    textTransform: "uppercase",
    letterSpacing: 2,
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 8
  },
  heroTitle: {
    color: "#f3f5f7",
    fontSize: 28,
    fontWeight: "800"
  },
  heroCopy: {
    color: "#9aa7b5",
    lineHeight: 22,
    marginTop: 10
  },
  topStats: {
    flexDirection: "row",
    gap: 10
  },
  statBox: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    backgroundColor: "#18202b"
  },
  statLabel: {
    color: "#9aa7b5",
    marginBottom: 6
  },
  statValue: {
    color: "#f3f5f7",
    fontSize: 22,
    fontWeight: "800"
  },
  tabRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14
  },
  tabPill: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#151c25"
  },
  tabPillActive: {
    backgroundColor: "#2a2115"
  },
  tabText: {
    color: "#f3f5f7",
    textTransform: "capitalize",
    fontWeight: "700"
  },
  scrollContent: {
    gap: 14,
    paddingVertical: 14,
    paddingBottom: 40
  },
  card: {
    borderRadius: 26,
    padding: 20,
    backgroundColor: "#121821",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)"
  },
  cardTitle: {
    color: "#f3f5f7",
    fontSize: 22,
    fontWeight: "800"
  },
  cardBody: {
    gap: 12,
    marginTop: 16
  },
  questRow: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: "#18202b",
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  questRowDone: {
    backgroundColor: "#1e2d2a",
    borderWidth: 1,
    borderColor: "rgba(115,213,174,0.25)"
  },
  questTitle: {
    color: "#f3f5f7",
    fontWeight: "700"
  },
  questMeta: {
    color: "#9aa7b5",
    marginTop: 4
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#556372"
  },
  checkboxDone: {
    backgroundColor: "#73d5ae",
    borderColor: "#73d5ae"
  },
  chartRow: {
    height: 160,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8
  },
  chartColumn: {
    flex: 1,
    justifyContent: "flex-end"
  },
  chartBar: {
    width: "100%",
    borderRadius: 10,
    backgroundColor: "#d8a95b"
  },
  bodyCopy: {
    color: "#9aa7b5",
    lineHeight: 22
  },
  weekRow: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: "#18202b"
  },
  input: {
    borderRadius: 16,
    padding: 14,
    backgroundColor: "#0f151d",
    color: "#f3f5f7"
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: "top"
  },
  primaryButton: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: "#d8a95b",
    alignItems: "center",
    justifyContent: "center"
  },
  primaryButtonText: {
    color: "#18120b",
    fontWeight: "800"
  },
  entryCard: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: "#18202b"
  },
  entryMeta: {
    color: "#d8a95b",
    marginBottom: 8,
    fontWeight: "700"
  },
  timerText: {
    color: "#f3f5f7",
    fontSize: 56,
    fontWeight: "800",
    textAlign: "center"
  },
  inlineButtons: {
    flexDirection: "row",
    gap: 10
  },
  secondaryButton: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: "#18202b",
    alignItems: "center",
    justifyContent: "center"
  },
  secondaryButtonText: {
    color: "#f3f5f7",
    fontWeight: "700"
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  codePreview: {
    color: "#f3f5f7",
    fontFamily: "monospace",
    backgroundColor: "#0f151d",
    borderRadius: 16,
    padding: 14
  }
});
