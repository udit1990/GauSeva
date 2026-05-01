import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AlertsTab from "@/components/volunteer/AlertsTab";
import { AlertsTabSkeleton } from "@/components/volunteer/VolunteerSkeletons";
import BottomNav from "@/components/BottomNav";

const Alerts = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["volunteer-notifications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const unreadCount = notifications?.filter((n: any) => !n.read).length || 0;

  const markAllRead = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteer-notifications"] });
    },
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border px-5 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Alerts</h1>
        </div>
      </header>
      <div className="px-5 pt-4">
        {isLoading ? (
          <AlertsTabSkeleton />
        ) : (
          <AlertsTab
            notifications={notifications || []}
            onMarkRead={() => markAllRead.mutate()}
            unreadCount={unreadCount}
          />
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default Alerts;
