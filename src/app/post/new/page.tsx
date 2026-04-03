import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewHarvestForm } from "./NewHarvestForm";

export default async function NewHarvestPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-white mb-6">Log a Harvest</h1>
      <NewHarvestForm userId={user.id} />
    </main>
  );
}
