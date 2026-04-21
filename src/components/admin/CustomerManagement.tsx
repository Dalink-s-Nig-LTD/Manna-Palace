import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Search,
  Wallet,
  Printer,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Edit,
  Eye,
  DollarSign,
} from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";
import type { CustomerRecord } from "@/types/cafeteria";
import { CustomerIDCard } from "./CustomerIDCard";
import { FundTopUp } from "./FundTopUp";
import { getSqliteDB } from "@/lib/sqlite";

export function CustomerManagement() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [fundDialogOpen, setFundDialogOpen] = useState(false);
  const [idCardDialogOpen, setIdCardDialogOpen] = useState(false);
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerRecord | null>(null);
  const [newBalance, setNewBalance] = useState("");
  const [deductionReason, setDeductionReason] = useState("");

  // Form state
  const [form, setForm] = useState({
    customerId: "",
    firstName: "",
    lastName: "",
    department: "",
    classLevel: "",
    photo: "",
    expiryDate: "",
  });

  const customers = useQuery(api.customers.getAllCustomers, {
    search: search || undefined,
  });
  const transactions = useQuery(
    api.customerFunds.getTransactionHistory,
    selectedCustomer ? { customerId: selectedCustomer._id } : "skip",
  );
  const createCustomer = useMutation(api.customers.createCustomer);
  const updateCustomer = useMutation(api.customers.updateCustomer);
  const toggleActive = useMutation(api.customers.toggleCustomerActive);
  const deleteCustomer = useMutation(api.customers.deleteCustomer);
  const setCustomerBalance = useMutation(api.customers.setCustomerBalance);

  const resetForm = () => {
    setForm({
      customerId: "",
      firstName: "",
      lastName: "",
      department: "",
      classLevel: "",
      photo: "",
      expiryDate: "",
    });
  };

  const handleCreate = async () => {
    try {
      await createCustomer({
        customerId: form.customerId,
        firstName: form.firstName,
        lastName: form.lastName,
        department: form.department,
        classLevel: form.classLevel,
        photo: form.photo || undefined,
        expiryDate: form.expiryDate
          ? new Date(form.expiryDate).getTime()
          : undefined,
      });
      toast({ title: "Customer created successfully" });
      setAddDialogOpen(false);
      resetForm();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const handleUpdate = async () => {
    if (!selectedCustomer) return;
    try {
      await updateCustomer({
        id: selectedCustomer._id,
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
        department: form.department || undefined,
        classLevel: form.classLevel || undefined,
        photo: form.photo || undefined,
        expiryDate: form.expiryDate
          ? new Date(form.expiryDate).getTime()
          : undefined,
      });
      toast({ title: "Customer updated successfully" });
      setEditDialogOpen(false);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const handleToggle = async (id: Id<"customers">) => {
    try {
      const result = await toggleActive({ id });
      toast({
        title: result.isActive ? "Customer activated" : "Customer deactivated",
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: Id<"customers">) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;
    try {
      await deleteCustomer({ id });
      toast({ title: "Customer deleted" });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const openEdit = (cust: CustomerRecord) => {
    setSelectedCustomer(cust);
    setForm({
      customerId: cust.customerId,
      firstName: cust.firstName,
      lastName: cust.lastName,
      department: cust.department,
      classLevel: cust.classLevel,
      photo: cust.photo || "",
      expiryDate: cust.expiryDate
        ? new Date(cust.expiryDate).toISOString().split("T")[0]
        : "",
    });
    setEditDialogOpen(true);
  };

  const openView = (cust: CustomerRecord) => {
    setSelectedCustomer(cust);
    setViewDialogOpen(true);
  };

  const openFund = (cust: CustomerRecord) => {
    setSelectedCustomer(cust);
    setFundDialogOpen(true);
  };

  const openBalance = (cust: CustomerRecord) => {
    setSelectedCustomer(cust);
    setNewBalance(cust.balance.toString());
    setDeductionReason("");
    setBalanceDialogOpen(true);
  };

  const handleSetBalance = async () => {
    if (!selectedCustomer) return;
    const balanceNum = parseFloat(newBalance);
    if (isNaN(balanceNum) || balanceNum < 0) {
      toast({
        title: "Invalid balance",
        description: "Please enter a valid positive number",
        variant: "destructive",
      });
      return;
    }
    try {
      const result = await setCustomerBalance({
        id: selectedCustomer._id,
        balance: balanceNum,
        reason: deductionReason || undefined,
      });

      // Sync to SQLite if running in Tauri
      const sqliteDB = getSqliteDB();
      if (sqliteDB) {
        try {
          await sqliteDB.updateCustomerBalance(
            selectedCustomer.customerId,
            balanceNum,
          );

          if (result.deductionCreated) {
            await sqliteDB.addDeductionOrder({
              _id: `deduct-${Date.now()}`,
              customerId: selectedCustomer._id,
              amount: result.amount,
              reason: deductionReason,
              createdAt: Date.now(),
            });
          }
        } catch (sqliteErr) {
          console.warn("[SQLite] Failed to sync balance update:", sqliteErr);
          // Don't fail the whole operation if SQLite sync fails
        }
      }

      if (result.deductionCreated) {
        toast({
          title: "Balance updated successfully",
          description: `Deduction order created for ₦${result.amount.toLocaleString()}`,
        });
      } else {
        toast({ title: "Balance updated successfully" });
      }

      setBalanceDialogOpen(false);
      setNewBalance("");
      setDeductionReason("");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const openIdCard = (cust: CustomerRecord) => {
    setSelectedCustomer(cust);
    setIdCardDialogOpen(true);
  };

  const formFields = (
    <div className="grid gap-4 py-4">
      <Input
        placeholder="Customer ID (e.g. RUN/2024/001)"
        value={form.customerId}
        onChange={(e) => setForm({ ...form, customerId: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="First Name"
          value={form.firstName}
          onChange={(e) => setForm({ ...form, firstName: e.target.value })}
        />
        <Input
          placeholder="Last Name"
          value={form.lastName}
          onChange={(e) => setForm({ ...form, lastName: e.target.value })}
        />
      </div>
      <Input
        placeholder="Department"
        value={form.department}
        onChange={(e) => setForm({ ...form, department: e.target.value })}
      />
      <Input
        placeholder="Class Level (e.g. 100 Level)"
        value={form.classLevel}
        onChange={(e) => setForm({ ...form, classLevel: e.target.value })}
      />
      <Input
        placeholder="Photo URL (optional)"
        value={form.photo}
        onChange={(e) => setForm({ ...form, photo: e.target.value })}
      />
      <Input
        type="date"
        placeholder="Expiry Date"
        value={form.expiryDate}
        onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
      />
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
        <h2 className="text-base sm:text-2xl font-bold text-foreground">
          Customers
        </h2>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={resetForm}
              size="sm"
              className="w-full sm:w-auto gap-1 sm:gap-2 text-xs sm:text-sm"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4" /> Add
            </Button>
          </DialogTrigger>
          <DialogContent
            onPointerDownOutside={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
            className="w-[95vw] sm:w-full"
          >
            <DialogHeader>
              <DialogTitle className="text-sm sm:text-base">
                Register Customer
              </DialogTitle>
            </DialogHeader>
            {formFields}
            <DialogFooter className="gap-2 flex-col-reverse sm:flex-row">
              <Button
                variant="outline"
                onClick={() => setAddDialogOpen(false)}
                className="text-xs sm:text-sm"
              >
                Cancel
              </Button>
              <Button onClick={handleCreate} className="text-xs sm:text-sm">
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 text-xs sm:text-sm"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <Card className="p-2.5 sm:p-4">
          <CardContent className="p-0">
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Total
            </p>
            <p className="text-lg sm:text-2xl font-bold text-foreground">
              {customers?.length || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="p-2.5 sm:p-4">
          <CardContent className="p-0">
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Active
            </p>
            <p className="text-lg sm:text-2xl font-bold text-primary">
              {customers?.filter((s) => s.isActive).length || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="p-2.5 sm:p-4">
          <CardContent className="p-0">
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Balance
            </p>
            <p className="text-lg sm:text-2xl font-bold text-foreground break-words">
              ₦
              {(
                customers?.reduce((s, c) => s + c.balance, 0) || 0
              ).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="p-2.5 sm:p-4">
          <CardContent className="p-0">
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Inactive
            </p>
            <p className="text-lg sm:text-2xl font-bold text-destructive">
              {customers?.filter((s) => !s.isActive).length || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Customer Table */}
      <Card>
        <CardContent className="p-0">
          <div className="sm:hidden p-3 space-y-3">
            {customers?.map((cust) => (
              <Card key={cust._id} className="border-border">
                <CardContent className="p-3 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {cust.firstName} {cust.lastName}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground truncate">
                        {cust.customerId}
                      </p>
                    </div>
                    <Badge variant={cust.isActive ? "default" : "destructive"}>
                      {cust.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <p className="text-muted-foreground truncate">
                      Dept:{" "}
                      <span className="text-foreground">{cust.department}</span>
                    </p>
                    <p className="text-muted-foreground truncate">
                      Level:{" "}
                      <span className="text-foreground">{cust.classLevel}</span>
                    </p>
                    <p className="col-span-2 font-bold text-sm text-foreground">
                      Balance: ₦{cust.balance.toLocaleString()}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openView(cust as CustomerRecord)}
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(cust as CustomerRecord)}
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openFund(cust as CustomerRecord)}
                      title="Add Funds"
                    >
                      <Wallet className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openBalance(cust as CustomerRecord)}
                      title="Edit Balance"
                    >
                      <DollarSign className="w-4 h-4 text-green-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openIdCard(cust as CustomerRecord)}
                      title="Print ID"
                    >
                      <Printer className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleToggle(cust._id)}
                      title="Toggle Active"
                    >
                      {cust.isActive ? (
                        <ToggleRight className="w-4 h-4 text-primary" />
                      ) : (
                        <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDelete(cust._id)}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {customers?.length === 0 && (
              <p className="text-center py-6 text-sm text-muted-foreground">
                No customers found. Click "Add" to register one.
              </p>
            )}
          </div>

          <div
            className="hidden sm:block max-h-[55vh] overflow-y-auto"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(0,0,0,0.2) rgba(0,0,0,0.1)",
            }}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers?.map((cust) => (
                  <TableRow key={cust._id}>
                    <TableCell className="font-mono text-sm">
                      {cust.customerId}
                    </TableCell>
                    <TableCell className="font-medium">
                      {cust.firstName} {cust.lastName}
                    </TableCell>
                    <TableCell>{cust.department}</TableCell>
                    <TableCell>{cust.classLevel}</TableCell>
                    <TableCell className="font-bold">
                      ₦{cust.balance.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={cust.isActive ? "default" : "destructive"}
                      >
                        {cust.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {cust.barcodeData}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openView(cust as CustomerRecord)}
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(cust as CustomerRecord)}
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openFund(cust as CustomerRecord)}
                          title="Add Funds"
                        >
                          <Wallet className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openBalance(cust as CustomerRecord)}
                          title="Edit Balance"
                        >
                          <DollarSign className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openIdCard(cust as CustomerRecord)}
                          title="Print ID"
                        >
                          <Printer className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggle(cust._id)}
                          title="Toggle Active"
                        >
                          {cust.isActive ? (
                            <ToggleRight className="w-4 h-4 text-primary" />
                          ) : (
                            <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(cust._id)}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {customers?.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No customers found. Click "Add Customer" to register one.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          {formFields}
          <DialogFooter>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Customer Profile</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">ID:</span>{" "}
                  {selectedCustomer.customerId}
                </div>
                <div>
                  <span className="text-muted-foreground">Name:</span>{" "}
                  {selectedCustomer.firstName} {selectedCustomer.lastName}
                </div>
                <div>
                  <span className="text-muted-foreground">Department:</span>{" "}
                  {selectedCustomer.department}
                </div>
                <div>
                  <span className="text-muted-foreground">Level:</span>{" "}
                  {selectedCustomer.classLevel}
                </div>
                <div>
                  <span className="text-muted-foreground">Barcode:</span>{" "}
                  <span className="font-mono">
                    {selectedCustomer.barcodeData}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Balance:</span>{" "}
                  <span className="font-bold">
                    ₦{selectedCustomer.balance.toLocaleString()}
                  </span>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-foreground">
                  Recent Transactions
                </h4>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {transactions?.map((tx) => (
                    <div
                      key={tx._id}
                      className="flex justify-between text-sm p-2 rounded bg-muted/50"
                    >
                      <div>
                        <span
                          className={
                            tx.type === "credit"
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {tx.type === "credit" ? "+" : "-"}₦
                          {tx.amount.toLocaleString()}
                        </span>
                        <span className="ml-2 text-muted-foreground">
                          {tx.description}
                        </span>
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                  {(!transactions || transactions.length === 0) && (
                    <p className="text-muted-foreground text-sm">
                      No transactions yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Fund Top-Up Dialog */}
      {selectedCustomer && (
        <FundTopUp
          customer={selectedCustomer}
          open={fundDialogOpen}
          onOpenChange={setFundDialogOpen}
        />
      )}

      {/* ID Card Dialog */}
      {selectedCustomer && (
        <Dialog open={idCardDialogOpen} onOpenChange={setIdCardDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Customer ID Card</DialogTitle>
            </DialogHeader>
            <CustomerIDCard student={selectedCustomer} />
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Balance Dialog */}
      {selectedCustomer && (
        <Dialog open={balanceDialogOpen} onOpenChange={setBalanceDialogOpen}>
          <DialogContent
            onPointerDownOutside={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle>Edit Customer Balance</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Customer: {selectedCustomer.firstName}{" "}
                  {selectedCustomer.lastName}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Current Balance:{" "}
                  <span className="font-bold text-foreground">
                    ₦{selectedCustomer.balance.toLocaleString()}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">New Balance (₦)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter new balance"
                  value={newBalance}
                  onChange={(e) => setNewBalance(e.target.value)}
                  className="mt-2"
                />
              </div>
              {selectedCustomer.balance > parseFloat(newBalance || "0") && (
                <div>
                  <label className="text-sm font-medium">
                    Reason for Deduction (optional)
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., Refund, Adjustment, Penalty..."
                    value={deductionReason}
                    onChange={(e) => setDeductionReason(e.target.value)}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    A deduction order will be created for: ₦
                    {(
                      selectedCustomer.balance - parseFloat(newBalance || "0")
                    ).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setBalanceDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSetBalance}>Set Balance</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
