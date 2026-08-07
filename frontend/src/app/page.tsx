import { redirect } from "next/navigation";

/** The proxy sends signed-out visitors to /login before this ever renders. */
export default function Home() {
  redirect("/tasks");
}
