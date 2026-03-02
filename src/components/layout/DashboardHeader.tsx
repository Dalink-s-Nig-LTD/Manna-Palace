import React from "react";
import { Button } from "@/components/ui/button";
import { LogOut, User, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";

interface DashboardHeaderProps {
  onLogout: () => void;
  children?: React.ReactNode;
}

export function DashboardHeader({ onLogout, children }: DashboardHeaderProps) {
  const { role, userName } = useAuth();
  const isAdmin =
    role === "superadmin" ||
    role === "manager" ||
    role === "vc" ||
    role === "supervisor";

  return (
    <header className="border-b border-border px-6 py-3 bg-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 flex items-center justify-center shrink-0">
            <img
              src={logo}
              alt="Manna Palace Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-foreground">
              {isAdmin
                ? userName
                  ? `Welcome ${userName}`
                  : "Welcome Admin Dashboard"
                : userName
                  ? `Welcome Cashier · ${userName}`
                  : "Welcome Cashier Dashboard"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {children}
          <Button
            variant="ghost"
            onClick={onLogout}
            className="text-base px-4 py-2 text-foreground/80 hover:text-white hover:bg-primary font-semibold transition-colors"
          >
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
