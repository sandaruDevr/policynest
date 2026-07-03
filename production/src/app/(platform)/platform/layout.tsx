import { redirect } from "next/navigation";
import { PlatformShell } from "@/components/platform/platform-shell";
import { getPlatformContext } from "@/lib/data/platform/session";

export const dynamic = "force-dynamic";

export default async function PlatformGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getPlatformContext().catch(() => null);

  if (!context) {
    redirect("/app/home");
  }

  return <PlatformShell context={context}>{children}</PlatformShell>;
}
