import { createFileRoute } from "@tanstack/react-router";
import { Wallet } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch, ApiError } from "@/lib/api";
import { getStoredAuth } from "@/lib/auth";
import { uploadImage } from "@/lib/image";

type Profile = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  avatarUrl?: string | null;
  headline?: string | null;
  bio?: string | null;
  payoutMethod?: string | null;
  bankName?: string | null;
  bankRib?: string | null;
  bankAccountHolder?: string | null;
  flouciNumber?: string | null;
  createdAt: string;
  updatedAt: string;
};

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

const getInitials = (fullName?: string) => {
  if (!fullName) return "IN";
  const parts = fullName.split(" ").map((p) => p.trim()).filter(Boolean);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "IN";
};

function ProfilePage() {
  const auth = getStoredAuth();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [payout, setPayout] = useState({
    payoutMethod: "bank",
    bankName: "",
    bankRib: "",
    bankAccountHolder: "",
    flouciNumber: "",
  });
  const [payoutSaved, setPayoutSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const profileQuery = useQuery({
    queryKey: ["instructor-profile"],
    queryFn: () => apiFetch<Profile>("/users/me"),
  });
  const profile = profileQuery.data;

  const displayInitials = useMemo(
    () => getInitials(profile?.fullName ?? auth?.user.fullName),
    [auth?.user.fullName, profile?.fullName],
  );

  useEffect(() => {
    if (profile?.fullName) setFullName(profile.fullName);
    if (profile?.headline != null) setHeadline(profile.headline);
    if (profile?.bio != null) setBio(profile.bio);
    if (profile) {
      setPayout({
        payoutMethod: profile.payoutMethod ?? "bank",
        bankName: profile.bankName ?? "",
        bankRib: profile.bankRib ?? "",
        bankAccountHolder: profile.bankAccountHolder ?? "",
        flouciNumber: profile.flouciNumber ?? "",
      });
    }
  }, [profile?.fullName, profile?.headline, profile?.bio, profile?.id]);

  const saveMutation = useMutation({
    mutationFn: () =>
      apiFetch<Profile>("/users/me", {
        method: "PATCH",
        body: JSON.stringify({ fullName, headline: headline.trim(), bio: bio.trim() }),
      }),
    onSuccess: async () => {
      setFeedback("Profile updated.");
      await queryClient.invalidateQueries({ queryKey: ["instructor-profile"] });
    },
    onError: (e) => setFeedback(e instanceof ApiError ? e.message : "Could not update profile."),
  });

  const savePayout = useMutation({
    mutationFn: () =>
      apiFetch<Profile>("/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          payoutMethod: payout.payoutMethod,
          bankName: payout.bankName.trim(),
          bankRib: payout.bankRib.trim(),
          bankAccountHolder: payout.bankAccountHolder.trim(),
          flouciNumber: payout.flouciNumber.trim(),
        }),
      }),
    onSuccess: async () => {
      setPayoutSaved(true);
      setTimeout(() => setPayoutSaved(false), 2500);
      await queryClient.invalidateQueries({ queryKey: ["instructor-profile"] });
    },
  });
  const setPayoutField = (k: keyof typeof payout, v: string) =>
    setPayout((p) => ({ ...p, [k]: v }));

  const avatarMutation = useMutation({
    mutationFn: (avatarUrl: string) =>
      apiFetch<Profile>("/users/me", { method: "PATCH", body: JSON.stringify({ avatarUrl }) }),
    onSuccess: async () => {
      setFeedback("Profile picture updated.");
      await queryClient.invalidateQueries({ queryKey: ["instructor-profile"] });
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
    <div className="mx-auto max-w-[1100px] space-y-6 px-4 py-6 sm:px-6 md:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your instructor account.</p>
      </div>

      {feedback ? (
        <Alert>
          <AlertTitle>Notice</AlertTitle>
          <AlertDescription>{feedback}</AlertDescription>
        </Alert>
      ) : null}

      <Card className="border-border/60 shadow-soft">
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
              {profile?.role ?? "INSTRUCTOR"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-soft">
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
              <div className="space-y-2">
                <Label htmlFor="headline">Headline</Label>
                <Input
                  id="headline"
                  value={headline}
                  maxLength={120}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Grammy-winning Producer & Sound Designer"
                />
                <p className="text-xs text-muted-foreground">
                  Shown under your name on your course pages.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  rows={4}
                  value={bio}
                  maxLength={240}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="A short bio students will see on your course pages."
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={profile?.email ?? auth?.user.email ?? ""} disabled readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input value={profile?.role ?? "INSTRUCTOR"} disabled readOnly />
                </div>
              </div>
              <Button type="submit" disabled={saveMutation.isPending || fullName.trim().length < 2}>
                {saveMutation.isPending ? "Saving..." : "Save changes"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" /> Payout details
          </CardTitle>
          <CardDescription>
            Where Musicarth sends your monthly earnings (your 70% share). Paid out manually at the
            end of each month.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Payout method</Label>
              <div className="flex gap-2">
                {(["bank", "flouci"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPayoutField("payoutMethod", m)}
                    className={`rounded-xl border px-4 py-2 text-sm font-medium capitalize transition-colors ${
                      payout.payoutMethod === m
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border/60 hover:border-primary/40"
                    }`}
                  >
                    {m === "bank" ? "Bank transfer" : "Flouci"}
                  </button>
                ))}
              </div>
            </div>

            {payout.payoutMethod === "flouci" ? (
              <div className="space-y-2">
                <Label htmlFor="flouciNumber">Flouci phone number</Label>
                <Input
                  id="flouciNumber"
                  value={payout.flouciNumber}
                  onChange={(e) => setPayoutField("flouciNumber", e.target.value)}
                  placeholder="e.g. 20 123 456"
                />
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bankAccountHolder">Account holder name</Label>
                  <Input
                    id="bankAccountHolder"
                    value={payout.bankAccountHolder}
                    onChange={(e) => setPayoutField("bankAccountHolder", e.target.value)}
                    placeholder="Full name on the account"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank name</Label>
                  <Input
                    id="bankName"
                    value={payout.bankName}
                    onChange={(e) => setPayoutField("bankName", e.target.value)}
                    placeholder="e.g. BIAT, Attijari…"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="bankRib">RIB (account number)</Label>
                  <Input
                    id="bankRib"
                    value={payout.bankRib}
                    onChange={(e) => setPayoutField("bankRib", e.target.value)}
                    placeholder="20-digit RIB"
                  />
                </div>
              </div>
            )}

            {payoutSaved ? (
              <p className="text-sm text-emerald-600">Payout details saved ✓</p>
            ) : null}
            <Button onClick={() => savePayout.mutate()} disabled={savePayout.isPending}>
              {savePayout.isPending ? "Saving…" : "Save payout details"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
