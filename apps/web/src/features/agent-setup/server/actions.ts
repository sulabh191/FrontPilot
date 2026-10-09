"use server";

import { revalidatePath } from "next/cache";
import { ApiError, unwrap } from "@frontpilot/api-client";
import { getApi } from "@/shared/lib/api";
import { agentSettingsSchema, toolKeys } from "../schema";

export type SaveSettingsState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
};

// The API's validation error details: one entry per invalid field,
// e.g. { path: "suggestedQuestions.2", message: "Keep each option under 40 characters." }
type ValidationIssue = { path: string; message: string };

function toFieldErrors(details: unknown): SaveSettingsState["fieldErrors"] {
  if (!Array.isArray(details)) return {};
  const errors: Record<string, string[]> = {};
  for (const issue of details as ValidationIssue[]) {
    // "suggestedQuestions.2" → "suggestedQuestions": the form shows one error per field.
    const field = String(issue.path ?? "").split(".")[0] || "form";
    (errors[field] ??= []).push(issue.message);
  }
  return errors;
}

// Server Action: runs on the server when the form is submitted.
export async function saveAgentSettings(
  _prev: SaveSettingsState,
  formData: FormData,
): Promise<SaveSettingsState> {
  // 1. Validate here first: instant, friendly errors without a network call.
  const parsed = agentSettingsSchema.safeParse({
    agentName: formData.get("agentName"),
    greeting: formData.get("greeting"),
    tone: formData.get("tone"),
    instructions: formData.get("instructions") ?? "",
    tools: Object.fromEntries(toolKeys.map((key) => [key, formData.get(`tool.${key}`) === "true"])),
    approvalMode: formData.get("approvalMode"),
    // Empty boxes are skipped, so the owner can use fewer than four options.
    suggestedQuestions: formData
      .getAll("suggestedQuestions")
      .map((value) => String(value).trim())
      .filter(Boolean),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // 2. Save through the API, which validates again: it never trusts its callers
  //    (the iOS app will call the same endpoint). The business comes from the token,
  //    so one business can't overwrite another's settings.
  try {
    unwrap(await getApi().PUT("/v1/agent-settings", { body: parsed.data }));
  } catch (error) {
    if (error instanceof ApiError && error.status === 400) {
      return {
        status: "error",
        message: "Please fix the highlighted fields.",
        fieldErrors: toFieldErrors(error.body?.error.details),
      };
    }
    console.error("[agent-settings] save failed", error);
    return { status: "error", message: "Could not save settings. Please try again." };
  }

  revalidatePath("/dashboard/agent");
  return { status: "success", message: "Settings saved." };
}
