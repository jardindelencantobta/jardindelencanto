import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PortalShell } from "@/components/portal/PortalShell";
import type { PortalProfile } from "@/app/portal/layout";

export const metadata: Metadata = {
  title: "Admin | Jardín El Encanto",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, avatar_url")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") redirect("/portal");

  return (
    <PortalShell profile={profile as PortalProfile}>
      {children}
    </PortalShell>
  );
}
