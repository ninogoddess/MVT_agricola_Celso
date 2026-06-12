import PlanesView from "@/components/planes/PlanesView";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SubscriptionService } from "@/lib/services/subscription.service";
import { redirect } from "next/navigation";

export default async function PlanesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Resolver tenant y plan actual
  const tenantId =
    (user.app_metadata as any)?.tenant_id ||
    (await supabase.from("user_profiles").select("tenant_id").eq("id", user.id).single()).data?.tenant_id;

  let currentPlan: "free" | "pro" | "organizacion" = "free";
  if (tenantId) {
    const service = new SubscriptionService(supabase, tenantId);
    const sub = await service.getCurrentSubscription();
    const planId = (sub as any)?.plan?.id;
    if (planId === "pro" || planId === "organizacion") currentPlan = planId;
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-up">
      <PlanesView currentPlan={currentPlan} />
    </div>
  );
}
