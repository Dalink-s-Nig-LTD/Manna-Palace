import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, X, Loader } from "lucide-react";
import { convex } from "@/lib/convex";
import { api } from "../../../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

interface AllOrder {
  _id: string;
  total: number;
  cashierCode: string;
  createdAt: number;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  orderType?: string;
}

export function AllOrdersButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [orders, setOrders] = useState<AllOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchAllOrders = async () => {
    setIsLoading(true);
    setError(null);
    setOrders([]);

    try {
      let allOrdersData: AllOrder[] = [];
      let cursor: string | undefined = undefined;
      let batchNum = 0;

      console.log("[AllOrdersButton] Starting to fetch all orders...");

      // Fetch all orders using pagination
      while (true) {
        batchNum++;
        console.log(
          `[AllOrdersButton] Fetching batch ${batchNum} (cursor: ${cursor || "start"})...`,
        );

        const batch = await convex.query(
          api.getAllOrdersPaginated.getAllOrdersPaginated,
          {
            batchSize: 1000,
            cursor,
          },
        );

        if (!batch || batch.orders.length === 0) {
          console.log(
            `[AllOrdersButton] Batch ${batchNum} returned 0 orders, complete`,
          );
          break;
        }

        allOrdersData = allOrdersData.concat(batch.orders);
        console.log(
          `[AllOrdersButton] Batch ${batchNum}: ${batch.orders.length} orders (total: ${allOrdersData.length})`,
        );

        if (!batch.hasMore) {
          console.log("[AllOrdersButton] No more batches available");
          break;
        }

        cursor = batch.nextCursor || undefined;
      }

      // Filter out special orders
      const regularOrders = allOrdersData.filter(
        (order) => (order.orderType || "regular") !== "special",
      );

      console.log(
        `[AllOrdersButton] Total fetched: ${allOrdersData.length}, Regular: ${regularOrders.length}`,
      );

      setOrders(regularOrders);
      setTotalCount(regularOrders.length);
    } catch (err) {
      console.error("[AllOrdersButton] Error fetching orders:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch orders");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = async () => {
    setIsOpen(true);
    if (orders.length === 0) {
      await fetchAllOrders();
    }
  };

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

  return (
    <>
      <Button
        variant="outline"
        onClick={handleOpenDialog}
        className="flex items-center gap-2"
        title="View all orders in database"
      >
        <ShoppingCart className="w-4 h-4" />
        <span className="hidden sm:inline">All Orders</span>
        <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
          {totalCount > 0 ? totalCount.toLocaleString() : "0"}
        </span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              All-Time Orders Database
            </DialogTitle>
            <DialogClose />
          </DialogHeader>

          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md">
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">
                Fetching all orders from database...
              </p>
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-secondary p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold text-foreground">
                    {totalCount.toLocaleString()}
                  </p>
                </div>
                <div className="bg-secondary p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-primary">
                    ₦{totalRevenue.toLocaleString()}
                  </p>
                </div>
                <div className="bg-secondary p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Avg Order</p>
                  <p className="text-2xl font-bold text-foreground">
                    ₦{Math.round(avgOrderValue).toLocaleString()}
                  </p>
                </div>
                <div className="bg-secondary p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Unique Codes</p>
                  <p className="text-2xl font-bold text-foreground">
                    {new Set(orders.map((o) => o.cashierCode)).size}
                  </p>
                </div>
              </div>

              {/* Recent Orders Table */}
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-secondary border-b">
                    <tr>
                      <th className="px-4 py-2 text-left">Date & Time</th>
                      <th className="px-4 py-2 text-left">Cashier</th>
                      <th className="px-4 py-2 text-right">Amount</th>
                      <th className="px-4 py-2 text-center">Items</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 50).map((order) => (
                      <tr
                        key={order._id}
                        className="border-b hover:bg-secondary/50"
                      >
                        <td className="px-4 py-2 text-muted-foreground">
                          {new Date(order.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-2 font-medium">
                          {order.cashierCode}
                        </td>
                        <td className="px-4 py-2 text-right font-semibold">
                          ₦{order.total.toLocaleString()}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {order.items?.length || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {orders.length > 50 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Showing first 50 of {totalCount.toLocaleString()} orders
                </p>
              )}

              <Button
                variant="outline"
                onClick={() => fetchAllOrders()}
                className="mt-4 w-full"
              >
                Refresh Data
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
