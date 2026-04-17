import { query } from "./_generated/server";
import { v } from "convex/values";

export const getRevenueUpToDate = query({
  args: {
    upToTimestamp: v.number(),
    fromTimestamp: v.optional(v.number()), // Add optional start filter for date range
  },
  handler: async (ctx, args) => {
    // Use index to filter, not collect all then filter
    const fromTime = args.fromTimestamp || args.upToTimestamp - (90 * 24 * 60 * 60 * 1000); // Default to last 90 days
    
    const filteredOrders = await ctx.db
      .query("orders")
      .withIndex("by_createdAt", (q) => 
        q.gte("createdAt", fromTime).lte("createdAt", args.upToTimestamp)
      )
      .collect();

    const totalRevenue = filteredOrders
      .filter(order => order.orderType !== "special")
      .reduce((sum, order) => sum + order.total, 0);

    return {
      totalRevenue,
      orderCount: filteredOrders.filter(order => order.orderType !== "special").length,
    };
  },
});
