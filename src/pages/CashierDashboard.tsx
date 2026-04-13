import React, { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { MenuGrid } from "@/components/cashier/MenuGrid";
import { Cart } from "@/components/cashier/Cart";
import {
  MobileCart,
  FloatingCartButton,
} from "@/components/cashier/MobileCart";
import { SyncStatus } from "@/components/cashier/SyncStatus";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  Database,
  Sun,
  Clock,
  Moon,
  TrendingUp,
  ShoppingCart,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Calculator from "@/components/cashier/Calculator";
import { LocalOrderHistory } from "@/components/cashier/LocalOrderHistory";
import Modal from "@/components/ui/Modal";
import { useShiftSalesWithLocal } from "@/hooks/useShiftSalesWithLocal";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getSqliteDB } from "@/lib/sqlite";

interface CashierDashboardProps {
  onLogout: () => void;
}

export function CashierDashboard({ onLogout }: CashierDashboardProps) {
  const isMobile = useIsMobile();
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<string | null>(null);
  const [salesReportOpen, setSalesReportOpen] = useState(false);
  const [cachedShifts, setCachedShifts] = useState<string[] | null>(null);
  const { syncPendingOrders } = useCart();
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [localHistoryOpen, setLocalHistoryOpen] = useState(false);

  const isTauri = "__TAURI__" in window;

  // Load cached shift settings on desktop
  useEffect(() => {
    if (!isTauri) return;

    const loadCachedShifts = async () => {
      try {
        const sqliteDB = getSqliteDB();
        if (!sqliteDB) return;
        const shifts = await sqliteDB.getCachedShiftSettings();
        setCachedShifts(shifts);
      } catch (error) {
        console.error("Failed to load cached shift settings:", error);
      }
    };

    if (salesReportOpen) {
      loadCachedShifts();
    }
  }, [isTauri, salesReportOpen]);

  const {
    shiftSales,
    isLoading,
    hasLocalData,
    localOrderCount,
    unsyncedCount,
    detailedOrders,
  } = useShiftSalesWithLocal(salesReportOpen);

  // Use cached shifts on desktop, fallback to remote on web
  const remoteEnabledShifts = useQuery(
    api.shiftSettings.getEnabledShifts,
    !isTauri && salesReportOpen ? {} : "skip",
  ) as string[] | undefined;

  const enabledShifts = isTauri ? cachedShifts : remoteEnabledShifts;

  // Access code breakdown is now directly from backend (already filtered by shift assignment)

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncPendingOrders();
      if (result.total === 0) {
        toast({
          title: "No orders to sync",
          description: "All orders are already synced.",
        });
      } else {
        toast({
          title: "Sync complete",
          description: `${result.synced} orders synced, ${result.failed} failed out of ${result.total} total.`,
          variant: result.failed > 0 ? "destructive" : "default",
        });
      }
    } catch (error) {
      toast({
        title: "Sync failed",
        description: "Failed to sync orders. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleShiftClick = (shift: string) => {
    setSelectedShift(shift);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardHeader onLogout={onLogout}>
        <div className="flex items-center gap-3">
          <SyncStatus />
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
            Sync Orders
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCalculatorOpen((prev) => !prev)}
            className="gap-2"
          >
            Calculator
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSalesReportOpen((prev) => !prev)}
            className="gap-2"
          >
            Sales Report
          </Button>
          {isTauri && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocalHistoryOpen((prev) => !prev)}
              className="gap-2"
            >
              <Database className="w-4 h-4" />
              Local Orders
            </Button>
          )}
        </div>
      </DashboardHeader>

      <main className="flex-1 flex flex-row overflow-hidden">
        {/* Menu Area */}
        <div className="flex-1 overflow-hidden p-4 sm:p-6">
          <MenuGrid />
        </div>

        {/* Current Order Sidebar */}
        {!isMobile && (
          <div className="w-80 lg:w-96 border-l border-border p-6 bg-card/50 hidden md:flex flex-col min-h-0 overflow-hidden">
            <Cart />
          </div>
        )}
      </main>

      {/* Calculator Modal */}
      <Modal isOpen={calculatorOpen} onClose={() => setCalculatorOpen(false)}>
        <Calculator />
      </Modal>

      {/* Sales Report Modal */}
      <Modal
        isOpen={salesReportOpen}
        onClose={() => setSalesReportOpen(false)}
        className="sm:max-w-2xl max-h-[90vh]"
      >
        <div className="flex flex-col h-full">
          <h2 className="text-2xl font-bold mb-4 text-center text-foreground">
            Daily Sales Report
          </h2>
          {isLoading ? (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin">
                <TrendingUp className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          ) : (
            <div className="overflow-y-auto flex-1 pr-2 space-y-3">
              {/* Total Summary Card */}
              {shiftSales?.fullDay && (
                <div className="p-4 border rounded-lg bg-blue-50">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Total Orders
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {shiftSales.fullDay.orderCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Total Sales
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        ₦{shiftSales.fullDay.totalSales.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Morning Shift - only show if has orders */}
              {enabledShifts?.includes("morning") &&
                shiftSales?.morning &&
                shiftSales.morning.orderCount > 0 && (
                  <div className="p-3 border rounded-lg bg-orange-50">
                    <h3 className="font-semibold text-sm text-orange-700 mb-2">
                      Morning Shift
                    </h3>
                    <div className="grid grid-cols-2 gap-3 mb-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">
                          Sales: ₦
                          {shiftSales.morning.totalSales?.toLocaleString() || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">
                          Orders: {shiftSales.morning.orderCount || 0}
                        </p>
                      </div>
                    </div>
                    {shiftSales.morning.byAccessCode &&
                      Object.keys(shiftSales.morning.byAccessCode).length >
                        0 && (
                        <div className="mt-2 pt-2 border-t border-orange-200 space-y-1">
                          {Object.entries(shiftSales.morning.byAccessCode).map(
                            ([code, data]) => (
                              <div
                                key={code}
                                className="flex justify-between text-xs"
                              >
                                <span className="font-medium text-orange-700">
                                  {code}
                                </span>
                                <span className="text-foreground">
                                  ₦{data.totalSales.toLocaleString()} (
                                  {data.orderCount})
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                      )}
                  </div>
                )}

              {/* Afternoon Shift - only show if has orders */}
              {enabledShifts?.includes("afternoon") &&
                shiftSales?.afternoon &&
                shiftSales.afternoon.orderCount > 0 && (
                  <div className="p-3 border rounded-lg bg-yellow-50">
                    <h3 className="font-semibold text-sm text-yellow-700 mb-2">
                      Afternoon Shift
                    </h3>
                    <div className="grid grid-cols-2 gap-3 mb-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">
                          Sales: ₦
                          {shiftSales.afternoon.totalSales?.toLocaleString() ||
                            0}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">
                          Orders: {shiftSales.afternoon.orderCount || 0}
                        </p>
                      </div>
                    </div>
                    {shiftSales.afternoon.byAccessCode &&
                      Object.keys(shiftSales.afternoon.byAccessCode).length >
                        0 && (
                        <div className="mt-2 pt-2 border-t border-yellow-200 space-y-1">
                          {Object.entries(
                            shiftSales.afternoon.byAccessCode,
                          ).map(([code, data]) => (
                            <div
                              key={code}
                              className="flex justify-between text-xs"
                            >
                              <span className="font-medium text-yellow-700">
                                {code}
                              </span>
                              <span className="text-foreground">
                                ₦{data.totalSales.toLocaleString()} (
                                {data.orderCount})
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                )}

              {/* Evening Shift - only show if has orders */}
              {enabledShifts?.includes("evening") &&
                shiftSales?.evening &&
                shiftSales.evening.orderCount > 0 && (
                  <div className="p-3 border rounded-lg bg-purple-50">
                    <h3 className="font-semibold text-sm text-purple-700 mb-2">
                      Evening Shift
                    </h3>
                    <div className="grid grid-cols-2 gap-3 mb-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">
                          Sales: ₦
                          {shiftSales.evening.totalSales?.toLocaleString() || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">
                          Orders: {shiftSales.evening.orderCount || 0}
                        </p>
                      </div>
                    </div>
                    {shiftSales.evening.byAccessCode &&
                      Object.keys(shiftSales.evening.byAccessCode).length >
                        0 && (
                        <div className="mt-2 pt-2 border-t border-purple-200 space-y-1">
                          {Object.entries(shiftSales.evening.byAccessCode).map(
                            ([code, data]) => (
                              <div
                                key={code}
                                className="flex justify-between text-xs"
                              >
                                <span className="font-medium text-purple-700">
                                  {code}
                                </span>
                                <span className="text-foreground">
                                  ₦{data.totalSales.toLocaleString()} (
                                  {data.orderCount})
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                      )}
                  </div>
                )}

              {/* Unassigned (codes without shift) */}
              {shiftSales?.unassigned &&
                shiftSales.unassigned.orderCount > 0 && (
                  <div className="p-3 border rounded-lg bg-gray-50">
                    <h3 className="font-semibold text-sm text-gray-700 mb-2">
                      Unassigned Orders
                    </h3>
                    <div className="grid grid-cols-2 gap-3 mb-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">
                          Sales: ₦
                          {shiftSales.unassigned.totalSales?.toLocaleString() ||
                            0}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">
                          Orders: {shiftSales.unassigned.orderCount || 0}
                        </p>
                      </div>
                    </div>
                    {Object.keys(shiftSales.unassigned.byAccessCode).length >
                      0 && (
                      <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                        {Object.entries(shiftSales.unassigned.byAccessCode).map(
                          ([code, data]) => (
                            <div
                              key={code}
                              className="flex justify-between text-xs"
                            >
                              <span className="font-medium text-gray-600">
                                {code}
                              </span>
                              <span className="text-foreground">
                                ₦{data.totalSales.toLocaleString()} (
                                {data.orderCount})
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                )}

              {/* Detailed Orders List */}
              {detailedOrders && detailedOrders.length > 0 && (
                <div className="p-3 border rounded-lg bg-blue-50">
                  <h3 className="font-semibold text-sm text-blue-700 mb-2">
                    Order Details
                  </h3>
                  <div className="space-y-2">
                    {detailedOrders.map((order, idx) => (
                      <div
                        key={idx}
                        className="p-2 bg-white rounded border border-blue-100 text-xs"
                      >
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">
                            Code:{" "}
                            <span className="text-blue-600">
                              {order.cashierCode}
                            </span>
                          </span>
                          <span className="font-bold text-green-600">
                            ₦{order.total.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-xs">
                          {new Date(order.createdAt).toLocaleTimeString()}
                        </p>
                        {order.items && order.items.length > 0 && (
                          <div className="text-muted-foreground mt-1 space-y-0.5">
                            {order.items.map((item: any, itemIdx) => (
                              <p key={itemIdx}>
                                {item.quantity}× {item.name} - ₦
                                {(item.price * item.quantity).toLocaleString()}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Local Order History Modal */}
      <Modal
        isOpen={localHistoryOpen}
        onClose={() => setLocalHistoryOpen(false)}
        className="sm:max-w-lg"
      >
        <LocalOrderHistory />
      </Modal>

      {/* Mobile Cart */}
      {isMobile && (
        <>
          <FloatingCartButton onClick={() => setMobileCartOpen(true)} />
          <MobileCart
            isOpen={mobileCartOpen}
            onOpenChange={setMobileCartOpen}
          />
        </>
      )}
    </div>
  );
}
