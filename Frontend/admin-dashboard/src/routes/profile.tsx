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
import { getStoredAuth } from "@/lib/auth";
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
  if (!fullName) return "AD";
  const parts = fullName.split(" ").map((p) => p.trim()).filter(Boolean);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "AD";
};

function ProfilePage() {
  const auth = getStoredAuth();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const profileQuery = useQuery({
    queryKey: ["admin-profile"],
    queryFn: () => apiFetch<Profile>("/users/me"),
  });
  const profile = profileQuery.data;

  const displayInitials = useMemo(
    () => getInitials(profile?.fullName ?? auth?.user.fullName),
    [auth?.user.fullName, profile?.fullName],
  );

  useEffect(() => {
    if (profile?.fullName) setFullName(profile.fullName);
  }, [profile?.fullName]);

  const saveMutation = useMutation({
    mutationFn: () =>
      apiFetch<Profile>("/users/me", {
        method: "PATCH",
        body: JSON.stringify({ fullName }),
      }),
    onSuccess: async () => {
      setFeedback("Profile updated.");
      await queryClient.invalidateQueries({ queryKey: ["admin-profile"] });
    },
    onError: (e) => setFeedback(e instanceof ApiError ? e.message : "Could not update profile."),
  });

  const avatarMutation = useMutation({
    mutationFn: (avatarUrl: string) =>
      apiFetch<Profile>("/users/me", {
        method: "PATCH",
        body: JSON.stringify({ avatarUrl }),
      }),
    onSuccess: async () => {
      setFeedback("Profile picture updated.");
      await queryClient.invalidateQueries({ queryKey: ["admin-profile"] });
    },
    onError: (e) => setFeedback(e instanceof ApiError ? e.message : "Could not update picture."),
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

  return (
    <div className="mx-auto max-w-[1100px] space-y-6 p-4 sm:p-6 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your admin account.</p>
      </div>

      {feedback ? (
        <Alert>
          <AlertTitle>Notice</AlertTitle>
          <AlertDescription>{feedback}</AlertDescription>
        </Alert>
      ) : null}

      <Card className="border-border/60 shadow-[var(--shadow-card)]">
        <CardContent className="flex flex-col items-start gap-5 p-6 sm:flex-row sm:items-center">
          <div className="flex flex-col items-center gap-2">
            <Avatar className="h-20 w-20 ring-4 ring-primary/10">
              <AvatarImage src={profile?.avatarUrl ?? undefined} alt={profile?.fullName ?? "Profile"} />
              <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
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
          <div>
            <p className="text-lg font-semibold">{profile?.fullName ?? auth?.user.fullName}</p>
            <p className="text-sm text-muted-foreground">{profile?.email ?? auth?.user.email}</p>
            <Badge variant="secondary" className="mt-2">
              {profile?.role ?? auth?.user.role ?? "ADMIN"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle>Account details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {profileQuery.isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-40" />
            </div>
          ) : (
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                setFeedback(null);
                saveMutation.mutate();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  minLength={2}
                  maxLength={120}
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={profile?.email ?? auth?.user.email ?? ""} disabled readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input value={profile?.role ?? "ADMIN"} disabled readOnly />
                </div>
              </div>
              <Button type="submit" disabled={saveMutation.isPending || fullName.trim().length < 2}>
                {saveMutation.isPending ? "Saving..." : "Save changes"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
