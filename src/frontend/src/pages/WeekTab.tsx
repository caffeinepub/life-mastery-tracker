import type { WeeklyHobbies } from "@/backend.d";
import IndicatorCard from "@/components/IndicatorCard";
import { Button } from "@/components/ui/button";
import {
  useCurrentWeekEntries,
  useCurrentWeekHobbies,
  useSaveWeeklyHobbies,
} from "@/hooks/useQueries";
import { currentWeekKey, weekLabel } from "@/lib/dateUtils";
import {
  type DailyScores,
  computeWeeklyAverages,
  hobbyScore,
  masterClassification,
  masterIndicator,
  scoreColorClass,
} from "@/scoreEngine";
import { startOfISOWeek } from "date-fns";
import { BookOpen, Loader2, Music, PenTool } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const INDICATOR_META = [
  { key: "study", label: "Study", icon: "📚", ocid: "indicators.study_card" },
  {
    key: "digitalWellbeing",
    label: "Digital Wellbeing",
    icon: "📱",
    ocid: "indicators.digital_wellbeing_card",
  },
  {
    key: "recharge",
    label: "Recharge",
    icon: "🔋",
    ocid: "indicators.recharge_card",
  },
  {
    key: "health",
    label: "Health",
    icon: "💚",
    ocid: "indicators.health_card",
  },
  {
    key: "baselineThought",
    label: "Baseline Thought",
    icon: "🧠",
    ocid: "indicators.baseline_thought_card",
  },
  {
    key: "guruPranam",
    label: "Guru Pranam",
    icon: "🕯️",
    ocid: "indicators.guru_pranam_card",
  },
  {
    key: "controlOverLife",
    label: "Control Over Life",
    icon: "🎯",
    ocid: "indicators.control_over_life_card",
  },
  {
    key: "attentionToHealth",
    label: "Attention to Health",
    icon: "🌿",
    ocid: "indicators.attention_health_card",
  },
];

const CLASSIFICATION_STYLE: Record<string, string> = {
  "Exceptional Week":
    "border-emerald-500/50 text-emerald-400 bg-emerald-500/10",
  "Excellent Week": "border-green-500/50 text-green-400 bg-green-500/10",
  "Good Week": "border-green-600/40 text-green-300 bg-green-600/8",
  "Acceptable Week": "border-amber-500/50 text-amber-400 bg-amber-500/10",
  "Weak Week": "border-orange-500/50 text-orange-400 bg-orange-500/10",
  "Poor Week": "border-red-500/50 text-red-400 bg-red-500/10",
  "Collapse Week": "border-red-600/50 text-red-300 bg-red-600/10",
};

const MASTER_ACCENT: Record<
  string,
  { text: string; border: string; glow: string; bar: string }
> = {
  green: {
    text: "score-text-green",
    border: "oklch(0.72 0.16 145)",
    glow: "oklch(0.72 0.16 145 / 0.12)",
    bar: "oklch(0.72 0.16 145)",
  },
  amber: {
    text: "score-text-amber",
    border: "oklch(0.78 0.16 75)",
    glow: "oklch(0.78 0.16 75 / 0.12)",
    bar: "oklch(0.78 0.16 75)",
  },
  red: {
    text: "score-text-red",
    border: "oklch(0.62 0.22 25)",
    glow: "oklch(0.62 0.22 25 / 0.12)",
    bar: "oklch(0.62 0.22 25)",
  },
};

function HobbyButton({
  active,
  onClick,
  icon: Icon,
  label,
  dataOcid,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  dataOcid: string;
}) {
  return (
    <button
      type="button"
      data-ocid={dataOcid}
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
        active
          ? "border-primary bg-primary/15 text-primary"
          : "border-border bg-muted/20 text-muted-foreground hover:text-foreground hover:border-border/80"
      }`}
    >
      <Icon size={22} />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

function BarChartRow({
  label,
  icon,
  score,
  isLowest,
}: {
  label: string;
  icon: string;
  score: number;
  isLowest: boolean;
}) {
  const color = scoreColorClass(score);
  const accent = MASTER_ACCENT[color];
  const textClass =
    color === "green"
      ? "score-text-green"
      : color === "amber"
        ? "score-text-amber"
        : "score-text-red";

  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-base w-6">{icon}</span>
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <span
            className={`text-xs font-medium ${isLowest ? "text-destructive" : "text-foreground/70"}`}
          >
            {label}
            {isLowest && " ⚠"}
          </span>
          <span className={`text-xs font-bold tabular-nums ${textClass}`}>
            {score.toFixed(1)}
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(score / 10) * 100}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ backgroundColor: accent.bar }}
          />
        </div>
      </div>
    </div>
  );
}

export default function WeekTab() {
  const { data: weekEntries, isLoading: entriesLoading } =
    useCurrentWeekEntries();
  const { data: hobbiesData, isLoading: hobbiesLoading } =
    useCurrentWeekHobbies();
  const saveHobbies = useSaveWeeklyHobbies();

  const [guitar, setGuitar] = useState(false);
  const [poetry, setPoetry] = useState(false);
  const [storyWriting, setStoryWriting] = useState(false);
  const [hobbiesSynced, setHobbiesSynced] = useState(false);

  useEffect(() => {
    if (hobbiesData && !hobbiesSynced) {
      setGuitar(hobbiesData.guitar);
      setPoetry(hobbiesData.poetry);
      setStoryWriting(hobbiesData.storyWriting);
      setHobbiesSynced(true);
    }
  }, [hobbiesData, hobbiesSynced]);

  const entries = (weekEntries ?? []).map(([, entry]) => entry);
  const weeklyAvg = computeWeeklyAverages(entries);
  const currentHobbyScore = hobbyScore({ guitar, poetry, storyWriting });
  const master = masterIndicator(weeklyAvg, currentHobbyScore);
  const classification = masterClassification(master);
  const weekStart = startOfISOWeek(new Date());
  const weekLabelStr = weekLabel(weekStart);

  const allIndicators = [
    ...INDICATOR_META.map((m) => ({
      key: m.key,
      score: weeklyAvg[m.key as keyof DailyScores],
    })),
    { key: "hobbies", score: currentHobbyScore },
  ];
  const lowestKey = allIndicators.reduce((a, b) =>
    a.score <= b.score ? a : b,
  ).key;

  const handleSaveHobbies = async () => {
    const weekKey = currentWeekKey();
    const hobbies: WeeklyHobbies = { guitar, poetry, storyWriting };
    try {
      await saveHobbies.mutateAsync({ weekKey, hobbies });
      toast.success("Hobbies saved!");
    } catch {
      toast.error("Failed to save hobbies.");
    }
  };

  if (entriesLoading || hobbiesLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const masterColorKey = scoreColorClass(master);
  const masterAccent = MASTER_ACCENT[masterColorKey];
  const classStyle =
    CLASSIFICATION_STYLE[classification] ??
    "border-border text-foreground bg-card";
  const ghostScore = Math.round(master).toString();

  return (
    <div className="space-y-6">
      {/* Week Header */}
      <div className="pt-2">
        <p className="text-xs section-header mb-1">Weekly Review</p>
        <h2 className="font-display text-2xl font-bold">{weekLabelStr}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {entries.length} / 7 days logged
        </p>
      </div>

      {/* Master Indicator — redesigned premium card */}
      <motion.div
        data-ocid="weekly.master_indicator_card"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        style={{ borderColor: masterAccent.border }}
        className="rounded-2xl border-2 bg-card p-6 relative overflow-hidden"
      >
        {/* Atmospheric glow */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 25% 60%, ${masterAccent.glow}, transparent 60%)`,
          }}
        />
        {/* Ghost watermark numeral */}
        <div
          aria-hidden
          className="absolute right-3 top-1/2 -translate-y-1/2 font-display font-bold tabular-nums select-none pointer-events-none leading-none"
          style={{
            fontSize: "9rem",
            color: masterAccent.border,
            opacity: 0.07,
          }}
        >
          {ghostScore}
        </div>

        <div className="relative">
          <p className="text-xs section-header mb-4">Master Indicator</p>
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="flex items-baseline gap-2">
                <span
                  className={`font-display text-7xl font-bold leading-none tabular-nums ${masterAccent.text}`}
                >
                  {master.toFixed(1)}
                </span>
                <span className="text-muted-foreground text-base mb-1">
                  /10
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {entries.length} {entries.length === 1 ? "day" : "days"} logged
                this week
              </p>
            </div>
            <div className="shrink-0 mb-1">
              <span
                className={`inline-block px-4 py-2 rounded-xl border text-sm font-semibold ${classStyle}`}
              >
                {classification}
              </span>
            </div>
          </div>

          {/* Thick animated bar with glow */}
          <div className="mt-5 h-3 rounded-full bg-muted/40 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(master / 10) * 100}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
              className="h-full rounded-full"
              style={{
                backgroundColor: masterAccent.bar,
                boxShadow: `0 0 10px ${masterAccent.bar}`,
              }}
            />
          </div>
        </div>
      </motion.div>

      {/* Hobbies */}
      <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <p className="section-header">Weekly Hobbies</p>
        <div className="grid grid-cols-3 gap-3">
          <HobbyButton
            active={guitar}
            onClick={() => setGuitar((v) => !v)}
            icon={Music}
            label="Guitar"
            dataOcid="weekly.guitar_toggle"
          />
          <HobbyButton
            active={poetry}
            onClick={() => setPoetry((v) => !v)}
            icon={BookOpen}
            label="Poetry"
            dataOcid="weekly.poetry_toggle"
          />
          <HobbyButton
            active={storyWriting}
            onClick={() => setStoryWriting((v) => !v)}
            icon={PenTool}
            label="Story Writing"
            dataOcid="weekly.story_toggle"
          />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Hobby score:{" "}
            <span className="font-semibold text-primary">
              {currentHobbyScore.toFixed(1)}
            </span>
          </p>
          <Button
            size="sm"
            onClick={handleSaveHobbies}
            disabled={saveHobbies.isPending}
            data-ocid="weekly.hobbies_save_button"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {saveHobbies.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : null}
            Save Hobbies
          </Button>
        </div>
      </section>

      {/* Indicator Breakdown Chart */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <p className="section-header mb-4">Indicator Breakdown</p>
        {INDICATOR_META.map((meta) => (
          <BarChartRow
            key={meta.key}
            label={meta.label}
            icon={meta.icon}
            score={weeklyAvg[meta.key as keyof DailyScores]}
            isLowest={lowestKey === meta.key}
          />
        ))}
        <BarChartRow
          label="Hobbies"
          icon="🎨"
          score={currentHobbyScore}
          isLowest={lowestKey === "hobbies"}
        />
      </section>

      {/* Weekly Averages grid */}
      {entries.length > 0 ? (
        <section className="space-y-3">
          <p className="section-header">Weekly Averages</p>
          <div className="grid grid-cols-2 gap-3">
            {INDICATOR_META.map((meta, i) => (
              <IndicatorCard
                key={meta.key}
                label={meta.label}
                icon={meta.icon}
                score={weeklyAvg[meta.key as keyof DailyScores]}
                dataOcid={meta.ocid}
                isLowest={lowestKey === meta.key}
                index={i}
              />
            ))}
          </div>
        </section>
      ) : (
        <div
          data-ocid="week.empty_state"
          className="text-center py-12 text-muted-foreground"
        >
          <p className="text-4xl mb-3">📊</p>
          <p className="font-medium">No entries this week yet</p>
          <p className="text-sm mt-1">
            Start logging daily entries to see your scores here.
          </p>
        </div>
      )}
    </div>
  );
}
