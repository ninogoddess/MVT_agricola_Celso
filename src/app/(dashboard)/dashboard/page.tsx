import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import DashboardContent from "@/components/dashboard/DashboardContent";
import PaymentConfirm from "@/components/planes/PaymentConfirm";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <>
      <Suspense fallback={null}>
        <PaymentConfirm />
      </Suspense>
      <DashboardContent />
    </>
  );
}
