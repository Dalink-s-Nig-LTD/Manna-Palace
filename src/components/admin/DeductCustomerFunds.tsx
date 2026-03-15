import React, { useState } from "react";
import { useMutation } from "@/lib/convexApi";
import { api } from "@/lib/convexApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import type { Id } from "../../../convex/_generated/dataModel";

interface DeductCustomerFundsProps {
  customer: {
    _id: Id<"customers">;
    firstName: string;
    lastName: string;
    balance: number;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeductCustomerFunds({
  customer,
  open,
  onOpenChange,
}: DeductCustomerFundsProps) {
  const { toast } = useToast();
  const { code: authCode } = useAuth();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const deductFunds = useMutation(api.customerFunds.deductByAdmin);

  const numAmount = parseFloat(amount) || 0;
  const isValid =
    numAmount > 0 && numAmount <= customer.balance && reason.trim().length > 0;

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      const result = await deductFunds({
        customerId: customer._id,
        amount: numAmount,
        reason: reason.trim(),
        deductedBy: authCode || "admin",
      });
      toast({
        title: "Funds deducted",
        description: `New balance: ₦${result.balanceAfter.toLocaleString()}`,
      });
      onOpenChange(false);
      setAmount("");
      setReason("");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Deduct Funds — {customer.firstName} {customer.lastName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="text-sm text-muted-foreground">
            Current Balance:{" "}
            <span className="font-bold text-foreground">
              ₦{customer.balance.toLocaleString()}
            </span>
          </div>

          <div>
            <label className="text-sm font-medium">Amount to Deduct (₦)</label>
            <Input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              max={customer.balance}
              step="100"
              className="mt-1"
            />
            {numAmount > customer.balance && (
              <p className="text-xs text-destructive mt-1">
                Amount exceeds available balance
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">
              Reason / Description *
            </label>
            <Textarea
              placeholder="Why is this deduction being made? (e.g., Refund due to complaint, Balance correction, etc.)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 resize-none"
              rows={3}
            />
            {reason.trim().length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Reason is required
              </p>
            )}
          </div>

          {numAmount > 0 && numAmount <= customer.balance && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm">
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Current Balance:</span>
                <span>₦{customer.balance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-destructive font-bold">
                <span>After Deduction:</span>
                <span>₦{(customer.balance - numAmount).toLocaleString()}</span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleSubmit}
              disabled={!isValid || loading}
            >
              {loading ? "Processing..." : "Deduct Funds"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
