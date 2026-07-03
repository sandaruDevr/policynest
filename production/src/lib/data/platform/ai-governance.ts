import "server-only";
import { createClient } from "@/lib/supabase/server";
import { recordPlatformAction } from "./audit";
import type {
  AiModel,
  AiModelType,
  AiPromptSummary,
  PromptVersion,
  AiEvaluation,
  EvaluationCase,
  CreateModelInput,
  CreatePromptInput,
  CreatePromptVersionInput,
  CreateEvaluationInput,
} from "@/types/platform";

const MODEL_TYPES: AiModelType[] = ["chat", "embedding", "vision", "reasoning"];

function normalizeModelType(value: string): AiModelType {
  return MODEL_TYPES.includes(value as AiModelType)
    ? (value as AiModelType)
    : "chat";
}

// ---------------------------------------------------------------------
// Models
// ---------------------------------------------------------------------

export async function listModels(): Promise<AiModel[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("ai_model_summary")
    .select("*")
    .order("model_type", { ascending: true })
    .order("label", { ascending: true });

  return (data || []).map((r) => ({
    id: r.id,
    provider: r.provider,
    modelId: r.model_id,
    label: r.label,
    modelType: normalizeModelType(r.model_type),
    contextWindow: r.context_window,
    maxOutputTokens: r.max_output_tokens,
    costPer1kInput: r.cost_per_1k_input,
    costPer1kOutput: r.cost_per_1k_output,
    isActive: r.is_active,
    isDefault: r.is_default,
    metadata: (r.metadata as Record<string, unknown>) || {},
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function createModel(
  input: CreateModelInput,
): Promise<{ id: string; error?: string }> {
  const supabase = createClient();

  // If is_default, unset other defaults for the same model_type
  if (input.isDefault) {
    await supabase
      .from("ai_models")
      .update({ is_default: false })
      .eq("model_type", input.modelType ?? "chat")
      .eq("is_default", true);
  }

  const { data, error } = await supabase
    .from("ai_models")
    .insert({
      provider: input.provider ?? "openai",
      model_id: input.modelId,
      label: input.label,
      model_type: input.modelType ?? "chat",
      context_window: input.contextWindow ?? null,
      max_output_tokens: input.maxOutputTokens ?? null,
      cost_per_1k_input: input.costPer1kInput ?? null,
      cost_per_1k_output: input.costPer1kOutput ?? null,
      is_active: input.isActive ?? true,
      is_default: input.isDefault ?? false,
    })
    .select("id")
    .single();

  if (error) return { id: "", error: error.message };

  await recordPlatformAction({
    action: "ai_model.create",
    targetType: "ai_model",
    targetId: data.id,
    summary: `Registered model "${input.label}" (${input.provider}/${input.modelId})`,
    meta: { provider: input.provider, modelId: input.modelId },
  });

  return { id: data.id };
}

export async function updateModel(
  modelId: string,
  input: Partial<CreateModelInput>,
): Promise<{ error?: string }> {
  const supabase = createClient();

  if (input.isDefault) {
    const { data: model } = await supabase
      .from("ai_models")
      .select("model_type")
      .eq("id", modelId)
      .single();
    if (model) {
      await supabase
        .from("ai_models")
        .update({ is_default: false })
        .eq("model_type", model.model_type)
        .neq("id", modelId)
        .eq("is_default", true);
    }
  }

  const update: Record<string, unknown> = {};
  if (input.label !== undefined) update.label = input.label;
  if (input.provider !== undefined) update.provider = input.provider;
  if (input.modelId !== undefined) update.model_id = input.modelId;
  if (input.modelType !== undefined) update.model_type = input.modelType;
  if (input.contextWindow !== undefined) update.context_window = input.contextWindow;
  if (input.maxOutputTokens !== undefined) update.max_output_tokens = input.maxOutputTokens;
  if (input.costPer1kInput !== undefined) update.cost_per_1k_input = input.costPer1kInput;
  if (input.costPer1kOutput !== undefined) update.cost_per_1k_output = input.costPer1kOutput;
  if (input.isActive !== undefined) update.is_active = input.isActive;
  if (input.isDefault !== undefined) update.is_default = input.isDefault;
  update.updated_at = new Date().toISOString();

  if (Object.keys(update).length <= 1) return {};

  const { error } = await supabase.from("ai_models").update(update).eq("id", modelId);
  if (error) return { error: error.message };

  await recordPlatformAction({
    action: "ai_model.update",
    targetType: "ai_model",
    targetId: modelId,
    summary: "Updated model configuration",
    meta: update,
  });

  return {};
}

// ---------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------

export async function listPrompts(): Promise<AiPromptSummary[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("ai_prompt_summary")
    .select("*")
    .order("label", { ascending: true });

  return (data || []).map((r) => ({
    id: r.id,
    key: r.key,
    label: r.label,
    description: r.description,
    promptType: (r.prompt_type as AiPromptSummary["promptType"]) ?? "system",
    modelType: r.model_type,
    isActive: r.is_active,
    currentVersion: r.current_version,
    versionCount: r.version_count,
    evaluationCount: r.evaluation_count,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function createPrompt(
  input: CreatePromptInput,
): Promise<{ id: string; error?: string }> {
  const supabase = createClient();

  // Create the prompt
  const { data: prompt, error: promptErr } = await supabase
    .from("ai_prompts")
    .insert({
      key: input.key,
      label: input.label,
      description: input.description ?? null,
      prompt_type: input.promptType ?? "system",
      model_type: input.modelType ?? "chat",
      is_active: true,
    })
    .select("id")
    .single();

  if (promptErr || !prompt) return { id: "", error: promptErr?.message ?? "Failed to create prompt" };

  // Create the first version
  const { data: version, error: verErr } = await supabase
    .from("ai_prompt_versions")
    .insert({
      prompt_id: prompt.id,
      version: "v1.0",
      content: input.content,
      change_reason: input.changeReason ?? "Initial version",
      status: "published",
      published_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (verErr || !version) return { id: "", error: verErr?.message ?? "Failed to create version" };

  // Link current_version_id
  await supabase
    .from("ai_prompts")
    .update({ current_version_id: version.id })
    .eq("id", prompt.id);

  await recordPlatformAction({
    action: "ai_prompt.create",
    targetType: "ai_prompt",
    targetId: prompt.id,
    summary: `Created prompt "${input.label}" (key: ${input.key})`,
    meta: { key: input.key },
  });

  return { id: prompt.id };
}

export async function getPromptVersions(promptId: string): Promise<PromptVersion[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("ai_prompt_versions")
    .select("*")
    .eq("prompt_id", promptId)
    .order("created_at", { ascending: false });

  return (data || []).map((v) => ({
    id: v.id,
    promptId: v.prompt_id,
    version: v.version,
    content: v.content,
    changeReason: v.change_reason,
    status: v.status as PromptVersion["status"],
    publishedAt: v.published_at,
    publishedBy: v.published_by,
    createdBy: v.created_by,
    createdAt: v.created_at,
  }));
}

export async function createPromptVersion(
  input: CreatePromptVersionInput,
): Promise<{ id: string; error?: string }> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("ai_prompt_versions")
    .insert({
      prompt_id: input.promptId,
      version: input.version,
      content: input.content,
      change_reason: input.changeReason ?? null,
      status: "draft",
    })
    .select("id")
    .single();

  if (error) return { id: "", error: error.message };

  await recordPlatformAction({
    action: "ai_prompt.version.create",
    targetType: "ai_prompt",
    targetId: input.promptId,
    summary: `Created prompt version ${input.version}`,
    meta: { version: input.version },
  });

  return { id: data.id };
}

export async function publishPromptVersion(
  versionId: string,
): Promise<{ error?: string }> {
  const supabase = createClient();

  const { data: version } = await supabase
    .from("ai_prompt_versions")
    .select("prompt_id, version")
    .eq("id", versionId)
    .single();

  if (!version) return { error: "Version not found" };

  // Supersede previous published versions
  await supabase
    .from("ai_prompt_versions")
    .update({ status: "superseded" })
    .eq("prompt_id", version.prompt_id)
    .eq("status", "published");

  // Publish this version
  const { error } = await supabase
    .from("ai_prompt_versions")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
    })
    .eq("id", versionId);

  if (error) return { error: error.message };

  // Update prompt's current_version_id
  await supabase
    .from("ai_prompts")
    .update({ current_version_id: versionId, updated_at: new Date().toISOString() })
    .eq("id", version.prompt_id);

  await recordPlatformAction({
    action: "ai_prompt.version.publish",
    targetType: "ai_prompt_version",
    targetId: versionId,
    summary: `Published prompt version ${version.version}`,
    meta: { version: version.version },
  });

  return {};
}

// ---------------------------------------------------------------------
// Evaluations
// ---------------------------------------------------------------------

export async function listEvaluations(): Promise<AiEvaluation[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("ai_evaluations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return (data || []).map((r) => ({
    id: r.id,
    label: r.label,
    description: r.description,
    promptId: r.prompt_id,
    promptVersionId: r.prompt_version_id,
    modelId: r.model_id,
    status: (r.status as AiEvaluation["status"]) ?? "pending",
    avgScore: r.avg_score,
    avgLatencyMs: r.avg_latency_ms,
    totalCases: r.total_cases,
    passedCases: r.passed_cases,
    summary: r.summary,
    metadata: (r.metadata as Record<string, unknown>) || {},
    createdBy: r.created_by,
    createdAt: r.created_at,
    completedAt: r.completed_at,
  }));
}

export async function getEvaluationCases(
  evaluationId: string,
): Promise<EvaluationCase[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("ai_evaluation_cases")
    .select("*")
    .eq("evaluation_id", evaluationId)
    .order("created_at", { ascending: true });

  return (data || []).map((r) => ({
    id: r.id,
    evaluationId: r.evaluation_id,
    input: r.input,
    expectedOutput: r.expected_output,
    actualOutput: r.actual_output,
    score: r.score,
    latencyMs: r.latency_ms,
    status: (r.status as EvaluationCase["status"]) ?? "pending",
    notes: r.notes,
    metadata: (r.metadata as Record<string, unknown>) || {},
    createdAt: r.created_at,
  }));
}

export async function createEvaluation(
  input: CreateEvaluationInput,
): Promise<{ id: string; error?: string }> {
  const supabase = createClient();

  const { data: evalRow, error: evalErr } = await supabase
    .from("ai_evaluations")
    .insert({
      label: input.label,
      description: input.description ?? null,
      prompt_id: input.promptId ?? null,
      prompt_version_id: input.promptVersionId ?? null,
      model_id: input.modelId ?? null,
      status: "pending",
      total_cases: input.cases.length,
    })
    .select("id")
    .single();

  if (evalErr || !evalRow) return { id: "", error: evalErr?.message ?? "Failed to create evaluation" };

  // Insert cases
  const cases = input.cases.map((c) => ({
    evaluation_id: evalRow.id,
    input: c.input,
    expected_output: c.expectedOutput ?? null,
    status: "pending" as const,
  }));

  const { error: casesErr } = await supabase
    .from("ai_evaluation_cases")
    .insert(cases);

  if (casesErr) return { id: "", error: casesErr.message };

  await recordPlatformAction({
    action: "ai_evaluation.create",
    targetType: "ai_evaluation",
    targetId: evalRow.id,
    summary: `Created evaluation "${input.label}" with ${input.cases.length} test cases`,
    meta: { caseCount: input.cases.length },
  });

  return { id: evalRow.id };
}
