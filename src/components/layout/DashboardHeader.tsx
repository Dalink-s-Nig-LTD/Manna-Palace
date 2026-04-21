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
    <header className="bg-card border-b border-border px-3 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center flex-shrink-0">
            <img
              src={logo}
              alt="Manna Palace Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display font-bold text-base sm:text-xl text-foreground truncate">
              {isAdmin
                ? userName || "Admin Dashboard"
                : userName
                  ? `Cashier · ${userName}`
                  : "Cashier Dashboard"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              Redeemers University · Manna Palace
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {children}
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="text-muted-foreground hover:text-foreground text-xs sm:text-sm h-8 sm:h-10"
          >
            <LogOut className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Logout</span>
            <span className="sm:hidden">Out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
