/**
 * Shapes shared between the wizard client and the server action. Kept free of
 * both React and Supabase imports so either side can use it.
 */

import type { Archetype } from "./questions";

export interface CompanySetup {
  name: string;
  website: string;
  archetype: Archetype;
  domain: string;
  coreProcesses: string[];
  buyer: string;
  monetisationToday: string;
  notes: string;
}

export const DOMAIN_SUGGESTIONS = [
  "ITSM",
  "Service Management",
  "Service Operations",
  "DevOps",
  "AI Engineering",
  "SRE",
  "Other",
] as const;

export function emptySetup(): CompanySetup {
  return {
    name: "",
    website: "",
    archetype: "technical_domain_vendor",
    domain: "",
    coreProcesses: [],
    buyer: "",
    monetisationToday: "",
    notes: "",
  };
}
