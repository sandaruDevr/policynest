"use client";

import * as React from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";

type Mode = "feedback" | "safe-voice";

const FEEDBACK_CATEGORIES = [
  "Bug report",
  "Feature request",
  "Content suggestion",
  "General feedback",
  "Other",
];

const SAFE_VOICE_CATEGORIES = [
  { id: "near-miss", label: "Near miss" },
  { id: "improvement", label: "Improvement" },
  { id: "psychosocial", label: "Psychosocial" },
  { id: "facility", label: "Facility" },
  { id: "other", label: "Other" },
] as const;

export default function FeedbackPage() {
  const [mode, setMode] = React.useState<Mode>("feedback");
  const [category, setCategory] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [anonymous, setAnonymous] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !message) return;

    setIsSubmitting(true);
    try {
      if (mode === "feedback") {
        const res = await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category, message, anonymous }),
        });
        if (!res.ok) throw new Error("Failed to submit");
      } else {
        const res = await fetch("/api/safe-voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: category as "near-miss" | "improvement" | "psychosocial" | "facility" | "other",
            message,
            anonymous: true,
          }),
        });
        if (!res.ok) throw new Error("Failed to submit");
      }
      setSubmitted(true);
      setCategory("");
      setMessage("");
      setAnonymous(false);
      setTimeout(() => setSubmitted(false), 3000);
    } catch (error) {
      console.error("Submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSafeVoice = mode === "safe-voice";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Your voice"
        title="Feedback"
        description="Share your thoughts, report issues, or suggest improvements."
      />

      {/* Mode Toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => { setMode("feedback"); setCategory(""); }}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
            mode === "feedback"
              ? "border-brand-500/40 bg-brand-500/12 text-brand-200"
              : "border-hairline bg-canvas-inset/40 text-ink-muted hover:text-ink"
          }`}
        >
          General Feedback
        </button>
        <button
          type="button"
          onClick={() => { setMode("safe-voice"); setCategory(""); setAnonymous(true); }}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
            mode === "safe-voice"
              ? "border-accent-500/40 bg-accent-500/12 text-accent-300"
              : "border-hairline bg-canvas-inset/40 text-ink-muted hover:text-ink"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          Safe Voice
          <Badge tone="accent" size="sm">Anonymous by default</Badge>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="surface-card p-6 sm:p-8">
        <div className="space-y-6">
          {submitted && (
            <div className="rounded-xl border border-success-500/30 bg-success-500/10 p-4 text-sm text-success-300">
              {isSafeVoice
                ? "Safe Voice submission received. Thank you for speaking up."
                : "Feedback submitted. Thank you!"}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-ink">
              {isSafeVoice ? "Concern category" : "Category"}
            </label>
            <div className="flex flex-wrap gap-2">
              {isSafeVoice
                ? SAFE_VOICE_CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategory(c.id)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        category === c.id
                          ? "border-accent-500/40 bg-accent-500/12 text-accent-300"
                          : "border-hairline bg-canvas-inset/40 text-ink-muted hover:text-ink"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))
                : FEEDBACK_CATEGORIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        category === c
                          ? "border-brand-500/40 bg-brand-500/12 text-brand-200"
                          : "border-hairline bg-canvas-inset/40 text-ink-muted hover:text-ink"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-ink">Message</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                isSafeVoice
                  ? "Describe your concern or suggestion..."
                  : "Describe your feedback in detail..."
              }
              rows={6}
              required
            />
          </div>

          {/* Anonymous Toggle (only for general feedback) */}
          {!isSafeVoice && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="anonymous"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
                className="h-4 w-4 rounded border-hairline bg-canvas-inset text-brand-500 focus:ring-brand-500"
              />
              <label htmlFor="anonymous" className="text-sm text-ink-muted">
                Submit anonymously
              </label>
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setCategory("");
                setMessage("");
                setAnonymous(false);
              }}
              disabled={isSubmitting}
            >
              Clear
            </Button>
            <Button
              type="submit"
              variant={isSafeVoice ? "accent" : "primary"}
              disabled={isSubmitting || !category || !message}
            >
              {isSubmitting
                ? "Submitting..."
                : isSafeVoice
                ? "Submit safely"
                : "Submit feedback"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
