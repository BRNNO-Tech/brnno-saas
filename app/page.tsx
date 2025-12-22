import { redirect } from "next/navigation";

export default function Home() {
  // Redirect to dashboard - you can add auth check here later
  redirect("/dashboard");
}
