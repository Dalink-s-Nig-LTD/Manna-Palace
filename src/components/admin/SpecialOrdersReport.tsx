import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Package, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SpecialOrdersReport() {
  const [timeFilter, setTimeFilter] = useState<
    "today" | "week" | "month" | "all"
  >("today");

  const specialDeliveries = useQuery(api.specialOrders.getSpecialOrders);

  // Filter special deliveries based on time
  const getFilteredOrders = () => {
    if (!specialDeliveries) return [];

    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

    return specialDeliveries.filter((order) => {
      if (timeFilter === "today") return order.createdAt >= oneDayAgo;
      if (timeFilter === "week") return order.createdAt >= oneWeekAgo;
      if (timeFilter === "month") return order.createdAt >= oneMonthAgo;
      return true;
    });
  };

  const specialOrders = getFilteredOrders();

  // Calculate stats
  const totalRevenue = specialOrders.reduce(
    (sum, order) => sum + order.total,
    0,
  );
  const totalOrders = specialOrders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Payment status stats from filtered orders
  const paidCount = specialOrders.filter((d) => d.paymentStatus === "paid").length;
  const pendingCount = specialOrders.filter((d) => d.paymentStatus === "pending").length;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4">
        <Card className="p-2.5 sm:p-4">
          <CardHeader className="pb-1 sm:pb-2">
            <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground">
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-lg sm:text-2xl font-bold">{totalOrders}</div>
          </CardContent>
        </Card>
        <Card className="p-2.5 sm:p-4">
          <CardHeader className="pb-1 sm:pb-2">
            <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-lg sm:text-2xl font-bold break-words">
              ₦{totalRevenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card className="p-2.5 sm:p-4">
          <CardHeader className="pb-1 sm:pb-2">
            <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground">
              Avg Order
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-lg sm:text-2xl font-bold">
              ₦{Math.round(averageOrderValue).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card className="p-2.5 sm:p-4">
          <CardHeader className="pb-1 sm:pb-2">
            <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground flex items-center gap-0.5 sm:gap-1">
              <CheckCircle className="w-3 h-3 text-green-600" />
              Paid
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-lg sm:text-2xl font-bold text-green-600">{paidCount}</div>
          </CardContent>
        </Card>
        <Card className="p-2.5 sm:p-4">
          <CardHeader className="pb-1 sm:pb-2">
            <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground flex items-center gap-0.5 sm:gap-1">
              <Clock className="w-3 h-3 text-amber-600" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-lg sm:text-2xl font-bold text-amber-600">{pendingCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table/Cards */}
      <Card>
        <CardHeader className="pb-2 sm:pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Package className="w-4 h-4 sm:w-5 sm:h-5" />
                Special Orders
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">
                Special orders placed
              </CardDescription>
            </div>
            <Select
              value={timeFilter}
              onValueChange={(value) =>
                setTimeFilter(value as "today" | "week" | "month" | "all")
              }
            >
              <SelectTrigger className="w-full sm:w-[150px] text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {/* Desktop Table - Hidden on mobile */}
          <div className="hidden sm:block border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Order ID</TableHead>
                  <TableHead className="text-xs">Date & Time</TableHead>
                  <TableHead className="text-xs">Department</TableHead>
                  <TableHead className="text-xs">Staff</TableHead>
                  <TableHead className="text-xs">Item</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Cashier</TableHead>
                  <TableHead className="text-right text-xs">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {specialOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-xs">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  specialOrders.map((order) => (
                    <TableRow key={order._id}>
                      <TableCell className="font-mono text-[10px]">
                        {String(order._id).slice(-8).toUpperCase()}
                      </TableCell>
                      <TableCell className="text-xs">
                        {format(new Date(order.createdAt), "MMM dd HH:mm")}
                      </TableCell>
                      <TableCell className="text-xs">{order.department}</TableCell>
                      <TableCell className="text-xs">{order.staffName}</TableCell>
                      <TableCell className="text-xs">
                        <div>
                          {order.itemDescription}
                          <div className="text-[10px] text-muted-foreground">
                            Qty: {order.quantity}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.paymentStatus === "paid" ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-[10px]">
                            Paid
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-[10px]">
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-[10px]">
                        {order.cashierCode === "KIOSK" ? (
                          <Badge variant="secondary" className="text-[9px] px-1">
                            Self
                          </Badge>
                        ) : (
                          order.cashierCode
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold text-xs">
                        ₦{order.total.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards - Visible only on mobile */}
          <div className="sm:hidden space-y-3">
            {specialOrders.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                No orders found
              </div>
            ) : (
              specialOrders.map((order) => (
                <Card key={order._id} className="p-3 bg-muted/50">
                  <div className="space-y-2 text-[11px]">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-mono text-[10px] text-muted-foreground">
                          {String(order._id).slice(-8).toUpperCase()}
                        </div>
                        <div className="font-medium">{order.itemDescription}</div>
                      </div>
                      <div className="text-right">
                        {order.paymentStatus === "paid" ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-[9px]">
                            Paid
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-[9px]">
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <span className="text-muted-foreground">Date:</span> {format(new Date(order.createdAt), "MMM dd")}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Qty:</span> {order.quantity}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Dept:</span> {order.department}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total:</span> <span className="font-bold">₦{order.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
    </div>
  );
}
