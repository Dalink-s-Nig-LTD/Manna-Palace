import { v } from "convex/values";
import { mutation } from "./_generated/server";

// Password hashing using PBKDF2 (Web Crypto API compatible)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    data,
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    256
  );
  
  const hashArray = Array.from(new Uint8Array(derivedBits));
  const saltArray = Array.from(salt);
  
  // Return proper JSON string format
  return JSON.stringify({ salt: saltArray, hash: hashArray });
}

// Fix corrupted admin password
export const fixAdminPassword = mutation({
  args: {
    email: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the admin user
    const admin = await ctx.db
      .query("adminUsers")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    if (!admin) {
      throw new Error("Admin user not found");
    }

    // Generate proper password hash
    const properHash = await hashPassword(args.newPassword);

    // Update the password hash
    await ctx.db.patch(admin._id, {
      passwordHash: properHash,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      message: `Password for ${args.email} has been reset successfully`,
      passwordHash: properHash, // Return for verification
    };
  },
});
