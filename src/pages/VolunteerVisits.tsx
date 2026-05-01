import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import VisitsTab from "@/components/volunteer/VisitsTab";
import { VisitsTabSkeleton } from "@/components/volunteer/VolunteerSkeletons";
import BottomNav from "@/components/BottomNav";
import { toast } from "sonner";

const VolunteerVisits = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: visits, isLoading } = useQuery({
    queryKey: ["volunteer-visits", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("visit_bookings")
        .select("*, gaushalas_list(name, city, state, lat, lng)")
        .eq("assigned_volunteer", user.id)
        .order("visit_date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const updateVisitMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("visit_bookings").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteer-visits"] });
      toast.success("Visit updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const saveVisitNotesMutation = useMutation({
    mutationFn: async ({ visitId, notes }: { visitId: string; notes: string }) => {
      const { error } = await supabase.from("visit_bookings").update({ volunteer_notes: notes }).eq("id", visitId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteer-visits"] });
      toast.success("Visit notes saved");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border px-5 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Visit Calendar</h1>
        </div>
      </header>
      <div className="px-5 pt-4">
        {isLoading ? (
          <VisitsTabSkeleton />
        ) : (
          <VisitsTab
            visits={visits || []}
            updateVisitMutation={updateVisitMutation}
            saveVisitNotesMutation={saveVisitNotesMutation}
          />
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default VolunteerVisits;
