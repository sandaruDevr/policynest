"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Download,
  FileSignature,
  Pin,
  Share2,
  Sparkles,
  Tag,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatusPill } from "@/components/shared/status-pill";
import type { DocumentDetail, DocumentSection } from "@/types";
import { formatDate } from "@/lib/utils/format";

interface ViewerProps {
  document: DocumentDetail;
  related: { id: string; title: string }[];
  isPinned?: boolean;
  pinId?: string;
}

export function DocumentViewer({ document, related, isPinned = false, pinId }: ViewerProps) {
  const router = useRouter();
  const [activeSection, setActiveSection] = React.useState<string>(
    document.sections[0]?.anchor ?? "",
  );
  const [bookmarked, setBookmarked] = React.useState(document.bookmarked || false);
  const [pinned, setPinned] = React.useState(isPinned);
  const [currentPinId, setCurrentPinId] = React.useState(pinId);
  const [acknowledged, setAcknowledged] = React.useState(false);
  const [isAcknowledging, setIsAcknowledging] = React.useState(false);

  // Fetch initial acknowledgement status on mount
  React.useEffect(() => {
    const fetchAcknowledgementStatus = async () => {
      try {
        const res = await fetch(`/api/library/check-acknowledgement?documentId=${document.id}`);
        if (res.ok) {
          const { data } = await res.json();
          setAcknowledged(data.acknowledged);
        }
      } catch {
        // Ignore errors, default to false
      }
    };
    fetchAcknowledgementStatus();
  }, [document.id]);

  const handleBookmarkToggle = async () => {
    try {
      const res = await fetch("/api/library/bookmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: document.id }),
      });
      const { data } = await res.json();
      setBookmarked(data.bookmarked);
    } catch (error) {
      console.error("Failed to toggle bookmark:", error);
    }
  };

  const handleAcknowledge = async () => {
    setIsAcknowledging(true);
    try {
      const res = await fetch("/api/library/acknowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: document.id, version: document.version, acknowledged }),
      });
      const { data } = await res.json();
      setAcknowledged(data.acknowledged);
    } catch (error) {
      console.error("Failed to toggle acknowledgement:", error);
    } finally {
      setIsAcknowledging(false);
    }
  };

  const handleAskAboutThis = () => {
    router.push(`/app/assistant?context=document:${document.id}`);
  };

  const handlePinToQuickRef = async () => {
    if (pinned && currentPinId) {
      try {
        const res = await fetch("/api/quick-reference/unpin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: currentPinId }),
        });
        if (res.ok) {
          setPinned(false);
          setCurrentPinId(undefined);
        }
      } catch (error) {
        console.error("Failed to unpin:", error);
      }
      return;
    }

    try {
      const res = await fetch("/api/quick-reference/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "policy",
          title: document.title,
          subtitle: `${document.type.replace("-", " ")} · v${document.version}`,
          targetType: "document",
          targetId: document.id,
          targetUrl: `/app/library/${document.id}`,
        }),
      });
      if (res.ok) {
        const { data } = await res.json();
        setPinned(true);
        setCurrentPinId(data.id);
      }
    } catch (error) {
      console.error("Failed to pin to quick reference:", error);
    }
  };

  React.useEffect(() => {
    const handler: IntersectionObserverCallback = (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible?.target.id) setActiveSection(visible.target.id);
    };
    const observer = new IntersectionObserver(handler, {
      rootMargin: "-40% 0px -55% 0px",
      threshold: 0,
    });
    document.sections.forEach((s: { anchor: string }) => {
      const el = window.document.getElementById(s.anchor);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [document.sections]);

  return (
    <div className="space-y-6">
      <TopBar document={document} bookmarked={bookmarked} onBookmarkToggle={handleBookmarkToggle} onAskAboutThis={handleAskAboutThis} pinned={pinned} onPinToQuickRef={handlePinToQuickRef} pinId={currentPinId} />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr,16rem]">
        <article className="surface-card p-6 sm:p-8">
          <Hero document={document} />
          <Separator className="my-6" />
          <div className="space-y-10">
            {document.sections.map((section: { id: string; anchor: string; title: string; body: string }) => (
              <SectionBlock key={section.anchor} section={section} />
            ))}
          </div>
          <Separator className="my-6" />
          {document.acknowledgementRequired ? (
            <AcknowledgeBlock document={document} acknowledged={acknowledged} onAcknowledge={handleAcknowledge} isAcknowledging={isAcknowledging} />
          ) : null}
          {related.length > 0 ? (
            <div className="mt-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-dim mb-2">
                Related documents
              </p>
              <ul className="flex flex-wrap gap-2">
                {related.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/app/library/${r.id}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-canvas-inset/40 px-3 py-1.5 text-xs text-ink-muted transition-colors hover:border-brand-500/30 hover:text-ink"
                    >
                      {r.title}
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </article>

        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <div className="surface-card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-dim mb-3">
                On this page
              </p>
              <ul className="space-y-1">
                {document.sections.map((s: { anchor: string; title: string }) => (
                  <li key={s.anchor}>
                    <a
                      href={`#${s.anchor}`}
                      className={`block truncate rounded-lg px-2 py-1.5 text-sm transition-colors ${
                        activeSection === s.anchor
                          ? "bg-brand-500/12 text-brand-200"
                          : "text-ink-muted hover:bg-white/5 hover:text-ink"
                      }`}
                    >
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="surface-card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-dim mb-3">
                Metadata
              </p>
              <dl className="space-y-2 text-xs">
                <Meta label="Version" value={document.version} />
                <Meta label="Effective" value={formatDate(document.effectiveAt)} />
                <Meta label="Updated" value={formatDate(document.updatedAt)} />
              </dl>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {document.tags.slice(0, 6).map((t: string) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-full border border-hairline bg-canvas-inset/40 px-2 py-0.5 text-[10px] text-ink-muted"
                  >
                    <Tag className="h-2.5 w-2.5" />
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-ink-dim">{label}</dt>
      <dd className="text-right text-ink">{value}</dd>
    </div>
  );
}

function TopBar({ document, bookmarked, onBookmarkToggle, onAskAboutThis, pinned, onPinToQuickRef, pinId }: { document: DocumentDetail; bookmarked: boolean; onBookmarkToggle: () => void; onAskAboutThis: () => void; pinned: boolean; onPinToQuickRef: () => void; pinId?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/app/library">
          <ChevronLeft className="h-3.5 w-3.5" />
          Library
        </Link>
      </Button>
      <span className="text-[11px] text-ink-dim">/</span>
      <span className="text-[11px] text-ink-muted">{document.category}</span>
      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={onAskAboutThis}>
          <Sparkles className="h-3.5 w-3.5" />
          Ask about this
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Download PDF">
          <Download className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Share">
          <Share2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Pin to quick reference" onClick={onPinToQuickRef}>
          <Pin className={`h-4 w-4 ${pinned ? "fill-brand-300 text-brand-300" : ""}`} />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Bookmark" onClick={onBookmarkToggle}>
          <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-brand-300 text-brand-300" : ""}`} />
        </Button>
      </div>
    </div>
  );
}

function Hero({ document }: { document: DocumentDetail }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="brand" size="sm">
          {document.type.replace("-", " ")} · v{document.version}
        </Badge>
        {document.status === "updated" ? (
          <StatusPill tone="brand" label="Updated" />
        ) : null}
        {document.offlineAvailable ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-500/10 px-2 py-0.5 text-[10px] text-accent-300 ring-1 ring-accent-500/30">
            <Cloud className="h-2.5 w-2.5" /> Offline
          </span>
        ) : null}
      </div>
      <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl text-balance">
        {document.title}
      </h1>
      <p className="max-w-3xl text-sm text-ink-muted">{document.summary}</p>
    </div>
  );
}

function SectionBlock({ section }: { section: DocumentSection }) {
  return (
    <section id={section.anchor} className="scroll-mt-24 space-y-3">
      <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
        {section.title}
      </h2>
      {section.body ? (
        <div className="prose prose-invert prose-sm max-w-none text-[15px] leading-relaxed text-ink-muted
          prose-headings:text-ink prose-headings:font-semibold prose-headings:font-display
          prose-h3:text-base prose-h3:mt-2 prose-h3:mb-1
          prose-strong:text-ink prose-strong:font-semibold
          prose-p:my-2 prose-p:leading-relaxed
          prose-ul:my-2 prose-ul:pl-4 prose-ul:list-disc prose-ul:space-y-0.5
          prose-ol:my-2 prose-ol:pl-4 prose-ol:space-y-0.5
          prose-li:my-0 prose-li:text-ink
          prose-a:text-brand-400 prose-a:no-underline hover:prose-a:underline
          prose-code:text-brand-300 prose-code:bg-brand-500/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
          prose-pre:bg-surface-strong prose-pre:border prose-pre:border-hairline
          prose-blockquote:border-l-2 prose-blockquote:border-accent-500/50 prose-blockquote:pl-3 prose-blockquote:italic
          prose-table:my-3 prose-table:border prose-table:border-hairline
          prose-th:border prose-th:border-hairline prose-th:bg-surface-strong prose-th:px-2 prose-th:py-1.5
          prose-td:border prose-td:border-hairline prose-td:px-2 prose-td:py-1.5
          prose-hr:border-hairline prose-hr:my-4
          break-words">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {section.body}
          </ReactMarkdown>
        </div>
      ) : null}
    </section>
  );
}

function AcknowledgeBlock({ document, acknowledged, onAcknowledge, isAcknowledging }: { document: DocumentDetail; acknowledged: boolean; onAcknowledge: () => void; isAcknowledging: boolean }) {
  return (
    <div className={`flex flex-col gap-3 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between ${
      acknowledged
        ? "border-success-500/30 bg-success-500/8"
        : "border-warn-500/30 bg-warn-500/8"
    }`}>
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 place-items-center rounded-xl ring-1 ${
          acknowledged
            ? "bg-success-500/15 ring-success-500/30 text-success-300"
            : "bg-warn-500/15 ring-warn-500/30 text-warn-300"
        }`}>
          <FileSignature className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-medium text-ink">
            {acknowledged ? "Acknowledged" : "Acknowledgement required"}
          </p>
          <p className="text-xs text-ink-muted">
            {acknowledged
              ? "You have acknowledged this document."
              : "Confirm you've read and understood the latest version."}
          </p>
        </div>
      </div>
      <Button
        variant={acknowledged ? "ghost" : "accent"}
        size="sm"
        onClick={onAcknowledge}
        disabled={isAcknowledging}
      >
        {isAcknowledging ? "Updating..." : acknowledged ? "Unacknowledge" : "I acknowledge"}
      </Button>
    </div>
  );
}
