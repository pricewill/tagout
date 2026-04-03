import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/Avatar";
import { FollowButton } from "@/components/FollowButton";
import { SpeciesBadge } from "@/components/ui/SpeciesBadge";
import { formatWeight, formatLength } from "@/lib/utils";
import { MapPin, Scale, Ruler } from "lucide-react";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;

  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  const profile = await prisma.user.findUnique({
    where: { username },
    include: {
      _count: {
        select: { followers: true, following: true, harvests: true },
      },
    },
  });

  if (!profile) notFound();

  const [harvests, isFollowing] = await Promise.all([
    prisma.harvest.findMany({
      where: { user_id: profile.id },
      orderBy: { harvested_at: "desc" },
      include: {
        images: {
          where: { is_primary: true },
          take: 1,
        },
        _count: { select: { likes: true } },
      },
    }),
    authUser && authUser.id !== profile.id
      ? prisma.follow
          .findUnique({
            where: {
              follower_id_following_id: {
                follower_id: authUser.id,
                following_id: profile.id,
              },
            },
          })
          .then(Boolean)
      : false,
  ]);

  return (
    <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Profile header */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <div className="flex items-start gap-5">
          <Avatar
            src={profile.avatar_url}
            alt={profile.display_name}
            size="xl"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-xl font-bold text-white">{profile.display_name}</h1>
                <p className="text-slate-400">@{profile.username}</p>
                {profile.home_state && (
                  <p className="text-slate-500 text-sm flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {profile.home_state}
                  </p>
                )}
              </div>
              <FollowButton
                targetUserId={profile.id}
                initialFollowing={isFollowing as boolean}
                currentUserId={authUser?.id ?? null}
              />
            </div>

            {profile.bio && (
              <p className="text-slate-300 text-sm mt-3">{profile.bio}</p>
            )}

            <div className="flex gap-6 mt-4 text-sm">
              <div>
                <span className="font-bold text-white">{profile._count.harvests}</span>
                <span className="text-slate-400 ml-1">Harvests</span>
              </div>
              <div>
                <span className="font-bold text-white">{profile._count.followers}</span>
                <span className="text-slate-400 ml-1">Followers</span>
              </div>
              <div>
                <span className="font-bold text-white">{profile._count.following}</span>
                <span className="text-slate-400 ml-1">Following</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Harvest grid */}
      <div>
        <h2 className="text-lg font-semibold text-slate-200 mb-4">
          Harvests
        </h2>
        {harvests.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            No harvests logged yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {harvests.map((harvest) => {
              const primaryImage = harvest.images[0];
              return (
                <Link key={harvest.id} href={`/harvest/${harvest.id}`} className="group">
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-800">
                    {primaryImage ? (
                      <Image
                        src={primaryImage.url}
                        alt={harvest.species}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">
                        No photo
                      </div>
                    )}

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white font-semibold text-sm leading-tight">
                          {harvest.species}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {harvest.weight_lbs != null && (
                            <span className="flex items-center gap-0.5 text-slate-300 text-xs">
                              <Scale className="w-3 h-3" />
                              {formatWeight(harvest.weight_lbs)}
                            </span>
                          )}
                          {harvest.length_in != null && (
                            <span className="flex items-center gap-0.5 text-slate-300 text-xs">
                              <Ruler className="w-3 h-3" />
                              {formatLength(harvest.length_in)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Badge */}
                    <div className="absolute top-2 left-2">
                      <SpeciesBadge type={harvest.species_type} className="text-xs" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
