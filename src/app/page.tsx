import { redirect } from "next/navigation";

export default function RootPage() {
  // As per Step 6 requirements, there is no marketing landing page.
  // We redirect directly to the registration flow.
  redirect("/register");
}
