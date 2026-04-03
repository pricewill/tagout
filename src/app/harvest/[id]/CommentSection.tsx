"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { MessageCircle, Send } from "lucide-react";
import Link from "next/link";

interface Comment {
  id: string;
  body: string;
  created_at: Date | string;
  user: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

interface CommentSectionProps {
  harvestId: string;
  initialComments: Comment[];
  currentUserId: string | null;
}

export function CommentSection({
  harvestId,
  initialComments,
  currentUserId,
}: CommentSectionProps) {
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !currentUserId) return;

    setPosting(true);
    try {
      const res = await fetch(`/api/harvests/${harvestId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim() }),
      });

      if (res.ok) {
        const { comment } = await res.json();
        setComments((prev) => [...prev, comment]);
        setBody("");
      }
    } finally {
      setPosting(false);
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="font-semibold text-slate-200 flex items-center gap-2">
        <MessageCircle className="w-4 h-4" />
        Comments ({comments.length})
      </h2>

      {comments.length === 0 && (
        <p className="text-slate-500 text-sm">Be the first to comment!</p>
      )}

      <div className="space-y-3">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <Avatar
              src={comment.user.avatar_url}
              alt={comment.user.display_name}
              size="sm"
            />
            <div className="flex-1 bg-slate-800/50 rounded-xl px-3 py-2.5">
              <div className="flex items-baseline gap-2 mb-1">
                <Link
                  href={`/profile/${comment.user.username}`}
                  className="text-sm font-semibold text-slate-200 hover:text-amber-400 transition-colors"
                >
                  {comment.user.display_name}
                </Link>
                <span className="text-xs text-slate-500">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </span>
              </div>
              <p className="text-slate-300 text-sm">{comment.body}</p>
            </div>
          </div>
        ))}
      </div>

      {currentUserId ? (
        <form onSubmit={handlePost} className="flex gap-2 pt-2">
          <input
            type="text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add a comment…"
            maxLength={500}
            className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
          <Button type="submit" size="sm" loading={posting} disabled={!body.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      ) : (
        <p className="text-sm text-slate-500">
          <Link href="/login" className="text-amber-400 hover:underline">Sign in</Link>{" "}
          to leave a comment.
        </p>
      )}
    </section>
  );
}
