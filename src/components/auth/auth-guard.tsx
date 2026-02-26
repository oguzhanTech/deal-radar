"use client";

import { useState, useCallback, useRef } from "react";
import { useAuth } from "./auth-provider";
import { LoginModal } from "./login-modal";

export function useAuthGuard() {
  const { user } = useAuth();
  const userRef = useRef(user);
  userRef.current = user;

  const [showLogin, setShowLogin] = useState(false);

  const requireAuth = useCallback(
    (action: () => void | Promise<void>) => {
      if (userRef.current) {
        const result = action();
        if (result instanceof Promise) {
          result.catch(console.error);
        }
      } else {
        setShowLogin(true);
      }
    },
    []
  );

  const AuthModal = () => (
    <LoginModal open={showLogin} onOpenChange={setShowLogin} />
  );

  return { requireAuth, AuthModal, isAuthenticated: !!user };
}
