import { useState, type FormEvent } from "react";
import {
  submitInstructorApplication,
  submitStudentApplication,
} from "@/lib/api";

type Role = "student" | "instructor";

const inputClass =
  "w-full rounded-xl border border-foreground/15 bg-white/80 px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:bg-white";
const labelClass = "block text-sm font-medium text-foreground/80 mb-1.5";

export function ApplyForm({ role }: { role: Role }) {
  const isInstructor = role === "instructor";
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    country: "",
    city: "",
    address: "",
    instruments: "",
    motivation: "",
  });
  const [cv, setCv] = useState<File | null>(null);

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isInstructor && !cv) {
      setError("Please attach your CV as a PDF.");
      return;
    }

    setSubmitting(true);
    try {
      if (isInstructor) {
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => {
          if (v) fd.append(k, v);
        });
        if (cv) fd.append("cv", cv);
        await submitInstructorApplication(fd);
      } else {
        await submitStudentApplication({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          country: form.country,
          city: form.city,
          address: form.address || undefined,
          instruments: form.instruments || undefined,
          motivation: form.motivation || undefined,
        });
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-foreground/10 bg-white/80 p-10 text-center shadow-soft">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
        </div>
        <h2 className="mt-5 font-display text-2xl">Application received</h2>
        <p className="mt-3 text-sm text-foreground/70">
          Thanks! Our team will review your {role} application. Once it&apos;s approved, you&apos;ll
          get an email with a link to set your password and access the platform.
        </p>
        <a href="/" className="mt-6 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90">
          Back to home
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl rounded-3xl border border-foreground/10 bg-white/70 p-6 shadow-soft sm:p-8">
      {error ? (
        <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass}>Full name</label>
          <input className={inputClass} required value={form.fullName} onChange={set("fullName")} placeholder="Hamza Ben Ali" />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input className={inputClass} type="email" required value={form.email} onChange={set("email")} placeholder="you@email.com" />
        </div>
        <div>
          <label className={labelClass}>Phone</label>
          <input className={inputClass} required value={form.phone} onChange={set("phone")} placeholder="+216 ..." />
        </div>
        <div>
          <label className={labelClass}>Country</label>
          <input className={inputClass} required value={form.country} onChange={set("country")} placeholder="Tunisia" />
        </div>
        <div>
          <label className={labelClass}>City</label>
          <input className={inputClass} required value={form.city} onChange={set("city")} placeholder="Tunis" />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Address <span className="text-foreground/40">(optional)</span></label>
          <input className={inputClass} value={form.address} onChange={set("address")} placeholder="Street, neighborhood" />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>
            {isInstructor ? "Instruments you'll teach" : "Instrument(s) you want to learn"}
            {!isInstructor ? <span className="text-foreground/40"> (optional)</span> : null}
          </label>
          <input
            className={inputClass}
            required={isInstructor}
            value={form.instruments}
            onChange={set("instruments")}
            placeholder="Piano, Guitar, Oud..."
          />
        </div>

        {isInstructor ? (
          <div className="sm:col-span-2">
            <label className={labelClass}>CV (PDF)</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setCv(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-foreground/70 file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary hover:file:bg-primary/20"
            />
            {cv ? <p className="mt-1.5 text-xs text-foreground/50">{cv.name} · {(cv.size / 1024 / 1024).toFixed(1)} MB</p> : null}
          </div>
        ) : null}

        <div className="sm:col-span-2">
          <label className={labelClass}>
            {isInstructor ? "Tell us about your experience" : "Why do you want to join?"}
            <span className="text-foreground/40"> (optional)</span>
          </label>
          <textarea className={`${inputClass} min-h-28 resize-y`} value={form.motivation} onChange={set("motivation")} />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-7 w-full rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-white transition-all hover:bg-primary/90 disabled:opacity-60"
      >
        {submitting ? "Submitting..." : `Submit ${role} application`}
      </button>
      <p className="mt-3 text-center text-xs text-foreground/50">
        Your application is reviewed by our team. You&apos;ll be emailed an invite once approved.
      </p>
    </form>
  );
}
