"use client";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Settings } from "lucide-react";
import { SIDEBAR_LINKS } from "@/lib/constants";
import NavLink from "./NavLink";
import { usePathname } from "next/navigation";

function Sidebar() {
  const path = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        <TooltipProvider delayDuration={800}>
          {SIDEBAR_LINKS.map((item) => {
            return (
              <div key={item.label} className="text-white fill-color">
                <NavLink
                  label={item.label}
                  Icon={item.icon}
                  route={item.route}
                  pathname={path}
                />
              </div>
            );
          })}
        </TooltipProvider>
      </nav>
      <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
        <TooltipProvider>
          <NavLink
            label="Settings"
            Icon={Settings}
            route="/dashboard/settings"
            pathname={path}
          />
        </TooltipProvider>
      </nav>
    </aside>
  );
}

export default Sidebar;
