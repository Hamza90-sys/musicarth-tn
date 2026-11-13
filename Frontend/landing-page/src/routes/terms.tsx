import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
});

const companyAddress =
  "Avenue Sadok Mokkadem, Espace Happy Days, Berge du Lac, La Marsa, Tunis 1053, Tunisia.";

function TermsPage() {
  return (
    <main className="min-h-screen bg-surface px-6 py-16">
      <article className="mx-auto max-w-3xl">
        <a href="/" className="text-sm text-primary hover:underline">
          ← Back to home
        </a>
        <p className="mt-8 text-sm font-medium uppercase tracking-[0.2em] text-primary">
          Musicarth | BSMART GO
        </p>
        <h1 className="mt-3 font-display text-[clamp(2.25rem,5vw,3.5rem)] tracking-[-0.03em]">
          Terms &amp; Conditions
        </h1>
        <p className="mt-2 text-sm text-foreground/50">Last updated: November 13, 2026</p>
        <p className="mt-1 text-sm text-foreground/50">Company: BSMART GO | Location: Tunisia</p>

        <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-foreground/80">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Introduction</h2>
            <p className="mt-3">
              Welcome to Musicarth. These Terms &amp; Conditions govern your access to and use of
              the Musicarth website, mobile applications, courses, and educational services.
              Musicarth is operated by BSMART GO, a company registered in Tunisia. By creating an
              account, purchasing a course, or using our services, you agree to these Terms &amp;
              Conditions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. Company Information</h2>
            <p className="mt-3">
              <strong>Company:</strong> BSMART GO
              <br />
              <strong>Registered Address:</strong> {companyAddress}
            </p>
            <p className="mt-3">
              BSMART GO is the company providing and operating the Musicarth platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Our Services</h2>
            <p className="mt-3">Musicarth is an online music education platform offering:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Pre-recorded music courses.</li>
              <li>
                Instrument learning programs, including guitar, piano, flute, and other instruments.
              </li>
              <li>Educational resources and practice materials.</li>
              <li>Live instructor sessions included in selected course packages.</li>
            </ul>
            <p className="mt-3">
              Course content, prices, and the number of included live sessions may vary depending on
              the selected package.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. User Accounts</h2>
            <p className="mt-3">
              Users may need to create an account to access certain Musicarth services.
            </p>
            <p className="mt-3">Users agree to:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Provide accurate registration information.</li>
              <li>Maintain the confidentiality of their login credentials.</li>
              <li>Avoid sharing their accounts without authorization.</li>
              <li>Notify the platform of suspected unauthorized account access.</li>
            </ul>
            <p className="mt-3">
              Users are responsible for activities performed through their accounts, subject to
              applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Courses and Purchases</h2>
            <p className="mt-3">
              Musicarth offers educational courses and packages that may require payment.
            </p>
            <p className="mt-3">Before purchasing, users should review:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Course descriptions.</li>
              <li>Package prices.</li>
              <li>Included educational materials.</li>
              <li>Number of live sessions, where applicable.</li>
              <li>Any specific conditions associated with the selected package.</li>
            </ul>
            <p className="mt-3">
              Access to paid courses is provided according to the conditions displayed at the time
              of purchase.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Payments</h2>
            <p className="mt-3">
              Payments may be processed through third-party payment providers supported by
              Musicarth. Users agree to provide accurate payment information and complete the
              applicable payment process. Course access may be granted after successful payment
              verification. Payment processing may also be subject to the payment provider&apos;s
              own terms and conditions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Live Sessions</h2>
            <p className="mt-3">
              Certain course packages include live sessions with instructors. The number of sessions
              and their conditions depend on the selected package. Users should respect scheduled
              session times and follow any booking or attendance instructions provided by Musicarth.
              Specific cancellation and rescheduling rules for live sessions must be communicated
              before booking.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">8. Refunds and Cancellations</h2>
            <p className="mt-3">
              Refund eligibility, cancellation conditions, and course-access termination rules must
              follow the refund policy communicated by Musicarth at the time of purchase.
            </p>
            <p className="mt-3 font-medium text-foreground">
              Important: The final refund and cancellation policy must be completed and approved by
              BSMART GO before these Terms are published.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">9. Intellectual Property</h2>
            <p className="mt-3">
              All original Musicarth content, including recorded lessons, educational videos, course
              materials, platform design and branding, text, graphics, and other original resources,
              is protected by applicable intellectual property laws.
            </p>
            <p className="mt-3">
              Users may access purchased educational materials for personal learning purposes. Users
              must not reproduce, distribute, sell, publicly share, or commercially exploit
              Musicarth content without appropriate authorization.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">10. Acceptable Use</h2>
            <p className="mt-3">Users agree not to:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Use Musicarth for unlawful purposes.</li>
              <li>Attempt unauthorized access to the platform.</li>
              <li>Distribute or share purchased content without permission.</li>
              <li>Interfere with the platform&apos;s functionality or security.</li>
              <li>Misuse other users&apos; personal information.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">11. Account Suspension</h2>
            <p className="mt-3">
              BSMART GO may restrict or suspend accounts in cases of serious violations of these
              Terms, subject to applicable law and appropriate procedures.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">12. Service Availability</h2>
            <p className="mt-3">
              BSMART GO aims to maintain Musicarth services and platform availability. However,
              temporary interruptions may occur due to maintenance, technical problems, or
              circumstances beyond our reasonable control.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">13. Limitation of Liability</h2>
            <p className="mt-3">
              To the extent permitted by applicable law, BSMART GO shall not be responsible for
              indirect losses arising from improper use of Musicarth or circumstances beyond its
              reasonable control. Nothing in these Terms excludes liability that cannot legally be
              excluded.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">14. Changes to These Terms</h2>
            <p className="mt-3">
              BSMART GO may update these Terms &amp; Conditions when necessary. Updated versions
              will be published on the Musicarth website. Continued use of the platform after
              applicable changes take effect is subject to the updated Terms, as permitted by law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">15. Applicable Law</h2>
            <p className="mt-3">
              These Terms &amp; Conditions are subject to applicable laws and regulations of
              Tunisia.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">16. Contact Information</h2>
            <p className="mt-3">
              For questions concerning these Terms &amp; Conditions:
              <br />
              <strong>BSMART GO</strong>
              <br />
              {companyAddress}
            </p>
            <p className="mt-3 text-sm text-foreground/60">
              This document is a working draft. Complete and approve the refund, cancellation, and
              live-session policies before publication.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
