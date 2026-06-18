"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { createCustomer, updateCustomer } from "@/lib/firebase/api";
import type { Customer, CustomerInput } from "@/lib/types";

export function CustomerForm({
  ownerId,
  customer,
  onSaved,
}: {
  ownerId: string;
  customer?: Customer;
  onSaved?: () => void;
}) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError("");
    setSuccess("");
    setPending(true);

    const formData = new FormData(form);
    const input: CustomerInput = {
      name: String(formData.get("name") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      address: String(formData.get("address") ?? "").trim(),
      notes: String(formData.get("notes") ?? "").trim(),
    };

    try {
      if (!input.name) {
        throw new Error("Customer name is required.");
      }

      if (customer) {
        await updateCustomer(customer.id, input);
        setSuccess("Customer updated.");
      } else {
        const customerId = await createCustomer(ownerId, input);
        form.reset();
        setSuccess(`Customer saved. ID: ${customerId}`);
      }

      onSaved?.();
    } catch (submitError) {
      setError(formatCrudError(submitError, "Unable to save customer."));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-line bg-surface p-4 shadow-soft">
      <div className="grid gap-4">
        <Input
          autoComplete="name"
          defaultValue={customer?.name}
          label="Customer name"
          name="name"
          required
        />
        <Input
          autoComplete="tel"
          defaultValue={customer?.phone}
          inputMode="tel"
          label="Phone"
          name="phone"
        />
        <Input autoComplete="street-address" defaultValue={customer?.address} label="Address" name="address" />
        <Textarea defaultValue={customer?.notes} label="Notes" name="notes" />
      </div>
      {error ? <p className="mt-3 text-sm font-semibold text-clay">{error}</p> : null}
      {success ? <p className="mt-3 text-sm font-semibold text-leaf">{success}</p> : null}
      <Button className="mt-4 w-full sm:w-auto" disabled={pending} type="submit">
        {pending ? "Saving..." : customer ? "Save customer" : "Add customer"}
      </Button>
    </form>
  );
}

function formatCrudError(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error && "code" in error) {
    return `${fallback} (${String(error.code)})`;
  }

  return fallback;
}
