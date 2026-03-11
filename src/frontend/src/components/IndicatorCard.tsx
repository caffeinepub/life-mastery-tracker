import { scoreColorClass } from "@/scoreEngine";
import { motion } from "motion/react";

interface IndicatorCardProps {
  label: string;
  score: number;
  icon: string;
  dataOcid?: string;
  isLowest?: boolean;
  index?: number;
}

const SCORE_ACCENTS = {
  green: {
    text: "score-text-green",
    border: "oklch(0.72 0.16 145)",
    glow: "oklch(0.72 0.16 145 / 0.14)",
    bar: "oklch(0.72 0.16 145)",
  },
  amber: {
    text: "score-text-amber",
    border: "oklch(0.78 0.16 75)",
    glow: "oklch(0.78 0.16 75 / 0.14)",
    bar: "oklch(0.78 0.16 75)",
  },
  red: {
    text: "score-text-red",
    border: "oklch(0.62 0.22 25)",
    glow: "oklch(0.62 0.22 25 / 0.14)",
    bar: "oklch(0.62 0.22 25)",
  },
};

export default function IndicatorCard({
  label,
  score,
  icon,
  dataOcid,
  isLowest,
  index = 0,
}: IndicatorCardProps) {
  const colorKey = scoreColorClass(score) as keyof typeof SCORE_ACCENTS;
  const accent = SCORE_ACCENTS[colorKey];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      data-ocid={dataOcid}
      style={{
        borderLeftColor: accent.border,
      }}
      className={`relative rounded-xl bg-card border border-border border-l-[3px] p-4 overflow-hidden ${
        isLowest ? "ring-1 ring-destructive/40" : ""
      }`}
    >
      {/* Per-score radial glow */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at top right, ${accent.glow}, transparent 65%)`,
        }}
      />

      <div className="relative">
        {/* Top row: icon + score */}
        <div className="flex items-start justify-between mb-2.5">
          <span className="text-xl leading-none mt-0.5">{icon}</span>
          <span
            className={`font-display text-3xl font-bold tabular-nums leading-none ${
              accent.text
            }`}
          >
            {score.toFixed(1)}
          </span>
        </div>

        {/* Label */}
        <p className="text-xs font-medium text-foreground/65 leading-snug mb-2.5">
          {label}
        </p>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(score / 10) * 100}%` }}
            transition={{
              duration: 0.65,
              ease: "easeOut",
              delay: index * 0.05 + 0.1,
            }}
            className="h-full rounded-full"
            style={{ backgroundColor: accent.bar }}
          />
        </div>

        {isLowest && (
          <p className="text-xs text-destructive mt-2 font-medium">
            ⚠ Focus area
          </p>
        )}
      </div>
    </motion.div>
  );
}
