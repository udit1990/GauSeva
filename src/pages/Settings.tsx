import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { usePersona } from "@/hooks/usePersona";
import {
  ArrowLeft, User, Mail, Phone, CreditCard, Save, LogOut,
  Shield, Clipboard, ChevronRight, AlertTriangle, Heart, PawPrint,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
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

const Settings = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAdmin, isVolunteer, signOut, loading: authLoading } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pan, setPan] = useState("");
  const [dirty, setDirty] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setEmail(profile.email || "");
      setPhone(profile.phone || "");
      setPan(profile.pan || "");
      setDirty(false);
    }
  }, [profile]);

  const handleFieldChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    setDirty(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim() || null,
          email: email.trim() || null,
          phone: phone.trim() || null,
          pan: pan.trim().toUpperCase() || null,
        })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile updated");
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to save"),
  });

  const { clearCart, totalItems } = useCart();
  const { persona, setPersona } = usePersona();
  const [showPersonaConfirm, setShowPersonaConfirm] = useState(false);
  const [pendingPersona, setPendingPersona] = useState<"gau_seva" | "animal_welfare" | null>(null);

  const handleSignOut = async () => {
    clearCart();
    queryClient.clear();
    await signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };


  const roleBadge = isAdmin
    ? { label: "System Admin", icon: Shield, cls: "text-destructive bg-destructive/10" }
    : isVolunteer
    ? { label: "Volunteer", icon: Clipboard, cls: "text-primary bg-primary/10" }
    : { label: "Donor", icon: User, cls: "text-muted-foreground bg-muted" };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button
          onClick={() => navigate("/profile")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-sm"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Settings</h1>
      </header>

      <div className="px-5 space-y-5">
        {/* Role Badge */}
        <div className="flex items-center gap-3 rounded-xl bg-card border border-border p-4">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${roleBadge.cls}`}>
            <roleBadge.icon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">{roleBadge.label}</p>
            <p className="text-xs text-muted-foreground">{phone || user?.email || "No contact info"}</p>
          </div>
        </div>

        {/* Profile Fields */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Personal Information</h3>

          <div className="space-y-2.5">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Full Name"
                value={fullName}
                onChange={handleFieldChange(setFullName)}
                className="h-11 pl-10 rounded-lg bg-card text-sm"
              />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Phone Number"
                value={phone}
                onChange={handleFieldChange(setPhone)}
                className="h-11 pl-10 rounded-lg bg-card text-sm"
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={handleFieldChange(setEmail)}
                className="h-11 pl-10 rounded-lg bg-card text-sm"
              />
            </div>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="PAN (for 80G receipts)"
                value={pan}
                onChange={handleFieldChange(setPan)}
                className="h-11 pl-10 rounded-lg bg-card text-sm uppercase"
                maxLength={10}
              />
            </div>
          </div>

          {dirty && (
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="w-full h-11 rounded-lg text-sm font-semibold"
            >
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? "Saving…" : "Save Changes"}
            </Button>
          )}
        </div>

        {/* Persona Preference */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Experience</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                if (persona === "gau_seva") return;
                if (totalItems > 0) { setPendingPersona("gau_seva"); setShowPersonaConfirm(true); }
                else setPersona("gau_seva");
              }}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                persona === "gau_seva" ? "border-primary bg-primary/5" : "border-border bg-card"
              }`}
            >
              <Heart className={`h-5 w-5 ${persona === "gau_seva" ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-sm font-medium ${persona === "gau_seva" ? "text-primary" : "text-foreground"}`} lang="hi">गौ सेवा</span>
            </button>
            <button
              onClick={() => {
                if (persona === "animal_welfare") return;
                if (totalItems > 0) { setPendingPersona("animal_welfare"); setShowPersonaConfirm(true); }
                else setPersona("animal_welfare");
              }}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                persona === "animal_welfare" ? "border-primary bg-primary/5" : "border-border bg-card"
              }`}
            >
              <PawPrint className={`h-5 w-5 ${persona === "animal_welfare" ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-sm font-medium ${persona === "animal_welfare" ? "text-primary" : "text-foreground"}`}>Animal Welfare</span>
            </button>
          </div>
        </div>

        {/* Persona switch confirmation */}
        <AlertDialog open={showPersonaConfirm} onOpenChange={setShowPersonaConfirm}>
          <AlertDialogContent className="max-w-[340px] rounded-xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Switch experience?</AlertDialogTitle>
              <AlertDialogDescription>
                Your cart has {totalItems} item{totalItems !== 1 ? "s" : ""}. Switching will clear your cart.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-lg" onClick={() => setPendingPersona(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction className="rounded-lg" onClick={() => {
                clearCart();
                if (pendingPersona) setPersona(pendingPersona);
                setPendingPersona(null);
                setShowPersonaConfirm(false);
              }}>Switch & Clear Cart</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>


        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Quick Access</h3>

          {isAdmin && (
            <button
              onClick={() => navigate("/admin")}
              className="w-full flex items-center gap-3 rounded-xl bg-card border border-border p-3.5 active:bg-muted/50 transition-colors"
            >
              <Shield className="h-5 w-5 text-destructive" />
              <span className="flex-1 text-left text-sm font-medium text-foreground">Admin Dashboard</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          )}

          {isVolunteer && (
            <button
              onClick={() => navigate("/volunteer")}
              className="w-full flex items-center gap-3 rounded-xl bg-card border border-border p-3.5 active:bg-muted/50 transition-colors"
            >
              <Clipboard className="h-5 w-5 text-primary" />
              <span className="flex-1 text-left text-sm font-medium text-foreground">Volunteer Dashboard</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          )}

          <button
            onClick={() => navigate("/my-contributions")}
            className="w-full flex items-center gap-3 rounded-xl bg-card border border-border p-3.5 active:bg-muted/50 transition-colors"
          >
            <CreditCard className="h-5 w-5 text-primary" />
            <span className="flex-1 text-left text-sm font-medium text-foreground">My Contributions</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>

          <button
            onClick={() => navigate("/my-visits")}
            className="w-full flex items-center gap-3 rounded-xl bg-card border border-border p-3.5 active:bg-muted/50 transition-colors"
          >
            <User className="h-5 w-5 text-muted-foreground" />
            <span className="flex-1 text-left text-sm font-medium text-foreground">My Visits</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Sign Out */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full h-12 rounded-lg text-destructive border-destructive/20 hover:bg-destructive/5"
            >
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
              <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSignOut}
                className="rounded-lg bg-destructive hover:bg-destructive/90"
              >
                Sign Out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <p className="text-center text-[11px] text-muted-foreground pb-2">
          Signed in as {user?.email || phone || "—"}
        </p>
      </div>

      <BottomNav />
    </div>
  );
};

export default Settings;
