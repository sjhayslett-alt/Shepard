import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getAuthState } from "~/auth";

export const Route = createFileRoute("/dashboard/events")({
  beforeLoad: async () => {
    const { user } = await getAuthState();
    if (!user) throw redirect({ to: "/login" });
    return { user };
  },
  component: EventsLayout,
});

function EventsLayout() {
  return <Outlet />;
}
