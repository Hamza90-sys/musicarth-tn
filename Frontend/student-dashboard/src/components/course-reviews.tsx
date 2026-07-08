import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiFetch, ApiError } from "@/lib/api";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { id: string; fullName: string; avatarUrl: string | null };
};
type ReviewsResponse = { items: Review[]; average: number | null; count: number };

const initials = (n?: string) =>
  (n ?? "").split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";

function Stars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={onChange ? "cursor-pointer" : "cursor-default"}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >
          <Star
            className={`h-4 w-4 ${n <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`}
          />
        </button>
      ))}
    </div>
  );
}

export function CourseReviews({ courseId, canReview }: { courseId: string; canReview: boolean }) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reviewsQuery = useQuery({
    queryKey: ["course-reviews", courseId],
    queryFn: () => apiFetch<ReviewsResponse>(`/courses/${courseId}/reviews`),
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/courses/${courseId}/reviews`, {
        method: "POST",
        body: JSON.stringify({ rating, comment: comment.trim() || undefined }),
      }),
    onSuccess: async () => {
      setError(null);
      setComment("");
      await queryClient.invalidateQueries({ queryKey: ["course-reviews", courseId] });
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Could not submit review."),
  });

  const data = reviewsQuery.data;

  return (
    <Card className="border-border/60 shadow-[var(--shadow-card)]">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Reviews</CardTitle>
            <CardDescription>What students say about this course.</CardDescription>
          </div>
          {data?.average != null ? (
            <div className="flex items-center gap-2">
              <Stars value={Math.round(data.average)} />
              <span className="text-sm font-semibold">{data.average.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({data.count})</span>
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {canReview ? (
          <div className="space-y-3 rounded-2xl border border-border/60 p-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Your rating</span>
              <Stars value={rating} onChange={setRating} />
            </div>
            <Textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share what you thought of this course (optional)"
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button size="sm" disabled={submitMutation.isPending} onClick={() => submitMutation.mutate()}>
              {submitMutation.isPending ? "Submitting..." : "Submit review"}
            </Button>
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
            Complete at least 30% of the course to leave a review.
          </p>
        )}

        {reviewsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading reviews…</p>
        ) : (data?.items.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">No reviews yet — be the first.</p>
        ) : (
          <div className="space-y-4">
            {data?.items.map((r) => (
              <div key={r.id} className="flex gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={r.user.avatarUrl ?? undefined} />
                  <AvatarFallback className="bg-primary/10 text-xs text-primary">
                    {initials(r.user.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{r.user.fullName}</p>
                    <Stars value={r.rating} />
                  </div>
                  {r.comment ? (
                    <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>
                  ) : null}
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
