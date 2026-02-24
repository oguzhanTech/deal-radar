"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Shield, Loader2 } from "lucide-react";
import { TRUSTED_SUBMITTER_THRESHOLD } from "@/lib/constants";
import type { Profile } from "@/lib/types/database";

interface AdminUsersContentProps {
  initialUsers: Profile[];
}

export function AdminUsersContent({ initialUsers }: AdminUsersContentProps) {
  const [users, setUsers] = useState(initialUsers);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const supabase = createClient();

  const toggleRole = async (userId: string, currentRole: string) => {
    setLoadingId(userId);
    const newRole = currentRole === "admin" ? "user" : "admin";
    await supabase.from("profiles").update({ role: newRole }).eq("user_id", userId);
    setUsers((prev) =>
      prev.map((u) => (u.user_id === userId ? { ...u, role: newRole as Profile["role"] } : u))
    );
    setLoadingId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Users Management</h2>
        <span className="text-sm text-muted-foreground">{users.length} users</span>
      </div>

      <div className="space-y-2">
        {users.map((user) => (
          <div key={user.user_id} className="border rounded-lg p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm truncate">{user.display_name || "Unnamed"}</p>
                {user.role === "admin" && (
                  <Badge className="text-[10px] bg-purple-100 text-purple-800 border-0">Admin</Badge>
                )}
                {user.trust_score >= TRUSTED_SUBMITTER_THRESHOLD && (
                  <Badge className="text-[10px] bg-green-100 text-green-800 border-0">Trusted</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {user.country || "No country"} · Trust: {user.trust_score}
              </p>
            </div>

            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs shrink-0"
              onClick={() => toggleRole(user.user_id, user.role)}
              disabled={loadingId === user.user_id}
            >
              {loadingId === user.user_id ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Shield className="h-3 w-3" />
              )}
              {user.role === "admin" ? "Remove Admin" : "Make Admin"}
            </Button>
          </div>
        ))}

        {users.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No users found</p>
        )}
      </div>
    </div>
  );
}
