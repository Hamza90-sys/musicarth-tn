import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { CoursesStory } from "@/components/CoursesStory";
import { CoursesGrid } from "@/components/CoursesGrid";
import { LiveSessions } from "@/components/LiveSessions";
import { Experience } from "@/components/Experience";
import { Instructors } from "@/components/Instructors";
import { Testimonials } from "@/components/Testimonials";
import { FinalCTA } from "@/components/FinalCTA";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Musicarth - Learn Music Beyond Limits" },
      {
        name: "description",
        content:
          "A cinematic, immersive platform for learning music with world-class instructors, live sessions, and personalized journeys across piano, guitar, violin, and drums.",
      },
      { property: "og:title", content: "Musicarth - Learn Music Beyond Limits" },
      {
        property: "og:description",
        content:
          "A cinematic, immersive platform for learning music with world-class instructors and live sessions.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="relative overflow-x-clip bg-background text-foreground antialiased">
      <Navbar />
      <Hero />
      <CoursesStory />
      <CoursesGrid />
      <LiveSessions />
      <Experience />
      <Instructors />
      <Testimonials />
      <FinalCTA />
      <Footer />
    </main>
  );
}
