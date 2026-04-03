"use client";

import { useState, useTransition } from "react";
import { UserPlus, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface FollowButtonProps {
  targetUserId: string;
  initialFollowing: boolean;
  currentUserId?: string | null;
}

export function FollowButton({
  targetUserId,
  initialFollowing,
  currentUserId,
}: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [isPending, startTransition] = useTransition();

  async function handleToggle() {
    if (!currentUserId) {
      window.location.href = "/login";
      return;
    }

    startTransition(async () => {
      const prev = following;
      setFollowing(!prev);

      try {
        const res = await fetch(`/api/follow/${targetUserId}`, {
          method: "POST",
        });
        if (!res.ok) setFollowing(prev);
      } catch {
        setFollowing(prev);
      }
    });
  }

  if (currentUserId === targetUserId) return null;

  return (
    <Button
      variant={following ? "secondary" : "primary"}
      onClick={handleToggle}
      loading={isPending}
    >
      {following ? (
        <>
          <UserCheck className="w-4 h-4" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          Follow
        </>
      )}
    </Button>
  );
}
