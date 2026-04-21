import React, { useState } from "react";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { StatsCards } from "@/components/admin/StatsCards";
import { AllTimeSales } from "@/components/admin/AllTimeSales";
import { TodayOrders } from "@/components/admin/TodayOrders";
import { SalesChart } from "@/components/admin/SalesChart";
import { CategoryChart } from "@/components/admin/CategoryChart";
import { MenuManagement } from "@/components/admin/MenuManagement";
import { RecentOrders } from "@/components/admin/RecentOrders";
import { UserManagement } from "@/components/admin/UserManagement";
import { AccessCodeGenerator } from "@/components/admin/AccessCodeGenerator";
import { ExportReports } from "@/components/admin/ExportReports";
import { DataReset } from "@/components/admin/DataReset";
import { AllOrdersViewer } from "@/components/admin/AllOrdersViewer";
import { ActivityLogs } from "@/components/admin/ActivityLogs";
import { SpecialOrdersReport } from "@/components/admin/SpecialOrdersReport";
import { ManualEntries } from "@/components/admin/ManualEntries";
import { CustomerManagement } from "@/components/admin/CustomerManagement";
import { ShiftManagement } from "@/components/admin/ShiftManagement";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Users,
  Key,
  FileText,
  Menu,
  Crown,
  Database,
  Activity,
  Package,
  Wallet,
  BarChart3,
  GraduationCap,
  Clock,
  ShoppingCart,
  LogOut,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/cafeteria";
import logo from "@/assets/logo.png";

interface AdminDashboardProps {
  onLogout: () => void;
}

type TabType =
  | "overview"
  | "sales"
  | "menu"
  | "customers"
  | "users"
  | "codes"
  | "reports"
  | "all-orders"
  | "logs"
  | "reset"
  | "special-orders"
  | "manual-entries"
  | "shifts";

interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ReactNode;
  allowedRoles: UserRole[];
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const { role } = useAuth();

  // Role checks
  const isSuperadmin = role === "superadmin";
  const isManager = role === "manager";
  const isVC = role === "vc" || role === "supervisor";
  const canEditMenu = isSuperadmin || isManager;
  const canManageUsers = isSuperadmin;

  const tabs: TabConfig[] = [
    {
      id: "overview",
      label: "Overview",
      icon: <LayoutDashboard className="w-4 h-4" />,
      allowedRoles: ["superadmin", "manager", "vc"],
    },
    {
      id: "sales",
      label: "Sales",
      icon: <BarChart3 className="w-4 h-4" />,
      allowedRoles: ["superadmin", "manager", "vc"],
    },
    {
      id: "menu",
      label: "Menu",
      icon: <UtensilsCrossed className="w-4 h-4" />,
      allowedRoles: ["superadmin", "manager"],
    },
    {
      id: "customers",
      label: "Customers",
      icon: <GraduationCap className="w-4 h-4" />,
      allowedRoles: ["superadmin", "manager"],
    },
    {
      id: "users",
      label: "Admin Users",
      icon: <Users className="w-4 h-4" />,
      allowedRoles: ["superadmin"],
    },
    {
      id: "codes",
      label: "Access Codes",
      icon: <Key className="w-4 h-4" />,
      allowedRoles: ["superadmin", "manager"],
    },
    {
      id: "reports",
      label: "Reports",
      icon: <FileText className="w-4 h-4" />,
      allowedRoles: ["superadmin", "manager", "vc"],
    },
    {
      id: "all-orders",
      label: "All Orders",
      icon: <ShoppingCart className="w-4 h-4" />,
      allowedRoles: ["superadmin"],
    },
    {
      id: "special-orders",
      label: "Special Orders",
      icon: <Package className="w-4 h-4" />,
      allowedRoles: ["superadmin", "manager", "vc"],
    },
    {
      id: "logs",
      label: "Activity Logs",
      icon: <Activity className="w-4 h-4" />,
      allowedRoles: ["superadmin"],
    },
    {
      id: "manual-entries",
      label: "Manual Entries",
      icon: <Wallet className="w-4 h-4" />,
      allowedRoles: ["superadmin"],
    },
    {
      id: "reset",
      label: "Data Reset",
      icon: <Database className="w-4 h-4" />,
      allowedRoles: ["superadmin"],
    },
    {
      id: "shifts",
      label: "Shift Settings",
      icon: <Clock className="w-4 h-4" />,
      allowedRoles: ["superadmin"],
    },
  ];

  const visibleTabs = tabs.filter((tab) =>
    tab.allowedRoles.includes(role as UserRole),
  );

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <TodayOrders />
            {!isMobile && (
              <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
                <SalesChart />
                <CategoryChart />
              </div>
            )}
            <RecentOrders />
          </div>
        );
      case "sales":
        return (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <AllTimeSales />
            <StatsCards />
          </div>
        );
      case "menu":
        return canEditMenu ? (
          <div className="animate-fade-in">
            <MenuManagement />
          </div>
        ) : null;
      case "customers":
        return canEditMenu ? (
          <div className="animate-fade-in">
            <CustomerManagement />
          </div>
        ) : null;
      case "users":
        return canManageUsers ? (
          <div className="animate-fade-in">
            <UserManagement />
          </div>
        ) : null;
      case "codes":
        return canEditMenu ? (
          <div className="animate-fade-in">
            <AccessCodeGenerator />
          </div>
        ) : null;
      case "reports":
        return (
          <div className="animate-fade-in">
            <ExportReports />
          </div>
        );
      case "all-orders":
        return isSuperadmin ? (
          <div className="animate-fade-in">
            <AllOrdersViewer />
          </div>
        ) : null;
      case "special-orders":
        return (
          <div className="animate-fade-in">
            <SpecialOrdersReport />
          </div>
        );
      case "logs":
        return isSuperadmin ? (
          <div className="animate-fade-in">
            <ActivityLogs />
          </div>
        ) : null;
      case "manual-entries":
        return isSuperadmin ? (
          <div className="animate-fade-in">
            <ManualEntries />
          </div>
        ) : null;
      case "reset":
        return isSuperadmin ? (
          <div className="animate-fade-in">
            <DataReset />
          </div>
        ) : null;
      case "shifts":
        return isSuperadmin ? (
          <div className="animate-fade-in">
            <ShiftManagement />
          </div>
        ) : null;
      default:
        return null;
    }
  };

  const TabNavigation = ({ showLogout = false }: { showLogout?: boolean }) => (
    <div className="flex flex-col gap-1">
      {visibleTabs.map((tab) => (
        <Button
          key={tab.id}
          variant={activeTab === tab.id ? "default" : "ghost"}
          onClick={() => handleTabChange(tab.id)}
          className="justify-start gap-2"
        >
          {tab.icon}
          {tab.label}
          {tab.allowedRoles.includes("superadmin") &&
            !tab.allowedRoles.includes("manager") && (
              <Crown className="w-3 h-3 ml-auto text-accent" />
            )}
        </Button>
      ))}

      {showLogout && (
        <Button
          variant="ghost"
          onClick={() => {
            setMobileMenuOpen(false);
            onLogout();
          }}
          className="justify-start gap-2 text-destructive hover:text-destructive"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Desktop Header Only */}
      <div className="hidden lg:block">
        <DashboardHeader onLogout={onLogout} />
      </div>

      {/* Mobile Header - Minimal */}
      <div className="lg:hidden bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
          <img
            src={logo}
            alt="Manna Palace Logo"
            className="w-full h-full object-contain"
          />
        </div>
        
        {/* Mobile Hamburger Menu - Top Right */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-1/2 max-w-[50vw] sm:w-80">
            <SheetTitle className="sr-only">Admin navigation</SheetTitle>
            <div className="py-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">
                Menu
              </h2>
              <TabNavigation showLogout />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 border-r border-border p-4 bg-card/50 overflow-y-auto">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Navigation
            </h2>
          </div>
          <TabNavigation />
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main Content Area */}
          <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto">
            {renderTabContent()}
          </div>
        </div>
      </main>
    </div>
  );
}
