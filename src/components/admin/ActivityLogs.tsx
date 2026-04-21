import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import {
  CalendarIcon,
  Download,
  RefreshCw,
  Filter,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function ActivityLogs() {
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [limit, setLimit] = useState(100);
  const [offset, setOffset] = useState(0);

  // Query logs with filters
  const logsData = useQuery(api.activityLogs.getFilteredLogs, {
    role: roleFilter === "all" ? undefined : roleFilter,
    action: actionFilter === "all" ? undefined : actionFilter,
    status:
      statusFilter === "all"
        ? undefined
        : (statusFilter as "success" | "failed"),
    startDate: dateRange.from ? dateRange.from.getTime() : undefined,
    endDate: dateRange.to ? dateRange.to.getTime() : undefined,
    limit,
    offset,
  });

  const stats = useQuery(api.activityLogs.getActivityStats, {
    startDate: dateRange.from ? dateRange.from.getTime() : undefined,
    endDate: dateRange.to ? dateRange.to.getTime() : undefined,
  });

  const logs = logsData?.logs || [];
  const total = logsData?.total || 0;
  const hasMore = logsData?.hasMore || false;

  // Filter logs by search term (client-side for user-friendliness)
  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      log.userEmail?.toLowerCase().includes(searchLower) ||
      log.accessCode?.toLowerCase().includes(searchLower) ||
      log.action.toLowerCase().includes(searchLower) ||
      log.details?.toLowerCase().includes(searchLower)
    );
  });

  const handleExportCSV = () => {
    const headers = [
      "Date",
      "User/Code",
      "Role",
      "Action",
      "Status",
      "Details",
    ];
    const rows = filteredLogs.map((log) => [
      format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss"),
      log.userEmail || log.accessCode || "N/A",
      log.role,
      log.action,
      log.status,
      log.details || "",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const clearFilters = () => {
    setRoleFilter("all");
    setActionFilter("all");
    setStatusFilter("all");
    setSearchTerm("");
    setDateRange({ from: undefined, to: undefined });
    setOffset(0);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <Card className="p-2.5 sm:p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
              <CardTitle className="text-[10px] sm:text-sm font-medium">Logs</CardTitle>
              <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-lg sm:text-2xl font-bold">{stats.totalLogs}</div>
            </CardContent>
          </Card>
          <Card className="p-2.5 sm:p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
              <CardTitle className="text-[10px] sm:text-sm font-medium">Success</CardTitle>
              <div className="h-2.5 w-2.5 sm:h-4 sm:w-4 rounded-full bg-green-500" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-lg sm:text-2xl font-bold text-green-600">
                {stats.successfulActions}
              </div>
            </CardContent>
          </Card>
          <Card className="p-2.5 sm:p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
              <CardTitle className="text-[10px] sm:text-sm font-medium">Failed</CardTitle>
              <div className="h-2.5 w-2.5 sm:h-4 sm:w-4 rounded-full bg-red-500" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-lg sm:text-2xl font-bold text-red-600">
                {stats.failedActions}
              </div>
            </CardContent>
          </Card>
          <Card className="p-2.5 sm:p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
              <CardTitle className="text-[10px] sm:text-sm font-medium">Users</CardTitle>
              <div className="text-xs sm:text-base">👥</div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-lg sm:text-2xl font-bold">
                {stats.uniqueAdminUsers + stats.uniqueCashiers}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="text-sm sm:text-base">Activity Logs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          {/* Search */}
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-xs sm:text-sm"
          />

          {/* Filter Controls - Responsive Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="text-xs sm:text-sm h-8 sm:h-10">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="superadmin">Superadmin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="cashier">Cashier</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="vc">VC</SelectItem>
              </SelectContent>
            </Select>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="text-xs sm:text-sm h-8 sm:h-10">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
                <SelectItem value="create_order">Create Order</SelectItem>
                <SelectItem value="update_menu">Update Menu</SelectItem>
                <SelectItem value="create_user">Create User</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="text-xs sm:text-sm h-8 sm:h-10">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="text-xs sm:text-sm h-8 sm:h-10 justify-start px-2 sm:px-3"
                >
                  <CalendarIcon className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate text-[10px] sm:text-xs">
                    {dateRange.from
                      ? dateRange.to
                        ? `${format(dateRange.from, "M/d")} - ${format(dateRange.to, "M/d")}`
                        : format(dateRange.from, "M/d")
                      : "Date"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) =>
                    setDateRange({ from: range?.from, to: range?.to })
                  }
                  numberOfMonths={1}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="text-[10px] sm:text-xs text-muted-foreground">
              {filteredLogs.length} of {total}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={clearFilters} className="text-xs h-8">
                <RefreshCw className="mr-1 h-3 w-3" />
                <span className="hidden sm:inline">Clear</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV} className="text-xs h-8">
                <Download className="mr-1 h-3 w-3" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table/Cards */}
      <Card>
        <CardContent className="pt-3 sm:pt-6">
          {/* Desktop Table - Hidden on mobile */}
          <div className="hidden sm:block rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date & Time</TableHead>
                  <TableHead className="text-xs">User/Code</TableHead>
                  <TableHead className="text-xs">Role</TableHead>
                  <TableHead className="text-xs">Action</TableHead>
                  <TableHead className="text-xs max-w-[200px]">Details</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-xs">
                      No activity logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log._id}>
                      <TableCell className="whitespace-nowrap text-xs">
                        {format(new Date(log.createdAt), "MMM dd HH:mm")}
                      </TableCell>
                      <TableCell className="text-xs">
                        {log.userEmail || log.accessCode || "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{log.role}</Badge>
                      </TableCell>
                      <TableCell className="font-medium text-xs">
                        {log.action}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs">
                        {log.details || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            log.status === "success" ? "default" : "destructive"
                          }
                          className="text-[10px]"
                        >
                          {log.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards - Visible only on mobile */}
          <div className="sm:hidden space-y-2">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">
                No activity logs found
              </div>
            ) : (
              filteredLogs.map((log) => (
                <Card key={log._id} className="p-2.5 bg-muted/50">
                  <div className="space-y-1.5 text-[10px]">
                    <div className="flex justify-between items-start gap-2">
                      <div className="font-medium">{log.action}</div>
                      <Badge
                        variant={
                          log.status === "success" ? "default" : "destructive"
                        }
                        className="text-[8px]"
                      >
                        {log.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-[9px]">
                      <span className="text-muted-foreground">
                        {log.userEmail || log.accessCode || "N/A"}
                      </span>
                      <Badge variant="outline" className="text-[8px]">
                        {log.role}
                      </Badge>
                    </div>
                    <div className="text-[9px] text-muted-foreground">
                      {format(new Date(log.createdAt), "MMM dd HH:mm")}
                    </div>
                    {log.details && (
                      <div className="text-[9px] pt-1 border-t text-muted-foreground truncate">
                        {log.details}
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
    </div>
  );
}
