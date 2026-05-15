"use client";
import { useRouter } from "next/navigation";
import { EducationForm } from "../education-form";

export function EducationFormPage() {
  const router = useRouter();
  return <EducationForm entry={null} onSaved={() => router.push("/education" as never)} onCancel={() => router.push("/education" as never)} />;
}
