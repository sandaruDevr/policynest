/**
 * Generates a clean, professional Word document (PROJECT_STATUS_UPDATE.docx)
 * for the Nestor AI project status update.
 *
 * Run: node scripts/generate-status-doc.js
 */
const fs = require("fs");
const path = require("path");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
} = require("docx");

// ---- Brand palette ----------------------------------------------------
const NAVY = "1F3A5F";
const BLUE = "2563EB";
const SLATE = "475569";
const INK = "1E293B";
const GREEN = "15803D";
const LIGHT = "F1F5F9";
const HEADER_FILL = "1F3A5F";
const WHITE = "FFFFFF";

const FONT = "Calibri";

// ---- Helpers ----------------------------------------------------------
function heading1(text) {
  return new Paragraph({
    spacing: { before: 320, after: 140 },
    border: { bottom: { color: BLUE, space: 4, style: BorderStyle.SINGLE, size: 12 } },
    children: [
      new TextRun({ text, bold: true, size: 30, color: NAVY, font: FONT }),
    ],
  });
}

function heading2(text) {
  return new Paragraph({
    spacing: { before: 220, after: 100 },
    children: [
      new TextRun({ text, bold: true, size: 24, color: BLUE, font: FONT }),
    ],
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120, line: 276 },
    alignment: opts.align || AlignmentType.LEFT,
    children: parseInline(text, opts),
  });
}

// Parse **bold** segments inside a string into TextRuns.
function parseInline(text, opts = {}) {
  const runs = [];
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  for (const part of parts) {
    if (!part) continue;
    const isBold = part.startsWith("**") && part.endsWith("**");
    runs.push(
      new TextRun({
        text: isBold ? part.slice(2, -2) : part,
        bold: isBold || opts.bold || false,
        size: opts.size || 22,
        color: opts.color || INK,
        font: FONT,
      }),
    );
  }
  return runs;
}

function bullet(text) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 80, line: 270 },
    children: parseInline(text),
  });
}

function cell(text, { bold = false, color = INK, fill, align = AlignmentType.LEFT, size = 20 } = {}) {
  return new TableCell({
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    shading: fill ? { type: ShadingType.CLEAR, fill, color: "auto" } : undefined,
    children: [
      new Paragraph({
        alignment: align,
        children: [new TextRun({ text, bold, color, size, font: FONT })],
      }),
    ],
  });
}

function buildTable(headers, rows, colWidths) {
  const noBorder = { style: BorderStyle.SINGLE, size: 2, color: "D1D5DB" };
  const borders = {
    top: noBorder, bottom: noBorder, left: noBorder, right: noBorder,
    insideHorizontal: noBorder, insideVertical: noBorder,
  };
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) =>
      cell(h, { bold: true, color: WHITE, fill: HEADER_FILL, align: i === 0 ? AlignmentType.LEFT : AlignmentType.LEFT, size: 20 }),
    ),
  });
  const dataRows = rows.map((r, ri) =>
    new TableRow({
      children: r.map((c, ci) => {
        const isStatus = typeof c === "string" && /Complete|Operational|Production|Hardened/i.test(c) && c.includes("✅");
        return cell(typeof c === "string" ? c : String(c), {
          fill: ri % 2 === 1 ? LIGHT : undefined,
          color: isStatus ? GREEN : INK,
          bold: isStatus,
        });
      }),
    }),
  );
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: colWidths,
    borders,
    rows: [headerRow, ...dataRows],
  });
}

function spacer(after = 120) {
  return new Paragraph({ spacing: { after }, children: [] });
}

function divider() {
  return new Paragraph({
    spacing: { before: 160, after: 160 },
    border: { bottom: { color: "CBD5E1", space: 2, style: BorderStyle.SINGLE, size: 6 } },
    children: [],
  });
}

// ---- Document content -------------------------------------------------
const children = [];

// Title block
children.push(
  new Paragraph({
    spacing: { after: 40 },
    children: [new TextRun({ text: "Nestor AI", bold: true, size: 52, color: NAVY, font: FONT })],
  }),
  new Paragraph({
    spacing: { after: 200 },
    children: [new TextRun({ text: "Project Status Update", size: 32, color: BLUE, font: FONT })],
  }),
);

// Meta table (borderless)
const metaBorders = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const metaTable = new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  borders: {
    top: metaBorders, bottom: metaBorders, left: metaBorders, right: metaBorders,
    insideHorizontal: metaBorders, insideVertical: metaBorders,
  },
  rows: [
    ["Prepared for:", "Project Owner"],
    ["Prepared by:", "Development Team"],
    ["Date:", "26 June 2026"],
    ["Status:", "On Track — Core Platform Operational"],
  ].map(([k, v]) =>
    new TableRow({
      children: [
        new TableCell({
          width: { size: 22, type: WidthType.PERCENTAGE },
          margins: { top: 20, bottom: 20, left: 0, right: 80 },
          children: [new Paragraph({ children: [new TextRun({ text: k, bold: true, color: SLATE, size: 20, font: FONT })] })],
        }),
        new TableCell({
          margins: { top: 20, bottom: 20, left: 0, right: 0 },
          children: [new Paragraph({ children: [new TextRun({ text: v, color: INK, size: 20, font: FONT })] })],
        }),
      ],
    }),
  ),
});
children.push(metaTable, divider());

// Executive Summary
children.push(
  heading1("Executive Summary"),
  body("Nestor AI is a **multi-tenant, AI-powered compliance and policy intelligence platform** for regulated care providers (Aged Care, NDIS, Healthcare). The platform is built on a secure, enterprise-grade architecture with strict data isolation between client organisations."),
  body("We are pleased to report that all three core layers of the platform — the **Staff Experience**, the **Organisation Admin Console**, and the **Super Admin Platform** — are now operational, with a hardened backend and a fully versioned database."),
  body("The system is production-ready at its core, with ongoing work focused on expanding advanced governance, analytics, and commercial features."),
);

// Architecture
children.push(
  heading1("Platform Architecture"),
  buildTable(
    ["Layer", "Technology", "Purpose"],
    [
      ["Frontend", "Next.js 14, TypeScript, Tailwind CSS", "Fast, modern, responsive web application"],
      ["Backend", "Node.js / Express", "Secure AI orchestration & document processing"],
      ["Database", "Supabase (PostgreSQL + pgvector)", "Tenant-isolated data with vector search"],
      ["AI Engine", "OpenAI (GPT + Embeddings)", "Policy intelligence & semantic retrieval"],
      ["Security", "Row-Level Security (RLS)", "Database-enforced tenant isolation"],
    ],
    [2200, 3800, 4000],
  ),
  spacer(140),
  body("**Key Strength:** Every client organisation's data is cryptographically and structurally isolated at the database level. No tenant can ever access another tenant's documents, users, or activity."),
);

// Section 1 — Staff
children.push(
  heading1("1. Staff Experience — Complete"),
  body("The day-to-day interface used by frontline care staff. Eleven feature areas are live:"),
  bullet("**AI Assistant** — Ask policy questions, receive cited, step-by-step answers grounded only in approved documents."),
  bullet("**Policy Library** — Browse and read approved organisational policies and procedures."),
  bullet("**Incident Reporting** — Structured incident capture with AI-assisted guidance."),
  bullet("**Quick Reference** — Fast access to critical procedures."),
  bullet("**Emergency Guidance** — Rapid-access emergency protocols."),
  bullet("**Training** — Assigned training modules and progress tracking."),
  bullet("**Compliance** — Personal compliance tasks and acknowledgements."),
  bullet("**Feedback** — Staff feedback channel."),
  bullet("**History** — Personal query and activity history."),
  bullet("**Profile & Home** — Personalised dashboard and account management."),
  spacer(60),
  body("**Safeguards:** The AI will only answer from approved, published content. Low-confidence or high-risk answers are automatically escalated for human review rather than guessed."),
);

// Section 2 — Org Admin
children.push(
  heading1("2. Organisation Admin Console — Core Complete"),
  body("The control centre for each client organisation's administrators and compliance managers."),
  heading2("Operational today:"),
  bullet("**Dashboard** — Organisation-wide health and activity overview."),
  bullet("**Document Management** — Upload, structure, version, approve, and publish policies. Documents are automatically processed into AI-searchable knowledge."),
  bullet("**AI Governance** — Configure the AI assistant's behaviour: confidence thresholds, escalation rules, custom guidance, and Golden Answers (pre-approved responses to common questions)."),
  bullet("**HITL Review** — Human-in-the-loop queue for reviewing and correcting AI answers."),
  bullet("**User & Site Management** — Manage staff accounts, roles, and physical sites."),
  bullet("**Training Management** — Create and assign training."),
  bullet("**Reports & Analytics** — Usage and compliance reporting."),
  bullet("**Audit Trail** — Complete record of all administrative actions."),
  spacer(60),
  body("**Backend Hardening Complete:** The AI processing server has been secured with industry-standard protections (rate limiting, security headers, request validation, structured logging, and authenticated internal communication)."),
);

// Section 3 — Super Admin
children.push(
  heading1("3. Super Admin Platform — Phases 1–5 Complete"),
  body("The platform-level command centre that lets us (the platform operator) manage all client organisations from a single secure console. This is the foundation for operating Nestor AI as a commercial SaaS product."),
  heading2("Delivered:"),
  buildTable(
    ["Phase", "Capability", "Status"],
    [
      ["1", "Platform Foundation — cross-tenant visibility, secure admin layer, audit logging", "✅ Complete"],
      ["2", "Tenant Management — provision, activate, suspend organisations; plans & feature flags; usage monitoring", "✅ Complete"],
      ["3", "Master Document Governance — platform-owned master templates with versioning and one-click propagation", "✅ Complete"],
      ["4", "AI Governance — central model registry, versioned prompt management, evaluation framework", "✅ Complete"],
      ["5", "HITL Governance Center — cross-tenant review queues with SLA monitoring and breach alerts", "✅ Complete"],
    ],
    [900, 7100, 2000],
  ),
  spacer(140),
  body("**Business Value:** We can now onboard a new client organisation in a single automated step, push standardised compliance templates across the entire customer base, and monitor AI quality and review timeliness across every tenant from one screen."),
);

// Section 4 — Database
children.push(
  heading1("4. Database & Infrastructure — Robust & Versioned"),
  bullet("**15 structured migration phases** covering the complete schema evolution from foundation to platform governance."),
  bullet("**Vector search** optimised with HNSW indexing for fast, accurate policy retrieval."),
  bullet("**Full audit logging** at both organisation and platform levels."),
  bullet("**Idempotent migrations** — safe, repeatable database deployments."),
);

// Roadmap
children.push(
  heading1("Roadmap — Next Phases"),
  body("The platform foundation is complete. Upcoming work expands the commercial and intelligence capabilities:"),
  bullet("**Phase 6** — Golden Answer System (platform-level curated answers with framework linking)"),
  bullet("**Phase 7** — Legislative Intelligence (regulatory change monitoring & impact analysis)"),
  bullet("**Phase 8** — Platform Analytics (executive metrics, growth & revenue insights)"),
  bullet("**Phase 9** — Billing & Commercial (subscriptions, entitlements)"),
  bullet("**Phases 10–14** — Marketplace, Operations Center, Security consolidation, and final production hardening."),
);

// Summary
children.push(
  heading1("Summary"),
  buildTable(
    ["Area", "Status"],
    [
      ["Staff Experience", "✅ Operational"],
      ["Organisation Admin", "✅ Core Operational"],
      ["Super Admin Platform", "✅ Phases 1–5 Operational"],
      ["Database & Security", "✅ Production-Grade"],
      ["Backend AI Server", "✅ Hardened"],
    ],
    [6000, 4000],
  ),
  spacer(140),
  body("**The core platform is functional, secure, and ready to support live client organisations.** Development continues on schedule toward the full commercial feature set."),
  divider(),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 80 },
    children: [
      new TextRun({
        text: "For technical questions or a live demonstration, please contact the development team.",
        italics: true,
        color: SLATE,
        size: 18,
        font: FONT,
      }),
    ],
  }),
);

// ---- Build & write ----------------------------------------------------
const doc = new Document({
  creator: "Development Team",
  title: "Nestor AI — Project Status Update",
  description: "Client status report",
  styles: {
    default: {
      document: { run: { font: FONT, size: 22, color: INK } },
    },
  },
  sections: [
    {
      properties: {
        page: { margin: { top: 1100, bottom: 1100, left: 1100, right: 1100 } },
      },
      children,
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  const out = path.join(__dirname, "..", "PROJECT_STATUS_UPDATE.docx");
  fs.writeFileSync(out, buffer);
  console.log("Word document written to:", out);
});
