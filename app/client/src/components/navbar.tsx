import { Outlet, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { NAVBAR_ITEMS } from "@/config/navbarConfig";

export function NavbarLayout() {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (url: string) => {
    if (url === "/") {
      return currentPath === "/";
    }
    return currentPath.startsWith(url);
  };

  return (
    <div className="relative min-h-screen pb-28">
      {/* Main content */}
      <main>
        <Outlet />
      </main>

      {/* Navbar */}
      <nav className="fixed bottom-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 rounded-2xl p-2 flex justify-around gap-1 sm:gap-2 items-center bg-background/90 backdrop-blur-xl border border-border shadow-2xl">
        {NAVBAR_ITEMS.map((item) => {
          const IconComponent = item.icon as any;
          const active = isActive(item.url);

          return (
            <Link key={item.url} to={item.url} className="flex-1 sm:flex-none">
              <Button
                className={`w-full sm:w-12 h-12 rounded-lg sm:rounded-full ${
                  active ? "" : "opacity-70"
                }`}
                variant={active ? "default" : "ghost"}
                title={item.title}
              >
                <IconComponent className="w-6 h-6" />
              </Button>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
