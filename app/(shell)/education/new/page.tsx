import { Header } from "@/components/navigation/header";
import { BackLink } from "@/components/navigation/back-link";
import { EducationFormPage } from "./education-form-page";

export default function NewEducationPage() {
  return (
    <>
      <Header title="Add education" />
      <div className="p-2xl max-w-[560px] flex flex-col gap-md">
        <BackLink href="/education" label="Education" />
        <EducationFormPage />
      </div>
    </>
  );
}
