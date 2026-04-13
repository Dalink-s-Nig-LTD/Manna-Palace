# SQLite Daily Report Debugging Guide

## When Built App Shows No Orders in Daily Report

### Logging Chain to Check (in Browser Console):

1. **Module initialization** (appear on page load):

   ```
   [SQLiteDB Module] Loaded. Tauri: true, sqliteDB instance: ✅
   [getSqliteDB] Creating new SQLiteOrderDB instance
   [sqliteDB export] Initialized: ✅
   ```

   ❌ If any show `❌` or negative → SQLite not loading

2. **CartContext initialization**:

   ```
   [CartContext] Starting orderQueue initialization...
   [OrderQueue] Init: isTauri = true
   [OrderQueue] Attempting SQLite initialization...
   [SQLiteDB] Attempting to load @tauri-apps/plugin-sql...
   [SQLiteDB] ✅ Successfully loaded @tauri-apps/plugin-sql
   [OrderQueue] ✅ SQLite initialized successfully
   [CartContext] ✅ OrderQueue initialized successfully
   ```

   ❌ If you see `❌ SQLite init failed` → Plugin not loading in production

3. **When you make an order**:

   ```
   📦 Order queue_XXXXX saved to SQLite
   [CartContext] Order saved to SQLite successfully
   [SQLiteDB] Fetching all pending orders...
   [SQLiteDB] Found 1 pending orders
   ```

4. **When opening Daily Report**:
   ```
   [TodayOrders] Loading local data for date range: ...
   [TodayOrders] Fetching cached orders...
   [TodayOrders] ✅ Got X cached orders for date range
   [TodayOrders] ✅ Got Y cached access codes
   [TodayOrders] Built today orders data: { totalOrders: X, ... }
   ```
   ❌ If you see `⚠️ getSqliteDB returned null` → SQLite instance is null

### Most Common Issue in Production Build:

**Plugin Import Fails** - The dynamic import of `@tauri-apps/plugin-sql` fails silently

**Watch for this log**:

```
[SQLiteDB] ❌ Failed to load @tauri-apps/plugin-sql: [error details]
```

### If Orders Work in Dev but Not in Build:

1. **Check Tauri.conf.json CSP** - is `@tauri-apps/plugin-sql` whitelisted?
2. **Check features in Cargo.toml** - is `sql` feature enabled?
3. **Confirm SQLite plugin installed**: `npm list @tauri-apps/plugin-sql`

### Fallback Behavior:

If SQLite fails to initialize, the app automatically falls back to:

- **Dev** → Will show: `[OrderQueue] Using IndexedDB (Tauri: true SQLite: null)`
- **Build** → Browser IndexedDB (persists locally but not on desktop)

### To Force Full Debugging:

Open DevTools → F12 → Console

- Search for `[SQLiteDB]` to see all SQLite logs
- Search for `[OrderQueue]` to see order queue logs
- Search for `[TodayOrders]` to see report loading logs

### To Verify Orders Are in SQLite:

1. Create an order in built app
2. Check console for success logs
3. Reopen app WITHOUT clearing data
4. Open daily report
5. Watch console for `Got X cached orders`

If missing, orders weren't saved to SQLite (check step 3 above - order save logs).
C:\Users\USER\AppData\Roaming\Manna Palace\logs\
