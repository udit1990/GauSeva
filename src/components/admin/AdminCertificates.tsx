import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Download, Shield, ScrollText, Mail, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadReceipt } from "@/lib/receiptGenerator";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

const typeFilters = ["all", "80g", "general"] as const;

const AdminCertificates = () => {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  const { data: certificates, isLoading } = useQuery({
    queryKey: ["admin-certificates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certificates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const emailMutation = useMutation({
    mutationFn: async (certificateId: string) => {
      const { data, error } = await supabase.functions.invoke("email-certificate", {
        body: { certificate_id: certificateId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast({ title: "Email sent", description: "Certificate emailed to donor successfully." });
      queryClient.invalidateQueries({ queryKey: ["admin-certificates"] });
    },
    onError: (err: Error) => {
      toast({ title: "Email failed", description: err.message, variant: "destructive" });
    },
  });

  const filtered = certificates?.filter((c: any) => {
    if (typeFilter !== "all" && c.certificate_type !== typeFilter) return false;
    return true;
  });

  const handleDownload = (cert: any) => {
    downloadReceipt({
      receiptNumber: cert.certificate_number,
      date: new Date(cert.issued_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      donorName: cert.donor_name,
      donorEmail: cert.donor_email || undefined,
      donorPan: cert.donor_pan || undefined,
      amount: Number(cert.amount),
      orderId: cert.order_id,
    });
  };

  const total80g = certificates?.filter((c: any) => c.certificate_type === "80g").length || 0;
  const totalGeneral = certificates?.filter((c: any) => c.certificate_type === "general").length || 0;

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-card p-2.5 shadow-sm text-center">
          <p className="text-lg font-bold text-foreground">{certificates?.length || 0}</p>
          <p className="text-[10px] text-muted-foreground">Total</p>
        </div>
        <div className="rounded-lg bg-primary/5 p-2.5 shadow-sm text-center">
          <p className="text-lg font-bold text-primary">{total80g}</p>
          <p className="text-[10px] text-muted-foreground">80G Receipts</p>
        </div>
        <div className="rounded-lg bg-secondary/5 p-2.5 shadow-sm text-center">
          <p className="text-lg font-bold text-secondary">{totalGeneral}</p>
          <p className="text-[10px] text-muted-foreground">General</p>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-1.5">
        {typeFilters.map((f) => (
          <button
            key={f}
            onClick={() => setTypeFilter(f)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors capitalize",
              typeFilter === f
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {f === "80g" ? "80G Receipts" : f === "general" ? "General" : "All"}
          </button>
        ))}
      </div>

      {/* Certificate list */}
      {filtered?.map((cert: any) => (
        <div key={cert.id} className="rounded-lg bg-card p-3 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                  cert.certificate_type === "80g"
                    ? "bg-primary/10"
                    : "bg-secondary/10"
                )}
              >
                {cert.certificate_type === "80g" ? (
                  <Shield className="h-4 w-4 text-primary" />
                ) : (
                  <ScrollText className="h-4 w-4 text-secondary" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {cert.donor_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {cert.certificate_number} •{" "}
                  {new Date(cert.issued_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={cn(
                      "inline-block rounded-full px-2 py-0.5 text-[10px] font-medium",
                      cert.certificate_type === "80g"
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary/10 text-secondary"
                    )}
                  >
                    {cert.certificate_type === "80g"
                      ? "80G Tax Receipt"
                      : "Donation Certificate"}
                  </span>
                  <span className="text-xs font-bold text-foreground">
                    ₹{Number(cert.amount).toLocaleString("en-IN")}
                  </span>
                </div>
                {cert.donor_pan && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    PAN: {cert.donor_pan.toUpperCase()}
                  </p>
                )}
                {cert.emailed_at && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                    Emailed {new Date(cert.emailed_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1.5 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="text-xs rounded-lg"
                onClick={() => handleDownload(cert)}
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                PDF
              </Button>
              {cert.donor_email && (
                <Button
                  size="sm"
                  variant={cert.emailed_at ? "ghost" : "default"}
                  className="text-xs rounded-lg"
                  disabled={emailMutation.isPending}
                  onClick={() => emailMutation.mutate(cert.id)}
                >
                  {emailMutation.isPending && emailMutation.variables === cert.id ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  ) : (
                    <Mail className="h-3.5 w-3.5 mr-1" />
                  )}
                  {cert.emailed_at ? "Resend" : "Email"}
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}

      {filtered?.length === 0 && (
        <div className="text-center py-8">
          <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No certificates found</p>
        </div>
      )}
    </div>
  );
};

export default AdminCertificates;
