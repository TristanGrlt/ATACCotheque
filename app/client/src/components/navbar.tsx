import { Outlet, useLocation, Link } from "react-router-dom";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { NAVBAR_ITEMS } from "@/config/navbarConfig";

export function NavbarLayout() {
  const location = useLocation();
  const currentPath = location.pathname;
  const lastTouchRef = useRef<Record<string, number>>({});

  const isActive = (url: string) => {
    if (url === "/") {
      return currentPath === "/";
    }
    return currentPath.startsWith(url);
  };

  const handleTouchDouble =
    (itemUrl: string, onDoubleClick?: () => void) =>
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (event.pointerType !== "touch") return;
      const now = Date.now();
      const lastTap = lastTouchRef.current[itemUrl] ?? 0;

      if (now - lastTap < 350) {
        onDoubleClick?.();
        lastTouchRef.current[itemUrl] = 0;
      } else {
        lastTouchRef.current[itemUrl] = now;
      }
    };

  return (
    <div className="relative min-h-screen">
      {/* Main content */}
      <main>
        <Outlet />
      </main>

      {/* Navbar */}
      <nav className="fixed bottom-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 rounded-2xl p-2 flex justify-around gap-1 sm:gap-2 items-center bg-background/90 backdrop-blur-xl border border-border shadow-2xl">
        {NAVBAR_ITEMS.map((item) => {
          const IconComponent = item.icon;
          const active = isActive(item.url);

          return (
            <Link key={item.url} to={item.url} className="flex-1 sm:flex-none">
              <Button
                className={`w-full sm:w-12 h-12 rounded-lg sm:rounded-full ${
                  active ? "" : "opacity-70"
                }`}
                variant={active ? "default" : "ghost"}
                title={item.title}
                onDoubleClick={item.onDoubleClick}
                onPointerDown={handleTouchDouble(item.url, item.onDoubleClick)}
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
