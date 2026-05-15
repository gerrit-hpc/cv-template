import { redirect } from "next/navigation";
import { decideHomeRedirect } from "@/server/data/bootstrap";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const target = await decideHomeRedirect();
  redirect(target as never);
}
