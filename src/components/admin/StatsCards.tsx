import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, ShoppingBag, DollarSign, Users } from "lucide-react";

export function StatsCards() {
  const stats = useQuery(api.orders.getOrdersStats);

  console.log("StatsCards - Data:", stats);

  if (!stats) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-border shadow-card">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="animate-pulse">
                <div className="h-3 sm:h-4 bg-secondary rounded w-20 mb-1 sm:mb-2"></div>
                <div className="h-6 sm:h-8 bg-secondary rounded w-24 mb-1"></div>
                <div className="h-2 sm:h-3 bg-secondary rounded w-16"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsData = [
    {
      title: "Weekly Revenue",
      value: `₦${stats.totalRevenue.toLocaleString()}`,
      change: stats.revenueChange,
      trend: "up",
      icon: DollarSign,
      color: "primary",
    },
    {
      title: "Weekly Orders",
      value: stats.totalOrders.toString(),
      change: stats.ordersChange,
      trend: "up",
      icon: ShoppingBag,
      color: "accent",
    },
    {
      title: "Avg. Order Value",
      value: `₦${stats.avgOrderValue.toLocaleString()}`,
      change: stats.avgChange,
      trend: "up",
      icon: TrendingUp,
      color: "success",
    },
    {
      title: "Daily Customers",
      value: stats.dailyCustomers.toString(),
      change: stats.dailyChange,
      trend: "up",
      icon: Users,
      color: "navy",
    },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
      {statsData.map((stat) => {
        const Icon = stat.icon;

        return (
          <Card
            key={stat.title}
            className="border-border shadow-card hover:shadow-card-hover transition-shadow"
          >
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-2 sm:gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-0.5 sm:mb-1 truncate">
                    {stat.title}
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-foreground break-words sm:whitespace-nowrap">
                    {stat.value}
                  </p>
                  <p className="text-xs text-success mt-0.5 sm:mt-1 flex items-center gap-0.5 truncate">
                    <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                    <span className="truncate">{stat.change}</span>
                  </p>
                </div>
                <div
                  className={`
                  w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0
                  ${stat.color === "primary" ? "bg-primary/10" : ""}
                  ${stat.color === "accent" ? "bg-accent/20" : ""}
                  ${stat.color === "success" ? "bg-success/10" : ""}
                  ${stat.color === "navy" ? "bg-navy/10" : ""}
                `}
                >
                  <Icon
                    className={`
                    w-5 h-5 sm:w-6 sm:h-6
                    ${stat.color === "primary" ? "text-primary" : ""}
                    ${stat.color === "accent" ? "text-accent" : ""}
                    ${stat.color === "success" ? "text-success" : ""}
                    ${stat.color === "navy" ? "text-navy" : ""}
                  `}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
