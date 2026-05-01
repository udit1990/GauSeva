import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Settings, LogOut, Shield, Clipboard, HandHeart, MapPin, ChevronRight, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import ImpactStrip from "@/components/ImpactStrip";
import SevaStreakCalendar from "@/components/SevaStreakCalendar";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Profile = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAdmin, isVolunteer, signOut, loading } = useAuth();
  const { clearCart } = useCart();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const { data: orders } = useQuery({
    queryKey: ["my-orders", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const totalDonated = orders?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;

  const impactData = [
    { value: String(orders?.length || 0), label: "Daans Done" },
    { value: `₹${totalDonated > 1000 ? `${(totalDonated / 1000).toFixed(1)}K` : totalDonated}`, label: "Total Donated" },
  ];


  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);

    const fallbackRedirect = window.setTimeout(() => {
      window.location.assign("/");
    }, 2200);

    try {
      clearCart();
      queryClient.clear();
      localStorage.clear();

      const { error } = await signOut();
      if (error) {
        toast.error(`Sign out failed: ${error.message}`);
      } else {
        toast.success("Signed out");
      }

      navigate("/", { replace: true });
      window.location.assign("/");
    } catch (e) {
      console.error("[Profile] sign out failed", e);
      navigate("/", { replace: true });
      window.location.assign("/");
    } finally {
      window.clearTimeout(fallbackRedirect);
      setIsSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="px-5 pt-12 pb-4">
        <h1 className="text-lg font-bold text-foreground">Profile</h1>
      </header>

      <div className="px-5 space-y-5">
        {/* User Card */}
        <div className="flex items-center gap-4 rounded-lg bg-card p-4 shadow-sm">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <User className="h-7 w-7 text-primary" />
            {(isAdmin || isVolunteer) && (
              <span className={cn(
                "absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold text-white ring-2 ring-card",
                isAdmin ? "bg-destructive" : "bg-primary"
              )}>
                {isAdmin ? <Shield className="h-3 w-3" /> : <Clipboard className="h-3 w-3" />}
              </span>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-base font-bold text-foreground">{user?.email}</p>
            </div>
            {(isAdmin || isVolunteer) && (
              <div className="flex items-center gap-1.5 mt-1">
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                    <Shield className="h-2.5 w-2.5" /> Admin
                  </span>
                )}
                {isVolunteer && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    <Clipboard className="h-2.5 w-2.5" /> Volunteer
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => navigate("/settings")}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-muted"
          >
            <Settings className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Impact */}
        <ImpactStrip items={impactData} />

        {/* Seva Streak Calendar */}
        {user && <SevaStreakCalendar />}

        {/* Admin Link */}
        {isAdmin && (
          <Button
            onClick={() => navigate("/admin")}
            className="w-full h-12 rounded-lg text-base font-semibold bg-secondary hover:bg-secondary/90"
            size="lg"
          >
            <Shield className="h-4 w-4 mr-2" />
            Admin Dashboard
          </Button>
        )}

        {/* Volunteer Link */}
        {isVolunteer && (
          <Button
            onClick={() => navigate("/volunteer")}
            className="w-full h-12 rounded-lg text-base font-semibold"
            size="lg"
          >
            <Clipboard className="h-4 w-4 mr-2" />
            Volunteer Dashboard
          </Button>
        )}

        {/* Quick Actions */}
        <div className="space-y-2">
          <button
            onClick={() => navigate("/my-contributions")}
            className="w-full flex items-center gap-3 rounded-xl bg-card p-4 shadow-sm active:bg-muted/50 transition-colors"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <HandHeart className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-foreground">Your Contributions</p>
              <p className="text-xs text-muted-foreground">View all daans, receipts & status</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>

          <button
            onClick={() => navigate("/my-visits")}
            className="w-full flex items-center gap-3 rounded-xl bg-card p-4 shadow-sm active:bg-muted/50 transition-colors"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary/10">
              <MapPin className="h-5 w-5 text-secondary" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-foreground">Your Visits</p>
              <p className="text-xs text-muted-foreground">Planned & past gaushala visits</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Sign Out with Confirmation */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="w-full h-12 rounded-lg text-destructive border-destructive/20 hover:bg-destructive/5">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-[340px] rounded-xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Sign Out?
              </AlertDialogTitle>
              <AlertDialogDescription>
                You'll need to verify your phone number again to sign back in.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-lg" disabled={isSigningOut}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="rounded-lg bg-destructive hover:bg-destructive/90"
              >
                {isSigningOut ? "Signing out..." : "Sign Out"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
