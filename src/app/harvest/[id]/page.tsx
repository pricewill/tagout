import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { ImageCarousel } from "@/components/ImageCarousel";
import { SpeciesBadge } from "@/components/ui/SpeciesBadge";
import { Avatar } from "@/components/ui/Avatar";
import { LikeButton } from "@/components/LikeButton";
import { CommentSection } from "./CommentSection";
import Link from "next/link";
import { MapPin, Scale, Ruler, Calendar, Crosshair, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { formatWeight, formatLength } from "@/lib/utils";

interface HarvestPageProps {
  params: Promise<{ id: string }>;
}

export default async function HarvestPage({ params }: HarvestPageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  const harvest = await prisma.harvest.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, username: true, display_name: true, avatar_url: true } },
      images: { orderBy: { display_order: "asc" } },
      _count: { select: { likes: true, comments: true } },
    },
  });

  if (!harvest) notFound();

  const [isLiked, comments] = await Promise.all([
    authUser
      ? prisma.like.findUnique({
          where: { user_id_harvest_id: { user_id: authUser.id, harvest_id: id } },
        }).then(Boolean)
      : false,
    prisma.comment.findMany({
      where: { harvest_id: id },
      orderBy: { created_at: "asc" },
      include: {
        user: { select: { username: true, display_name: true, avatar_url: true } },
      },
    }),
  ]);

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Image carousel */}
      <ImageCarousel
        images={harvest.images.map((img) => ({ url: img.url }))}
        aspectRatio="video"
        className="rounded-xl overflow-hidden"
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <SpeciesBadge type={harvest.species_type} />
          </div>
          <h1 className="text-2xl font-bold text-white">{harvest.species}</h1>
          <p className="text-slate-400">{harvest.method}</p>
        </div>
        <LikeButton
          harvestId={harvest.id}
          initialCount={harvest._count.likes}
          initialLiked={isLiked as boolean}
          userId={authUser?.id}
        />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={<MapPin className="w-4 h-4" />} label="Location" value={harvest.location_label} />
        <StatCard
          icon={<Calendar className="w-4 h-4" />}
          label="Harvested"
          value={format(new Date(harvest.harvested_at), "MMM d, yyyy")}
        />
        {harvest.weight_lbs != null && (
          <StatCard icon={<Scale className="w-4 h-4" />} label="Weight" value={formatWeight(harvest.weight_lbs)} />
        )}
        {harvest.length_in != null && (
          <StatCard icon={<Ruler className="w-4 h-4" />} label="Length" value={formatLength(harvest.length_in)} />
        )}
      </div>

      {/* AI ID result */}
      {harvest.ai_id_result && harvest.ai_id_result !== "Unknown" && (
        <div className="bg-forest-900/40 border border-forest-700/50 rounded-xl p-4 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-forest-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-forest-300">AI Species ID</p>
            <p className="text-forest-200">{harvest.ai_id_result}</p>
            {harvest.ai_id_confidence != null && (
              <p className="text-xs text-forest-500 mt-0.5">
                {Math.round(harvest.ai_id_confidence * 100)}% confidence
              </p>
            )}
          </div>
        </div>
      )}

      {/* Caption */}
      {harvest.caption && (
        <div className="bg-slate-800/50 rounded-xl p-4">
          <p className="text-slate-200 leading-relaxed">{harvest.caption}</p>
        </div>
      )}

      {/* Hunter/angler info */}
      <Link
        href={`/profile/${harvest.user.username}`}
        className="flex items-center gap-3 bg-slate-800/40 hover:bg-slate-700/40 border border-slate-700/50 rounded-xl p-4 transition-colors"
      >
        <Avatar src={harvest.user.avatar_url} alt={harvest.user.display_name} size="md" />
        <div>
          <p className="font-semibold text-white">{harvest.user.display_name}</p>
          <p className="text-slate-400 text-sm">@{harvest.user.username}</p>
        </div>
        <Crosshair className="w-4 h-4 text-amber-500 ml-auto" />
      </Link>

      {/* Comments */}
      <CommentSection
        harvestId={harvest.id}
        initialComments={comments}
        currentUserId={authUser?.id ?? null}
      />
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3">
      <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
        {icon}
        {label}
      </div>
      <p className="text-slate-200 font-medium text-sm">{value}</p>
    </div>
  );
}
