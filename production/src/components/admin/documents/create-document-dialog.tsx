"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Upload, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";

const DOC_TYPES = ["policy", "procedure", "guideline", "form", "fact-sheet"];
const RISK_LEVELS = ["low", "medium", "high"];

export function CreateDocumentDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"upload" | "paste">("upload");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [dragOver, setDragOver] = React.useState(false);

  const [form, setForm] = React.useState({
    title: "",
    documentType: "policy",
    category: "",
    sector: "",
    riskLevel: "medium",
    framework: "",
    tags: "",
    content: "",
    acknowledgementRequired: false,
  });

  const set = (key: keyof typeof form, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (f) {
      setFile(f);
      if (!form.title) {
        const name = f.name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " ");
        set("title", name);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0] || null;
    if (f) {
      setFile(f);
      if (!form.title) {
        const name = f.name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " ");
        set("title", name);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      let docId: string;

      if (mode === "upload" && file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", form.title);
        formData.append("documentType", form.documentType);
        formData.append("category", form.category);
        formData.append("sector", form.sector);
        formData.append("riskLevel", form.riskLevel);
        formData.append("framework", form.framework);
        formData.append("tags", form.tags);
        formData.append("acknowledgementRequired", String(form.acknowledgementRequired));

        const res = await fetch("/api/admin/documents/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Upload failed");
        }
        const { data } = await res.json();
        docId = data.id;
      } else {
        const res = await fetch("/api/admin/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.title,
            documentType: form.documentType,
            category: form.category || undefined,
            sector: form.sector || undefined,
            riskLevel: form.riskLevel,
            framework: form.framework
              ? form.framework.split(",").map((s) => s.trim()).filter(Boolean)
              : [],
            tags: form.tags
              ? form.tags.split(",").map((s) => s.trim()).filter(Boolean)
              : [],
            content: form.content || undefined,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to create document");
        }
        const { data } = await res.json();
        docId = data.id;
      }

      setOpen(false);
      router.push(`/admin/documents/${docId}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="primary" size="md">
          <Plus className="h-4 w-4" />
          New document
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create document</DialogTitle>
          <DialogDescription>
            Upload a file or paste content. AI will structure, summarise, and
            auto-ingest sections and retrieval chunks.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <div className="mt-3 rounded-xl border border-critical-500/30 bg-critical-500/8 px-3 py-2 text-sm text-critical-400">
            {error}
          </div>
        ) : null}

        {/* Mode toggle */}
        <div className="mt-2 flex rounded-xl border border-hairline bg-surface p-1">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              mode === "upload"
                ? "bg-brand-500/12 text-brand-300"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            <Upload className="h-4 w-4" /> Upload file
          </button>
          <button
            type="button"
            onClick={() => setMode("paste")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              mode === "paste"
                ? "bg-brand-500/12 text-brand-300"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            <FileText className="h-4 w-4" /> Paste text
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Title" required>
            <Input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Falls Prevention Policy"
              required
            />
          </Field>

          {mode === "upload" ? (
            <Field label="Document file">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
                  dragOver
                    ? "border-brand-400 bg-brand-500/5"
                    : "border-hairline bg-surface"
                }`}
              >
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.txt,.md"
                  onChange={handleFileChange}
                  className="hidden"
                  id="doc-upload"
                />
                <label
                  htmlFor="doc-upload"
                  className="cursor-pointer text-sm text-ink-muted hover:text-ink"
                >
                  {file ? (
                    <span className="font-medium text-ink">{file.name}</span>
                  ) : (
                    <>
                      <Upload className="mx-auto mb-2 h-6 w-6 text-ink-dim" />
                      <span>Drag &amp; drop or click to upload</span>
                      <span className="block text-xs text-ink-dim">
                        PDF, DOCX, TXT, MD (max 25 MB)
                      </span>
                    </>
                  )}
                </label>
              </div>
            </Field>
          ) : (
            <Field label="Content (markdown)" required>
              <Textarea
                value={form.content}
                onChange={(e) => set("content", e.target.value)}
                placeholder="Paste your policy text here. AI will structure it into clean markdown with proper headings and sections."
                rows={10}
                required
              />
            </Field>
          )}

          <details className="group">
            <summary className="cursor-pointer text-xs font-medium text-ink-muted hover:text-ink">
              Advanced options
            </summary>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Type">
                <Select
                  value={form.documentType}
                  onChange={(v) => set("documentType", v)}
                  options={DOC_TYPES}
                />
              </Field>
              <Field label="Risk level">
                <Select
                  value={form.riskLevel}
                  onChange={(v) => set("riskLevel", v)}
                  options={RISK_LEVELS}
                />
              </Field>
              <Field label="Category">
                <Input
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                  placeholder="e.g. Clinical Care"
                />
              </Field>
              <Field label="Sector">
                <Input
                  value={form.sector}
                  onChange={(e) => set("sector", e.target.value)}
                  placeholder="e.g. aged-care"
                />
              </Field>
              <Field label="Frameworks (comma-separated)">
                <Input
                  value={form.framework}
                  onChange={(e) => set("framework", e.target.value)}
                  placeholder="Aged Care Quality Standards, NDIS"
                />
              </Field>
              <Field label="Tags (comma-separated)">
                <Input
                  value={form.tags}
                  onChange={(e) => set("tags", e.target.value)}
                  placeholder="medication, safety"
                />
              </Field>
            </div>
            <label className="mt-3 flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={form.acknowledgementRequired}
                onChange={(e) => set("acknowledgementRequired", e.target.checked)}
                className="h-4 w-4 rounded border-hairline-strong bg-canvas-inset accent-brand-500"
              />
              <span className="text-sm text-ink">
                Require staff acknowledgement on publish
              </span>
            </label>
          </details>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={
                submitting ||
                !form.title ||
                (mode === "upload" && !file) ||
                (mode === "paste" && !form.content.trim())
              }
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Create &amp; ingest</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-ink-muted">
        {label}
        {required ? <span className="text-critical-400"> *</span> : null}
      </span>
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex h-10 w-full rounded-xl border border-hairline-strong bg-canvas-inset/60 px-3.5 text-sm text-ink capitalize focus-ring focus:border-brand-400/60"
    >
      {options.map((o) => (
        <option key={o} value={o} className="bg-canvas-raised">
          {o}
        </option>
      ))}
    </select>
  );
}
