"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import {
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Trash2,
  WandSparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Composer } from "@/components/assistant/composer";
import { ResponseCard } from "@/components/assistant/response-card";
import { ConfidenceTag } from "@/components/assistant/response-blocks";
import { SavedResponses } from "@/components/assistant/saved-responses";
import { SavedResponseModal } from "@/components/assistant/saved-response-modal";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/shared/skeleton";
import type {
  AssistantNextAction,
  ConversationTurn,
  DocumentSummary,
  GuidanceQuery,
  QuickReferenceItem,
  SuggestedPrompt,
} from "@/types";

interface WorkspaceProps {
  prompts: SuggestedPrompt[];
  initialHistory: ConversationTurn[];
  documents: DocumentSummary[];
  savedItems: QuickReferenceItem[];
}

export function AssistantWorkspace({
  prompts,
  initialHistory,
  documents,
  savedItems,
}: WorkspaceProps) {
  const params = useSearchParams();
  const router = useRouter();
  const queryParam = params.get("q") ?? "";
  const tabParam = params.get("tab") ?? "";
  const highlightId = params.get("id") ?? undefined;

  const [turns, setTurns] = React.useState<ConversationTurn[]>(initialHistory);
  const [explainNew, setExplainNew] = React.useState(false);
  const [selectedSavedItem, setSelectedSavedItem] = React.useState<QuickReferenceItem | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const documentTitleById = React.useMemo(
    () => Object.fromEntries(documents.map((d) => [d.id, d.shortTitle ?? d.title])),
    [documents],
  );

  // Restore conversation from localStorage on mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("caresuite:assistant-conversation");
      if (saved) {
        const parsed = JSON.parse(saved) as ConversationTurn[];
        if (parsed.length > 0 && initialHistory.length === 0) {
          setTurns(parsed);
        }
      }
    } catch {
      // ignore corrupt storage
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist conversation to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem("caresuite:assistant-conversation", JSON.stringify(turns));
    } catch {
      // ignore storage errors
    }
  }, [turns]);

  // Deep-link to saved item from URL
  React.useEffect(() => {
    if (tabParam === "saved" && highlightId) {
      const item = savedItems.find((i) => i.id === highlightId);
      if (item) {
        setSelectedSavedItem(item);
      }
    }
  }, [tabParam, highlightId, savedItems]);

  const handleSelectSavedItem = (item: QuickReferenceItem) => {
    setSelectedSavedItem(item);
  };

  const handleUnpinSavedItem = async (id: string) => {
    try {
      const res = await fetch("/api/quick-reference/unpin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        // Refresh the page to re-fetch saved items
        router.refresh();
      }
    } catch {
      // ignore
    }
  };

  // Auto-scroll to bottom on new turns
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [turns.length]);

  const submitQuery = React.useCallback(
    async (text: string, options?: { voice?: boolean; retryId?: string }) => {
      const id = options?.retryId || `q_${Date.now()}`;
      const q: GuidanceQuery = {
        id,
        text,
        locale: "en-AU",
        mode: explainNew ? "explain-like-im-new" : "standard",
        voice: !!options?.voice,
        createdAt: new Date().toISOString(),
      };

      if (options?.retryId) {
        setTurns((prev) =>
          prev.map((t) => (t.query.id === id ? { ...t, state: "loading" } : t)),
        );
      } else {
        setTurns((prev) => [...prev, { query: q, state: "loading" }]);
      }

      // Build conversation history from previous complete turns for multi-turn RAG
      const conversationHistory = turns
        .filter((t) => t.state === "complete" && t.response)
        .map((t) => ({
          query: t.query.text,
          answer: t.response?.blocks?.find((b) => b.kind === "summary")?.text || "",
        }));

      try {
        const res = await fetch("/api/rag/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            mode: explainNew ? "explain-like-im-new" : "standard",
            voice: !!options?.voice,
            conversationHistory: conversationHistory.length > 0 ? conversationHistory : undefined,
          }),
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const { data } = await res.json();
        setTurns((prev) =>
          prev.map((t) =>
            t.query.id === id
              ? { ...t, state: "complete", response: data }
              : t,
          ),
        );
      } catch (error) {
        console.error("Failed to submit query:", error);
        setTurns((prev) =>
          prev.map((t) =>
            t.query.id === id
              ? { ...t, state: "error" }
              : t,
          ),
        );
      }
    },
    [explainNew],
  );

  const retryTurn = React.useCallback(
    (turn: ConversationTurn) => {
      submitQuery(turn.query.text, { retryId: turn.query.id });
    },
    [submitQuery],
  );

  const resetConversation = () => {
    setTurns([]);
    localStorage.removeItem("caresuite:assistant-conversation");
  };

  // Honor ?q= prefill (route from Home or palette)
  React.useEffect(() => {
    if (queryParam) {
      submitQuery(queryParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onAction = (a: AssistantNextAction) => {
    if (a.kind === "ask-followup") {
      submitQuery(a.prompt);
    } else if (a.kind === "open-document") {
      const anchor = a.sectionAnchor ? `#${a.sectionAnchor}` : "";
      router.push(`/app/library/${a.documentId}${anchor}`);
    } else if (a.kind === "start-incident") {
      router.push("/app/incidents/new");
    } else if (a.kind === "rephrase") {
      const lastTurn = turns[turns.length - 1];
      if (lastTurn?.query) {
        submitQuery(lastTurn.query.text + " (please rephrase this)");
      }
    } else if (a.kind === "pin-quick-ref") {
      const lastTurn = turns[turns.length - 1];
      const queryText = lastTurn?.query?.text || "";
      const response = lastTurn?.response;
      const title = queryText.slice(0, 120) || "AI answer";
      fetch("/api/quick-reference/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "ai-answer",
          title,
          subtitle: "Saved from Assistant",
          content: response
            ? { query: queryText, response }
            : undefined,
        }),
      }).catch(() => {});
    } else if (a.kind === "share-internal") {
      // TODO: Implement share internal
      console.log("Share internal not yet implemented");
    }
  };

  const defaultTab = tabParam === "saved" ? "saved" : "conversation";

  return (
    <>
      <Tabs defaultValue={defaultTab}>
        <div className="sticky top-16 z-20 -mx-4 bg-canvas/95 backdrop-blur-md px-4 pb-3 pt-1.5 sm:-mx-6 sm:px-6">
          <Header
            explainNew={explainNew}
            setExplainNew={setExplainNew}
            onReset={resetConversation}
            hasTurns={turns.length > 0}
          />
          <TabsList className="mt-2">
            <TabsTrigger value="conversation">Conversation</TabsTrigger>
            <TabsTrigger value="saved">
              Saved {savedItems.length > 0 ? `(${savedItems.length})` : ""}
            </TabsTrigger>
            <TabsTrigger value="suggested">Suggested intents</TabsTrigger>
          </TabsList>
        </div>

        <div className="pt-4">
          <TabsContent value="conversation" className="space-y-4">
            {turns.length === 0 ? (
              <EmptyHero onPrompt={(t) => submitQuery(t)} prompts={prompts} />
            ) : (
              <ul className="space-y-4">
                {turns.map((t) => (
                  <li key={t.query.id} className="space-y-2.5">
                    <UserBubble text={t.query.text} mode={t.query.mode} />
                    {t.state === "loading" ? (
                      <ResponseSkeleton />
                    ) : t.state === "error" ? (
                      <ErrorState turn={t} onRetry={retryTurn} />
                    ) : t.response ? (
                      <ResponseCard
                        response={t.response}
                        documentTitleById={documentTitleById}
                        onAction={onAction}
                      />
                    ) : null}
                  </li>
                ))}
                <div ref={scrollRef} aria-hidden />
              </ul>
            )}

            <div className="sticky bottom-2 lg:bottom-4 z-10">
              <Composer onSubmit={submitQuery} disabled={turns.some((t) => t.state === "loading")} />
            </div>
          </TabsContent>

          <TabsContent value="saved">
            <SavedResponses
              savedItems={savedItems}
              onSelectItem={handleSelectSavedItem}
              onUnpin={handleUnpinSavedItem}
            />
          </TabsContent>

          <TabsContent value="suggested">
            <SuggestedGrid prompts={prompts} onPick={(t) => submitQuery(t)} />
          </TabsContent>
        </div>
      </Tabs>

      <SavedResponseModal
        item={selectedSavedItem}
        documentTitleById={documentTitleById}
        onClose={() => setSelectedSavedItem(null)}
      />
    </>
  );
}

function Header({
  explainNew,
  setExplainNew,
  onReset,
  hasTurns,
}: {
  explainNew: boolean;
  setExplainNew: (v: boolean) => void;
  onReset: () => void;
  hasTurns: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-glow">
          <Sparkles className="h-4 w-4 text-white" />
        </span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-300/80">
            Operational assistant
          </p>
          <h1 className="font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            Get role-aware guidance, with sources.
          </h1>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-hairline bg-canvas-inset/50 px-3 py-1.5 text-xs">
          <WandSparkles className="h-3.5 w-3.5 text-brand-300" />
          <span className="text-ink-muted">Explain like I'm new</span>
          <Switch checked={explainNew} onCheckedChange={setExplainNew} />
        </span>
        {hasTurns ? (
          <Button variant="ghost" size="sm" onClick={onReset} aria-label="Clear conversation">
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </Button>
        ) : null}
        <Button variant="ghost" size="sm" asChild>
          <a href="/app/emergency">
            <ShieldAlert className="h-3.5 w-3.5" />
            Escalate
          </a>
        </Button>
      </div>
    </div>
  );
}

function UserBubble({ text, mode }: { text: string; mode: GuidanceQuery["mode"] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex justify-end"
    >
      <div className="max-w-[42rem] rounded-2xl border border-hairline-strong bg-surface-strong px-4 py-2 shadow-elev1">
        <div className="flex items-center gap-2 pb-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-dim">
            You
          </span>
          {mode === "explain-like-im-new" ? (
            <span className="rounded-full bg-brand-500/12 px-2 py-0.5 text-[10px] text-brand-200 ring-1 ring-brand-500/30">
              Explain mode
            </span>
          ) : null}
        </div>
        <p className="text-sm text-ink">{text}</p>
      </div>
    </motion.div>
  );
}

function ResponseSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="surface-card overflow-hidden"
    >
      <div className="flex items-center gap-3 border-b border-hairline px-5 py-3">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-500/15 ring-1 ring-brand-500/30">
          <Sparkles className="h-3.5 w-3.5 text-brand-300 animate-pulse" />
        </span>
        <span className="text-sm font-medium text-ink">Assistant</span>
        <ConfidenceTag level="medium" />
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="h-2 w-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="h-2 w-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: "300ms" }} />
          <span className="ml-2 text-xs text-ink-muted">Thinking…</span>
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-3/4" />
        <div className="space-y-2 pt-1.5">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-2/3 rounded-xl" />
        </div>
      </div>
    </motion.div>
  );
}

function ErrorState({ turn, onRetry }: { turn: ConversationTurn; onRetry: (t: ConversationTurn) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="surface-card overflow-hidden"
    >
      <div className="flex items-center gap-3 border-b border-hairline px-5 py-3">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-critical-500/15 ring-1 ring-critical-500/30">
          <ShieldAlert className="h-3.5 w-3.5 text-critical-300" />
        </span>
        <span className="text-sm font-medium text-ink">Assistant</span>
      </div>
      <div className="space-y-3 p-4 sm:p-5">
        <p className="text-sm text-ink-muted">
          Something went wrong while fetching the response. You can retry or try rephrasing your question.
        </p>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => onRetry(turn)}>
            <RotateCcw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function EmptyHero({
  prompts,
  onPrompt,
}: {
  prompts: SuggestedPrompt[];
  onPrompt: (t: string) => void;
}) {
  return (
    <div className="surface-card relative overflow-hidden p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-radial-brand"
      />
      <div className="relative max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-300/80">
          Ready when you are
        </p>
        <h2 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink">
          Ask any operational question. Get sourced steps, not opinions.
        </h2>
        <p className="mt-1.5 max-w-xl text-sm text-ink-muted">
          Answers cite published policies for your role and sector. Use voice or text.
        </p>
      </div>

      <div className="relative mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {prompts.slice(0, 4).map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPrompt(p.label)}
            className="group flex items-center gap-3 rounded-xl border border-hairline bg-canvas-inset/40 px-4 py-3 text-left transition-colors hover:border-brand-500/30 hover:bg-brand-500/8"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500/12 ring-1 ring-brand-500/30 text-brand-200">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <span className="text-sm text-ink">{p.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SuggestedGrid({
  prompts,
  onPick,
}: {
  prompts: SuggestedPrompt[];
  onPick: (t: string) => void;
}) {
  if (prompts.length === 0) {
    return <EmptyState title="No suggestions yet" description="Suggested intents tailored to your role will appear here." />;
  }
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {prompts.map((p) => (
        <li key={p.id}>
          <button
            type="button"
            onClick={() => onPick(p.label)}
            className="group flex h-full w-full items-start gap-3 rounded-2xl border border-hairline bg-canvas-raised/60 p-4 text-left transition-all hover:border-brand-500/30 hover:bg-brand-500/8"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500/12 ring-1 ring-brand-500/30 text-brand-200">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="text-sm text-ink">{p.label}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
