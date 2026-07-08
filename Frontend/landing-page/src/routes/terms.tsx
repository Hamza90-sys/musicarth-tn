import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
});

function TermsPage() {
  return (
    <main className="min-h-screen bg-surface px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <a href="/" className="text-sm text-primary hover:underline">
          ← Back to home
        </a>
        <h1 className="mt-6 font-display text-[clamp(2.25rem,5vw,3.5rem)] tracking-[-0.03em]">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-foreground/50">Last updated: {new Date().getFullYear()}</p>

        <div className="mt-8 space-y-7 text-[15px] leading-relaxed text-foreground/80">
          <p>
            These Terms govern your use of Musicarth, operated by Hamza Chargui and Rayen Trabelsi.
            By creating an account or using the platform you accept these Terms.
          </p>

          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Accounts &amp; approval</h2>
            <p className="mt-3">
              Access to Musicarth is by application. Student and instructor applications are
              reviewed by our team, and access is granted only after approval. You are responsible
              for keeping your login credentials secure and for all activity under your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. Instructors</h2>
            <ul className="mt-3 space-y-2">
              <li>You must hold the rights to any content you upload and to teach the material.</li>
              <li>You agree to deliver booked live sessions on time and professionally.</li>
              <li>
                Platform commission and payout terms apply to paid courses and sessions and are
                shown in your dashboard.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Students</h2>
            <p className="mt-3">
              Course and session access is for your personal use. You may not redistribute,
              re-stream, or resell lesson content. Booked live sessions are subject to the
              instructor&apos;s cancellation policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Payments &amp; refunds</h2>
            <p className="mt-3">
              All prices are shown in Tunisian Dinar (TND) before purchase. Payments are processed
              securely through our payment provider (Flouci); we never store your card details.
              Musicarth retains a platform commission on each paid course and live session; the
              remainder is paid out to the instructor.
            </p>
            <p className="mt-3 font-medium text-foreground">Refund policy:</p>
            <ul className="mt-2 space-y-2">
              <li>
                <strong>Courses:</strong> you may request a full refund within <strong>7 days</strong>{" "}
                of purchase, provided you have completed less than <strong>25%</strong> of the
                course. After that, purchases are non-refundable.
              </li>
              <li>
                <strong>Live sessions:</strong> refundable in full if cancelled at least{" "}
                <strong>24 hours</strong> before the scheduled start. Cancellations inside 24 hours,
                or no-shows, are non-refundable.
              </li>
              <li>
                Approved refunds are returned to your original payment method via Flouci, typically
                within a few business days. To request one, email us at the address below.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Acceptable use</h2>
            <p className="mt-3">
              You agree not to misuse the platform — no harassment, infringing content, spam, or
              attempts to disrupt the service. We may hide content or suspend accounts that violate
              these Terms or our community standards.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Content ownership</h2>
            <p className="mt-3">
              Instructors retain ownership of their course content and grant Musicarth a licence to
              host and stream it to enrolled students. You retain ownership of forum posts and
              recordings you publish.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Termination</h2>
            <p className="mt-3">
              You may delete your account at any time. We may suspend or terminate accounts that
              breach these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">8. Contact</h2>
            <p className="mt-3">
              Questions about these Terms? Email{" "}
              <a href="mailto:musicarthtn@gmail.com" className="text-primary hover:underline">
                musicarthtn@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
