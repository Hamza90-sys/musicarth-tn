import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <main className="min-h-screen bg-surface px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <a href="/" className="text-sm text-primary hover:underline">
          ← Back to home
        </a>
        <h1 className="mt-6 font-display text-[clamp(2.25rem,5vw,3.5rem)] tracking-[-0.03em]">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-foreground/50">Last updated: {new Date().getFullYear()}</p>

        <div className="mt-8 space-y-7 text-[15px] leading-relaxed text-foreground/80">
          <p>
            This Privacy Policy explains how Musicarth (&quot;we&quot;, &quot;us&quot;), operated by
            Hamza Chargui and Rayen Trabelsi, collects, uses, and protects your personal
            information. By using the platform you agree to this policy.
          </p>

          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Information we collect</h2>
            <ul className="mt-3 space-y-2">
              <li>
                <strong>Account &amp; application data:</strong> full name, email, phone number,
                country and city, and — for instructor applicants — a CV/résumé and the instruments
                you teach.
              </li>
              <li>
                <strong>Learning data:</strong> courses you enrol in, lesson progress, watch
                position, XP, streaks, badges, and session bookings.
              </li>
              <li>
                <strong>Content you create:</strong> forum posts, replies, audio recordings, and
                course materials.
              </li>
              <li>
                <strong>Technical data:</strong> basic device and usage information needed to keep
                the service secure and reliable.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. How we use it</h2>
            <ul className="mt-3 space-y-2">
              <li>To create and manage your account and review applications.</li>
              <li>To deliver lessons, live sessions, progress tracking, and the community.</li>
              <li>To match students with instructors and process bookings.</li>
              <li>To send essential notifications (approvals, session reminders, account notices).</li>
              <li>To keep the platform safe and to comply with the law.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Payments</h2>
            <p className="mt-3">
              Payments are handled by our third-party payment provider, <strong>Flouci</strong>. Your
              card and banking details are entered on the provider&apos;s secure checkout and are
              never stored on Musicarth&apos;s servers — we only receive a confirmation that a
              payment succeeded. Instructors provide their own bank or Flouci payout details to
              receive their earnings; these are visible only to Musicarth administrators for the
              purpose of paying them.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Sharing</h2>
            <p className="mt-3">
              We do not sell your personal data. We share information only with the service
              providers required to operate the platform (e.g. hosting, video streaming, email) and
              where required by law. Instructors and students see only the information necessary to
              run a booked session.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Your rights</h2>
            <p className="mt-3">
              You can access and update your profile at any time, and request deletion of your
              account. On deletion we remove or anonymise your personal data, subject to legal
              retention requirements.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Contact</h2>
            <p className="mt-3">
              For any privacy request, email{" "}
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
