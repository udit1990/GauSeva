import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import GlobalFilterBar from "./GlobalFilterBar";
import KpiCards from "./KpiCards";
import AlertsPanel from "./AlertsPanel";
import LiveOrdersFeed from "./LiveOrdersFeed";
import VolunteerStatusPanel from "./VolunteerStatusPanel";
import OrderDetailDrawer from "./OrderDetailDrawer";

const CommandCenter = () => {
  const navigate = useNavigate();
  const [drawerOrderId, setDrawerOrderId] = useState<string | null>(null);

  const handleKpiClick = useCallback((filter: string) => {
    navigate(`/admin?tab=orders&status=${filter}`);
  }, [navigate]);

  const handleAlertAction = useCallback((action: string, metadata?: Record<string, unknown>) => {
    if (action === "navigate" && metadata?.tab) {
      const params = new URLSearchParams();
      params.set("tab", metadata.tab as string);
      if (metadata.filter) params.set("status", metadata.filter as string);
      navigate(`/admin?${params.toString()}`);
    }
  }, [navigate]);

  return (
    <div className="space-y-5">
      {/* Global Filters */}
      <GlobalFilterBar />

      {/* KPIs */}
      <KpiCards onKpiClick={handleKpiClick} />

      {/* Alerts */}
      <AlertsPanel onAction={handleAlertAction} />

      {/* Two-column on larger screens */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Live Orders Feed */}
        <LiveOrdersFeed onOrderClick={setDrawerOrderId} />

        {/* Volunteer Status */}
        <VolunteerStatusPanel />
      </div>

      {/* Order Detail Drawer */}
      <OrderDetailDrawer orderId={drawerOrderId} onClose={() => setDrawerOrderId(null)} />
    </div>
  );
};

export default CommandCenter;
