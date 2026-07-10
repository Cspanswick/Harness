import { LAYER_HEX, EXPOSURE_HEX } from "@/lib/palette";
import {
  LAYERS,
  MONETISATION_QUESTIONS,
  THREAT_VECTORS,
  THREATS,
  type Monetisation,
} from "@/lib/questions";
import type { Answers, ExposureBand, Scores } from "@/lib/scoring";

const MON_LABEL: Record<Monetisation, string> = {
  none: "not monetised",
  secondary: "secondary revenue",
  primary: "primary revenue",
};

/** Horizontal 0–100 strength bars for L1–L5, on the defensibility gradient (§2.3). */
export function LayerBars({ scores, answers }: { scores: Scores; answers: Answers }) {
  return (
    <ul className="flex flex-col gap-4">
      {LAYERS.map((layer) => {
        const value = scores.layers[layer.id];
        const band = scores.layerBands[layer.id];
        const mon = answers[MONETISATION_QUESTIONS[layer.id].id] as Monetisation | undefined;
        return (
          <li key={layer.id}>
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="text-ink">
                <span className="font-mono text-xs text-ink-soft">L{layer.n}</span>{" "}
                {layer.name}
              </span>
              <span className="font-mono text-xs text-ink-soft">
                {value} · {band}
                {mon && mon !== "none" && (
                  <span className="text-ink"> · {MON_LABEL[mon]}</span>
                )}
              </span>
            </div>
            <div
              className="mt-1.5 h-4 w-full border-[1.5px] border-ink rounded-sharp bg-paper overflow-hidden"
              role="img"
              aria-label={`${layer.name}: ${value} of 100, ${band}`}
            >
              <div
                className="h-full"
                style={{ width: `${value}%`, backgroundColor: LAYER_HEX[layer.id] }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

const BAND_LABEL: Record<ExposureBand, string> = {
  LOW: "LOW",
  MEDIUM: "MED",
  HIGH: "HIGH",
};

/** Three exposure bars, higher = more exposed, with HIGH/MED/LOW chips (§2.3). */
export function ThreatBars({ scores }: { scores: Scores }) {
  return (
    <ul className="flex flex-col gap-4">
      {THREAT_VECTORS.map((vector) => {
        const value = scores.threats[vector];
        const band = scores.threatBands[vector];
        return (
          <li key={vector}>
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="text-ink">{THREATS[vector].label}</span>
              <span
                className="font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-sharp text-paper"
                style={{ backgroundColor: EXPOSURE_HEX[band] }}
              >
                {BAND_LABEL[band]} · {value}
              </span>
            </div>
            <div
              className="mt-1.5 h-4 w-full border-[1.5px] border-ink rounded-sharp bg-paper overflow-hidden"
              role="img"
              aria-label={`${THREATS[vector].label} exposure: ${value} of 100, ${band}`}
            >
              <div
                className="h-full"
                style={{ width: `${value}%`, backgroundColor: EXPOSURE_HEX[band] }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
