import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Save, X } from "lucide-react";

const AdminSkus = () => {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newSku, setNewSku] = useState({ name: "", description: "", price: "", unit: "unit", category_id: "annapurna" });
  const [filterCategory, setFilterCategory] = useState<string>("all");

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
      const { data } = await supabase.from("skus").select("*").order("category_id, sort_order");
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
    mutationFn: async () => {
      const { error } = await supabase.from("skus").insert({
        name: newSku.name,
        description: newSku.description,
        price: parseFloat(newSku.price),
        unit: newSku.unit,
        category_id: newSku.category_id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-skus"] });
      setShowAdd(false);
      setNewSku({ name: "", description: "", price: "", unit: "unit", category_id: "annapurna" });
      toast.success("SKU added");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = filterCategory === "all" ? skus : skus?.filter((s) => s.category_id === filterCategory);

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterCategory("all")}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${filterCategory === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
        >
          All
        </button>
        {categories?.map((c) => (
          <button
            key={c.id}
            onClick={() => setFilterCategory(c.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${filterCategory === c.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
          >
            {c.title}
          </button>
        ))}
      </div>

      {/* Add Button */}
      <Button onClick={() => setShowAdd(true)} size="sm" className="rounded-lg">
        <Plus className="h-4 w-4 mr-1" /> Add SKU
      </Button>

      {/* Add Form */}
      {showAdd && (
        <div className="rounded-lg bg-card p-3 shadow-sm space-y-2">
          <select
            value={newSku.category_id}
            onChange={(e) => setNewSku({ ...newSku, category_id: e.target.value })}
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            {categories?.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <Input placeholder="Name" value={newSku.name} onChange={(e) => setNewSku({ ...newSku, name: e.target.value })} className="h-10" />
          <Input placeholder="Description" value={newSku.description} onChange={(e) => setNewSku({ ...newSku, description: e.target.value })} className="h-10" />
          <div className="flex gap-2">
            <Input type="number" placeholder="Price" value={newSku.price} onChange={(e) => setNewSku({ ...newSku, price: e.target.value })} className="h-10" />
            <Input placeholder="Unit" value={newSku.unit} onChange={(e) => setNewSku({ ...newSku, unit: e.target.value })} className="h-10 w-24" />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => addMutation.mutate()} disabled={!newSku.name || !newSku.price}>
              <Save className="h-3.5 w-3.5 mr-1" /> Save
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowAdd(false)}>
              <X className="h-3.5 w-3.5 mr-1" /> Cancel
            </Button>
          </div>
        </div>
      )}

      {/* SKU List */}
      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}</div>
      ) : (
        <div className="space-y-2">
          {filtered?.map((sku) => (
            <div key={sku.id} className="rounded-lg bg-card p-3 shadow-sm">
              {editingId === sku.id ? (
                <div className="space-y-2">
                  <Input value={editValues.name} onChange={(e) => setEditValues({ ...editValues, name: e.target.value })} className="h-9" />
                  <Input value={editValues.description || ""} onChange={(e) => setEditValues({ ...editValues, description: e.target.value })} className="h-9" />
                  <div className="flex gap-2">
                    <Input type="number" value={editValues.price} onChange={(e) => setEditValues({ ...editValues, price: e.target.value })} className="h-9" />
                    <Input value={editValues.unit} onChange={(e) => setEditValues({ ...editValues, unit: e.target.value })} className="h-9 w-24" />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => updateMutation.mutate({ id: sku.id, name: editValues.name, description: editValues.description, price: parseFloat(editValues.price), unit: editValues.unit })}>
                      <Save className="h-3.5 w-3.5 mr-1" /> Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{sku.name}</p>
                    <p className="text-xs text-muted-foreground">₹{sku.price} / {sku.unit} • {sku.category_id}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingId(sku.id); setEditValues({ name: sku.name, description: sku.description, price: sku.price, unit: sku.unit }); }} className="p-2 rounded-md hover:bg-muted">
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <button onClick={() => deleteMutation.mutate(sku.id)} className="p-2 rounded-md hover:bg-destructive/10">
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSkus;
