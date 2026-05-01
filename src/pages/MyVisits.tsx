import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Calendar, Clock, Users, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";

const statusColors: Record<string, string> = {
  pending: "bg-primary/15 text-primary",
  confirmed: "bg-secondary/15 text-secondary",
  visited: "bg-secondary/15 text-secondary",
  cancelled: "bg-destructive/15 text-destructive",
  "not-visited": "bg-muted text-muted-foreground",
};

const MyVisits = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: bookings } = useQuery({
    queryKey: ["my-visits", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("visit_bookings")
        .select("*, gaushalas_list(name, city, state)")
        .eq("user_id", user.id)
        .order("visit_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button onClick={() => navigate(-1)} className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Your Visits</h1>
      </header>

      <div className="px-5 space-y-3">
        {bookings && bookings.length > 0 ? (
          bookings.map((booking) => {
            const gaushala = booking.gaushalas_list as any;
            return (
              <div key={booking.id} className="rounded-xl bg-card p-4 shadow-sm space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{gaushala?.name || "Gaushala"}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">{gaushala?.city}, {gaushala?.state}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${statusColors[booking.status] || statusColors.pending}`}>
                    {booking.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(booking.visit_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{booking.time_slot}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{booking.num_visitors}</span>
                  </div>
                </div>
                {booking.volunteer_notes && (
                  <p className="text-xs text-muted-foreground italic border-t border-border pt-2">
                    Note: {booking.volunteer_notes}
                  </p>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 space-y-3">
            <p className="text-sm text-muted-foreground">No visits booked yet</p>
            <button
              onClick={() => navigate("/visit")}
              className="text-sm font-semibold text-primary"
            >
              Book a Visit →
            </button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default MyVisits;
