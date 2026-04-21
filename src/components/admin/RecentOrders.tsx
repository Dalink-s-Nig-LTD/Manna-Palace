import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Clock,
  CreditCard,
  Banknote,
  Smartphone,
  ScanLine,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const paymentIcons = {
  cash: Banknote,
  card: CreditCard,
  transfer: Smartphone,
};

export function RecentOrders() {
  const recentOrders = useQuery(api.orders.getRecentOrders, { limit: 5 });

  console.log("RecentOrders - Data:", recentOrders);

  if (!recentOrders) {
    return (
      <Card className="border-border shadow-card">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 font-display text-base sm:text-lg">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            Recent Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 sm:h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground text-sm">
              Loading...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recentOrders.length === 0) {
    return (
      <Card className="border-border shadow-card">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 font-display text-base sm:text-lg">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            Recent Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 sm:h-[300px] flex items-center justify-center">
            <div className="text-muted-foreground text-xs sm:text-sm">
              No orders yet
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="border-border shadow-card">
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="flex items-center gap-2 font-display text-base sm:text-lg">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          Recent Orders
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-auto sm:h-[480px] pr-2 sm:pr-4">
          <div className="space-y-2 sm:space-y-3">
            {recentOrders.map((order) => {
              const PaymentIcon =
                paymentIcons[order.paymentMethod as keyof typeof paymentIcons];

              return (
                <div
                  key={order._id}
                  className="p-2.5 sm:p-4 rounded-lg bg-secondary/50 border border-border"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5 sm:mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <p className="font-semibold text-xs sm:text-sm truncate">
                          {order._id.slice(-8).toUpperCase()}
                        </p>
                        {(order as any).cashierCode === "KIOSK" && (
                          <Badge
                            variant="secondary"
                            className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0 gap-0.5"
                          >
                            <ScanLine className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            <span className="hidden sm:inline">Self-Order</span>
                            <span className="sm:hidden">Self</span>
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {formatDistanceToNow(order.createdAt, {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="flex items-center gap-0.5 sm:gap-1 capitalize text-[9px] sm:text-xs px-1.5 sm:px-2 py-0.5 h-fit shrink-0"
                    >
                      {PaymentIcon ? (
                        <PaymentIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      ) : null}
                      <span className="hidden sm:inline">
                        {order.paymentMethod === "customer_balance"
                          ? "Customer Balance"
                          : order.paymentMethod}
                      </span>
                      <span className="sm:hidden">
                        {order.paymentMethod === "customer_balance"
                          ? "Balance"
                          : order.paymentMethod}
                      </span>
                    </Badge>
                  </div>

                  <div className="space-y-0.5 mb-2">
                    {order.items.map((item, idx) => (
                      <p
                        key={`${item.menuItemId}-${idx}`}
                        className="text-[10px] sm:text-xs text-muted-foreground truncate"
                      >
                        {item.quantity}x {item.name}
                      </p>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-1.5 sm:pt-2 border-t border-border">
                    <span className="text-[10px] sm:text-xs text-muted-foreground">
                      Total
                    </span>
                    <span className="font-bold text-primary text-sm sm:text-base">
                      ₦{order.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
