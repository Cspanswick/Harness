/**
 * Exact hex values from HANDOVER §7, for the places that need a string rather
 * than a Tailwind class — chip backgrounds, inline SVG fills, Recharts cells.
 * These must match the @theme tokens in app/globals.css.
 */

import type { LayerId } from "./questions";
import type { ExposureBand, Verdict } from "./scoring";

export const LAYER_HEX: Record<LayerId, string> = {
  l1: "#c7783a",
  l2: "#b98a34",
  l3: "#7e8f4c",
  l4: "#3e7d62",
  l5: "#1e5f58",
};

export const VERDICT_HEX: Record<Verdict, string> = {
  MOAT_BUSINESS: "#1e5f58",
  CONTESTED_MOAT: "#7e8f4c",
  CONDITIONAL_MOAT: "#b98a34",
  MIXED: "#44586a",
  FEATURE_BUSINESS: "#c7783a",
  EXPENSIVE_FLOW_REBUILD: "#c7783a",
  UNPRICED: "#8a93a0",
};

export const EXPOSURE_HEX: Record<ExposureBand, string> = {
  LOW: "#3e7d62",
  MEDIUM: "#b98a34",
  HIGH: "#c7783a",
};

export const INK = "#13222e";
export const PAPER = "#edf0f2";
export const LINE = "#c6d0d8";
