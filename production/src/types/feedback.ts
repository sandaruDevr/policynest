import type { ID, ISODateString } from "./common";

export type SurveyStatus = "active" | "completed" | "expired";

export interface SurveySummary {
  id: ID;
  title: string;
  description?: string;
  status: SurveyStatus;
  questionCount: number;
  estimatedMinutes: number;
  closesAt?: ISODateString;
  completedAt?: ISODateString;
  anonymous: boolean;
}

export type SafeVoiceCategory =
  | "near-miss"
  | "improvement"
  | "psychosocial"
  | "facility"
  | "other";

export interface SafeVoiceSubmission {
  id: ID;
  submittedAt: ISODateString;
  category: SafeVoiceCategory;
  message: string;
  anonymous: boolean;
  status: "received" | "reviewing" | "actioned";
}
