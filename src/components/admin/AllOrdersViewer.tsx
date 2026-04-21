import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, ShoppingCart } from "lucide-react";
import { convex } from "@/lib/convex";
import { api } from "../../../convex/_generated/api";
import { useToast } from "@/hooks/use-toast";

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
  paymentMethod?: string;
}

export function AllOrdersViewer() {
  const [orders, setOrders] = useState<AllOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<
    "date-desc" | "date-asc" | "amount-desc" | "amount-asc"
  >("date-desc");
  const { toast } = useToast();

  const fetchAllOrders = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let allOrdersData: AllOrder[] = [];
      let cursor: string | undefined = undefined;
      let batchNum = 0;

      console.log("[AllOrdersViewer] Starting to fetch all orders...");

      while (true) {
        batchNum++;
        console.log(
          `[AllOrdersViewer] Fetching batch ${batchNum} (cursor: ${cursor || "start"})...`,
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
            `[AllOrdersViewer] Batch ${batchNum} returned 0 orders, complete`,
          );
          break;
        }

        allOrdersData = allOrdersData.concat(batch.orders);
        console.log(
          `[AllOrdersViewer] Batch ${batchNum}: ${batch.orders.length} orders (total: ${allOrdersData.length})`,
        );

        if (!batch.hasMore) {
          console.log("[AllOrdersViewer] No more batches available");
          break;
        }

        cursor = batch.nextCursor || undefined;
      }

      // Filter out special orders
      const regularOrders = allOrdersData.filter(
        (order) => (order.orderType || "regular") !== "special",
      );

      console.log(
        `[AllOrdersViewer] Total fetched: ${allOrdersData.length}, Regular: ${regularOrders.length}`,
      );

      setOrders(regularOrders);
      toast({
        title: "Success",
        description: `Loaded ${regularOrders.length.toLocaleString()} orders`,
      });
    } catch (err) {
      console.error("[AllOrdersViewer] Error fetching orders:", err);
      const errorMsg =
        err instanceof Error ? err.message : "Failed to fetch orders";
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Don't auto-fetch on mount - wait for user to click button
    // fetchAllOrders();
  }, []);

  // Filter and sort orders
  const filteredOrders = orders
    .filter((order) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        order.cashierCode.toLowerCase().includes(searchLower) ||
        order._id.toLowerCase().includes(searchLower) ||
        order.total.toString().includes(searchLower)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return b.createdAt - a.createdAt;
        case "date-asc":
          return a.createdAt - b.createdAt;
        case "amount-desc":
          return b.total - a.total;
        case "amount-asc":
          return a.total - b.total;
        default:
          return 0;
      }
    });

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
  const uniqueCashiers = new Set(orders.map((o) => o.cashierCode)).size;

  const exportToCSV = () => {
    if (filteredOrders.length === 0) {
      toast({
        title: "No data",
        description: "No orders to export",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      "ID",
      "Cashier",
      "Amount",
      "Date & Time",
      "Items Count",
      "Payment Method",
    ];
    const rows = filteredOrders.map((order) => [
      order._id,
      order.cashierCode,
      order.total,
      new Date(order.createdAt).toLocaleString(),
      order.items?.length || 0,
      order.paymentMethod || "N/A",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `all-orders-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Exported",
      description: `${filteredOrders.length} orders exported to CSV`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
        <h1 className="text-base sm:text-2xl font-bold text-foreground">
          All Orders
        </h1>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Loading State with Circle */}
      {isLoading && (
        <Card className="border-border shadow-card">
          <CardContent className="p-24 flex flex-col items-center justify-center gap-6">
            <div className="relative w-24 h-24">
              {/* Outer spinning circle */}
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary border-r-primary animate-spin"></div>
              {/* Inner circle */}
              <div className="absolute inset-2 rounded-full border-2 border-primary/20"></div>
              {/* Center icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <ShoppingCart className="w-8 h-8 text-primary animate-pulse" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground mb-2">
                Fetching All Orders
              </p>
              <p className="text-sm text-muted-foreground">
                Please wait while we retrieve all orders from the database...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards - Only show when data is loaded */}
      {!isLoading && orders.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4">
          <Card className="border-border shadow-card p-2.5 sm:p-4">
            <CardContent className="p-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">
                Orders
              </p>
              <p className="text-lg sm:text-3xl font-bold text-primary break-words">
                {orders.length.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-card p-2.5 sm:p-4">
            <CardContent className="p-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">
                Revenue
              </p>
              <p className="text-lg sm:text-3xl font-bold text-primary break-words">
                ₦{totalRevenue.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-card p-2.5 sm:p-4">
            <CardContent className="p-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">
                Avg
              </p>
              <p className="text-lg sm:text-3xl font-bold text-primary">
                ₦{Math.round(avgOrderValue).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-card p-2.5 sm:p-4">
            <CardContent className="p-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">
                Cashiers
              </p>
              <p className="text-lg sm:text-3xl font-bold text-primary">
                {uniqueCashiers}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-card p-2.5 sm:p-4">
            <CardContent className="p-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">
                Showing
              </p>
              <p className="text-lg sm:text-3xl font-bold text-primary">
                {filteredOrders.length.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controls - Only show when data is loaded */}
      {!isLoading && orders.length > 0 && (
        <div className="flex flex-col gap-2 sm:gap-3">
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-xs sm:text-sm h-8 sm:h-10"
          />
          <div className="flex gap-2 items-center">
            <Select
              value={sortBy}
              onValueChange={(value: any) => setSortBy(value)}
            >
              <SelectTrigger className="text-xs sm:text-sm h-8 sm:h-10 flex-1">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Latest</SelectItem>
                <SelectItem value="date-asc">Oldest</SelectItem>
                <SelectItem value="amount-desc">High $</SelectItem>
                <SelectItem value="amount-asc">Low $</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={exportToCSV}
              variant="outline"
              size="sm"
              className="text-xs gap-1 h-8 sm:h-10"
              disabled={filteredOrders.length === 0 || isLoading}
            >
              <Download className="w-3 h-3" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>
      )}

      {/* Welcome State - Show before any fetch */}
      {!isLoading && orders.length === 0 && !error && (
        <Card className="border-border shadow-card">
          <CardContent className="p-12 text-center">
            <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-lg font-semibold text-foreground mb-2">
              Fetch All Orders from Database
            </p>
            <p className="text-muted-foreground mb-6">
              Click "Start Fetching" below to retrieve all orders from Convex
            </p>
            <Button onClick={fetchAllOrders} size="lg" className="gap-2">
              <ShoppingCart className="w-5 h-5" />
              Start Fetching
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Orders Table - Only show when data is loaded */}
      {!isLoading && filteredOrders.length > 0 && (
        <div className="border border-border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">
                  Date & Time
                </th>
                <th className="px-4 py-3 text-left font-semibold">
                  Cashier Code
                </th>
                <th className="px-4 py-3 text-right font-semibold">Amount</th>
                <th className="px-4 py-3 text-center font-semibold">Items</th>
                <th className="px-4 py-3 text-left font-semibold">Payment</th>
                <th className="px-4 py-3 text-left font-semibold">Order ID</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order, idx) => (
                <tr
                  key={order._id}
                  className={`border-b border-border hover:bg-secondary/50 transition-colors ${
                    idx % 2 === 0 ? "bg-card/50" : ""
                  }`}
                >
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(order.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-semibold text-primary">
                    {order.cashierCode}
                  </td>
                  <td className="px-4 py-3 text-right font-bold">
                    ₦{order.total.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-semibold">
                      {order.items?.length || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs uppercase tracking-wider">
                    <span className="bg-secondary px-2 py-1 rounded">
                      {order.paymentMethod || "unknown"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                    {order._id.slice(0, 8)}...
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* No Results */}
      {!isLoading && orders.length > 0 && filteredOrders.length === 0 && (
        <Card className="border-border shadow-card">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">
              No orders match your search
            </p>
            <Button onClick={() => setSearchTerm("")} variant="outline">
              Clear Search
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
