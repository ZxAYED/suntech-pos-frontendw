"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import { DataTable } from "@/components/common/data-table";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  useCashiersQuery,
  useCreateCashierMutation,
  useToggleCashierStatusMutation,
} from "@/redux/api/usersApi";
import type { CashierAccount } from "@/types/domain";

export function StaffManager() {
  const cashiers = useCashiersQuery();
  const createCashier = useCreateCashierMutation();
  const toggleStatus = useToggleCashierStatusMutation();
  const [open, setOpen] = useState(false);
  const [mintedId, setMintedId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");

  const columns: LegacyColumnDef<CashierAccount, unknown>[] = [
    { accessorKey: "publicId", header: "Public ID" },
    { accessorKey: "displayName", header: "Name" },
    { accessorKey: "locationName", header: "Location" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.status === "ACTIVE" ? "paid" : "pending"}>{row.original.status}</Badge>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="outline"
          loading={toggleStatus.isPending}
          onClick={async () => {
            const next = row.original.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
            try {
              await toggleStatus.mutateAsync({ id: row.original.id, status: next });
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Status update failed");
            }
          }}
        >
          {row.original.status === "ACTIVE" ? "Suspend" : "Activate"}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Staff"
        accent="provisioning"
        description="Mint cashier public IDs without requiring email."
        actions={<Button onClick={() => setOpen(true)}>Create cashier</Button>}
      />
      <DataTable columns={columns} data={cashiers.data ?? []} loading={cashiers.isLoading} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create cashier</DialogTitle>
          </DialogHeader>
          {mintedId ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Share this public ID with the cashier:</p>
              <p className="rounded-md bg-accent px-3 py-2 font-mono text-lg font-bold text-primary">{mintedId}</p>
              <Button
                onClick={() => {
                  setMintedId(null);
                  setOpen(false);
                }}
              >
                Done
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Input placeholder="Display name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
              <Input placeholder="Temporary password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
              <Button
                loading={createCashier.isPending}
                onClick={async () => {
                  try {
                    const created = await createCashier.mutateAsync({ displayName, password });
                    setMintedId(created.publicId);
                    setDisplayName("");
                    setPassword("");
                    toast.success("Cashier created");
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Unable to create cashier");
                  }
                }}
              >
                Mint CSH ID
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
