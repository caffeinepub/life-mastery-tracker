import type { DailyEntry } from "@/backend.d";
import IndicatorCard from "@/components/IndicatorCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { useSaveDailyEntry, useTodayEntry } from "@/hooks/useQueries";
import { computeDailyScores } from "@/scoreEngine";
import { format } from "date-fns";
import { CheckCircle2, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
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

// Each section gets a unique OKLCH left-border accent for spatial anchoring
const SECTION_ACCENTS: Record<string, string> = {
  study: "oklch(0.78 0.15 85)", // warm gold
  digital: "oklch(0.72 0.14 220)", // sky
  recharge: "oklch(0.68 0.14 285)", // violet
  health: "oklch(0.72 0.16 145)", // green
  baseline: "oklch(0.70 0.13 195)", // teal
  guru: "oklch(0.78 0.16 60)", // amber
  control: "oklch(0.74 0.17 50)", // orange
  attention: "oklch(0.74 0.14 155)", // lime
};

type FormData = Omit<DailyEntry, "speechPracticeCycles"> & {
  speechPracticeCycles: number;
};

const DEFAULT_FORM: FormData = {
  deepWorkHours: 0,
  screenTimeMinutes: 60,
  sleepRecharge: 5,
  pranayamaMinutes: 0,
  microRestRating: 5,
  nadiShodhanSessions: 0,
  mentalHealthRating: 5,
  physicalEnergyRating: 5,
  baselinePurityRating: 5,
  uTurnEfficiencyRating: 5,
  sensoryGuardingRating: 5,
  pmoOccurrence: false,
  guruPranamMinutes: 0,
  procrastinationRating: 5,
  passivePhoneRating: 5,
  fantasyRuminationRating: 5,
  daySatisfactionRating: 5,
  outsideFood: false,
  shutdownRitual: false,
  eyeRelaxationRating: 5,
  speechPracticeCycles: 0,
};

function entryToForm(entry: DailyEntry): FormData {
  return { ...entry, speechPracticeCycles: Number(entry.speechPracticeCycles) };
}

function SectionCard({
  accentKey,
  title,
  emoji,
  children,
}: {
  accentKey: keyof typeof SECTION_ACCENTS;
  title: string;
  emoji: string;
  children: React.ReactNode;
}) {
  const accent = SECTION_ACCENTS[accentKey];
  return (
    <section
      className="rounded-2xl border border-border border-l-[3px] bg-card p-5 space-y-5"
      style={{ borderLeftColor: accent }}
    >
      {/* Section header */}
      <div className="flex items-center gap-2.5 pb-1 border-b border-border/40">
        <span
          className="w-6 h-6 rounded-md flex items-center justify-center text-sm"
          style={{ backgroundColor: `${accent.replace(")", " / 0.15)")}` }}
        >
          {emoji}
        </span>
        <span
          className="text-xs font-semibold tracking-widest uppercase"
          style={{ color: accent }}
        >
          {title}
        </span>
      </div>
      {children}
    </section>
  );
}

function SliderField({
  label,
  value,
  onChange,
  max = 10,
  step = 1,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  max?: number;
  step?: number;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <Label className="text-sm text-foreground/80">{label}</Label>
        <span className="text-primary font-mono font-semibold text-sm tabular-nums">
          {value.toFixed(step < 1 ? 1 : 0)}
        </span>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        max={max}
        step={step}
        className="py-1"
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm text-foreground/80">{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(Number.parseFloat(e.target.value) || 0)}
          className="bg-input border-border text-foreground w-28"
        />
        {suffix && (
          <span className="text-sm text-muted-foreground">{suffix}</span>
        )}
      </div>
    </div>
  );
}

function BooleanToggle({
  label,
  value,
  onChange,
  dataOcid,
  yesLabel = "Yes",
  noLabel = "No",
  yesIsGood = true,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  dataOcid?: string;
  yesLabel?: string;
  noLabel?: string;
  yesIsGood?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <Label className="text-sm text-foreground/80">{label}</Label>
      <div
        className="flex rounded-lg border border-border overflow-hidden"
        data-ocid={dataOcid}
      >
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`px-4 py-1.5 text-sm font-medium transition-colors ${
            value
              ? yesIsGood
                ? "bg-emerald-700/60 text-emerald-100"
                : "bg-destructive/70 text-destructive-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {yesLabel}
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`px-4 py-1.5 text-sm font-medium border-l border-border transition-colors ${
            !value
              ? yesIsGood
                ? "bg-destructive/70 text-destructive-foreground"
                : "bg-emerald-700/60 text-emerald-100"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {noLabel}
        </button>
      </div>
    </div>
  );
}

export default function TodayTab() {
  const { data: existingEntry, isLoading } = useTodayEntry();
  const saveMutation = useSaveDailyEntry();
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (existingEntry) {
      setForm(entryToForm(existingEntry));
      setSaved(true);
    }
  }, [existingEntry]);

  const setField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    const entry: DailyEntry = {
      ...form,
      speechPracticeCycles: BigInt(form.speechPracticeCycles),
    };
    try {
      await saveMutation.mutateAsync(entry);
      setSaved(true);
      toast.success("Entry saved!");
    } catch {
      toast.error("Failed to save. Please try again.");
    }
  };

  const scores = computeDailyScores({
    ...form,
    speechPracticeCycles: BigInt(form.speechPracticeCycles),
  });
  const today = format(new Date(), "EEEE, MMMM d, yyyy");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Header */}
      <div className="pt-2">
        <p className="text-xs section-header mb-1">Daily Entry</p>
        <h2 className="font-display text-2xl font-bold text-foreground">
          {today}
        </h2>
      </div>

      {/* Form Sections */}
      <div className="space-y-4">
        <SectionCard accentKey="study" title="Study" emoji="📚">
          <NumberField
            label="Deep Work Hours"
            value={form.deepWorkHours}
            onChange={(v) => setField("deepWorkHours", v)}
            min={0}
            max={16}
            step={0.5}
            suffix="hrs"
          />
        </SectionCard>

        <SectionCard accentKey="digital" title="Digital Wellbeing" emoji="📱">
          <NumberField
            label="Screen Time"
            value={form.screenTimeMinutes}
            onChange={(v) => setField("screenTimeMinutes", v)}
            min={0}
            max={1440}
            step={5}
            suffix="min"
          />
        </SectionCard>

        <SectionCard accentKey="recharge" title="Recharge" emoji="🔋">
          <SliderField
            label="Sleep Recharge"
            value={form.sleepRecharge}
            onChange={(v) => setField("sleepRecharge", v)}
            hint="0 = exhausted · 10 = fully refreshed"
          />
          <NumberField
            label="Pranayama"
            value={form.pranayamaMinutes}
            onChange={(v) => setField("pranayamaMinutes", v)}
            min={0}
            max={120}
            suffix="min (goal: 15)"
          />
          <SliderField
            label="Micro Rest Rating"
            value={form.microRestRating}
            onChange={(v) => setField("microRestRating", v)}
            hint="Adherence to ~90 min rest cycles"
          />
          <NumberField
            label="Nadi Shodhan Sessions"
            value={form.nadiShodhanSessions}
            onChange={(v) => setField("nadiShodhanSessions", Math.round(v))}
            min={0}
            max={10}
            suffix="sessions (goal: 3)"
          />
        </SectionCard>

        <SectionCard accentKey="health" title="Health" emoji="💚">
          <SliderField
            label="Mental Health"
            value={form.mentalHealthRating}
            onChange={(v) => setField("mentalHealthRating", v)}
            hint="0 = overwhelmed · 5 = neutral · 10 = calm & joyful"
          />
          <SliderField
            label="Physical Energy"
            value={form.physicalEnergyRating}
            onChange={(v) => setField("physicalEnergyRating", v)}
            hint="0 = exhausted · 5 = functional · 10 = energetic"
          />
        </SectionCard>

        <SectionCard accentKey="baseline" title="Baseline Thought" emoji="🧠">
          <SliderField
            label="Baseline Purity"
            value={form.baselinePurityRating}
            onChange={(v) => setField("baselinePurityRating", v)}
          />
          <SliderField
            label="U-Turn Efficiency"
            value={form.uTurnEfficiencyRating}
            onChange={(v) => setField("uTurnEfficiencyRating", v)}
          />
          <SliderField
            label="Sensory Guarding"
            value={form.sensoryGuardingRating}
            onChange={(v) => setField("sensoryGuardingRating", v)}
          />
          <Separator className="bg-border/50" />
          <BooleanToggle
            label="PMO Occurrence"
            value={form.pmoOccurrence}
            onChange={(v) => setField("pmoOccurrence", v)}
            dataOcid="daily.pmo_toggle"
            yesLabel="Occurred"
            noLabel="Clean"
            yesIsGood={false}
          />
        </SectionCard>

        <SectionCard accentKey="guru" title="Guru Pranam" emoji="🕯️">
          <NumberField
            label="Swami Vivekananda Reading"
            value={form.guruPranamMinutes}
            onChange={(v) => setField("guruPranamMinutes", v)}
            min={0}
            max={120}
            suffix="min"
          />
        </SectionCard>

        <SectionCard accentKey="control" title="Control Over Life" emoji="🎯">
          <SliderField
            label="Procrastination Control"
            value={form.procrastinationRating}
            onChange={(v) => setField("procrastinationRating", v)}
            hint="10 = zero procrastination"
          />
          <SliderField
            label="Passive Phone Usage Control"
            value={form.passivePhoneRating}
            onChange={(v) => setField("passivePhoneRating", v)}
            hint="10 = fully intentional usage"
          />
          <SliderField
            label="Fantasy / Rumination Control"
            value={form.fantasyRuminationRating}
            onChange={(v) => setField("fantasyRuminationRating", v)}
          />
          <SliderField
            label="Day Satisfaction"
            value={form.daySatisfactionRating}
            onChange={(v) => setField("daySatisfactionRating", v)}
          />
          <Separator className="bg-border/50" />
          <BooleanToggle
            label="Outside Food Eaten"
            value={form.outsideFood}
            onChange={(v) => setField("outsideFood", v)}
            dataOcid="daily.outside_food_toggle"
            yesLabel="Yes"
            noLabel="No"
            yesIsGood={false}
          />
          <BooleanToggle
            label="Shutdown Ritual"
            value={form.shutdownRitual}
            onChange={(v) => setField("shutdownRitual", v)}
            dataOcid="daily.shutdown_ritual_toggle"
            yesLabel="Done"
            noLabel="Skipped"
            yesIsGood={true}
          />
        </SectionCard>

        <SectionCard
          accentKey="attention"
          title="Attention to Health"
          emoji="🌿"
        >
          <SliderField
            label="Eye Relaxation"
            value={form.eyeRelaxationRating}
            onChange={(v) => setField("eyeRelaxationRating", v)}
          />
          <div className="space-y-2">
            <Label className="text-sm text-foreground/80">
              Speech Practice Cycles
            </Label>
            <p className="text-xs text-muted-foreground">Goal: 3 cycles</p>
            <div className="flex gap-2">
              {([0, 1, 2, 3] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  data-ocid={`daily.speech_cycles_${n}`}
                  onClick={() => setField("speechPracticeCycles", n)}
                  className={`flex-1 py-2.5 rounded-lg border text-sm font-semibold transition-all ${
                    form.speechPracticeCycles === n
                      ? "border-primary bg-primary/20 text-primary shadow-sm"
                      : "border-border bg-muted/30 text-muted-foreground hover:border-border/80 hover:text-foreground"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={saveMutation.isPending}
        data-ocid="daily.submit_button"
        className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
        style={{ boxShadow: "0 0 20px oklch(0.78 0.15 85 / 0.25)" }}
      >
        {saveMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : saved ? (
          <>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Update Entry
          </>
        ) : (
          "Save Today's Entry"
        )}
      </Button>

      {/* Indicator Cards */}
      <AnimatePresence>
        {saved && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs section-header">Today's Indicators</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {INDICATOR_META.map((meta, i) => (
                <IndicatorCard
                  key={meta.key}
                  label={meta.label}
                  icon={meta.icon}
                  score={scores[meta.key as keyof typeof scores]}
                  dataOcid={meta.ocid}
                  index={i}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="text-center text-xs text-muted-foreground py-4">
        © {new Date().getFullYear()}. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
