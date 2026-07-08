import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Search, ShieldCheck, GraduationCap, Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { apiFetch, ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

type Role = "STUDENT" | "INSTRUCTOR" | "ADMIN";
type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  createdAt: string;
};
type UsersResponse = { items: AdminUser[]; total: number; page: number; limit: number };

export const Route = createFileRoute("/users")({
  component: UsersPage,
});

const roleIcon = (r: Role) =>
  r === "ADMIN" ? ShieldCheck : r === "INSTRUCTOR" ? Presentation : GraduationCap;

function UsersPage() {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [role, setRole] = useState<"" | Role>("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const usersQuery = useQuery({
    queryKey: ["admin-users", q, role, page],
    queryFn: () =>
      apiFetch<UsersResponse>(
        `/admin/users?page=${page}&limit=20${q ? `&q=${encodeURIComponent(q)}` : ""}${role ? `&role=${role}` : ""}`,
      ),
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, newRole }: { userId: string; newRole: Role }) =>
      apiFetch(`/admin/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
      }),
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Could not update role"),
  });

  const data = usersQuery.data;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-6 sm:px-6 md:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{t("users")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("usersSub")}
        </p>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="Search name or email…"
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              {(["", "STUDENT", "INSTRUCTOR", "ADMIN"] as const).map((r) => (
                <Button
                  key={r || "ALL"}
                  size="sm"
                  variant={role === r ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => {
                    setRole(r);
                    setPage(1);
                  }}
                >
                  {r === "" ? "All" : r.charAt(0) + r.slice(1).toLowerCase() + "s"}
                </Button>
              ))}
            </div>
          </div>
          {error ? <CardDescription className="text-destructive">{error}</CardDescription> : null}
        </CardHeader>
        <CardContent className="space-y-3">
          {usersQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading users…</p>
          ) : (data?.items.length ?? 0) === 0 ? (
            <p className="rounded-xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
              No users match.
            </p>
          ) : (
            data?.items.map((u) => {
              const Icon = roleIcon(u.role);
              return (
                <div
                  key={u.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{u.fullName}</p>
                      <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{u.role}</Badge>
                    <select
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                      value={u.role}
                      disabled={roleMutation.isPending}
                      onChange={(e) => {
                        const newRole = e.target.value as Role;
                        if (
                          newRole !== u.role &&
                          confirm(`Change ${u.fullName}'s role to ${newRole}?`)
                        ) {
                          roleMutation.mutate({ userId: u.id, newRole });
                        }
                      }}
                    >
                      <option value="STUDENT">STUDENT</option>
                      <option value="INSTRUCTOR">INSTRUCTOR</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                </div>
              );
            })
          )}

          {totalPages > 1 ? (
            <div className="flex items-center justify-between pt-2 text-sm">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-muted-foreground">
                Page {page} of {totalPages} · {data?.total} users
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
