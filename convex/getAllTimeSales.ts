import { query } from "./_generated/server";
import { v } from "convex/values";

export const getAllTimeSales = query({
  args: {
    startOfMonth: v.optional(v.number()), // Start timestamp for the month
    endOfMonth: v.optional(v.number()),   // End timestamp for the month
  },
  handler: async (ctx, args) => {
    // Default to current month if not provided
    let startTime = args.startOfMonth;
    let endTime = args.endOfMonth;

    if (!startTime || !endTime) {
      const now = new Date();
      startTime = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      endTime = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
    }

    // Fetch orders for the specified month with proper indexing
    const allOrdersRaw = await ctx.db
      .query("orders")
      .withIndex("by_createdAt", (q) => q.gte("createdAt", startTime).lte("createdAt", endTime))
      .order("desc")
      .collect(); // Now safely collects only 1 month of data

    const salesByDate: Record<string, { revenue: number; orders: number }> = {};
    const salesByCashier: Record<string, { revenue: number; orders: number }> = {};
    const uniqueCashierSet = new Set<string>();
    const daySet = new Set<string>();

    let totalRevenue = 0;
    let totalOrders = 0;

    for (const order of allOrdersRaw) {
      if (order.orderType === "special") continue;

      totalRevenue += order.total;
      totalOrders += 1;

      const code = order.cashierCode || "Unknown";
      uniqueCashierSet.add(code);
      if (!salesByCashier[code]) salesByCashier[code] = { revenue: 0, orders: 0 };
      salesByCashier[code].revenue += order.total;
      salesByCashier[code].orders += 1;

      const d = new Date(order.createdAt);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      daySet.add(dateKey);
      if (!salesByDate[dateKey]) salesByDate[dateKey] = { revenue: 0, orders: 0 };
      salesByDate[dateKey].revenue += order.total;
      salesByDate[dateKey].orders += 1;
    }

    return {
      totalRevenue,
      totalOrders,
      avgOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
      totalCustomers: totalOrders, // each order = 1 customer served
      totalDays: daySet.size,
      uniqueCashiers: uniqueCashierSet.size,
      salesByDate: Object.entries(salesByDate)
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      salesByCashier: Object.entries(salesByCashier)
        .map(([cashierCode, data]) => ({ cashierCode, ...data }))
        .sort((a, b) => b.revenue - a.revenue),
      isSampled: false, // Now fetching all orders, not sampled
      totalOrdersCaptured: allOrdersRaw.length, // Show how many orders were actually fetched
    };
  },
});
