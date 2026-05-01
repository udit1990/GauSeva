import { useState } from "react";
import { User, Building2, ArrowRightLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const ProfileTab = ({ profile, user, onSignOut, onGoSettings, gaushalas, onRaiseChangeRequest, changeRequests }: any) => {
  const [showChangeForm, setShowChangeForm] = useState(false);
  const [requestGaushala, setRequestGaushala] = useState("");
  const [requestReason, setRequestReason] = useState("");

  const assignedGaushala = gaushalas?.find((g: any) => g.id === profile?.gaushala_id);
  const pendingRequest = changeRequests?.find((cr: any) => cr.status === "pending");

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-card p-5 shadow-sm text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <User className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-lg font-bold text-foreground">{profile?.full_name || "Volunteer"}</h2>
        <p className="text-xs text-muted-foreground">{user?.email}</p>
        {profile?.phone && <p className="text-xs text-muted-foreground mt-0.5">{profile.phone}</p>}
        <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-secondary/10 px-3 py-1">
          <span className="text-xs font-semibold text-secondary">Volunteer</span>
        </div>
      </div>

      <div className="rounded-xl bg-card p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Tagged Gaushala</h3>
        </div>
        {assignedGaushala ? (
          <div className="rounded-lg bg-muted/30 p-3">
            <p className="text-sm font-semibold text-foreground">{assignedGaushala.name}</p>
            <p className="text-xs text-muted-foreground">{assignedGaushala.city}, {assignedGaushala.state}</p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">No gaushala assigned yet. Contact admin.</p>
        )}

        {pendingRequest ? (
          <div className="rounded-lg bg-primary/5 border border-primary/10 p-3 space-y-1">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-primary" />
              <p className="text-[11px] font-semibold text-primary">Change Request Pending</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Requested: {gaushalas?.find((g: any) => g.id === pendingRequest.requested_gaushala_id)?.name || "Unknown"}
            </p>
            {pendingRequest.reason && (
              <p className="text-[11px] text-muted-foreground italic">"{pendingRequest.reason}"</p>
            )}
          </div>
        ) : showChangeForm ? (
          <div className="space-y-2">
            <select
              value={requestGaushala}
              onChange={(e) => setRequestGaushala(e.target.value)}
              className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs"
            >
              <option value="">Select new gaushala</option>
              {gaushalas?.filter((g: any) => g.id !== profile?.gaushala_id).map((g: any) => (
                <option key={g.id} value={g.id}>{g.name}, {g.city}</option>
              ))}
            </select>
            <Textarea
              placeholder="Reason for change (optional)"
              value={requestReason}
              onChange={(e) => setRequestReason(e.target.value)}
              className="min-h-[60px] text-xs"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                className="rounded-lg text-xs h-8 flex-1"
                onClick={() => {
                  if (!requestGaushala) { toast.error("Select a gaushala"); return; }
                  onRaiseChangeRequest(requestGaushala, requestReason);
                  setShowChangeForm(false);
                  setRequestGaushala("");
                  setRequestReason("");
                }}
              >
                <ArrowRightLeft className="h-3 w-3 mr-1" /> Submit Request
              </Button>
              <Button size="sm" variant="ghost" className="rounded-lg text-xs h-8" onClick={() => setShowChangeForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          assignedGaushala && (
            <button
              onClick={() => setShowChangeForm(true)}
              className="flex items-center gap-1.5 text-xs text-primary font-medium"
            >
              <ArrowRightLeft className="h-3 w-3" /> Request Gaushala Change
            </button>
          )
        )}
      </div>

      <div className="space-y-2">
        <button
          onClick={onGoSettings}
          className="w-full rounded-xl bg-card p-4 shadow-sm text-left flex items-center justify-between transition-colors hover:bg-muted/50"
        >
          <span className="text-sm font-medium text-foreground">Settings</span>
          <span className="text-muted-foreground">›</span>
        </button>
        <button
          onClick={onSignOut}
          className="w-full rounded-xl bg-card p-4 shadow-sm text-left flex items-center justify-between transition-colors hover:bg-muted/50"
        >
          <span className="text-sm font-medium text-destructive">Sign Out</span>
          <span className="text-muted-foreground">›</span>
        </button>
      </div>
    </div>
  );
};

export default ProfileTab;
