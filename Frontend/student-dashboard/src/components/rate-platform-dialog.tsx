import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";

const DISMISS_KEY = "musicarth.rate.dismissed";

export const wasRateDismissed = () =>
  typeof window !== "undefined" && sessionStorage.getItem(DISMISS_KEY) === "1";

export const useMyPlatformReview = () =>
  useQuery({
    queryKey: ["my-platform-review"],
    queryFn: () => apiFetch<{ review: { id: string; rating: number } | null }>("/platform-reviews/me"),
    staleTime: 5 * 60 * 1000,
  });

/**
 * "Rate Musicarth" prompt shown after a student completes a lesson/course.
 * One review per student; their comment can appear on the landing page
 * testimonials once enough students have rated.
 */
export function RatePlatformDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");

  const submit = useMutation({
    mutationFn: () =>
      apiFetch("/platform-reviews", {
        method: "POST",
        body: JSON.stringify({ rating, comment: comment.trim() || undefined }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["my-platform-review"] });
      onOpenChange(false);
    },
  });

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(o) : dismiss())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enjoying Musicarth? 🎵</DialogTitle>
          <DialogDescription>
            Congrats on finishing your lesson! Rate your experience — your words may appear on our
            homepage.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-center gap-1.5 py-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(n)}
                aria-label={`${n} stars`}
              >
                <Star
                  className={`h-8 w-8 transition-colors ${
                    n <= (hover || rating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/30"
                  }`}
                />
              </button>
            ))}
          </div>
          <Textarea
            rows={3}
            maxLength={400}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What do you love about learning here? (optional)"
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={dismiss}>
            Maybe later
          </Button>
          <Button onClick={() => submit.mutate()} disabled={submit.isPending}>
            {submit.isPending ? "Sending…" : "Submit rating"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
