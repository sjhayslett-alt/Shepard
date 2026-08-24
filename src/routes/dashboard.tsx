import { createFileRoute, Outlet, redirect, useRouter, useRouterState } from "@tanstack/react-router";
import { getAuthState, logoutFn, clearSessionCookie, type SessionUser } from "~/auth";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const { user } = await getAuthState();
    if (!user) throw redirect({ to: "/login" });
    return { user };
  },
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = Route.useLoaderData() as { user: SessionUser };
  const router = useRouter();
  const routerState = useRouterState();
  
  // Check if we're on a child route (e.g. /dashboard/events)
  const isChildRoute = routerState.location.pathname !== "/dashboard";

  const handleLogout = async () => {
    await logoutFn();
    clearSessionCookie();
    router.navigate({ to: "/" });
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-50 border-b border-warm-200/60 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <a href="/dashboard" className="flex items-center gap-2 text-teal-700">
            <svg className="h-8 w-8" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2.5" />
              <path d="M20 8c-4 4-8 16-4 22 2 3 6 3 8 0 4-6 0-18-4-22z" fill="currentColor" opacity="0.7" />
              <path d="M20 8v8M16 16h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="text-xl font-bold tracking-tight">Shepherd</span>
          </a>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-warm-200 px-4 py-2 text-sm font-semibold text-warm-700 transition hover:bg-warm-100"
          >
            Sign out
          </button>
        </div>
      </header>

      {isChildRoute ? (
        <main className="flex-1">
          <Outlet />
        </main>
      ) : (
        <main className="flex flex-1 items-center justify-center px-4 py-16">
          <div className="w-full max-w-lg text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 text-teal-700">
              <svg className="h-8 w-8" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2.5" />
                <path d="M20 8c-4 4-8 16-4 22 2 3 6 3 8 0 4-6 0-18-4-22z" fill="currentColor" opacity="0.7" />
              </svg>
            </div>
            <h1 className="mt-6 text-3xl font-bold tracking-tight text-warm-900">
              Welcome, {user.name}!
            </h1>
            <p className="mt-2 text-lg text-warm-700">
              {user.churchName}
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <a href="/dashboard/events" className="block">
                <DashboardCard
                  title="Events"
                  desc="Create and manage church events"
                  icon={
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                  }
                />
              </a>
              <a href="/dashboard/volunteers" className="block">
                <DashboardCard
                  title="Volunteers"
                  desc="Coordinate your serving teams"
                  icon={
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                  }
                />
              </a>
              <a href="/dashboard/budget" className="block">
                <DashboardCard
                  title="Budget"
                  desc="Plan and track event budgets"
                  icon={
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                />
              </a>
              <DashboardCard
                title="Rooms & Resources"
                desc="Manage spaces and equipment"
                comingSoon
                icon={
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
                  </svg>
                }
              />
              <DashboardCard
                title="Settings"
                desc="Church profile and team"
                comingSoon
                icon={
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                }
              />
            </div>
          </div>
        </main>
      )}
    </div>
  );
}

function DashboardCard({
  title,
  desc,
  icon,
  comingSoon,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
  comingSoon?: boolean;
}) {
  return (
    <div className="group rounded-2xl border border-warm-200/60 bg-white p-6 text-left transition hover:border-teal-200 hover:shadow-md relative">
      <div className="mb-3 inline-flex rounded-lg bg-teal-100 p-2 text-teal-700">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-warm-900">{title}</h3>
      <p className="mt-1 text-sm text-warm-700">{desc}</p>
      {comingSoon && (
        <span className="absolute top-4 right-4 inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
          Coming soon
        </span>
      )}
    </div>
  );
}
