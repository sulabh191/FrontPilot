"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ApiError, unwrap } from "@frontpilot/api-client";
import { getApi } from "@/shared/lib/api";

export type ApprovalResult = { ok: boolean; message: string };

const idSchema = z.uuid();

// Shared by approve and decline. The API does the real work in one transaction:
// it updates the appointment, lead and conversation, then texts the customer.
// It only acts on an appointment that belongs to the token's business and is
// still awaiting approval, so the browser can't touch anyone else's bookings.
async function decide(appointmentId: string, decision: "approve" | "decline"): Promise<ApprovalResult> {
  // Server Actions are public endpoints: anyone can call them with any input.
  const parsed = idSchema.safeParse(appointmentId);
  if (!parsed.success) return { ok: false, message: "Invalid appointment." };

  const path =
    decision === "approve" ? "/v1/appointments/{id}/approve" : "/v1/appointments/{id}/decline";

  try {
    unwrap(await getApi().POST(path, { params: { path: { id: parsed.data } } }));
  } catch (error) {
    // Expected outcomes become friendly messages; anything else is a real failure.
    if (error instanceof ApiError && error.status === 409) {
      return { ok: false, message: "This booking was already handled." };
    }
    if (error instanceof ApiError && error.status === 404) {
      return { ok: false, message: "This booking no longer exists." };
    }
    console.error("[approval] API call failed", error);
    return { ok: false, message: "Something went wrong. Please try again." };
  }

  // Every dashboard page shows appointment data, so refresh them all.
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: decision === "approve" ? "Booking confirmed." : "Booking declined." };
}

export async function approveAppointment(appointmentId: string): Promise<ApprovalResult> {
  return decide(appointmentId, "approve");
}

export async function declineAppointment(appointmentId: string): Promise<ApprovalResult> {
  return decide(appointmentId, "decline");
}
