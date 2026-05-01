import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Filter, FileCheck, Award } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import HistoryListItem from "@/components/HistoryListItem";
import BottomNav from "@/components/BottomNav";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const getFYOptions = () => {
  const now = new Date();
  const currentYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const options = [];
  for (let i = 0; i < 4; i++) {
    const start = currentYear - i;
    options.push({ value: `${start}`, label: `FY ${start}-${(start + 1).toString().slice(2)}` });
  }
  return options;
};

const MyContributions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [fyFilter, setFyFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: orders } = useQuery({
    queryKey: ["my-contributions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: certificates } = useQuery({
    queryKey: ["my-certificates", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("certificates")
        .select("order_id, certificate_type")
        .eq("user_id", user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: evidenceCounts } = useQuery({
    queryKey: ["my-evidence-counts", user?.id],
    queryFn: async () => {
      if (!user || !orders) return {};
      const orderIds = orders.map((o) => o.id);
      if (orderIds.length === 0) return {};
      const { data, error } = await supabase
        .from("order_evidence")
        .select("order_id")
        .in("order_id", orderIds);
      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach((e) => {
        counts[e.order_id] = (counts[e.order_id] || 0) + 1;
      });
      return counts;
    },
    enabled: !!user && !!orders && orders.length > 0,
  });

  const { data: categories } = useQuery({
    queryKey: ["seva-categories-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("seva_categories").select("id, title").eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const certMap = new Map(certificates?.map((c) => [c.order_id, c.certificate_type]) || []);

  const filtered = orders?.filter((order) => {
    if (fyFilter !== "all") {
      const fyStart = parseInt(fyFilter);
      const created = new Date(order.created_at);
      const fyStartDate = new Date(fyStart, 3, 1);
      const fyEndDate = new Date(fyStart + 1, 2, 31, 23, 59, 59);
      if (created < fyStartDate || created > fyEndDate) return false;
    }
    if (categoryFilter !== "all") {
      const hasCategory = order.order_items?.some((item: any) => item.category_id === categoryFilter);
      if (!hasCategory) return false;
    }
    return true;
  });

  const totalDonated = filtered?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;
  const totalCerts = filtered?.filter((o) => certMap.has(o.id)).length || 0;
  const totalEvidence = filtered?.reduce((sum, o) => sum + (evidenceCounts?.[o.id] || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button onClick={() => navigate(-1)} className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Your Contributions</h1>
      </header>

      <div className="px-5 space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-primary/10 p-3 text-center">
            <p className="text-lg font-bold text-primary">{filtered?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Total Daans</p>
          </div>
          <div className="rounded-lg bg-secondary/10 p-3 text-center">
            <p className="text-lg font-bold text-secondary">₹{totalDonated.toLocaleString("en-IN")}</p>
            <p className="text-xs text-muted-foreground">Total Donated</p>
          </div>
        </div>

        {/* Certificates & Evidence summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-card p-3 shadow-sm">
            <FileCheck className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-bold text-foreground">{totalCerts}</p>
              <p className="text-[10px] text-muted-foreground">Certificates</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-card p-3 shadow-sm">
            <Award className="h-5 w-5 text-secondary" />
            <div>
              <p className="text-sm font-bold text-foreground">{totalEvidence}</p>
              <p className="text-[10px] text-muted-foreground">Proof Photos</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Select value={fyFilter} onValueChange={setFyFilter}>
            <SelectTrigger className="h-9 text-xs flex-1">
              <Filter className="h-3 w-3 mr-1" />
              <SelectValue placeholder="Financial Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {getFYOptions().map((fy) => (
                <SelectItem key={fy.value} value={fy.value}>{fy.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-9 text-xs flex-1">
              <SelectValue placeholder="Daan Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Orders List */}
        <div className="space-y-2">
          {filtered && filtered.length > 0 ? (
            filtered.map((order) => {
              const certType = certMap.get(order.id);
              return (
                <HistoryListItem
                  key={order.id}
                  title={order.order_items?.[0]?.sku_name ? `${order.order_items[0].sku_name}${order.order_items.length > 1 ? ` +${order.order_items.length - 1} more` : ""}` : "Daan Donation"}
                  date={new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  amount={`₹${Number(order.total_amount).toLocaleString("en-IN")}`}
                  status={order.status === "paid" ? "paid" : order.status === "completed" ? "completed" : order.status === "failed" ? "failed" : order.status === "pending" ? "pending" : "processing"}
                  hasCertificate={!!certType}
                  certificateType={certType as "80g" | "general" | undefined}
                  evidenceCount={evidenceCounts?.[order.id] || 0}
                  order={{
                    id: order.id,
                    created_at: order.created_at,
                    donor_name: order.donor_name,
                    donor_email: order.donor_email,
                    donor_pan: order.donor_pan,
                    total_amount: order.total_amount,
                  }}
                  onClick={() => navigate(`/proof/${order.id}`)}
                />
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No contributions found</p>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default MyContributions;
