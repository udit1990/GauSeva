import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, BarChart3, ClipboardList, Tag, MapPin, Users, CalendarDays, FileText, UserPlus, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminOrders from "@/components/admin/AdminOrders";
import AdminAssignments from "@/components/admin/AdminAssignments";
import AdminCatalogue from "@/components/admin/AdminCatalogue";
import AdminGaushalas from "@/components/admin/AdminGaushalas";
import AdminPeople from "@/components/admin/AdminPeople";
import AdminVisits from "@/components/admin/AdminVisits";
import AdminCertificates from "@/components/admin/AdminCertificates";
import AdminSettings from "@/components/admin/AdminSettings";
import { cn } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";

const tabs = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "assignments", label: "Assign", icon: UserPlus },
  { id: "orders", label: "Orders", icon: ClipboardList },
  { id: "certificates", label: "Certificates", icon: FileText },
  { id: "catalogue", label: "Catalogue", icon: Tag },
  { id: "gaushalas", label: "Gaushalas", icon: MapPin },
  { id: "people", label: "People", icon: Users },
  { id: "visits", label: "Visits", icon: CalendarDays },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

type TabId = (typeof tabs)[number]["id"];

const Admin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && tabs.some((t) => t.id === tab)) {
      setActiveTab(tab as TabId);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="flex items-center gap-3 px-5 pt-12 pb-3">
        <button onClick={() => navigate("/")} className="flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-sm">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Admin</h1>
      </header>

      {/* Tab Bar */}
      <div className="flex border-b border-border px-3 gap-0.5 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1 px-2.5 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap shrink-0",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground"
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="px-5 pt-4">
        {activeTab === "overview" && <AdminOverview onNavigate={(tab) => setActiveTab(tab as TabId)} />}
        {activeTab === "assignments" && <AdminAssignments />}
        {activeTab === "orders" && <AdminOrders />}
        {activeTab === "certificates" && <AdminCertificates />}
        {activeTab === "catalogue" && <AdminCatalogue />}
        {activeTab === "gaushalas" && <AdminGaushalas />}
        {activeTab === "people" && <AdminPeople />}
        {activeTab === "visits" && <AdminVisits />}
        {activeTab === "settings" && <AdminSettings />}
      </div>

      <BottomNav />
    </div>
  );
};

export default Admin;
