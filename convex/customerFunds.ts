import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Add funds to customer (manager action)
export const addFunds = mutation({
  args: {
    customerId: v.id("customers"),
    amount: v.number(),
    description: v.string(),
    addedBy: v.string(),
    paymentReference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.amount <= 0) throw new Error("Amount must be positive.");

    const customer = await ctx.db.get(args.customerId);
    if (!customer) throw new Error("Customer not found.");
    if (!customer.isActive) throw new Error("Customer account is inactive.");

    const balanceBefore = customer.balance;
    const balanceAfter = balanceBefore + args.amount;

    await ctx.db.patch(args.customerId, { balance: balanceAfter, updatedAt: Date.now() });

    await ctx.db.insert("customerTransactions", {
      customerId: args.customerId,
      type: "credit",
      amount: args.amount,
      balanceBefore,
      balanceAfter,
      description: args.description,
      addedBy: args.addedBy,
      paymentReference: args.paymentReference,
      createdAt: Date.now(),
    });

    return { balanceAfter };
  },
});

// Deduct funds from customer (order payment)
export const deductFunds = mutation({
  args: {
    customerId: v.id("customers"),
    amount: v.number(),
    description: v.string(),
    orderId: v.optional(v.id("orders")),
  },
  handler: async (ctx, args) => {
    if (args.amount <= 0) throw new Error("Amount must be positive.");

    const customer = await ctx.db.get(args.customerId);
    if (!customer) throw new Error("Customer not found.");
    if (!customer.isActive) throw new Error("Customer account is inactive.");
    if (customer.balance < args.amount) throw new Error("Insufficient balance.");

    const balanceBefore = customer.balance;
    const balanceAfter = balanceBefore - args.amount;

    await ctx.db.patch(args.customerId, { balance: balanceAfter, updatedAt: Date.now() });

    await ctx.db.insert("customerTransactions", {
      customerId: args.customerId,
      type: "debit",
      amount: args.amount,
      balanceBefore,
      balanceAfter,
      description: args.description,
      orderId: args.orderId,
      createdAt: Date.now(),
    });

    return { balanceAfter };
  },
});

// Deduct funds from customer by admin (with reason)
export const deductByAdmin = mutation({
  args: {
    customerId: v.id("customers"),
    amount: v.number(),
    reason: v.string(),
    deductedBy: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.amount <= 0) throw new Error("Amount must be positive.");
    if (!args.reason || args.reason.trim() === "") throw new Error("Reason is required.");

    const customer = await ctx.db.get(args.customerId);
    if (!customer) throw new Error("Customer not found.");
    if (!customer.isActive) throw new Error("Customer account is inactive.");
    if (customer.balance < args.amount) throw new Error("Insufficient balance.");

    const balanceBefore = customer.balance;
    const balanceAfter = balanceBefore - args.amount;

    // Update customer balance
    await ctx.db.patch(args.customerId, { balance: balanceAfter, updatedAt: Date.now() });

    // Create transaction record
    await ctx.db.insert("customerTransactions", {
      customerId: args.customerId,
      type: "debit",
      amount: args.amount,
      balanceBefore,
      balanceAfter,
      description: `Admin deduction: ${args.reason}`,
      addedBy: args.deductedBy,
      createdAt: Date.now(),
    });

    // Create order record for the deduction
    await ctx.db.insert("orders", {
      items: [
        {
          name: args.reason,
          price: args.amount,
          quantity: 1,
          isCustom: true,
        },
      ],
      total: args.amount,
      paymentMethod: "customer_balance",
      customerId: args.customerId,
      status: "completed",
      orderType: "deduction",
      cashierCode: args.deductedBy,
      createdAt: Date.now(),
    });

    return { balanceAfter };
  },
});

// Get transaction history for a customer
export const getTransactionHistory = query({
  args: {
    customerId: v.id("customers"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const txns = await ctx.db
      .query("customerTransactions")
      .withIndex("by_customerId", (q) => q.eq("customerId", args.customerId))
      .order("desc")
      .take(limit);

    // Enrich debit transactions with order items
    const enriched = await Promise.all(
      txns.map(async (tx) => {
        if (tx.orderId) {
          const order = await ctx.db.get(tx.orderId);
          if (order) {
            const itemsSummary = order.items
              .map((i) => (i.quantity > 1 ? `${i.name} x${i.quantity}` : i.name))
              .join(", ");
            return { ...tx, itemsSummary };
          }
        }
        return { ...tx, itemsSummary: undefined as string | undefined };
      })
    );
    return enriched;
  },
});

// Get customer balance
export const getCustomerBalance = query({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args) => {
    const customer = await ctx.db.get(args.customerId);
    if (!customer) throw new Error("Customer not found.");
    return { balance: customer.balance, name: `${customer.firstName} ${customer.lastName}` };
  },
});

