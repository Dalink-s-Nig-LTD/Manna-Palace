import { query } from "./_generated/server";

export default query(async ({ db }) => {
  // Set up the time range for today's morning shift (00:00 to 14:30)
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = now.getTime();
  const end = start + (14 * 60 * 60 * 1000) + (30 * 60 * 1000); // 14:30 in ms

  let total = 0;

  // Get orders for today's morning shift only using index
  const morningOrders = await db
    .query("orders")
    .withIndex("by_createdAt", (q) => q.gte("createdAt", start).lte("createdAt", end))
    .collect();

  for (const order of morningOrders) {
    if (order.orderType !== "special") {
      total += order.total;
    }
  }

  return total;
});
