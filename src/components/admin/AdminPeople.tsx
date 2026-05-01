import { useState } from "react";
import { cn } from "@/lib/utils";
import { Users, HandHelping, ShieldCheck } from "lucide-react";
import AdminDonors from "./AdminDonors";
import AdminVolunteers from "./AdminVolunteers";
import AdminRoles from "./AdminRoles";

const subTabs = [
  { id: "donors", label: "Donors", icon: Users },
  { id: "volunteers", label: "Volunteers", icon: HandHelping },
  { id: "roles", label: "Roles", icon: ShieldCheck },
] as const;

type SubTabId = (typeof subTabs)[number]["id"];

const AdminPeople = () => {
  const [activeSubTab, setActiveSubTab] = useState<SubTabId>("donors");

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5">
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              activeSubTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === "donors" && <AdminDonors />}
      {activeSubTab === "volunteers" && <AdminVolunteers />}
      {activeSubTab === "roles" && <AdminRoles />}
    </div>
  );
};

export default AdminPeople;