import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch, ApiError } from "@/lib/api";
import { getStoredAuth, setStoredAuth, useStoredAuth } from "@/lib/auth";
import { uploadImage } from "@/lib/image";

type Profile = {
  id: string;
  email: string;
  fullName: string;
  role: "STUDENT" | "INSTRUCTOR" | "ADMIN";
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

const getInitials = (fullName?: string) => {
  if (!fullName) {
    return "ST";
  }

  const parts = fullName
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "ST";
};

function ProfilePage() {
  const auth = useStoredAuth();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const profileQuery = useQuery({
    queryKey: ["student-profile"],
    queryFn: () => apiFetch<Profile>("/users/me"),
  });

  const profile = profileQuery.data;
  const displayInitials = useMemo(
    () => getInitials(profile?.fullName ?? auth?.user.fullName),
    [auth?.user.fullName, profile?.fullName],
  );

  const fileRef = useRef<HTMLInputElement>(null);
  const avatarMutation = useMutation({
    mutationFn: (avatarUrl: string) =>
      apiFetch<Profile>("/users/me", {
        method: "PATCH",
        body: JSON.stringify({ avatarUrl }),
      }),
    onSuccess: async () => {
      setFeedback("Profile picture updated.");
      await queryClient.invalidateQueries({ queryKey: ["student-profile"] });
    },
    onError: (error) =>
      setFeedback(error instanceof ApiError ? error.message : "Could not update picture."),
  });

  const onPickAvatar = async (file: File | null) => {
    if (!file) return;
    setFeedback(null);
    try {
      avatarMutation.mutate(await uploadImage(file, "avatars"));
    } catch {
      setFeedback("Could not process that image. Try a different file.");
    }
  };

  useEffect(() => {
    if (profile?.fullName) {
      setFullName(profile.fullName);
    }
  }, [profile?.fullName]);

  const saveMutation = useMutation({
    mutationFn: async () =>
      apiFetch<Profile>("/users/me", {
        method: "PATCH",
        body: JSON.stringify({ fullName }),
      }),
    onSuccess: async (updatedProfile) => {
      setFeedback("Your profile has been updated.");
      await queryClient.invalidateQueries({ queryKey: ["student-profile"] });

      const storedAuth = getStoredAuth();
      if (storedAuth) {
        setStoredAuth({
          ...storedAuth,
          user: updatedProfile,
        });
      }
    },
    onError: (error) => {
      setFeedback(error instanceof ApiError ? error.message : "Could not update profile.");
    },
  });

  const isLoading = profileQuery.isLoading;
  const apiError = profileQuery.error;

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8">
      <section className="rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-background to-background p-6 shadow-[var(--shadow-card)] md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
              Profile & preferences
            </p>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Keep your account details polished.
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              Update your display name, check your account identity, and keep the dashboard
              experience in sync with your profile.
            </p>
          </div>

          <Card className="w-full max-w-sm border-border/60 bg-background/80 backdrop-blur">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex flex-col items-center gap-2">
                <Avatar className="h-16 w-16 ring-4 ring-primary/10">
                  <AvatarImage src={profile?.avatarUrl ?? undefined} alt={profile?.fullName ?? "Profile"} />
                  <AvatarFallback className="bg-primary/10 text-base font-semibold text-primary">
                    {displayInitials}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={avatarMutation.isPending}
                  className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
                >
                  {avatarMutation.isPending ? "Uploading…" : "Change photo"}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onPickAvatar(e.target.files?.[0] ?? null)}
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold">
                  {profile?.fullName ?? auth?.user.fullName ?? "Student"}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {profile?.email ?? auth?.user.email}
                </p>
                <div className="mt-2">
                  <Badge variant="secondary">{profile?.role ?? auth?.user.role ?? "STUDENT"}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {apiError ? (
        <Alert variant="destructive">
          <AlertTitle>Could not load profile</AlertTitle>
          <AlertDescription>
            {apiError instanceof ApiError ? apiError.message : "Try refreshing the page."}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_360px]">
        <Card className="border-border/60 shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Account details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-40" />
              </div>
            ) : (
              <form
                className="space-y-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  setFeedback(null);
                  saveMutation.mutate();
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    minLength={2}
                    maxLength={120}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    value={profile?.email ?? auth?.user.email ?? ""}
                    disabled
                    readOnly
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Input value={profile?.role ?? auth?.user.role ?? "STUDENT"} disabled readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Member since</Label>
                    <Input
                      value={
                        profile?.createdAt
                          ? new Date(profile.createdAt).toLocaleDateString()
                          : "—"
                      }
                      disabled
                      readOnly
                    />
                  </div>
                </div>

                {feedback ? (
                  <p className="text-sm text-muted-foreground">{feedback}</p>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <Button
                    type="submit"
                    disabled={saveMutation.isPending || fullName.trim().length < 2}
                  >
                    {saveMutation.isPending ? "Saving..." : "Save changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFullName(profile?.fullName ?? auth?.user.fullName ?? "");
                      setFeedback(null);
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/60 shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle>Quick summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-xl bg-muted/30 px-4 py-3">
                <span className="text-muted-foreground">Display name</span>
                <span className="font-medium">{profile?.fullName ?? auth?.user.fullName}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/30 px-4 py-3">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{profile?.email ?? auth?.user.email}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/30 px-4 py-3">
                <span className="text-muted-foreground">Role</span>
                <span className="font-medium">{profile?.role ?? auth?.user.role}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed border-border/60 shadow-none">
            <CardContent className="space-y-3 p-6">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
                Coming next
              </p>
              <h3 className="text-lg font-semibold">Language, notifications, and billing</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                The backend is already set up for the core account flow, so the next pass can wire
                the remaining preferences, subscription management, and notification settings.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
