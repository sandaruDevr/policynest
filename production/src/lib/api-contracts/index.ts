/**
 * Backend-ready service contracts.
 *
 * The UI imports from "@/lib/api-contracts" — never from a concrete implementation.
 * Currently wired to mock services; flip to a real fetch client without changing callers.
 */
import type {
  ActivityItem,
  ApiResult,
  ComplianceItem,
  ComplianceSummary,
  ConversationTurn,
  CredentialItem,
  DocumentDetail,
  DocumentSummary,
  EmergencyContact,
  EmergencyDrill,
  EmergencyProtocol,
  GuidanceQuery,
  GuidanceResponse,
  IncidentReport,
  InductionStep,
  NotificationItem,
  QuickReferenceItem,
  SafeVoiceSubmission,
  SignedDocument,
  StaffProfile,
  SuggestedPrompt,
  SurveySummary,
  TrainingModule,
} from "@/types";

import { getMe as getProfile, updatePreferences as updateProfilePreferences } from "@/lib/data/profile";
import { list as listNotifications } from "@/lib/data/notifications";
import { listDocuments, getDocument, searchDocuments, toggleBookmark, acknowledgeDocument } from "@/lib/data/library";
import { listIncidents } from "@/lib/data/incidents";
import { listTrainingModules, getTrainingModule, listInductionSteps, listCredentials } from "@/lib/data/training";
import { listComplianceItems, getComplianceSummary } from "@/lib/data/compliance";
import { listEmergencyProtocols, getEmergencyProtocolByCategory, listEmergencyContacts, listEmergencyDrills } from "@/lib/data/emergency";
import { listQuickRefs, getQuickRefByTarget, pinQuickRef, unpinQuickRef } from "@/lib/data/quick-ref";
import { listActivity } from "@/lib/data/activity";
import { listSurveys } from "@/lib/data/surveys";
import { listConversationHistory } from "@/lib/data/assistant";
import { listSafeVoiceHistory } from "@/lib/data/feedback";
import { SUGGESTED_PROMPTS, MOCK_CONVERSATION } from "@/lib/mock-data";

const wrap = <T>(data: T): ApiResult<T> => ({
  data,
  meta: { fetchedAt: new Date().toISOString() },
});

export const ProfileApi = {
  async getMe(): Promise<ApiResult<StaffProfile>> {
    const profile = await getProfile();
    if (!profile) throw new Error("Not authenticated");
    return wrap(profile);
  },
  async updatePreferences(
    patch: Partial<StaffProfile>,
  ): Promise<ApiResult<StaffProfile>> {
    const profile = await updateProfilePreferences(patch);
    if (!profile) throw new Error("Not authenticated");
    return wrap(profile);
  },
};

export const LibraryApi = {
  async list(): Promise<ApiResult<DocumentSummary[]>> {
    const documents = await listDocuments();
    return wrap(documents);
  },
  async get(id: string): Promise<ApiResult<DocumentDetail | null>> {
    const doc = await getDocument(id);
    return wrap(doc);
  },
  async search(query: string): Promise<ApiResult<DocumentSummary[]>> {
    const documents = await searchDocuments(query);
    return wrap(documents);
  },
};

export const AssistantApi = {
  async suggestedPrompts(): Promise<ApiResult<SuggestedPrompt[]>> {
    return wrap(SUGGESTED_PROMPTS);
  },
  async ask(_query: GuidanceQuery): Promise<ApiResult<GuidanceResponse>> {
    const t = MOCK_CONVERSATION[0];
    if (!t?.response) throw new Error("missing mock response");
    return wrap(t.response);
  },
  async history(): Promise<ApiResult<ConversationTurn[]>> {
    const data = await listConversationHistory();
    return wrap(data);
  },
};

export const TrainingApi = {
  async modules(): Promise<ApiResult<TrainingModule[]>> {
    const data = await listTrainingModules();
    return wrap(data);
  },
  async module(id: string): Promise<ApiResult<TrainingModule | null>> {
    const data = await getTrainingModule(id);
    return wrap(data);
  },
  async induction(): Promise<ApiResult<InductionStep[]>> {
    const data = await listInductionSteps();
    return wrap(data);
  },
  async signedDocuments(): Promise<ApiResult<SignedDocument[]>> {
    return wrap([]);
  },
  async credentials(): Promise<ApiResult<CredentialItem[]>> {
    const data = await listCredentials();
    return wrap(data);
  },
};

export const ComplianceApi = {
  async summary(): Promise<ApiResult<ComplianceSummary>> {
    const data = await getComplianceSummary();
    return wrap(data);
  },
  async items(): Promise<ApiResult<ComplianceItem[]>> {
    const data = await listComplianceItems();
    return wrap(data);
  },
};

export const IncidentsApi = {
  async list(): Promise<ApiResult<IncidentReport[]>> {
    const data = await listIncidents();
    return { data, meta: { fetchedAt: new Date().toISOString() } };
  },
};

export const EmergencyApi = {
  async protocols(): Promise<ApiResult<EmergencyProtocol[]>> {
    const data = await listEmergencyProtocols();
    return wrap(data);
  },
  async protocol(category: string): Promise<ApiResult<EmergencyProtocol | null>> {
    const data = await getEmergencyProtocolByCategory(category);
    return wrap(data);
  },
  async drills(): Promise<ApiResult<EmergencyDrill[]>> {
    const data = await listEmergencyDrills();
    return wrap(data);
  },
  async contacts(): Promise<ApiResult<EmergencyContact[]>> {
    const data = await listEmergencyContacts();
    return wrap(data);
  },
};

export const QuickRefApi = {
  async list(): Promise<ApiResult<QuickReferenceItem[]>> {
    const data = await listQuickRefs();
    return wrap(data);
  },
  async findByTarget(targetType: string, targetId: string): Promise<ApiResult<QuickReferenceItem | null>> {
    const data = await getQuickRefByTarget(targetType, targetId);
    return wrap(data);
  },
  async pin(input: {
    kind: string;
    title: string;
    subtitle?: string;
    targetType?: string;
    targetId?: string;
    targetUrl?: string;
    content?: unknown;
  }): Promise<ApiResult<QuickReferenceItem | null>> {
    const data = await pinQuickRef(input);
    return wrap(data);
  },
  async unpin(id: string): Promise<ApiResult<boolean>> {
    const data = await unpinQuickRef(id);
    return wrap(data);
  },
};

export const FeedbackApi = {
  async surveys(): Promise<ApiResult<SurveySummary[]>> {
    const data = await listSurveys();
    return wrap(data);
  },
  async safeVoiceHistory(): Promise<ApiResult<SafeVoiceSubmission[]>> {
    const data = await listSafeVoiceHistory();
    return wrap(data);
  },
};

export const ActivityApi = {
  async list(): Promise<ApiResult<ActivityItem[]>> {
    const data = await listActivity();
    return wrap(data);
  },
};

export const NotificationsApi = {
  async list(): Promise<ApiResult<NotificationItem[]>> {
    const notifications = await listNotifications();
    return wrap(notifications);
  },
};
