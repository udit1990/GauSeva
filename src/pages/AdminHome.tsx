import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import CommandCenter from "@/components/admin/CommandCenter";
import BottomNav from "@/components/BottomNav";
import dhyanText from "@/assets/dhyan-flag.png";
import dhyanFlag from "@/assets/dhyan-logo.png";

const AdminHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-10 pb-2">
        <div className="flex items-center">
          <img src={dhyanText} alt="Dhyan Foundation" className="h-6 object-contain" />
          <img src={dhyanFlag} alt="" className="h-8 object-contain -ml-0.5 -mt-2" />
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1">
          <span className="text-[11px] font-semibold text-destructive">Admin</span>
        </div>
      </header>

      <div className="px-5 space-y-4 mt-2">
        <div>
          <h1 className="text-lg font-bold text-foreground">Command Center</h1>
          <p className="text-xs text-muted-foreground">Real-time operations dashboard</p>
        </div>

        <CommandCenter />
      </div>

      <BottomNav />
    </div>
  );
};

export default AdminHome;
