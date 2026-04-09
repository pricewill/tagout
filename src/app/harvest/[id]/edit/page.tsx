import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { EditHarvestForm } from "./EditHarvestForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditHarvestPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect(`/login?next=/harvest/${id}/edit`);
  }

  const harvest = await prisma.harvest.findUnique({ where: { id } });
  if (!harvest) notFound();
  if (harvest.user_id !== authUser.id) {
    redirect(`/harvest/${id}`);
  }

  return (
    <main className="min-h-screen bg-[#0d1a0d] text-white">
      <header className="sticky top-0 z-10 bg-[#0d1a0d]/95 backdrop-blur border-b border-[#2D4A2D] px-4 py-3 flex items-center gap-4">
        <a
          href={`/harvest/${id}`}
          className="text-[#8aaa8a] hover:text-white transition-colors"
        >
          ← Cancel
        </a>
        <h1 className="text-lg font-semibold">Edit post</h1>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <EditHarvestForm harvest={harvest} />
      </div>
    </main>
  );
}
