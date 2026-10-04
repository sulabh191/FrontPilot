"use server";

import { revalidatePath } from "next/cache";
import { getCurrentTenant } from "@/shared/lib/tenant";
import { agentSettingsSchema, toolKeys } from "../schema";
import { writeSettings } from "./store";

export type SaveSettingsState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
};

// Server Action: runs on the server when the form is submitted.
export async function saveAgentSettings(
  _prev: SaveSettingsState,
  formData: FormData,
): Promise<SaveSettingsState> {
  // The tenant comes from the server session, never from the form,
  // so one business can't overwrite another's settings.
  const tenant = await getCurrentTenant();

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
    const flat = parsed.error.flatten();
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: flat.fieldErrors,
    };
  }

  writeSettings(tenant.id, parsed.data);
  revalidatePath("/dashboard/agent");
  return { status: "success", message: "Settings saved." };
}
