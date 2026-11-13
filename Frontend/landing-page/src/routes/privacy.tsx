import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

const companyAddress =
  "Avenue Sadok Mokkadem, Espace Happy Days, Berge du Lac, La Marsa, Tunis 1053, Tunisia.";

function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-foreground/50">Last updated: November 13, 2026</p>
        <p className="mt-1 text-sm text-foreground/50">Company: BSMART GO | Location: Tunisia</p>

        <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-foreground/80">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Introduction</h2>
            <p className="mt-3">
              Welcome to Musicarth. We respect your privacy and are committed to protecting your
              personal information. Musicarth is operated by BSMART GO, a company based in Tunisia.
              This Privacy Policy explains how we collect, use, store, and protect personal
              information when you use our website, applications, and educational services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. Company Information</h2>
            <p className="mt-3">
              <strong>Company:</strong> BSMART GO
              <br />
              <strong>Registered Address:</strong> {companyAddress}
              <br />
              <strong>Platform:</strong> Musicarth
            </p>
            <p className="mt-3">
              BSMART GO is responsible for the processing of personal information associated with
              Musicarth, subject to applicable data protection laws.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Information We Collect</h2>
            <p className="mt-3">Depending on how you use Musicarth, we may collect:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <strong>Personal information:</strong> Name, email address, and other account
                registration details.
              </li>
              <li>
                <strong>Account information:</strong> Login credentials and account preferences.
              </li>
              <li>
                <strong>Learning information:</strong> Courses purchased, learning progress, and
                educational activity.
              </li>
              <li>
                <strong>Communication information:</strong> Messages and requests submitted to our
                support team.
              </li>
              <li>
                <strong>Transaction information:</strong> Purchase history, payment status, and
                transaction references.
              </li>
              <li>
                <strong>Technical information:</strong> Device type, browser information, IP
                address, and technical usage data where collected.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              4. How We Use Your Information
            </h2>
            <p className="mt-3">We may use personal information to:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Create and manage user accounts.</li>
              <li>Provide access to music courses and educational materials.</li>
              <li>Organize live instructor sessions.</li>
              <li>Process and manage course purchases.</li>
              <li>Communicate important account and service updates.</li>
              <li>Improve the performance and functionality of Musicarth.</li>
              <li>Maintain platform security and prevent unauthorized access.</li>
              <li>Comply with applicable legal obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Payment Information</h2>
            <p className="mt-3">
              Musicarth may use third-party payment service providers to process transactions.
              Payment information is handled according to the applicable payment provider&apos;s
              privacy and security practices. We only use transaction information as necessary to
              manage purchases, verify payments, and provide access to purchased services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Sharing of Information</h2>
            <p className="mt-3">
              We do not sell users&apos; personal information. Information may be shared with
              trusted third-party service providers when necessary to operate Musicarth, including
              hosting, payment processing, technical infrastructure, and other essential services.
              Such providers should only process information as necessary to provide their services
              and in accordance with applicable requirements.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Data Security</h2>
            <p className="mt-3">
              BSMART GO takes reasonable technical and organizational measures to protect personal
              information against unauthorized access, alteration, disclosure, or loss. However, no
              online service can guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">8. Data Retention</h2>
            <p className="mt-3">
              Personal information is retained only for as long as necessary to provide our
              services, fulfill legitimate business purposes, and comply with applicable legal
              obligations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">9. Your Privacy Rights</h2>
            <p className="mt-3">Depending on applicable law, users may have the right to:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Request access to their personal information.</li>
              <li>Request correction of inaccurate information.</li>
              <li>Request deletion of personal information.</li>
              <li>Object to certain processing activities.</li>
              <li>Request information about how their data is used.</li>
            </ul>
            <p className="mt-3">
              Requests can be submitted to BSMART GO using its registered postal address listed in
              this policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">10. Third-Party Services</h2>
            <p className="mt-3">
              Musicarth may rely on external services to provide certain functionalities. These
              services may have their own privacy policies and data handling practices. Users should
              review the relevant policies where applicable.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">11. Changes to This Policy</h2>
            <p className="mt-3">
              BSMART GO reserves the right to update this Privacy Policy when necessary. Any updates
              will be published on the Musicarth website, with the latest revision date displayed at
              the top.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">12. Contact Information</h2>
            <p className="mt-3">
              For questions or requests concerning this Privacy Policy:
              <br />
              <strong>BSMART GO</strong>
              <br />
              {companyAddress}
            </p>
            <p className="mt-3 text-sm text-foreground/60">
              This document is a working draft. Confirm actual data practices, service providers,
              retention periods, and applicable legal requirements before publication.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
