import React, { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getSqliteDB } from "@/lib/sqlite";

type AllTimeSalesData = {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  totalCustomers: number;
};

function buildAllTimeSalesData(
  orders: Array<{
    _id: string;
    total: number;
    orderType?: string;
    cashierCode: string;
    createdAt: number;
  }>,
): AllTimeSalesData {
  const nonSpecialOrders = orders.filter(
    (order) => (order.orderType || "regular") !== "special",
  );
  const totalRevenue = nonSpecialOrders.reduce(
    (sum, order) => sum + order.total,
    0,
  );
  const totalOrders = nonSpecialOrders.length;

  return {
    totalRevenue,
    totalOrders,
    avgOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
    totalCustomers: totalOrders,
  };
}

export function AllTimeSales() {
  const isDesktop = typeof window !== "undefined" && "__TAURI__" in window;
  const [localData, setLocalData] = useState<AllTimeSalesData | null>(null);
  const [localLoading, setLocalLoading] = useState(isDesktop);

  // Month/year state for monthly view - initialized to current month
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Calculate month boundaries for Convex query
  const getMonthBoundaries = (date: Date) => {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );
    return {
      startOfMonth: startOfMonth.getTime(),
      endOfMonth: endOfMonth.getTime(),
    };
  };

  const monthBoundaries = getMonthBoundaries(currentDate);

  // Use aggregated query with monthly date range
  const remoteSummary = useQuery(api.getAllTimeSales.getAllTimeSales, {
    startOfMonth: monthBoundaries.startOfMonth,
    endOfMonth: monthBoundaries.endOfMonth,
  });

  useEffect(() => {
    if (!isDesktop) return;

    const loadLocalData = async () => {
      try {
        const sqlite = getSqliteDB();
        if (!sqlite) {
          setLocalLoading(false);
          return;
        }

        const orders = await sqlite.getCachedOrders();
        // Filter to current month
        const monthStart = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          1,
        ).getTime();
        const monthEnd = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          0,
          23,
          59,
          59,
          999,
        ).getTime();

        const monthOrders = orders.filter(
          (o) => o.createdAt >= monthStart && o.createdAt <= monthEnd,
        );
        setLocalData(buildAllTimeSalesData(monthOrders));
      } catch (error) {
        console.error("Failed to load cached monthly sales:", error);
      } finally {
        setLocalLoading(false);
      }
    };

    setLocalLoading(true);
    loadLocalData();
  }, [isDesktop, currentDate]);

  // Convert aggregated summary to AllTimeSalesData format if needed
  const remoteData = remoteSummary
    ? {
        totalRevenue: remoteSummary.totalRevenue,
        totalOrders: remoteSummary.totalOrders,
        avgOrderValue: remoteSummary.avgOrderValue,
        totalCustomers: remoteSummary.totalCustomers,
      }
    : null;

  const data = isDesktop
    ? (localData ?? remoteData ?? null)
    : (remoteData ?? null);
  const isLoading = isDesktop
    ? localLoading && remoteSummary === undefined && !localData
    : remoteSummary === undefined;

  const handlePreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1),
    );
  };

  // Check if we're at the current month or future
  const today = new Date();
  const isCurrentMonth =
    currentDate.getFullYear() === today.getFullYear() &&
    currentDate.getMonth() === today.getMonth();
  const isFutureMonth =
    currentDate.getFullYear() > today.getFullYear() ||
    (currentDate.getFullYear() === today.getFullYear() &&
      currentDate.getMonth() > today.getMonth());
  const canGoToNextMonth = !isCurrentMonth && !isFutureMonth;

  const monthYearDisplay = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-border shadow-card">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="animate-pulse">
                <div className="h-3 sm:h-4 bg-secondary rounded w-20 mb-1 sm:mb-2"></div>
                <div className="h-6 sm:h-8 bg-secondary rounded w-24"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: "Monthly Revenue",
      value: `₦${data.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "primary",
    },
    {
      title: "Monthly Orders",
      value: data.totalOrders.toLocaleString(),
      icon: ShoppingBag,
      color: "accent",
    },
    {
      title: "Customers Served",
      value: data.totalCustomers.toLocaleString(),
      icon: Users,
      color: "navy",
    },
    {
      title: "Avg. Order Value",
      value: `₦${data.avgOrderValue.toLocaleString()}`,
      icon: TrendingUp,
      color: "success",
    },
  ];

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between flex-col sm:flex-row gap-2">
        <h3 className="text-base sm:text-lg font-semibold text-foreground text-center sm:text-left">
          Monthly Sales Summary
        </h3>
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={handlePreviousMonth}
            className="p-1.5 sm:p-2 hover:bg-secondary rounded-md transition-colors"
            title="Previous month"
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <span className="text-xs sm:text-sm font-medium px-2 sm:px-3 py-0.5 sm:py-1 bg-secondary rounded-md min-w-fit">
            {monthYearDisplay}
          </span>
          <button
            onClick={handleNextMonth}
            disabled={!canGoToNextMonth}
            className={`p-1.5 sm:p-2 rounded-md transition-colors ${
              canGoToNextMonth
                ? "hover:bg-secondary cursor-pointer"
                : "opacity-50 cursor-not-allowed"
            }`}
            title={
              canGoToNextMonth ? "Next month" : "Cannot view future months"
            }
          >
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className="border-border shadow-card hover:shadow-card-hover transition-shadow"
            >
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-0.5 sm:mb-1 truncate">
                      {stat.title}
                    </p>
                    <p className="text-lg sm:text-2xl font-bold text-foreground truncate">
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ${
                      stat.color === "primary"
                        ? "bg-primary/10"
                        : stat.color === "accent"
                          ? "bg-accent/20"
                          : stat.color === "navy"
                            ? "bg-navy/10"
                            : "bg-success/10"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 sm:w-6 sm:h-6 ${
                        stat.color === "primary"
                          ? "text-primary"
                          : stat.color === "accent"
                            ? "text-accent"
                            : stat.color === "navy"
                              ? "text-navy"
                              : "text-success"
                      }`}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
