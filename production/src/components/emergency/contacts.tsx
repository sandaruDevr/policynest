import { Phone } from "lucide-react";
import type { EmergencyContact } from "@/types";

export function EmergencyContacts({ contacts }: { contacts: EmergencyContact[] }) {
  const grouped = contacts.reduce(
    (acc: Record<string, EmergencyContact[]>, c: EmergencyContact) => {
      if (!acc[c.role]) acc[c.role] = [];
      acc[c.role].push(c);
      return acc;
    },
    {} as Record<string, EmergencyContact[]>,
  );

  return (
    <div className="space-y-4">
      <h2 className="font-display text-base font-semibold tracking-tight text-ink">
        Emergency contacts
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Object.entries(grouped).map(([role, list]) => (
          <div
            key={role}
            className="rounded-2xl border border-critical-500/30 bg-critical-500/8 p-4"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-critical-300">
              {role}
            </p>
            <ul className="mt-3 space-y-2">
              {list.map((c) => (
                <li key={c.id}>
                  <ContactItem contact={c} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactItem({ contact }: { contact: EmergencyContact }) {
  return (
    <div className="flex items-start gap-3">
      <a
        href={`tel:${contact.phone}`}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-critical-500/15 ring-1 ring-critical-500/30 text-critical-300 transition-colors hover:bg-critical-500/25"
        aria-label={`Call ${contact.label}`}
      >
        <Phone className="h-3.5 w-3.5" />
      </a>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">{contact.label}</p>
        <a href={`tel:${contact.phone}`} className="text-xs text-ink-muted hover:text-ink underline-offset-2 hover:underline">
          {contact.phone}
        </a>
        <p className="mt-0.5 text-[11px] text-ink-dim">{contact.role}</p>
      </div>
    </div>
  );
}
