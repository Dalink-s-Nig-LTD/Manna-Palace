import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Extra classes forwarded to DialogContent — use to override width, e.g. "sm:max-w-2xl" */
  className?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  className,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={`max-h-[90vh] overflow-y-auto scrollbar-thin ${className ?? "sm:max-w-md"}`}
      >
        {children}
      </DialogContent>
    </Dialog>
  );
};

export default Modal;
