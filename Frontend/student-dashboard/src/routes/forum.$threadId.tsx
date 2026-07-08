import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CornerUpRight, ThumbsUp } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";

type UserSummary = {
  id: string;
  fullName: string;
  email: string;
};

type Reply = {
  id: string;
  threadId: string;
  authorId: string;
  body: string;
  audioUrl: string | null;
  upvotes: number;
  createdAt: string;
  updatedAt: string;
  author: UserSummary;
};

type ThreadDetail = {
  thread: {
    id: string;
    authorId: string;
    category: string;
    title: string;
    body: string;
    isPinned: boolean;
    isLocked: boolean;
    upvotes: number;
    replyCount: number;
    createdAt: string;
    updatedAt: string;
    author: UserSummary;
  };
  replies: Reply[];
  totalReplies: number;
  page: number;
  limit: number;
};

export const Route = createFileRoute("/forum/$threadId")({
  component: ForumThreadPage,
});

function ForumThreadPage() {
  const { threadId } = Route.useParams();
  const queryClient = useQueryClient();
  const [replyBody, setReplyBody] = useState("");
  const [audioUrl, setAudioUrl] = useState("");

  const threadQuery = useQuery({
    queryKey: ["forum-thread", threadId],
    queryFn: () => apiFetch<ThreadDetail>(`/forum/threads/${threadId}`),
  });

  const replyMutation = useMutation({
    mutationFn: () =>
      apiFetch<Reply>(`/forum/threads/${threadId}/replies`, {
        method: "POST",
        body: JSON.stringify({
          body: replyBody,
          audioUrl: audioUrl || undefined,
        }),
      }),
    onSuccess: async () => {
      setReplyBody("");
      setAudioUrl("");
      await queryClient.invalidateQueries({ queryKey: ["forum-thread", threadId] });
      await queryClient.invalidateQueries({ queryKey: ["forum-threads"] });
      await queryClient.invalidateQueries({ queryKey: ["student-notifications-badge"] });
    },
  });

  const upvoteMutation = useMutation({
    mutationFn: () => apiFetch(`/forum/threads/${threadId}/upvote`, { method: "POST" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["forum-thread", threadId] });
      await queryClient.invalidateQueries({ queryKey: ["forum-threads"] });
    },
  });

  const data = threadQuery.data;
  const thread = data?.thread;

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8 space-y-6">
      <Button asChild variant="ghost" className="gap-2">
        <Link to="/forum">
          <ArrowLeft className="h-4 w-4" />
          Back to forum
        </Link>
      </Button>

      {threadQuery.isLoading ? (
        <div className="rounded-3xl border border-border/60 bg-background p-8 shadow-[var(--shadow-card)]">
          Loading thread…
        </div>
      ) : thread ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="space-y-6">
            <Card className="border-border/60 shadow-[var(--shadow-card)]">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{thread.category}</Badge>
                  {thread.isPinned ? <Badge variant="outline">Pinned</Badge> : null}
                  {thread.isLocked ? <Badge variant="destructive">Locked</Badge> : null}
                </div>
                <CardTitle className="text-2xl tracking-tight">{thread.title}</CardTitle>
                <CardDescription>
                  Posted by {thread.author.fullName} • {new Date(thread.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="whitespace-pre-wrap text-sm leading-7 text-foreground/90">
                  {thread.body}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => upvoteMutation.mutate()}
                    disabled={upvoteMutation.isPending}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    {thread.upvotes} Upvote{thread.upvotes === 1 ? "" : "s"}
                  </Button>
                  <Badge variant="secondary">{thread.replyCount} replies</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle>Replies</CardTitle>
                <CardDescription>Discussion stays up to date without page refreshes.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data?.replies.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
                    No replies yet. Be the first to jump in.
                  </div>
                ) : (
                  data?.replies.map((reply) => (
                    <article
                      key={reply.id}
                      className="rounded-2xl border border-border/60 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{reply.author.fullName}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(reply.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {reply.audioUrl ? (
                          <Badge variant="outline" className="gap-1">
                            <CornerUpRight className="h-3.5 w-3.5" />
                            Audio
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-foreground/90">
                        {reply.body}
                      </p>
                    </article>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-border/60 shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle>Write a reply</CardTitle>
                <CardDescription>
                  Add a helpful answer, a practice update, or an audio example.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reply-body">Reply</Label>
                  <Textarea
                    id="reply-body"
                    rows={7}
                    value={replyBody}
                    onChange={(event) => setReplyBody(event.target.value)}
                    placeholder="Share your answer or a practice tip."
                    disabled={thread.isLocked}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="audio-url">Audio URL (optional)</Label>
                  <Input
                    id="audio-url"
                    value={audioUrl}
                    onChange={(event) => setAudioUrl(event.target.value)}
                    placeholder="https://..."
                    disabled={thread.isLocked}
                  />
                </div>
                <Button
                  className="w-full gap-2"
                  disabled={!replyBody.trim() || thread.isLocked || replyMutation.isPending}
                  onClick={() => replyMutation.mutate()}
                >
                  <CornerUpRight className="h-4 w-4" />
                  Post reply
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
