import type { DailyEntry, WeeklyHobbies } from "./backend.d";

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function studyScore(hours: number): number {
  if (hours > 4) return 10;
  if (hours >= 3) return 8;
  if (hours >= 2) return 6;
  if (hours >= 1) return 4;
  return hours * 4;
}

export function digitalWellbeingScore(minutes: number): number {
  if (minutes < 15) return 10;
  if (minutes < 30) return 9;
  if (minutes < 60) return 8;
  if (minutes < 120) return 6;
  if (minutes < 180) return 4;
  if (minutes < 240) return 2;
  return 0;
}

export function pranayamaScore(minutes: number): number {
  return minutes >= 15 ? 10 : (minutes / 15) * 10;
}

export function nadiShodhanScore(sessions: number): number {
  return Math.min((sessions / 3) * 10, 10);
}

export function rechargeScore(entry: DailyEntry): number {
  return avg([
    entry.sleepRecharge,
    pranayamaScore(entry.pranayamaMinutes),
    entry.microRestRating,
    nadiShodhanScore(entry.nadiShodhanSessions),
  ]);
}

export function healthScore(entry: DailyEntry): number {
  return (2 * entry.mentalHealthRating + entry.physicalEnergyRating) / 3;
}

export function baselineThoughtScore(entry: DailyEntry): number {
  if (entry.pmoOccurrence) return 0;
  return (
    (entry.baselinePurityRating +
      entry.uTurnEfficiencyRating +
      0.5 * entry.sensoryGuardingRating) /
    2.5
  );
}

export function guruPranamScore(minutes: number): number {
  if (minutes >= 30) return 10;
  if (minutes >= 20) return 8;
  if (minutes >= 10) return 6;
  if (minutes >= 5) return 4;
  if (minutes > 0) return 2;
  return 0;
}

export function controlOverLifeScore(entry: DailyEntry): number {
  const outsideFoodScore = entry.outsideFood ? 0 : 10;
  const shutdownScore = entry.shutdownRitual ? 10 : 0;
  return avg([
    entry.procrastinationRating,
    entry.passivePhoneRating,
    entry.fantasyRuminationRating,
    entry.daySatisfactionRating,
    outsideFoodScore,
    shutdownScore,
  ]);
}

export function speechPracticeScore(cycles: number): number {
  if (cycles >= 3) return 10;
  if (cycles === 2) return 7;
  if (cycles === 1) return 3;
  return 0;
}

export function attentionToHealthScore(
  entry: DailyEntry,
  recharge: number,
): number {
  const outsideFoodScore = entry.outsideFood ? 0 : 10;
  const pmoScore = entry.pmoOccurrence ? 0 : 10;
  return avg([
    entry.eyeRelaxationRating,
    speechPracticeScore(Number(entry.speechPracticeCycles)),
    outsideFoodScore,
    pmoScore,
    recharge,
  ]);
}

export interface DailyScores {
  study: number;
  digitalWellbeing: number;
  recharge: number;
  health: number;
  baselineThought: number;
  guruPranam: number;
  controlOverLife: number;
  attentionToHealth: number;
}

export function computeDailyScores(entry: DailyEntry): DailyScores {
  const recharge = rechargeScore(entry);
  return {
    study: studyScore(entry.deepWorkHours),
    digitalWellbeing: digitalWellbeingScore(entry.screenTimeMinutes),
    recharge,
    health: healthScore(entry),
    baselineThought: baselineThoughtScore(entry),
    guruPranam: guruPranamScore(entry.guruPranamMinutes),
    controlOverLife: controlOverLifeScore(entry),
    attentionToHealth: attentionToHealthScore(entry, recharge),
  };
}

export function computeWeeklyAverages(entries: DailyEntry[]): DailyScores {
  if (entries.length === 0) {
    return {
      study: 0,
      digitalWellbeing: 0,
      recharge: 0,
      health: 0,
      baselineThought: 0,
      guruPranam: 0,
      controlOverLife: 0,
      attentionToHealth: 0,
    };
  }
  const allScores = entries.map((e) => computeDailyScores(e));
  const keys = [
    "study",
    "digitalWellbeing",
    "recharge",
    "health",
    "baselineThought",
    "guruPranam",
    "controlOverLife",
    "attentionToHealth",
  ] as const;
  const result = {} as DailyScores;
  for (const key of keys) {
    result[key] = avg(allScores.map((s) => s[key]));
  }
  return result;
}

export function hobbyScore(hobbies: WeeklyHobbies): number {
  return avg([
    hobbies.guitar ? 10 : 0,
    hobbies.poetry ? 10 : 0,
    hobbies.storyWriting ? 10 : 0,
  ]);
}

export function masterIndicator(
  weeklyAverages: DailyScores,
  hobbyScoreVal: number,
): number {
  return avg([
    weeklyAverages.study,
    weeklyAverages.digitalWellbeing,
    weeklyAverages.recharge,
    weeklyAverages.health,
    weeklyAverages.baselineThought,
    weeklyAverages.guruPranam,
    weeklyAverages.controlOverLife,
    weeklyAverages.attentionToHealth,
    hobbyScoreVal,
  ]);
}

export function masterClassification(score: number): string {
  if (score >= 9) return "Exceptional Week";
  if (score >= 8) return "Excellent Week";
  if (score >= 7) return "Good Week";
  if (score >= 6) return "Acceptable Week";
  if (score >= 5) return "Weak Week";
  if (score >= 4) return "Poor Week";
  return "Collapse Week";
}

export function scoreColorClass(score: number): string {
  if (score >= 8) return "green";
  if (score >= 5) return "amber";
  return "red";
}
