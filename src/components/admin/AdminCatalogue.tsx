import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Save, X, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const AdminCatalogue = () => {
  const queryClient = useQueryClient();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});
  const [showAddSku, setShowAddSku] = useState<string | null>(null);
  const [newSku, setNewSku] = useState({ name: "", description: "", price: "", unit: "unit" });

  const { data: categories } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("seva_categories").select("*").order("sort_order");
      return data || [];
    },
  });

  const { data: skus, isLoading } = useQuery({
    queryKey: ["admin-skus"],
    queryFn: async () => {
      const { data } = await supabase.from("skus").select("*").order("sort_order");
      return data || [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...values }: any) => {
      const { error } = await supabase.from("skus").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-skus"] });
      setEditingId(null);
      toast.success("SKU updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("skus").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-skus"] });
      toast.success("SKU deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const addMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const { error } = await supabase.from("skus").insert({
        name: newSku.name,
        description: newSku.description || null,
        price: parseFloat(newSku.price),
        unit: newSku.unit,
        category_id: categoryId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-skus"] });
      setShowAddSku(null);
      setNewSku({ name: "", description: "", price: "", unit: "unit" });
      toast.success("SKU added");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleActiveM = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("skus").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-skus"] }),
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}</div>;

  const getSkusForCategory = (categoryId: string) => skus?.filter((s) => s.category_id === categoryId) || [];

  return (
    <div className="space-y-3">
      {categories?.map((cat) => {
        const catSkus = getSkusForCategory(cat.id);
        const isExpanded = expandedCategory === cat.id;
        const activeCount = catSkus.filter((s) => s.is_active).length;

        return (
          <div key={cat.id} className="rounded-xl bg-card border border-border overflow-hidden">
            {/* Category Header */}
            <button
              onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
              className="w-full flex items-center justify-between p-3 text-left"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{cat.title}</p>
                <p className="text-[10px] text-muted-foreground">{catSkus.length} SKUs • {activeCount} active</p>
              </div>
              {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </button>

            {/* SKUs */}
            {isExpanded && (
              <div className="border-t border-border">
                {catSkus.map((sku) => (
                  <div key={sku.id} className="border-b border-border last:border-0 p-3">
                    {editingId === sku.id ? (
                      <div className="space-y-2">
                        <Input value={editValues.name} onChange={(e) => setEditValues({ ...editValues, name: e.target.value })} className="h-8 text-sm" placeholder="Name" />
                        <div className="flex gap-2">
                          <Input type="number" value={editValues.price} onChange={(e) => setEditValues({ ...editValues, price: e.target.value })} className="h-8 text-sm" placeholder="Price" />
                          <Input value={editValues.unit} onChange={(e) => setEditValues({ ...editValues, unit: e.target.value })} className="h-8 text-sm w-20" placeholder="Unit" />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="h-7 text-xs" onClick={() => updateMutation.mutate({ id: sku.id, name: editValues.name, price: parseFloat(editValues.price), unit: editValues.unit })}>
                            <Save className="h-3 w-3 mr-1" /> Save
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditingId(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm font-medium", sku.is_active ? "text-foreground" : "text-muted-foreground line-through")}>{sku.name}</p>
                          <p className="text-xs text-muted-foreground">₹{sku.price} / {sku.unit}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleActiveM.mutate({ id: sku.id, is_active: !sku.is_active })}
                            className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", sku.is_active ? "bg-secondary/10 text-secondary" : "bg-muted text-muted-foreground")}
                          >
                            {sku.is_active ? "Active" : "Off"}
                          </button>
                          <button onClick={() => { setEditingId(sku.id); setEditValues({ name: sku.name, price: sku.price, unit: sku.unit }); }} className="p-1.5 rounded-md hover:bg-muted">
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                          <button onClick={() => deleteMutation.mutate(sku.id)} className="p-1.5 rounded-md hover:bg-destructive/10">
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Add SKU Form */}
                {showAddSku === cat.id ? (
                  <div className="p-3 space-y-2 bg-muted/30">
                    <Input placeholder="SKU Name" value={newSku.name} onChange={(e) => setNewSku({ ...newSku, name: e.target.value })} className="h-8 text-sm" />
                    <div className="flex gap-2">
                      <Input type="number" placeholder="Price" value={newSku.price} onChange={(e) => setNewSku({ ...newSku, price: e.target.value })} className="h-8 text-sm" />
                      <Input placeholder="Unit" value={newSku.unit} onChange={(e) => setNewSku({ ...newSku, unit: e.target.value })} className="h-8 text-sm w-20" />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="h-7 text-xs" onClick={() => addMutation.mutate(cat.id)} disabled={!newSku.name || !newSku.price}>
                        <Save className="h-3 w-3 mr-1" /> Add
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowAddSku(null)}>
                        <X className="h-3 w-3 mr-1" /> Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowAddSku(cat.id)} className="w-full p-2.5 text-xs font-medium text-primary flex items-center justify-center gap-1 hover:bg-primary/5 transition-colors">
                    <Plus className="h-3.5 w-3.5" /> Add SKU
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AdminCatalogue;