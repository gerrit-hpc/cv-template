import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import { Header } from "@/components/navigation/header";
import { ProfileForm } from "./profile-form";
import { KeyQualificationsSection } from "./key-qualifications-section";
import { LanguagesSection } from "./languages-section";
import { InfoBanner } from "@/components/ui/info-banner";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const profile = await db.profile.findUnique({
    where: { userId: CURRENT_USER_ID },
    include: {
      keyQualifications: { orderBy: { order: "asc" } },
      languages: { orderBy: { order: "asc" } },
    },
  });

  return (
    <>
      <Header title="Profile" />
      <div className="p-2xl max-w-[720px] flex flex-col gap-3xl">
        {!profile ? (
          <InfoBanner dismissible>
            Welcome. Import your existing markdown KB from Settings to pre-fill these fields, or start from scratch below.
          </InfoBanner>
        ) : null}
        <ProfileForm profile={profile ?? null} />
        {profile ? (
          <>
            <KeyQualificationsSection profileId={profile.id} items={profile.keyQualifications} />
            <LanguagesSection profileId={profile.id} items={profile.languages} />
          </>
        ) : null}
      </div>
    </>
  );
}
