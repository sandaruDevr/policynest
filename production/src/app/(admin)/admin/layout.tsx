import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminContext } from "@/lib/data/admin/session";

export const dynamic = "force-dynamic";

export default async function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Identity + role resolved server-side from the session cookie.
  // Middleware guarantees authentication; here we enforce admin role.
  const context = await getAdminContext().catch(() => null);

  if (!context) {
    // Authenticated non-admins fall back to the staff workspace.
    redirect("/app/home");
  }

  return <AdminShell context={context}>{children}</AdminShell>;
}
