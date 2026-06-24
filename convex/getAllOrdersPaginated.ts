import { query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

/**
 * Fetch all orders with pagination support
 * This query fetches orders in batches to work around Convex's return size limit
 * Each call returns up to batchSize orders after the lastOrderId cursor
 */
export const getAllOrdersPaginated = query({
  args: {
    batchSize: v.optional(v.number()),
    cursor: v.optional(v.string()), // lastOrderId from previous batch
  },
  handler: async (ctx, args) => {
    const batchSize = Math.min(args.batchSize || 1000, 5000);

    // Retrieve paginated batch using the cursor and the index
    let rawOrders;
    if (args.cursor) {
      const cursorDoc = await ctx.db.get(args.cursor as Id<"orders">);
      if (cursorDoc) {
        // Since we order "desc", subsequent pages must have createdAt <= cursor's createdAt.
        // We fetch a bit extra (batchSize + 100) to safely bypass duplicate timestamps.
        const potentialOrders = await ctx.db
          .query("orders")
          .withIndex("by_createdAt", (q) => q.lte("createdAt", cursorDoc.createdAt))
          .order("desc")
          .take(batchSize + 100);
        
        const cursorIndex = potentialOrders.findIndex((o) => o._id === args.cursor);
        if (cursorIndex !== -1) {
          rawOrders = potentialOrders.slice(cursorIndex + 1);
        } else {
          rawOrders = potentialOrders;
        }
      } else {
        rawOrders = await ctx.db
          .query("orders")
          .withIndex("by_createdAt")
          .order("desc")
          .take(batchSize + 1);
      }
    } else {
      rawOrders = await ctx.db
        .query("orders")
        .withIndex("by_createdAt")
        .order("desc")
        .take(batchSize + 1);
    }

    const hasMore = rawOrders.length > batchSize;
    const result = rawOrders.slice(0, batchSize);

    // Sum and count of all orders in this batch
    const batchTotal = result.reduce((sum, o) => sum + (o.total || 0), 0);
    const batchCount = result.length;
    
    // Sum and count of regular orders in this batch (excluding special orders)
    const regularOrders = result.filter((o) => (o.orderType || "regular") !== "special");
    const regularBatchTotal = regularOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const regularBatchCount = regularOrders.length;

    // Compute the grand totals only on the first page/dashboard run (no cursor) to save DB read quota.
    // We cap it at 30,000 records to prevent hitting the Convex 32,000 document read limit.
    let totalAmount;
    let totalCount;
    let regularTotalAmount;
    let regularTotalCount;
    let isTotalPrecise;

    if (!args.cursor) {
      const totalOrdersToCalculate = await ctx.db
        .query("orders")
        .order("desc")
        .take(30000);

      totalAmount = totalOrdersToCalculate.reduce((sum, o) => sum + (o.total || 0), 0);
      totalCount = totalOrdersToCalculate.length;

      const regularOrdersToCalculate = totalOrdersToCalculate.filter((o) => (o.orderType || "regular") !== "special");
      regularTotalAmount = regularOrdersToCalculate.reduce((sum, o) => sum + (o.total || 0), 0);
      regularTotalCount = regularOrdersToCalculate.length;
      isTotalPrecise = totalCount < 30000;
    }

    return {
      orders: result,
      hasMore,
      nextCursor: hasMore ? result[result.length - 1]?._id : null,
      batchTotal,
      batchCount,
      regularBatchTotal,
      regularBatchCount,
      totalAmount,
      totalCount,
      regularTotalAmount,
      regularTotalCount,
      isTotalPrecise,
    };
  },
});

/**
 * Get count of orders for a date range (useful for progress tracking)
 * Defaults to current month if no date range provided
 */
export const getOrdersCount = query({
  args: {
    startOfMonth: v.optional(v.number()),
    endOfMonth: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Default to current month
    let startTime = args.startOfMonth;
    let endTime = args.endOfMonth;

    if (!startTime || !endTime) {
      const now = new Date();
      startTime = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      endTime = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
    }

    // Count orders for the date range
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_createdAt", (q) => q.gte("createdAt", startTime).lte("createdAt", endTime))
      .collect();
    
    return orders.length;
  },
});

/**
 * Fetch all orders since a specific timestamp
 * Used for incremental syncing
 */
export const getOrdersSinceTimestamp = query({
  args: {
    sinceTimestamp: v.number(),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = Math.min(args.batchSize || 1000, 5000);
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_createdAt")
      .filter((q) => q.gte(q.field("createdAt"), args.sinceTimestamp))
      .order("desc")
      .take(batchSize + 1);

    const hasMore = orders.length > batchSize;
    return {
      orders: orders.slice(0, batchSize),
      hasMore,
      nextCursor: hasMore ? orders[batchSize]?._id : null,
    };
  },
});
