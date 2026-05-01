import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Trash2, Eye, EyeOff, MapPin } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const AdminGaushalas = () => {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [description, setDescription] = useState("");

  const { data: gaushalas, isLoading } = useQuery({
    queryKey: ["admin-gaushalas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gaushalas_list")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("gaushalas_list").insert({
        name, city, state, description: description || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gaushalas"] });
      toast.success("Gaushala added");
      setName(""); setCity(""); setState(""); setDescription(""); setShowAdd(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: boolean }) => {
      const { error } = await supabase.from("gaushalas_list").update({ [field]: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-gaushalas"] }),
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gaushalas_list").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gaushalas"] });
      toast.success("Gaushala deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-foreground">Manage Gaushalas</h3>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)} className="rounded-lg">
          <Plus className="h-3.5 w-3.5 mr-1" /> Add
        </Button>
      </div>

      {showAdd && (
        <div className="rounded-lg bg-card p-3 shadow-sm space-y-2">
          <Input placeholder="Gaushala Name *" value={name} onChange={(e) => setName(e.target.value)} className="h-9" />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="City *" value={city} onChange={(e) => setCity(e.target.value)} className="h-9" />
            <Input placeholder="State *" value={state} onChange={(e) => setState(e.target.value)} className="h-9" />
          </div>
          <Input placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} className="h-9" />
          <Button
            size="sm"
            onClick={() => addMutation.mutate()}
            disabled={!name || !city || !state || addMutation.isPending}
            className="rounded-lg"
          >
            Save Gaushala
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {gaushalas?.map((g) => (
          <div key={g.id} className="rounded-lg bg-card p-3 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{g.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3" /> {g.city}, {g.state}
                </p>
              </div>
              <button onClick={() => deleteMutation.mutate(g.id)} className="p-1.5 rounded-full hover:bg-destructive/10">
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </button>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Switch
                  checked={g.is_active}
                  onCheckedChange={(v) => toggleMutation.mutate({ id: g.id, field: "is_active", value: v })}
                />
                Active for Daan
              </label>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Switch
                  checked={g.is_visit_ready}
                  onCheckedChange={(v) => toggleMutation.mutate({ id: g.id, field: "is_visit_ready", value: v })}
                />
                Open for Visits
              </label>
            </div>
          </div>
        ))}
        {gaushalas?.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No gaushalas added yet</p>}
      </div>
    </div>
  );
};

export default AdminGaushalas;
