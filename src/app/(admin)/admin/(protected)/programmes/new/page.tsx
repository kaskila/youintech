import Link from "next/link";
import { ProgrammeForm } from "../programme-form";

export default function NewProgrammePage() {
  return (
    <div className="mx-auto max-w-content">
      <Link href="/admin/programmes" className="text-sm">
        ← Back to programmes
      </Link>
      <h1 className="text-display-sm mb-6 mt-2">New programme</h1>
      <ProgrammeForm />
    </div>
  );
}
