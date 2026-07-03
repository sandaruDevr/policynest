import { ScrollText } from "lucide-react";
import { ModulePlaceholder } from "@/components/admin/module-placeholder";

export const metadata = { title: "Audit & Compliance · Policy Nest Admin" };

export default function AuditPage() {
  return (
    <ModulePlaceholder
      eyebrow="Governance"
      title="Audit & Compliance"
      description="Tamper-evident record of administrative actions and organization-wide compliance readiness."
      icon={ScrollText}
      planned={[
        "Admin action audit trail",
        "Publish & approval decisions",
        "Acknowledgement completion",
        "Compliance task priorities",
        "Audit readiness indicators",
        "Exportable evidence packs",
      ]}
    />
  );
}
