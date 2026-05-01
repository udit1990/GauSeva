import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Star, Clock, CheckCircle2, TrendingUp, Award } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";
import { Skeleton } from "@/components/ui/skeleton";
import ProfileTab from "@/components/volunteer/ProfileTab";

const skillLabels: Record<string, { emoji: string; label: string }> = {
  cow: { emoji: "🐄", label: "Cow Care" },
  dog: { emoji: "🐕", label: "Dog Care" },
  cat: { emoji: "🐈", label: "Cat Care" },
  monkey: { emoji: "🐒", label: "Monkey Care" },
};

const VolunteerProfile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["volunteer-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: gaushalas } = useQuery({
    queryKey: ["gaushalas-list"],
    queryFn: async () => {
      const { data } = await supabase.from("gaushalas_list").select("id, name, city, state").eq("is_active", true);
      return data || [];
    },
  });

  const { data: changeRequests } = useQuery({
    queryKey: ["volunteer-change-requests", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("gaushala_change_requests")
        .select("*")
        .eq("volunteer_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!user,
  });

  // Performance stats
  const { data: stats } = useQuery({
    queryKey: ["volunteer-perf-stats", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data: orders } = await supabase
        .from("orders")
        .select("id, status, created_at, updated_at, expected_completion_at")
        .eq("assigned_volunteer", user.id);

      if (!orders) return { total: 0, completed: 0, rate: 0, avgHours: 0 };

      const completed = orders.filter(o => o.status === "completed");
      const total = orders.length;
      const rate = total > 0 ? Math.round((completed.length / total) * 100) : 0;

      // Average completion time
      let totalHours = 0;
      let countWithTime = 0;
      completed.forEach(o => {
        const created = new Date(o.created_at).getTime();
        const updated = new Date(o.updated_at).getTime();
        const hrs = (updated - created) / 3600000;
        if (hrs > 0 && hrs < 720) { // < 30 days
          totalHours += hrs;
          countWithTime++;
        }
      });
      const avgHours = countWithTime > 0 ? Math.round(totalHours / countWithTime) : 0;

      return { total, completed: completed.length, rate, avgHours };
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const raiseChangeRequest = useMutation({
    mutationFn: async (args: { gaushalaId: string; reason: string }) => {
      if (!user) return;
      const { error } = await supabase.from("gaushala_change_requests").insert({
        volunteer_id: user.id,
        current_gaushala_id: profile?.gaushala_id || null,
        requested_gaushala_id: args.gaushalaId,
        reason: args.reason || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteer-change-requests"] });
      toast.success("Change request submitted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const skills = (profile as any)?.skills || [];

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border px-5 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Profile</h1>
        </div>
      </header>

      <div className="px-5 pt-4 space-y-4">
        {profileLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-36 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        ) : (
          <>
            {/* Skills */}
            {skills.length > 0 && (
              <div className="rounded-xl bg-card border border-border p-4 space-y-2">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5" /> Skills
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {skills.map((skill: string) => {
                    const info = skillLabels[skill] || { emoji: "🐾", label: skill };
                    return (
                      <span key={skill} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        {info.emoji} {info.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Performance */}
            {stats && stats.total > 0 && (
              <div className="rounded-xl bg-card border border-border p-4 space-y-3">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5" /> Performance
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-secondary/5 p-3 text-center">
                    <CheckCircle2 className="h-4 w-4 text-secondary mx-auto mb-1" />
                    <p className="text-lg font-bold text-secondary">{stats.rate}%</p>
                    <p className="text-[9px] text-muted-foreground">Completion</p>
                  </div>
                  <div className="rounded-lg bg-primary/5 p-3 text-center">
                    <Clock className="h-4 w-4 text-primary mx-auto mb-1" />
                    <p className="text-lg font-bold text-primary">{stats.avgHours}h</p>
                    <p className="text-[9px] text-muted-foreground">Avg Time</p>
                  </div>
                  <div className="rounded-lg bg-accent/10 p-3 text-center">
                    <Star className="h-4 w-4 text-accent-foreground mx-auto mb-1" />
                    <p className="text-lg font-bold text-accent-foreground">{stats.completed}</p>
                    <p className="text-[9px] text-muted-foreground">Completed</p>
                  </div>
                </div>
              </div>
            )}

            <ProfileTab
              profile={profile}
              user={user}
              onSignOut={signOut}
              onGoSettings={() => navigate("/settings")}
              gaushalas={gaushalas}
              onRaiseChangeRequest={(gaushalaId: string, reason: string) => raiseChangeRequest.mutate({ gaushalaId, reason })}
              changeRequests={changeRequests}
            />
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default VolunteerProfile;
