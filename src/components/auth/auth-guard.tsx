"use client";

import { useState, useCallback } from "react";
import { useAuth } from "./auth-provider";
import { LoginModal } from "./login-modal";

export function useAuthGuard() {
  const { user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  const requireAuth = useCallback(
    (action: () => void) => {
      if (user) {
        action();
      } else {
        setShowLogin(true);
      }
    },
    [user]
  );

  const AuthModal = () => (
    <LoginModal open={showLogin} onOpenChange={setShowLogin} />
  );

  return { requireAuth, AuthModal, isAuthenticated: !!user };
}
