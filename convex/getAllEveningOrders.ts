import { query } from "./_generated/server";

import { query } from "./_generated/server";

export const getAllEveningOrders = query({
  handler: async (ctx) => {
    // Get today's date range
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const todayStart = now.getTime();
    const todayEnd = todayStart + 24 * 60 * 60 * 1000;
    
    // Get orders from today only using index - don't collect all orders
    const todayOrders = await ctx.db
      .query("orders")
      .withIndex("by_createdAt", (q) => q.gte("createdAt", todayStart).lte("createdAt", todayEnd))
      .collect();
    
    // Filter evening shift (3:00 PM - 10:00 PM)
    const eveningOrders = todayOrders.filter((order) => {
      const date = new Date(order.createdAt);
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const timeInMinutes = hours * 60 + minutes;
      return timeInMinutes >= 900 && timeInMinutes < 1440;
    });
    
    // Calculate exactly like the frontend does
    let grandTotal = 0;
    let customFoodTotal = 0;
    let customDrinksTotal = 0;
    let menuFoodTotal = 0;
    let menuDrinksTotal = 0;
    
    eveningOrders.forEach((order) => {
      grandTotal += order.total;
      
      order.items.forEach((item) => {
        const itemTotal = item.price * item.quantity;
        const category = item.category?.toLowerCase();
        const isCustom = item.isCustom === true;
        
        if (category === "drink" || category === "drinks") {
          if (isCustom) {
            customDrinksTotal += itemTotal;
          } else {
            menuDrinksTotal += itemTotal;
          }
        } else {
          if (isCustom) {
            customFoodTotal += itemTotal;
          } else {
            menuFoodTotal += itemTotal;
          }
        }
      });
    });
    
    return {
      orderCount: eveningOrders.length,
      grandTotal,
      menuFoodTotal,
      menuDrinksTotal,
      customFoodTotal,
      customDrinksTotal,
      // All orders
      orders: eveningOrders.map(o => ({
        _id: o._id,
        total: o.total,
        createdAt: new Date(o.createdAt).toLocaleString(),
        time: `${new Date(o.createdAt).getHours()}:${String(new Date(o.createdAt).getMinutes()).padStart(2, '0')}`,
        cashierCode: o.cashierCode,
        items: o.items.map(i => ({
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          category: i.category,
          isCustom: i.isCustom
        }))
      }))
    };
  },
});
