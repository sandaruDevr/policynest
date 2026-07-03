import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/route";
import { appendActivity } from "@/lib/data/activity";
import type { GuidanceResponse, GuidanceBlock, AssistantNextAction, Citation, GuidanceStep } from "@/types";

const EXPRESS_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function POST(request: NextRequest) {
  const INTERNAL_SECRET = process.env.INTERNAL_SHARED_SECRET;
  if (!INTERNAL_SECRET) {
    console.error("Missing INTERNAL_SHARED_SECRET environment variable");
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Resolve profile server-side
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, tenant_id, role, staff_role, site_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const body = await request.json();
  const { text, mode, voice, contextHints, documentContext, conversationHistory } = body;

  if (!text) {
    return NextResponse.json({ error: "Missing query text" }, { status: 400 });
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Internal-Token": INTERNAL_SECRET!,
    };

    const expressResponse = await fetch(`${EXPRESS_URL}/api/rag/query`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        user_id: user.id,
        tenant_id: profile.tenant_id,
        role: profile.role,
        staff_role: profile.staff_role,
        site_id: profile.site_id,
        query: text,
        mode,
        voice,
        context_hints: contextHints,
        document_context: documentContext,
        conversation_history: conversationHistory,
      }),
    });

    if (!expressResponse.ok) {
      const errorText = await expressResponse.text();
      console.error("Express error:", errorText);
      return NextResponse.json(
        { error: "Failed to process query" },
        { status: expressResponse.status },
      );
    }

    const expressData = await expressResponse.json();

    // Smart transform: parse answer text into structured blocks
    const { blocks, nextActions } = transformExpressResponse(expressData);

    const guidanceResponse: GuidanceResponse = {
      id: crypto.randomUUID(),
      queryId: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      confidence: mapConfidence(expressData.confidence),
      escalate: expressData.requires_escalation || false,
      blocks,
      nextActions,
      policyNotFound: expressData.policy_not_found || false,
    };

    // Append activity (non-blocking)
    appendActivity("ai-question", `Asked: ${text.slice(0, 120)}`, {
      targetId: guidanceResponse.id,
    }).catch(() => {});

    return NextResponse.json({ data: guidanceResponse });
  } catch (error) {
    console.error("RAG query error:", error);
    return NextResponse.json(
      { error: "Failed to process query" },
      { status: 500 },
    );
  }
}

function mapConfidence(numeric: number | null | undefined): "high" | "medium" | "low" {
  if (numeric === null || numeric === undefined) return "low";
  if (numeric >= 0.85) return "high";
  if (numeric >= 0.7) return "medium";
  return "low";
}

function transformExpressResponse(expressData: any): { blocks: GuidanceBlock[]; nextActions: AssistantNextAction[] } {
  const blocks: GuidanceBlock[] = [];
  const nextActions: AssistantNextAction[] = [];
  const answer: string = expressData.answer || "";

  // 1. Use backend steps if available, otherwise extract from answer text
  const backendSteps = (expressData.steps || []).map((s: any, i: number) => ({
    index: i + 1,
    text: s.step || s.text || String(s),
    iconKey: undefined as string | undefined,
    caution: undefined as string | undefined,
  }));

  if (backendSteps.length > 0) {
    if (answer.trim()) {
      blocks.push({ kind: "summary", text: answer.trim() });
    }
    blocks.push({ kind: "steps", steps: backendSteps });
  } else {
    const stepResult = extractSteps(answer);
    if (stepResult.steps.length > 0) {
      if (stepResult.preamble.trim()) {
        blocks.push({ kind: "summary", text: stepResult.preamble.trim() });
      }
      blocks.push({ kind: "steps", steps: stepResult.steps });
      if (stepResult.postscript.trim()) {
        blocks.push({ kind: "summary", text: stepResult.postscript.trim() });
      }
    } else if (answer.trim()) {
      blocks.push({ kind: "summary", text: answer.trim() });
    }
  }

  // 2. Detect warning/escalation keywords in the answer
  const warningText = extractWarning(answer);
  if (warningText) {
    blocks.push({ kind: "warning", text: warningText, severity: "warn" });
  }

  // 3. Add citations block with document_id mapping
  if (expressData.citations && expressData.citations.length > 0) {
    const citations: Citation[] = expressData.citations.map((c: any) => ({
      id: c.id || c.chunk_id || crypto.randomUUID(),
      documentId: c.document_id || c.doc_id,
      documentTitle: c.title || c.document_title || "Document",
      sectionAnchor: c.section_anchor,
      sectionTitle: c.section_title,
      snippet: c.snippet || c.content || c.text || "",
      version: c.version || "1.0",
      effectiveAt: c.effective_at || new Date().toISOString(),
    }));
    blocks.push({ kind: "citations", citations });
  }

  // 4. Escalation block from backend flag
  if (expressData.requires_escalation) {
    blocks.push({
      kind: "escalation",
      reason: expressData.escalation_reason || "Unable to provide guidance",
      suggestedContacts: expressData.suggested_contacts || [],
    });
  }

  // 5. Map backend suggested_actions
  if (expressData.suggested_actions) {
    for (const action of expressData.suggested_actions) {
      if (action.type === "open_document") {
        nextActions.push({
          kind: "open-document",
          documentId: action.document_id,
          sectionAnchor: action.section_anchor,
        });
      } else if (action.type === "start_incident") {
        nextActions.push({
          kind: "start-incident",
          presetType: action.preset_type,
        });
      } else if (action.type === "rephrase") {
        nextActions.push({ kind: "rephrase" });
      } else if (action.type === "pin_quick_ref") {
        nextActions.push({ kind: "pin-quick-ref" });
      }
    }
  }

  // 6. Map follow_up_questions from backend
  if (expressData.follow_up_questions && expressData.follow_up_questions.length > 0) {
    for (const q of expressData.follow_up_questions.slice(0, 2)) {
      nextActions.push({ kind: "ask-followup", prompt: q });
    }
  }

  // 7. Fallback nextActions so the UI always shows action buttons
  const hasPin = nextActions.some((a) => a.kind === "pin-quick-ref");
  const hasRephrase = nextActions.some((a) => a.kind === "rephrase");
  const hasOpenDoc = nextActions.some((a) => a.kind === "open-document");
  const hasStartIncident = nextActions.some((a) => a.kind === "start-incident");
  const hasFollowUp = nextActions.some((a) => a.kind === "ask-followup");

  if (!hasPin) nextActions.push({ kind: "pin-quick-ref" });
  if (!hasRephrase) nextActions.push({ kind: "rephrase" });

  if (!hasOpenDoc && expressData.citations?.[0]) {
    const first = expressData.citations[0];
    nextActions.push({
      kind: "open-document",
      documentId: first.document_id || first.doc_id,
      sectionAnchor: first.section_anchor,
    });
  }

  if (!hasStartIncident && (expressData.requires_escalation || /urgent|escalat|emergency|incident|000|ambulance/i.test(answer))) {
    nextActions.push({ kind: "start-incident" });
  }

  if (!hasFollowUp) {
    nextActions.push({ kind: "ask-followup", prompt: "Tell me more" });
  }

  return { blocks, nextActions };
}

function extractSteps(text: string): { preamble: string; steps: GuidanceStep[]; postscript: string } {
  const lines = text.split(/\n/);
  const steps: GuidanceStep[] = [];
  let preamble = "";
  let postscript = "";
  let inSteps = false;
  let stepBuffer: string[] = [];
  let stepIndex = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Match numbered steps: "1. ", "2) ", "Step 1: ", "1. **Title** — description"
    const stepMatch = line.match(/^(?:\*?\s*)?(?:Step\s+)?(\d+)[\.\)\:\-]\s*(.+)$/i);

    if (stepMatch) {
      if (!inSteps) {
        preamble = lines.slice(0, i).join("\n");
        inSteps = true;
      }
      // Flush previous buffer
      if (stepBuffer.length > 0) {
        steps.push({
          index: stepIndex++,
          text: stepBuffer.join(" ").trim(),
        });
        stepBuffer = [];
      }
      stepBuffer.push(stepMatch[2].trim());
    } else if (inSteps && line.trim().startsWith("- ")) {
      // Sub-bullet under current step
      stepBuffer.push(line.trim().replace(/^-\s*/, "— "));
    } else if (inSteps && line.trim() && !line.match(/^\d+[\.\)\:]/) && line.trimStart() === line) {
      // A non-indented, non-step line after we've seen steps → postscript
      if (stepBuffer.length > 0) {
        steps.push({
          index: stepIndex++,
          text: stepBuffer.join(" ").trim(),
        });
        stepBuffer = [];
      }
      postscript = lines.slice(i).join("\n");
      break;
    } else if (inSteps) {
      // Continuation of current step
      stepBuffer.push(line.trim());
    }
  }

  // Flush remaining buffer
  if (stepBuffer.length > 0) {
    steps.push({
      index: stepIndex++,
      text: stepBuffer.join(" ").trim(),
    });
  }

  return { preamble, steps, postscript };
}

function extractWarning(text: string): string | null {
  // Look for sentences with warning keywords
  const warningKeywords = /(must escalate|call 000|immediately contact|urgent|do not move|do not attempt|seek immediate|critical|severe|life.threatening)/i;
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const matches = sentences.filter((s) => warningKeywords.test(s));
  return matches.length > 0 ? matches.join(" ").trim() : null;
}
