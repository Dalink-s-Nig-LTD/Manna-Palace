import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  Plus,
  Trash2,
  Wallet,
  AlertCircle,
  CalendarIcon,
  RefreshCw,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ManualEntries() {
  const { userName, code, userEmail } = useAuth();
  const isMobile = useIsMobile();
  const authIdentifier = userEmail || code || "";

  // Replace Day dialog state
  const [isReplaceDayOpen, setIsReplaceDayOpen] = useState(false);
  const [replaceDate, setReplaceDate] = useState<Date>();
  const [morningTotal, setMorningTotal] = useState("");
  const [eveningTotal, setEveningTotal] = useState("");

  const [selectedMorningCashierCode, setSelectedMorningCashierCode] =
    useState("");
  const [selectedEveningCashierCode, setSelectedEveningCashierCode] =
    useState("");

  // Quick Entry dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [selectedQuickShift, setSelectedQuickShift] = useState("");
  const [selectedQuickCashierCode, setSelectedQuickCashierCode] = useState("");

  const createManualEntry = useMutation(api.manualEntries.createManualEntry);
  const replaceDayOrders = useMutation(api.manualEntries.replaceDayOrders);
  const deleteManualEntry = useMutation(api.manualEntries.deleteManualEntry);

  const entries = useQuery(api.manualEntries.getManualEntries, {});
  const stats = useQuery(api.manualEntries.getManualEntriesStats);
  const accessCodes = useQuery(api.accessCodes.listAccessCodes);
  const cashierCodes = (accessCodes || []).filter(
    (c) => c.role === "cashier" && c.isActive,
  );
  const morningCashierCodes = cashierCodes.filter((c) => c.shift === "morning");
  const eveningCashierCodes = cashierCodes.filter((c) => c.shift === "evening");
  const quickCashierCodes = selectedQuickShift
    ? cashierCodes.filter((c) => c.shift === selectedQuickShift)
    : cashierCodes;

  const handleReplaceDay = async () => {
    if (!replaceDate) {
      toast({
        title: "Error",
        description: "Please select a date",
        variant: "destructive",
      });
      return;
    }
    const morning = parseFloat(morningTotal) || 0;
    const evening = parseFloat(eveningTotal) || 0;
    if (morning === 0 && evening === 0) {
      toast({
        title: "Error",
        description: "Enter at least one shift total",
        variant: "destructive",
      });
      return;
    }

    try {
      // Always use midnight local time for the selected day
      const localMidnight = new Date(
        replaceDate.getFullYear(),
        replaceDate.getMonth(),
        replaceDate.getDate(),
        0,
        0,
        0,
        0,
      ).getTime();
      const result = await replaceDayOrders({
        date: localMidnight,
        morningTotal: morning,
        eveningTotal: evening,
        reason: "Manual day replacement",
        cashierCode: authIdentifier,
        morningCashierCode: selectedMorningCashierCode || undefined,
        eveningCashierCode: selectedEveningCashierCode || undefined,
      });

      toast({
        title: "Day Replaced",
        description: `Deleted ${result.deletedCount} orders. Set morning: ₦${morning.toLocaleString()}, evening: ₦${evening.toLocaleString()}`,
      });

      setReplaceDate(undefined);
      setMorningTotal("");
      setEveningTotal("");
      setSelectedMorningCashierCode("");
      setSelectedEveningCashierCode("");
      setIsReplaceDayOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to replace day orders",
        variant: "destructive",
      });
    }
  };

  const handleCreateEntry = async () => {
    if (!amount || !description || !date) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount === 0) {
      toast({
        title: "Error",
        description: "Please enter a valid non-zero amount",
        variant: "destructive",
      });
      return;
    }

    try {
      // Always use midnight local time for the selected day
      const entryDate = new Date(date);
      const localMidnight = new Date(
        entryDate.getFullYear(),
        entryDate.getMonth(),
        entryDate.getDate(),
        0,
        0,
        0,
        0,
      ).getTime();
      await createManualEntry({
        amount: parsedAmount,
        description,
        date: localMidnight,
        reason: "Manual entry",
        cashierCode: authIdentifier,
        orderCashierCode: selectedQuickCashierCode || undefined,
      });
      toast({
        title: "Success",
        description: "Manual entry added successfully",
      });
      setAmount("");
      setDescription("");
      setDate("");
      setSelectedQuickShift("");
      setSelectedQuickCashierCode("");
      setIsCreateDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to add manual entry",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEntry = async (
    entryId: Id<"manualEntries">,
    entryDescription: string,
  ) => {
    if (
      !confirm(
        `Are you sure you want to delete this manual entry?\n"${entryDescription}"`,
      )
    )
      return;
    try {
      await deleteManualEntry({ id: entryId, cashierCode: authIdentifier });
      toast({
        title: "Success",
        description: "Manual entry deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete entry",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Use <strong>Replace Day</strong> to delete all existing orders for a
          date and set correct morning/evening shift totals. Use{" "}
          <strong>Quick Entry</strong> to add a single adjustment amount.
        </AlertDescription>
      </Alert>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <Card className="p-2.5 sm:p-4">
          <CardHeader className="pb-1 sm:pb-2 p-0">
            <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-lg sm:text-2xl font-bold">
              {stats?.total || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="p-2.5 sm:p-4">
          <CardHeader className="pb-1 sm:pb-2 p-0">
            <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground">
              Amount
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-lg sm:text-2xl font-bold break-words">
              ₦{stats?.totalAmount?.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="p-2.5 sm:p-4">
          <CardHeader className="pb-1 sm:pb-2 p-0">
            <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground">
              Month
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-lg sm:text-2xl font-bold">
              ₦{stats?.monthTotal?.toLocaleString() || 0}
            </div>
            <div className="text-[9px] sm:text-xs text-muted-foreground">
              {stats?.monthCount || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="p-2.5 sm:p-4">
          <CardHeader className="pb-1 sm:pb-2 p-0">
            <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground">
              Today
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-lg sm:text-2xl font-bold">
              ₦{stats?.todayTotal?.toLocaleString() || 0}
            </div>
            <div className="text-[9px] sm:text-xs text-muted-foreground">
              {stats?.todayCount || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manual Entries Management */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
            <div>
              <CardTitle className="flex items-center gap-1 sm:gap-2 text-sm sm:text-base">
                <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
                Entries
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">
                Replace day or add adjustments
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 w-full sm:w-auto">
              {/* Replace Day Dialog */}
              <Dialog
                open={isReplaceDayOpen}
                onOpenChange={setIsReplaceDayOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="flex-1 sm:flex-none text-xs gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span className="hidden sm:inline">Replace</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] sm:w-full max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-sm sm:text-base">
                      Replace Day
                    </DialogTitle>
                    <DialogDescription>
                      Delete all orders for the selected date and set new shift
                      totals
                    </DialogDescription>
                  </DialogHeader>

                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      This will <strong>permanently delete</strong> all existing
                      orders for the selected date and replace them with the
                      totals you enter.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !replaceDate && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {replaceDate
                              ? format(replaceDate, "PPP")
                              : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={replaceDate}
                            onSelect={setReplaceDate}
                            disabled={(d) => d > new Date()}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="morningTotal">
                        Morning Shift Total (₦)
                      </Label>
                      <Input
                        id="morningTotal"
                        type="number"
                        placeholder="0"
                        value={morningTotal}
                        onChange={(e) => setMorningTotal(e.target.value)}
                        min="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="eveningTotal">
                        Evening Shift Total (₦)
                      </Label>
                      <Input
                        id="eveningTotal"
                        type="number"
                        placeholder="0"
                        value={eveningTotal}
                        onChange={(e) => setEveningTotal(e.target.value)}
                        min="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Morning Cashier</Label>
                      <Select
                        value={selectedMorningCashierCode}
                        onValueChange={setSelectedMorningCashierCode}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select morning cashier" />
                        </SelectTrigger>
                        <SelectContent>
                          {(morningCashierCodes.length > 0
                            ? morningCashierCodes
                            : cashierCodes
                          ).map((c) => (
                            <SelectItem key={c._id} value={c.code}>
                              {c.code} — {c.shift || "No shift"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Evening Cashier</Label>
                      <Select
                        value={selectedEveningCashierCode}
                        onValueChange={setSelectedEveningCashierCode}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select evening cashier" />
                        </SelectTrigger>
                        <SelectContent>
                          {(eveningCashierCodes.length > 0
                            ? eveningCashierCodes
                            : cashierCodes
                          ).map((c) => (
                            <SelectItem key={c._id} value={c.code}>
                              {c.code} — {c.shift || "No shift"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <DialogFooter className="gap-2 flex-col-reverse sm:flex-row">
                    <Button
                      variant="outline"
                      onClick={() => setIsReplaceDayOpen(false)}
                      className="text-xs sm:text-sm"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleReplaceDay}
                      className="text-xs sm:text-sm"
                    >
                      Replace
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Quick Entry Dialog */}
              <Dialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-none text-xs gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span className="hidden sm:inline">Entry</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] sm:w-full max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-sm sm:text-base">
                      Quick Entry
                    </DialogTitle>
                    <DialogDescription>
                      Add a single amount adjustment
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount (₦) *</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="Enter amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        step="0.01"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date">Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        placeholder="Brief description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Shift</Label>
                      <Select
                        value={selectedQuickShift}
                        onValueChange={(v) => {
                          setSelectedQuickShift(v);
                          setSelectedQuickCashierCode("");
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Filter by shift" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="morning">Morning</SelectItem>
                          <SelectItem value="evening">Evening</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Attribute to Cashier</Label>
                      <Select
                        value={selectedQuickCashierCode}
                        onValueChange={setSelectedQuickCashierCode}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select cashier code" />
                        </SelectTrigger>
                        <SelectContent>
                          {quickCashierCodes.map((c) => (
                            <SelectItem key={c._id} value={c.code}>
                              {c.code} — {c.shift || "No shift"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter className="gap-2 flex-col-reverse sm:flex-row">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                      className="text-xs sm:text-sm"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateEntry}
                      className="text-xs sm:text-sm"
                    >
                      Add
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            {isMobile ? (
              <div className="divide-y divide-border bg-background">
                {entries?.map((entry) => (
                  <div key={entry._id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-foreground">
                          {format(new Date(entry.date), "MMM dd, yyyy")}
                        </div>
                        <div
                          className="text-sm text-muted-foreground break-words"
                          title={entry.description}
                        >
                          {entry.description}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() =>
                          handleDeleteEntry(entry._id, entry.description)
                        }
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="rounded-md bg-muted/50 p-2">
                        <div className="text-muted-foreground">Amount</div>
                        <div
                          className={`font-semibold ${entry.amount < 0 ? "text-destructive" : "text-foreground"}`}
                        >
                          {entry.amount < 0 ? "-" : ""}₦
                          {Math.abs(entry.amount).toLocaleString()}
                        </div>
                      </div>
                      <div className="rounded-md bg-muted/50 p-2">
                        <div className="text-muted-foreground">Added by</div>
                        <div className="font-medium break-words">
                          {entry.addedByEmail}
                        </div>
                      </div>
                      <div className="rounded-md bg-muted/50 p-2 col-span-2">
                        <div className="text-muted-foreground">Added on</div>
                        <div className="font-medium">
                          {format(
                            new Date(entry.createdAt),
                            "MMM dd, yyyy HH:mm",
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {!entries || entries.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    No manual entries found
                  </div>
                ) : null}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Added By</TableHead>
                    <TableHead>Added On</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries?.map((entry) => (
                    <TableRow key={entry._id}>
                      <TableCell>
                        {format(new Date(entry.date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell
                        className={`font-semibold ${entry.amount < 0 ? "text-destructive" : ""}`}
                      >
                        {entry.amount < 0 ? "-" : ""}₦
                        {Math.abs(entry.amount).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div
                          className="max-w-[200px] truncate"
                          title={entry.description}
                        >
                          {entry.description}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {entry.addedByEmail}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(
                          new Date(entry.createdAt),
                          "MMM dd, yyyy HH:mm",
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleDeleteEntry(entry._id, entry.description)
                          }
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!entries || entries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        No manual entries found
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
