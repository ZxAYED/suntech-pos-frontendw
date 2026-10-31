"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  itemName?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDeleting?: boolean;
  onConfirm: () => void | Promise<void>;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  title = "Confirm Deletion",
  description,
  itemName,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  isDeleting = false,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex flex-row items-start gap-3 space-y-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <DialogTitle className="text-lg font-semibold text-[#070B28]">
              {title}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              {description ?? (
                <>
                  Are you sure you want to delete{" "}
                  {itemName ? (
                    <strong className="font-semibold text-slate-800">{itemName}</strong>
                  ) : (
                    "this item"
                  )}
                  ? This action cannot be undone.
                </>
              )}
            </DialogDescription>
          </div>
        </DialogHeader>

        <DialogFooter className="mt-4 flex flex-row justify-end gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={isDeleting}
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isDeleting}
            onClick={handleConfirm}
            className="bg-rose-600 hover:bg-rose-700 text-white"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
