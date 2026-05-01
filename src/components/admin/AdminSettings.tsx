import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { MessageSquare, Settings, UserPlus, Mail, CalendarDays, Newspaper } from "lucide-react";
import { toast } from "sonner";

const flagMeta: Record<string, { label: string; icon: typeof MessageSquare; description: string }> = {
  auto_assign_volunteers: {
    label: "Auto-Assign Volunteers",
    icon: UserPlus,
    description: "Automatically assign volunteers to new orders and visits based on gaushala mapping.",
  },
  auto_approve_basic_evidence: {
    label: "Auto-Approve Basic Evidence",
    icon: Settings,
    description: "Automatically approve validated volunteer photo uploads for paid orders on the standard happy path.",
  },
  email_receipts: {
    label: "Email Receipts",
    icon: Mail,
    description: "Automatically email 80G/donation receipts to donors after successful payment.",
  },
  gift_whatsapp_notify: {
    label: "Gift WhatsApp Notification",
    icon: MessageSquare,
    description: "Send a WhatsApp message to the gift recipient after a gift donation is completed.",
  },
  daily_volunteer_digest: {
    label: "Daily Volunteer Digest",
    icon: Newspaper,
    description: "Send a daily email summary to available volunteers with their pending tasks.",
  },
  visit_booking_enabled: {
    label: "Visit Booking",
    icon: CalendarDays,
    description: "Allow donors to book gaushala visits through the app.",
  },
};

const AdminSettings = () => {
  const queryClient = useQueryClient();

  const { data: flags, isLoading } = useQuery({
    queryKey: ["feature-flags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feature_flags")
        .select("*")
        .order("id");
      if (error) throw error;
      return data as { id: string; enabled: boolean; description: string | null; updated_at: string }[];
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from("feature_flags")
        .update({ enabled, updated_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { id, enabled }) => {
      queryClient.invalidateQueries({ queryKey: ["feature-flags"] });
      const meta = flagMeta[id];
      toast.success(`${meta?.label || id} ${enabled ? "enabled" : "disabled"}`);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update flag");
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Settings className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">Feature Flags</h2>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {flags?.map((flag) => {
            const meta = flagMeta[flag.id] || {
              label: flag.id,
              icon: Settings,
              description: flag.description || "",
            };
            const Icon = meta.icon;

            return (
              <div
                key={flag.id}
                className="flex items-center gap-4 rounded-xl bg-card border border-border p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{meta.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{meta.description}</p>
                  {flag.id === "gift_whatsapp_notify" && !flag.enabled && (
                    <p className="text-[10px] text-muted-foreground mt-1 italic">
                      Requires Twilio WhatsApp API credentials to function when enabled
                    </p>
                  )}
                </div>
                <Switch
                  checked={flag.enabled}
                  onCheckedChange={(checked) =>
                    toggleMutation.mutate({ id: flag.id, enabled: checked })
                  }
                  disabled={toggleMutation.isPending}
                />
              </div>
            );
          })}

          {flags?.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No feature flags configured</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
