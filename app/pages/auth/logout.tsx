import { redirect } from "react-router";
import type { Route } from "./+types/logout";
import { logout } from "~/lib/auth.server";

export async function loader() {
  // Logout should only happen via POST
  throw redirect("/");
}

export async function action({ request }: Route.ActionArgs) {
  return logout(request);
}

