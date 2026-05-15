import { redirect } from "next/navigation";
import { decideHomeRedirect } from "@/server/data/bootstrap";

export default async function HomePage() {
  const target = await decideHomeRedirect();
  redirect(target as never);
}
