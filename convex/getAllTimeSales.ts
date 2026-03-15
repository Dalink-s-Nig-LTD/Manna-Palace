import { query } from "./_generated/server";

export const getAllTimeSales = query({
  args: {},
  handler: async (ctx) => {
    const allOrdersRaw = await ctx.db.query("orders").collect();
    // Exclude special orders from sales totals
    const allOrders = allOrdersRaw.filter(order => order.orderType !== "special");

    // Single pass aggregation instead of multiple iterations
    let totalRevenue = 0;
    const uniqueCashiers = new Set<string>();
    const daysSet = new Set<string>();
    const salesByDate: Record<string, { revenue: number; orders: number }> = {};
    const salesByCashier: Record<string, { revenue: number; orders: number }> = {};

    for (const order of allOrders) {
      // Revenue and order count
      totalRevenue += order.total;

      // Track cashiers and days
      uniqueCashiers.add(order.cashierCode);
      const dateStr = new Date(order.createdAt).toDateString();
      daysSet.add(dateStr);

      // Group by date (single pass)
      const dateFormatted = new Date(order.createdAt).toLocaleDateString("en-NG", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      if (!salesByDate[dateFormatted]) {
        salesByDate[dateFormatted] = { revenue: 0, orders: 0 };
      }
      salesByDate[dateFormatted].revenue += order.total;
      salesByDate[dateFormatted].orders += 1;

      // Group by cashier (single pass)
      const code = order.cashierCode || "Unknown";
      if (!salesByCashier[code]) {
        salesByCashier[code] = { revenue: 0, orders: 0 };
      }
      salesByCashier[code].revenue += order.total;
      salesByCashier[code].orders += 1;
    }

    const totalOrders = allOrders.length;

    return {
      totalRevenue,
      totalOrders,
      avgOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
      totalCustomers: totalOrders,
      totalDays: daysSet.size,
      uniqueCashiers: uniqueCashiers.size,
      salesByDate: Object.entries(salesByDate)
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      salesByCashier: Object.entries(salesByCashier)
        .map(([cashierCode, data]) => ({ cashierCode, ...data }))
        .sort((a, b) => b.revenue - a.revenue),
    };
  },
});

