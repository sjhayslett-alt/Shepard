import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getAuthState } from "~/auth";

export const Route = createFileRoute("/dashboard/events/$eventId")({
  beforeLoad: async () => {
    const { user } = await getAuthState();
    if (!user) throw redirect({ to: "/login" });
    return { user };
  },
  component: EventDetailLayout,
});

function EventDetailLayout() {
  return <Outlet />;
}
