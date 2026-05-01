import { Home, Info, User, Heart, Sparkles, CalendarDays, ShieldCheck, HandHelping, Package, ListChecks, Upload, Bell } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { VOLUNTEER_ACTIVE_ORDER_STATUSES } from "@/lib/volunteerOrderStatus";

const baseTabs = [
  { icon: Home, label: "Seva", path: "/" },
  { icon: Sparkles, label: "Live Feed", path: "/my-contributions" },
  { icon: Heart, label: "My Karma", path: "/profile" },
  { icon: Info, label: "About", path: "/about" },
];

const guestTabs = [
  { icon: Home, label: "Seva", path: "/" },
  { icon: Info, label: "About", path: "/about" },
  { icon: User, label: "Sign In", path: "/auth" },
];

const adminTab = { icon: ShieldCheck, label: "Admin", path: "/admin" };
const adminVisitTab = { icon: CalendarDays, label: "Visits", path: "/admin?tab=visits" };

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, isVolunteer } = useAuth();

  const { data: pendingOrdersCount } = useQuery({
    queryKey: ["pending-orders-count", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("assigned_volunteer", user.id)
        .in("status", [...VOLUNTEER_ACTIVE_ORDER_STATUSES]);
      return count || 0;
    },
    enabled: !!user && isVolunteer,
    refetchInterval: 30000,
  });

  let tabs;
  if (!user) {
    tabs = guestTabs;
  } else if (isAdmin) {
    tabs = [
      { icon: Home, label: "Home", path: "/" },
      adminVisitTab,
      adminTab,
      { icon: User, label: "Profile", path: "/profile" },
    ];
  } else if (isVolunteer) {
    tabs = [
      { icon: Home, label: "Today", path: "/" },
      { icon: ListChecks, label: "Tasks", path: "/volunteer-tasks" },
      { icon: Upload, label: "Uploads", path: "/volunteer-uploads" },
      { icon: Bell, label: "Alerts", path: "/alerts" },
      { icon: User, label: "Profile", path: "/volunteer-profile" },
    ];
  } else {
    tabs = baseTabs;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-border bg-card/95 backdrop-blur-sm px-2 pb-safe">
      {tabs.map((tab) => {
        const active = location.pathname === tab.path || (tab.path.startsWith("/admin?") && location.pathname === "/admin" && location.search.includes(tab.path.split("?")[1]));
        const isTasksTab = tab.path === "/volunteer-tasks";
        return (
          <button
            key={tab.label + tab.path}
            onClick={() => navigate(tab.path)}
            className={cn(
              "relative flex flex-col items-center gap-0.5 py-2 px-2 transition-colors min-w-0",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <div className="relative">
              <tab.icon className="h-5 w-5" />
              {isTasksTab && (pendingOrdersCount || 0) > 0 && (
                <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-bold text-destructive-foreground">
                  {(pendingOrdersCount || 0) > 9 ? "9+" : pendingOrdersCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium truncate">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
