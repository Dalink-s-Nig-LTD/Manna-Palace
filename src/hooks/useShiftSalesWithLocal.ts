import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@/lib/convexApi";
import { api } from "../../convex/_generated/api";
import { orderQueue } from "@/lib/orderQueue";
import { getSqliteDB } from "@/lib/sqlite";
import type { Order } from "@/types/cafeteria";
import { useAuth } from "@/contexts/AuthContext";

interface ShiftData {
  totalSales: number;
  orderCount: number;
  byAccessCode: Record<string, { totalSales: number; orderCount: number }>;
}

interface ShiftSalesData {
  morning: ShiftData;
  afternoon: ShiftData;
  evening: ShiftData;
  unassigned: ShiftData;
  fullDay: ShiftData;
}

interface OrderDetail {
  id: string;
  total: number;
  cashierCode: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  createdAt: number;
  paymentMethod?: string;
}

interface OrderSummary {
  total: number;
  cashierCode: string;
  createdAt: number;
}

interface AccessCode {
  code: string;
  shift?: "morning" | "afternoon" | "evening";
  isActive?: boolean;
}

const emptyShift: ShiftData = { totalSales: 0, orderCount: 0, byAccessCode: {} };

/**
 * Hook that provides shift sales data for daily reports.
 * - Tauri: Reads all orders from SQLite database (no limit), grouped by access code shift.
 * - Web: Reads from Convex, grouped by access code shift.
 */
export function useShiftSalesWithLocal(enabled = true) {
  const isTauri = "__TAURI__" in window;
  const { code: currentCode } = useAuth();

  // Convex queries — only used on web platform
  const allOrdersFromConvex = useQuery(
    api.orders.getAllOrders,
    !isTauri && enabled ? { limit: 5000, daysBack: 1 } : "skip"
  );
  const accessCodes = useQuery(
    api.accessCodes.listAccessCodes,
    enabled ? {} : "skip"
  ) as AccessCode[] | undefined;
  const enabledShifts = useQuery(
    api.shiftSettings.getEnabledShifts,
    enabled ? {} : "skip"
  ) as string[] | undefined;

  const [shiftSalesData, setShiftSalesData] = useState<ShiftSalesData | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [unsyncedLocalCount, setUnsyncedLocalCount] = useState(0);
  const [detailedOrders, setDetailedOrders] = useState<OrderDetail[]>([]);

  // Process orders from SQLite (Tauri) or Convex (Web)
  const processOrders = useCallback(async () => {
    if (!enabled || !accessCodes) return;

    try {
      let todaysOrders: OrderSummary[] = [];

      // Get today's date range (local time)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.getTime();
      const todayEnd = todayStart + 24 * 60 * 60 * 1000;

      if (isTauri) {
        // Fetch all orders from SQLite (no limit)
        try {
          const sqliteDB = getSqliteDB();
          if (!sqliteDB) throw new Error("SQLite DB not available");

          const allQueued = await sqliteDB.getAllOrders();
          console.log(`[useShiftSalesWithLocal] Fetched ${allQueued.length} total orders from SQLite`);

          // Extract orders from QueuedOrder wrapper and filter to today's regular orders
          todaysOrders = (allQueued || [])
            .map((qo) => qo.order)
            .filter(
              (order) =>
                order.createdAt >= todayStart &&
                order.createdAt < todayEnd &&
                order.orderType !== "special"
            )
            .map((order) => ({
              total: order.total,
              cashierCode: order.cashierCode,
              createdAt: order.createdAt,
            }));

          console.log(`[useShiftSalesWithLocal] Found ${todaysOrders.length} today's orders from SQLite`);

          // Also add any unsynced queued orders
          try {
            const allQueued = await orderQueue.getAllOrders();
            const unsyncedQueued = allQueued.filter(
              (qo) =>
                qo.createdAt >= todayStart &&
                qo.createdAt < todayEnd &&
                (qo.order as Order & { orderType?: string }).orderType !== "special" &&
                qo.status !== "synced"
            );

            const unsyncedOrders: OrderSummary[] = unsyncedQueued.map((qo) => ({
              total: qo.order.total,
              cashierCode: (qo.order as Order & { cashierCode?: string }).cashierCode || "LOCAL",
              createdAt: qo.createdAt,
            }));

            if (unsyncedOrders.length > 0) {
              console.log(`[useShiftSalesWithLocal] Adding ${unsyncedOrders.length} unsynced queue orders`);
              todaysOrders.push(...unsyncedOrders);
            }
            setUnsyncedLocalCount(unsyncedQueued.length);
          } catch (err) {
            console.warn("[useShiftSalesWithLocal] Could not fetch unsynced queue orders:", err);
          }
        } catch (err) {
          console.error("[useShiftSalesWithLocal] Failed to fetch from SQLite:", err);
        }
      } else {
        // Web: Fetch from Convex
        if (!allOrdersFromConvex) return;

        console.log(`[useShiftSalesWithLocal] Processing ${allOrdersFromConvex.length} orders from Convex`);

        todaysOrders = (allOrdersFromConvex || [])
          .filter(
            (order) =>
              order.createdAt >= todayStart &&
              order.createdAt < todayEnd &&
              order.orderType !== "special"
          )
          .map((order) => ({
            total: order.total,
            cashierCode: order.cashierCode,
            createdAt: order.createdAt,
          }));

        console.log(`[useShiftSalesWithLocal] Found ${todaysOrders.length} today's orders from Convex`);
      }

      // Build code-to-shift map
      const codeToShift: Record<string, "morning" | "afternoon" | "evening" | undefined> = {};
      (accessCodes || []).forEach((ac: AccessCode) => {
        codeToShift[ac.code] = ac.shift;
      });
      console.log(`[useShiftSalesWithLocal] Access code → Shift mapping:`, codeToShift);

      // Group by shift
      const isShiftEnabled = (s: string): boolean => !enabledShifts || enabledShifts.includes(s);
      const morning = todaysOrders.filter((o) => codeToShift[o.cashierCode] === "morning" && isShiftEnabled("morning"));
      const afternoon = todaysOrders.filter((o) => codeToShift[o.cashierCode] === "afternoon" && isShiftEnabled("afternoon"));
      const evening = todaysOrders.filter((o) => codeToShift[o.cashierCode] === "evening" && isShiftEnabled("evening"));
      const unassigned = todaysOrders.filter((o) => {
        const shift = codeToShift[o.cashierCode];
        return shift === undefined || !isShiftEnabled(shift);
      });

      console.log(
        `[useShiftSalesWithLocal] Grouped by ACCESS CODE shifts: morning=${morning.length}, afternoon=${afternoon.length}, evening=${evening.length}, unassigned=${unassigned.length}`
      );

      const groupByCode = (orders: OrderSummary[]): Record<string, { totalSales: number; orderCount: number }> => {
        const grouped: Record<string, { totalSales: number; orderCount: number }> = {};
        orders.forEach((o) => {
          const code = o.cashierCode || "UNKNOWN";
          if (!grouped[code]) grouped[code] = { totalSales: 0, orderCount: 0 };
          grouped[code].totalSales += o.total;
          grouped[code].orderCount += 1;
        });
        return grouped;
      };

      setShiftSalesData({
        morning: {
          totalSales: morning.reduce((s, o) => s + o.total, 0),
          orderCount: morning.length,
          byAccessCode: groupByCode(morning),
        },
        afternoon: {
          totalSales: afternoon.reduce((s, o) => s + o.total, 0),
          orderCount: afternoon.length,
          byAccessCode: groupByCode(afternoon),
        },
        evening: {
          totalSales: evening.reduce((s, o) => s + o.total, 0),
          orderCount: evening.length,
          byAccessCode: groupByCode(evening),
        },
        unassigned: {
          totalSales: unassigned.reduce((s, o) => s + o.total, 0),
          orderCount: unassigned.length,
          byAccessCode: groupByCode(unassigned),
        },
        fullDay: {
          totalSales: todaysOrders.reduce((s, o) => s + o.total, 0),
          orderCount: todaysOrders.length,
          byAccessCode: groupByCode(todaysOrders),
        },
      });

      // Also store detailed orders for individual display
      // Extract full order objects from the orders we fetched
      if (isTauri) {
        const sqliteDB = getSqliteDB();
        if (sqliteDB) {
          try {
            const allQueued = await sqliteDB.getAllOrders();
            const todayDetailed = allQueued
              .map((qo) => qo.order)
              .filter(
                (order) =>
                  order.createdAt >= todayStart &&
                  order.createdAt < todayEnd &&
                  order.orderType !== "special"
              )
              .map((order) => ({
                id: order.id || "",
                total: order.total,
                cashierCode: order.cashierCode,
                items: order.items || [],
                createdAt: order.createdAt,
                paymentMethod: order.paymentMethod,
              }));
            setDetailedOrders(todayDetailed);
          } catch (err) {
            console.warn("[useShiftSalesWithLocal] Failed to fetch detailed orders:", err);
          }
        }
      } else {
        if (allOrdersFromConvex) {
          const todayDetailed = allOrdersFromConvex
            .filter(
              (order) =>
                order.createdAt >= todayStart &&
                order.createdAt < todayEnd &&
                order.orderType !== "special"
            )
            .map((order) => ({
              id: order._id?.toString() || "",
              total: order.total,
              cashierCode: order.cashierCode,
              items: order.items || [],
              createdAt: order.createdAt,
              paymentMethod: order.paymentMethod,
            }));
          setDetailedOrders(todayDetailed);
        }
      }

      setIsLoading(false);
    } catch (error) {
      console.error("[useShiftSalesWithLocal] Error processing orders:", error);
      setIsLoading(false);
    }
  }, [enabled, allOrdersFromConvex, accessCodes, enabledShifts, isTauri]);

  useEffect(() => {
    processOrders();
  }, [processOrders]);

  return {
    shiftSales: shiftSalesData,
    isLoading,
    hasLocalData: !!shiftSalesData,
    localOrderCount: shiftSalesData?.fullDay.orderCount || 0,
    unsyncedCount: unsyncedLocalCount,
    detailedOrders,
  };
}
