import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  return (
    <main className="min-h-screen bg-surface px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <a href="/" className="text-sm text-primary hover:underline">
          ← Back to home
        </a>

        <h1 className="mt-6 font-display text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] tracking-[-0.03em]">
          About <span className="italic text-gradient-primary">Musicarth.</span>
        </h1>

        <div className="mt-8 space-y-8 text-[15px] leading-relaxed text-foreground/80">
          <section>
            <h2 className="text-lg font-semibold text-foreground">Who we are</h2>
            <p className="mt-3">
              Musicarth was founded by <strong>Hamza Chargui</strong> and{" "}
              <strong>Rayen Trabelsi</strong>, two builders from Tunisia who believe that quality
              music education shouldn&apos;t depend on where you live, what schedule you keep, or
              which conservatory will take you. We started Musicarth to remove those barriers and
              put world-class instruction in the hands of every learner in the Maghreb — and
              beyond.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Why Musicarth exists</h2>
            <p className="mt-3">
              Traditional music schools force students into fixed timetables, long commutes, and
              one-size-fits-all lessons during low-energy hours. Talented instructors, meanwhile,
              have no simple way to reach students or earn a fair living from their craft. Musicarth
              fixes both sides of that gap: learners study any instrument on their own schedule,
              and certified instructors teach, publish, and get paid on a single platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">What we offer</h2>
            <ul className="mt-3 space-y-2">
              <li>
                <strong>On-demand video lessons</strong> — structured courses (sections and lessons)
                with adaptive streaming, note-taking, and resume-where-you-left-off progress.
              </li>
              <li>
                <strong>Live 1-on-1 sessions</strong> — book certified instructors and meet in an
                embedded video room, with screen share and chat. No external apps.
              </li>
              <li>
                <strong>Progress &amp; gamification</strong> — XP, levels, daily streaks, badges,
                and leaderboards to keep momentum going.
              </li>
              <li>
                <strong>Community</strong> — instrument-specific forums where students share
                recordings, ask questions, and get feedback from peers and teachers.
              </li>
              <li>
                <strong>Trilingual by design</strong> — Arabic, French, and English, built for the
                Tunisian market first and ready for the wider region.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Our purpose</h2>
            <p className="mt-3">
              To make learning music <strong>flexible, affordable, and genuinely effective</strong> —
              covering string, keyboard, percussion, wind, voice, music production (MAO), and theory,
              including traditional Maghrebi instruments and the Maqam vocal tradition.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">The goals we&apos;re working toward</h2>
            <ul className="mt-3 space-y-2">
              <li>
                <strong>Access</strong> — let anyone with an internet connection learn any
                instrument, at any level, at any time.
              </li>
              <li>
                <strong>Quality</strong> — every instructor is reviewed and approved before they can
                teach, and every course is curated.
              </li>
              <li>
                <strong>Opportunity</strong> — give Tunisian and regional instructors a real income
                stream and a global audience.
              </li>
              <li>
                <strong>Scale</strong> — grow from Tunisia to Algeria and Morocco, and build for
                100k+ learners without losing the personal feel.
              </li>
            </ul>
          </section>

          <p className="border-t border-foreground/10 pt-6 text-sm text-foreground/60">
            Questions or ideas? Reach the founders at{" "}
            <a href="mailto:musicarthtn@gmail.com" className="text-primary hover:underline">
              musicarthtn@gmail.com
            </a>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
