import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import type { EmergencyProtocol, EmergencyContact, EmergencyDrill } from "@/types";

type ProtocolRow = Database["public"]["Tables"]["emergency_protocols"]["Row"];
type ProtocolStepRow = Database["public"]["Tables"]["emergency_protocol_steps"]["Row"];
type EmergencyContactRow = Database["public"]["Tables"]["emergency_contacts"]["Row"];
type EmergencyDrillRow = Database["public"]["Tables"]["emergency_drills"]["Row"];

export async function listEmergencyProtocols(): Promise<EmergencyProtocol[]> {
  const supabase = createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .single();
  if (!profile) return [];

  const { data: protocols } = await supabase
    .from("emergency_protocols")
    .select("*")
    .eq("tenant_id", profile.tenant_id);

  const { data: steps } = await supabase
    .from("emergency_protocol_steps")
    .select("*")
    .in(
      "protocol_id",
      (protocols || []).map((p) => p.id)
    )
    .order("ord", { ascending: true });

  const { data: contacts } = await supabase
    .from("emergency_contacts")
    .select("*")
    .eq("tenant_id", profile.tenant_id);

  const stepsByProtocol = new Map<string, ProtocolStepRow[]>();
  (steps || []).forEach((s) => {
    const list = stepsByProtocol.get(s.protocol_id) || [];
    list.push(s);
    stepsByProtocol.set(s.protocol_id, list);
  });

  return (protocols || []).map((p) =>
    mapProtocol(p, stepsByProtocol.get(p.id) || [], contacts || [])
  );
}

export async function listEmergencyContacts(): Promise<EmergencyContact[]> {
  const supabase = createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .single();
  if (!profile) return [];

  const { data: rows } = await supabase
    .from("emergency_contacts")
    .select("*")
    .eq("tenant_id", profile.tenant_id)
    .order("is_primary", { ascending: false });

  return (rows || []).map(mapContact);
}

export async function listEmergencyDrills(): Promise<EmergencyDrill[]> {
  const supabase = createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .single();
  if (!profile) return [];

  const { data: rows } = await supabase
    .from("emergency_drills")
    .select("*")
    .eq("tenant_id", profile.tenant_id)
    .order("conducted_at", { ascending: false });

  return (rows || []).map((r) => ({
    id: r.id,
    title: r.title,
    conductedAt: r.conducted_at || "",
    outcome: r.outcome as EmergencyDrill["outcome"],
  }));
}

export async function getEmergencyProtocolByCategory(
  category: string,
): Promise<EmergencyProtocol | null> {
  const supabase = createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .single();
  if (!profile) return null;

  const { data: protocol } = await supabase
    .from("emergency_protocols")
    .select("*")
    .eq("tenant_id", profile.tenant_id)
    .eq("category", category)
    .single();

  if (!protocol) return null;

  const [{ data: steps }, { data: contacts }] = await Promise.all([
    supabase
      .from("emergency_protocol_steps")
      .select("*")
      .eq("protocol_id", protocol.id)
      .order("ord", { ascending: true }),
    supabase
      .from("emergency_contacts")
      .select("*")
      .eq("tenant_id", profile.tenant_id)
      .order("is_primary", { ascending: false }),
  ]);

  return mapProtocol(protocol, steps || [], contacts || []);
}

function mapProtocol(
  protocol: ProtocolRow,
  steps: ProtocolStepRow[],
  contacts: EmergencyContactRow[]
): EmergencyProtocol {
  return {
    category: protocol.category as EmergencyProtocol["category"],
    title: protocol.title,
    shortLabel: protocol.short_label,
    description: protocol.description || "",
    steps: steps.map((s) => ({
      index: s.ord,
      title: s.title,
      detail: s.detail || "",
      caution: s.caution || undefined,
    })),
    contacts: contacts.map(mapContact),
    linkedDocumentIds: [],
    offlineAvailable: protocol.offline_available || false,
    lastSyncedAt: protocol.last_synced_at || protocol.created_at,
  };
}

function mapContact(row: EmergencyContactRow): EmergencyContact {
  return {
    id: row.id,
    label: row.label,
    role: row.role || "",
    phone: row.phone,
    isPrimary: row.is_primary || false,
  };
}
