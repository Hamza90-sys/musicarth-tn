// Integration smoke test — asserts the critical safety invariants against a
// running backend. Run:  npm run smoke   (backend must be up on API_URL).
// Exits non-zero if any invariant fails, so it can gate a deploy.

const API = process.env.API_URL ?? "http://localhost:4000/api/v1";
const STUDENT = { email: "bestyhamza9@gmail.com", password: "Student123!" };
const INSTRUCTOR = { email: "trabelsidhiya123@gmail.com", password: "Instructor123!" };
const ADMIN = { email: "musicarthtn@gmail.com", password: "hamza90rayen90" };

let passed = 0;
let failed = 0;
function check(name, cond, detail = "") {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ ${name} ${detail}`);
  }
}
const login = async (c) => {
  const r = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(c),
  });
  return (await r.json()).accessToken;
};
const req = (path, { token, method = "GET", body } = {}) =>
  fetch(`${API}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

async function run() {
  console.log(`Smoke test → ${API}\n`);

  // 1. Health
  const health = await (await req("/health")).json().catch(() => ({}));
  check("health is ok + db up", health.status === "ok" && health.database === "up");

  // 2. Auth required on protected endpoints
  check("unauthenticated /users/me → 401", (await req("/users/me")).status === 401);
  check(
    "unauthenticated admin payouts → 401",
    (await req("/payments/admin/payouts")).status === 401,
  );

  const [sTok, iTok, aTok] = await Promise.all([login(STUDENT), login(INSTRUCTOR), login(ADMIN)]);
  check("student/instructor/admin can log in", Boolean(sTok && iTok && aTok));

  // 3. Role enforcement — student must NOT reach admin/instructor endpoints
  check(
    "student → admin users list is 403",
    (await req("/admin/users", { token: sTok })).status === 403,
  );
  check(
    "student → instructor earnings is 403",
    (await req("/payments/earnings/me", { token: sTok })).status === 403,
  );
  check(
    "admin → admin users list is 200",
    (await req("/admin/users?limit=1", { token: aTok })).status === 200,
  );

  // 4. Payment safety — cannot free-enroll a PAID course
  const courses = await (await req("/courses")).json();
  const paid = (Array.isArray(courses) ? courses : []).find((c) => c.price > 0 && c.isPublished);
  if (paid) {
    const enrolledAlready = (await req(`/courses/${paid.id}/progress`, { token: sTok })).status;
    // If not already enrolled, a free enroll attempt must be rejected (403).
    const freeEnroll = await req("/enrollments", {
      token: sTok,
      method: "POST",
      body: { courseId: paid.id },
    });
    check(
      "cannot free-enroll a paid course (403/409)",
      freeEnroll.status === 403 || freeEnroll.status === 409,
      `(got ${freeEnroll.status}; progress=${enrolledAlready})`,
    );
    // Invalid coupon is rejected server-side
    const badCoupon = await req(`/payments/course/${paid.id}`, {
      token: sTok,
      method: "POST",
      body: { couponCode: "DEFINITELY-NOT-REAL" },
    });
    check(
      "invalid coupon rejected (400/409)",
      badCoupon.status === 400 || badCoupon.status === 409,
      `(got ${badCoupon.status})`,
    );
  } else {
    console.log("  ⚠ no paid published course — skipping payment-gate checks");
  }

  // 5. Platform reviews hidden until > 15 raters
  const reviews = await (await req("/platform-reviews")).json();
  check(
    "testimonials gated until >15 (items empty when count ≤ 15)",
    reviews.count > 15 ? Array.isArray(reviews.items) : reviews.items.length === 0,
  );

  // 6. Token refresh works
  const loginRes = await (
    await req("/auth/login", { method: "POST", body: STUDENT })
  ).json();
  const refreshed = await req("/auth/refresh", {
    method: "POST",
    body: { refreshToken: loginRes.refreshToken },
  });
  check("refresh token issues a new access token", refreshed.status === 201);

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error("Smoke test crashed:", e.message);
  process.exit(1);
});
