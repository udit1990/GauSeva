import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, UserPlus, Trash2, ShieldCheck, Shield } from "lucide-react";

type AppRole = "admin" | "user" | "volunteer";

interface UserWithRoles {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  roles: AppRole[];
}

const roleBadgeVariant: Record<AppRole, string> = {
  admin: "bg-destructive/10 text-destructive border-destructive/20",
  volunteer: "bg-primary/10 text-primary border-primary/20",
  user: "bg-muted text-muted-foreground border-border",
};

const AdminRoles = () => {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<AppRole | "">("");
  const [assigning, setAssigning] = useState(false);

  const fetchUsersWithRoles = async () => {
    setLoading(true);
    try {
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("id, full_name, phone, email");
      if (pErr) throw pErr;

      const { data: roles, error: rErr } = await supabase
        .from("user_roles")
        .select("user_id, role");
      if (rErr) throw rErr;

      const roleMap: Record<string, AppRole[]> = {};
      roles?.forEach((r) => {
        if (!roleMap[r.user_id]) roleMap[r.user_id] = [];
        roleMap[r.user_id].push(r.role as AppRole);
      });

      const merged: UserWithRoles[] = (profiles || []).map((p) => ({
        id: p.id,
        full_name: p.full_name,
        phone: p.phone,
        email: p.email,
        roles: roleMap[p.id] || [],
      }));

      setUsers(merged);
    } catch (err: any) {
      toast.error(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersWithRoles();
  }, []);

  const handleAssignRole = async () => {
    if (!selectedUserId || !selectedRole) {
      toast.error("Select a user and role");
      return;
    }
    setAssigning(true);
    try {
      const { error } = await supabase.from("user_roles").insert({
        user_id: selectedUserId,
        role: selectedRole as AppRole,
      });
      if (error) {
        if (error.code === "23505") {
          toast.error("User already has this role");
        } else {
          throw error;
        }
      } else {
        toast.success("Role assigned!");
        setSelectedUserId("");
        setSelectedRole("");
        fetchUsersWithRoles();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to assign role");
    } finally {
      setAssigning(false);
    }
  };

  const handleRevokeRole = async (userId: string, role: AppRole) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);
      if (error) throw error;
      toast.success("Role revoked");
      fetchUsersWithRoles();
    } catch (err: any) {
      toast.error(err.message || "Failed to revoke role");
    }
  };

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.phone?.includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  const usersWithRoles = filtered.filter((u) => u.roles.length > 0);
  const usersWithoutRoles = filtered.filter((u) => u.roles.length === 0);

  return (
    <div className="space-y-5">
      {/* Assign role form */}
      <div className="rounded-xl bg-card border border-border p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <UserPlus className="h-4 w-4 text-primary" />
          Assign Role
        </h3>
        <div className="flex flex-col gap-2">
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="h-10 text-sm bg-background">
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id} className="text-sm">
                  {u.full_name || "Unnamed"} — {u.phone || u.email || u.id.slice(0, 8)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
              <SelectTrigger className="h-10 text-sm bg-background flex-1">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="volunteer">Volunteer</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAssignRole} disabled={assigning} size="sm" className="h-10 px-4">
              {assigning ? "…" : "Assign"}
            </Button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10 bg-card"
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
      ) : (
        <div className="space-y-3">
          {/* Users with roles */}
          {usersWithRoles.map((u) => (
            <div key={u.id} className="rounded-xl bg-card border border-border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{u.full_name || "Unnamed"}</p>
                  <p className="text-xs text-muted-foreground">{u.phone || u.email}</p>
                </div>
                <ShieldCheck className="h-4 w-4 text-primary" />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {u.roles.map((role) => (
                  <Badge
                    key={role}
                    variant="outline"
                    className={`${roleBadgeVariant[role]} text-[11px] gap-1 pr-1`}
                  >
                    {role}
                    <button
                      onClick={() => handleRevokeRole(u.id, role)}
                      className="ml-0.5 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          ))}

          {/* Users without roles */}
          {usersWithoutRoles.length > 0 && (
            <>
              <p className="text-xs text-muted-foreground pt-2">Other users ({usersWithoutRoles.length})</p>
              {usersWithoutRoles.map((u) => (
                <div key={u.id} className="rounded-xl bg-card border border-border p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{u.full_name || "Unnamed"}</p>
                    <p className="text-xs text-muted-foreground">{u.phone || u.email}</p>
                  </div>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminRoles;
