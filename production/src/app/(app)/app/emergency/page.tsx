import { EmergencyApi } from "@/lib/api-contracts";
import { ProtocolCard } from "@/components/emergency/protocol-card";
import { EmergencyContacts } from "@/components/emergency/contacts";
import { DrillSchedule } from "@/components/emergency/drill-schedule";
import { PageHeader } from "@/components/shared/page-header";

export const metadata = { title: "Emergency · Policy Nest" };

export default async function EmergencyPage() {
  const [{ data: protocols }, { data: contacts }, { data: drills }] =
    await Promise.all([
      EmergencyApi.protocols(),
      EmergencyApi.contacts(),
      EmergencyApi.drills(),
    ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Always-on"
        title="Emergency protocols & drills"
        description="Immediate access to critical procedures, contacts, and drill schedules."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <section aria-label="Protocols">
            <h2 className="font-display text-base font-semibold tracking-tight text-ink mb-3">
              Protocols
            </h2>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {protocols.map((p) => (
                <li key={p.category} className="h-full">
                  <ProtocolCard protocol={p} />
                </li>
              ))}
            </ul>
          </section>

          <section aria-label="Drills">
            <DrillSchedule drills={drills} />
          </section>
        </div>

        <div className="lg:col-span-1">
          <EmergencyContacts contacts={contacts} />
        </div>
      </div>
    </div>
  );
}
