import { createFileRoute } from "@tanstack/react-router";
import { ApplyForm } from "@/components/ApplyForm";

export const Route = createFileRoute("/apply/instructor")({
  component: InstructorApplyPage,
});

function InstructorApplyPage() {
  return (
    <main className="min-h-screen bg-surface py-16 px-6">
      <div className="mx-auto max-w-2xl text-center">
        <a href="/" className="text-sm text-primary hover:underline">← Back to home</a>
        <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs text-primary">
          <span className="h-1 w-1 rounded-full bg-primary" /> Teach on Musicarth
        </span>
        <h1 className="mt-5 font-display text-[clamp(2rem,4vw,3.25rem)] leading-[1.05] tracking-[-0.03em]">
          Become an <span className="italic text-gradient-primary">instructor.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-sm text-foreground/70">
          Share your details and CV. Our team reviews every application, and once approved we&apos;ll
          email you an invite to set your password and start teaching.
        </p>
      </div>
      <div className="mt-10">
        <ApplyForm role="instructor" />
      </div>
    </main>
  );
}
