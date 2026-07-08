import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Pin, Plus, ThumbsUp, Users } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";

type UserSummary = {
  id: string;
  fullName: string;
  email: string;
};

type Thread = {
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
  _count: {
    replies: number;
    upvoteRecords: number;
  };
};

type ThreadListResponse = {
  items: Thread[];
  total: number;
};

const categories = [
  "general",
  "piano",
  "guitar",
  "theory",
  "gear",
  "production",
  "performance",
];

export const Route = createFileRoute("/forum")({
  component: ForumPage,
});

function ForumPage() {
  const queryClient = useQueryClient();
  const [category, setCategory] = useState("general");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("general");

  const threadsQuery = useQuery({
    queryKey: ["forum-threads", category],
    queryFn: () =>
      apiFetch<ThreadListResponse>(`/forum/threads?category=${encodeURIComponent(category)}`),
  });

  const createThreadMutation = useMutation({
    mutationFn: () =>
      apiFetch<Thread>("/forum/threads", {
        method: "POST",
        body: JSON.stringify({
          category: selectedCategory,
          title,
          body,
        }),
      }),
    onSuccess: async () => {
      setTitle("");
      setBody("");
      await queryClient.invalidateQueries({ queryKey: ["forum-threads"] });
      await queryClient.invalidateQueries({ queryKey: ["student-notifications-badge"] });
    },
  });

  const threads = threadsQuery.data?.items ?? [];
  const total = threadsQuery.data?.total ?? 0;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8 space-y-6 md:space-y-8">
      <section className="rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-background to-background p-6 shadow-[var(--shadow-card)] md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Community forum</p>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Ask questions, share clips, and keep the music conversation going.
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              Threads are grouped by instrument and topic so the community stays easy to scan.
            </p>
          </div>
          <Card className="w-full max-w-sm border-border/60 bg-background/80 backdrop-blur">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-xs text-muted-foreground">Threads</p>
                <p className="mt-1 text-2xl font-semibold">{total}</p>
              </div>
              <div className="rounded-2xl bg-muted/40 p-3 text-primary">
                <MessageSquare className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.2fr)]">
        <Card className="border-border/60 shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Start a thread</CardTitle>
            <CardDescription>Share a question or post a practice update.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="thread-title">Title</Label>
              <Input
                id="thread-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="How do I keep my left hand relaxed during runs?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="thread-body">Body</Label>
              <Textarea
                id="thread-body"
                rows={8}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Add context, a clip link, or your practice notes."
              />
            </div>
            <Button
              className="w-full gap-2"
              disabled={!title.trim() || !body.trim() || createThreadMutation.isPending}
              onClick={() => createThreadMutation.mutate()}
            >
              <Plus className="h-4 w-4" />
              Post thread
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-[var(--shadow-card)]">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Threads</CardTitle>
                <CardDescription>Browse recent conversations in the community.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={category === "general" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategory("general")}
                >
                  General
                </Button>
                <Button
                  variant={category !== "general" ? "outline" : "secondary"}
                  size="sm"
                  onClick={() => setCategory("piano")}
                >
                  Piano
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {threadsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading threads…</p>
            ) : threads.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
                No threads yet for this category.
              </div>
            ) : (
              threads.map((thread) => (
                <article
                  key={thread.id}
                  className="rounded-2xl border border-border/60 p-4 transition-colors hover:bg-muted/30"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{thread.category}</Badge>
                    {thread.isPinned ? (
                      <Badge variant="outline" className="gap-1">
                        <Pin className="h-3.5 w-3.5" />
                        Pinned
                      </Badge>
                    ) : null}
                    {thread.isLocked ? <Badge variant="destructive">Locked</Badge> : null}
                  </div>
                  <h3 className="mt-3 text-lg font-semibold tracking-tight">{thread.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{thread.body}</p>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        {thread.author.fullName}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <ThumbsUp className="h-3.5 w-3.5" />
                        {thread.upvotes}
                      </span>
                      <span>{thread.replyCount} replies</span>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link to="/forum/$threadId" params={{ threadId: thread.id }}>
                        View thread
                      </Link>
                    </Button>
                  </div>
                </article>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
