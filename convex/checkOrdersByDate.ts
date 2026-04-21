import { query } from "./_generated/server";
import { v } from "convex/values";

export const checkOrdersByDate = query({
  args: {
    dateStart: v.number(), // timestamp for start of day
    dateEnd: v.number(),   // timestamp for end of day
  },
  handler: async (ctx, args) => {
    try {
      // Validate input arguments
      if (typeof args.dateStart !== 'number' || typeof args.dateEnd !== 'number') {
        throw new Error("Invalid date arguments: dateStart and dateEnd must be numbers");
      }

      if (args.dateStart >= args.dateEnd) {
        throw new Error("Invalid date range: dateStart must be before dateEnd");
      }

      const allOrders = await ctx.db
        .query("orders")
        .withIndex("by_createdAt", (q) => q.gte("createdAt", args.dateStart).lte("createdAt", args.dateEnd))
        .collect();
      
      // Filter orders safely with proper null checks
      const dayOrders = allOrders.filter((order) => {
        try {
          const orderType = order.orderType ?? "regular";
          return orderType !== "special";
        } catch (err) {
          console.error("Error filtering order:", order, err);
          return false;
        }
      });

      // Fetch all access codes from DB for display info
      const accessCodes = await ctx.db.query("accessCodes").collect();
      const codeMap: Record<string, { shift?: string }> = {};
      accessCodes.forEach((ac) => {
        if (ac && ac.code) {
          codeMap[ac.code] = { shift: ac.shift };
        }
      });

      const morningShift: any[] = [];
      const afternoonShift: any[] = [];
      const eveningShift: any[] = [];
      const unassigned: any[] = [];

      dayOrders.forEach((order) => {
        const shift = codeMap[order.cashierCode]?.shift;
        if (shift === "morning") morningShift.push(order);
        else if (shift === "afternoon") afternoonShift.push(order);
        else if (shift === "evening") eveningShift.push(order);
        else unassigned.push(order);
      });

    const calcTotals = (orders: any[]) => {
      let grandTotal = 0;
      let customFoodTotal = 0;
      let customDrinksTotal = 0;
      let menuFoodTotal = 0;
      let menuDrinksTotal = 0;
      const byAccessCode: Record<string, { total: number; orderCount: number; shift?: string }> = {};

      orders.forEach((order) => {
        try {
          // Ensure order.total is a valid number
          const orderTotal = order.total ?? 0;
          grandTotal += orderTotal;
          
          const code = order.cashierCode || "UNKNOWN";
          if (!byAccessCode[code]) {
            byAccessCode[code] = {
              total: 0,
              orderCount: 0,
              shift: codeMap[code]?.shift,
            };
          }
          byAccessCode[code].total += orderTotal;
          byAccessCode[code].orderCount += 1;

          // Safely handle items array
          if (Array.isArray(order.items) && order.items.length > 0) {
            order.items.forEach((item: any) => {
              try {
                const itemPrice = item.price ?? 0;
                const itemQuantity = item.quantity ?? 0;
                const itemTotal = itemPrice * itemQuantity;
                const category = item.category?.toLowerCase() ?? "";
                const isCustom = item.isCustom === true;

                if (category === "drink" || category === "drinks") {
                  if (isCustom) customDrinksTotal += itemTotal;
                  else menuDrinksTotal += itemTotal;
                } else {
                  if (isCustom) customFoodTotal += itemTotal;
                  else menuFoodTotal += itemTotal;
                }
              } catch (itemErr) {
                console.error("Error processing item:", item, itemErr);
              }
            });
          }
        } catch (orderErr) {
          console.error("Error processing order:", order, orderErr);
        }
      });

      return { grandTotal, menuFoodTotal, menuDrinksTotal, customFoodTotal, customDrinksTotal, byAccessCode };
    };

    const allDayTotals = calcTotals(dayOrders);

    return {
      totalOrders: dayOrders.length,
      beforeMorning: { count: 0, total: 0 },
      morningShift: {
        count: morningShift.length,
        ...calcTotals(morningShift),
      },
      afternoonShift: {
        count: afternoonShift.length,
        ...calcTotals(afternoonShift),
      },
      eveningShift: {
        count: eveningShift.length,
        ...calcTotals(eveningShift),
      },
      afterEvening: { count: 0, total: 0 },
      allDayTotal: allDayTotals.grandTotal,
      allDayByAccessCode: allDayTotals.byAccessCode,
    };
    } catch (error) {
      console.error("[checkOrdersByDate] Error:", error);
      // Return empty/safe response on error
      return {
        totalOrders: 0,
        beforeMorning: { count: 0, total: 0 },
        morningShift: {
          count: 0,
          grandTotal: 0,
          menuFoodTotal: 0,
          menuDrinksTotal: 0,
          customFoodTotal: 0,
          customDrinksTotal: 0,
          byAccessCode: {},
        },
        afternoonShift: {
          count: 0,
          grandTotal: 0,
          menuFoodTotal: 0,
          menuDrinksTotal: 0,
          customFoodTotal: 0,
          customDrinksTotal: 0,
          byAccessCode: {},
        },
        eveningShift: {
          count: 0,
          grandTotal: 0,
          menuFoodTotal: 0,
          menuDrinksTotal: 0,
          customFoodTotal: 0,
          customDrinksTotal: 0,
          byAccessCode: {},
        },
        afterEvening: { count: 0, total: 0 },
        allDayTotal: 0,
        allDayByAccessCode: {},
      };
    }
  },
});
