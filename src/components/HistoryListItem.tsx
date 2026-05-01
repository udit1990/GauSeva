import { ChevronRight, Download, FileCheck, Camera } from "lucide-react";
import { downloadReceipt } from "@/lib/receiptGenerator";

interface HistoryListItemProps {
  title: string;
  date: string;
  amount: string;
  status: "completed" | "pending" | "processing" | "paid" | "failed";
  onClick?: () => void;
  hasCertificate?: boolean;
  certificateType?: "80g" | "general";
  evidenceCount?: number;
  order?: {
    id: string;
    created_at: string;
    donor_name: string;
    donor_email?: string | null;
    donor_pan?: string | null;
    total_amount: number;
  };
}

const statusColors = {
  completed: "bg-secondary/15 text-secondary",
  pending: "bg-primary/15 text-primary",
  processing: "bg-muted text-muted-foreground",
  paid: "bg-green-500/15 text-green-700 dark:text-green-400",
  failed: "bg-destructive/15 text-destructive",
};

const statusLabels = {
  completed: "Completed",
  pending: "Pending",
  processing: "Processing",
  paid: "Paid",
  failed: "Failed",
};

const HistoryListItem = ({
  title, date, amount, status, onClick,
  hasCertificate, certificateType, evidenceCount, order,
}: HistoryListItemProps) => {

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!order) return;
    downloadReceipt({
      receiptNumber: `DF-${order.id.slice(0, 8).toUpperCase()}`,
      date: new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
      donorName: order.donor_name,
      donorEmail: order.donor_email || undefined,
      donorPan: order.donor_pan || undefined,
      amount: Number(order.total_amount),
      orderId: order.id,
    });
  };

  return (
    <button
      onClick={onClick}
      className="flex w-full flex-col gap-2 rounded-lg bg-card p-4 shadow-sm active:bg-muted/50 transition-colors text-left"
    >
      <div className="flex items-center gap-3 w-full">
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{date}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-sm font-bold text-foreground">{amount}</p>
            <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[status]}`}>
              {statusLabels[status]}
            </span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Badges row */}
      {(hasCertificate || (evidenceCount !== undefined && evidenceCount > 0)) && (
        <div className="flex items-center gap-2 pt-1 border-t border-border">
          {hasCertificate && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-medium text-primary">
              <FileCheck className="h-3 w-3" />
              {certificateType === "80g" ? "80G Receipt" : "Certificate"}
            </span>
          )}
          {evidenceCount !== undefined && evidenceCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2.5 py-1 text-[10px] font-medium text-secondary">
              <Camera className="h-3 w-3" />
              {evidenceCount} Proof{evidenceCount > 1 ? "s" : ""}
            </span>
          )}
          {hasCertificate && order && (
            <button
              onClick={handleDownload}
              className="ml-auto inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[10px] font-medium text-accent-foreground hover:bg-accent/80 transition-colors"
            >
              <Download className="h-3 w-3" />
              Download
            </button>
          )}
        </div>
      )}
    </button>
  );
};

export default HistoryListItem;
