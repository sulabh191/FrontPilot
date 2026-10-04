"use client";

import { useActionState } from "react";
import { cn } from "cn";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Separator } from "@/shared/ui/separator";
import { Textarea } from "@/shared/ui/textarea";
import { toneLabels, toolLabels } from "../constants";
import {
  approvalModes,
  MAX_SUGGESTED_QUESTIONS,
  toneOptions,
  toolKeys,
  type AgentSettings,
} from "../schema";
import { saveAgentSettings, type SaveSettingsState } from "../server/actions";
import { FieldError } from "./field-error";
import { ToolToggle } from "./tool-toggle";

const initialState: SaveSettingsState = { status: "idle" };

const approvalLabels: Record<AgentSettings["approvalMode"], { label: string; description: string }> = {
  review: {
    label: "Review mode",
    description: "Bookings and sensitive replies wait for your approval.",
  },
  auto: { label: "Auto mode", description: "Your agent acts on its own. You can review afterwards." },
};

export function AgentSettingsForm({ settings }: { settings: AgentSettings }) {
  const [state, formAction, isPending] = useActionState(saveAgentSettings, initialState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Identity</CardTitle>
          <CardDescription>How your agent introduces itself to customers.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agentName">Agent name</Label>
            <Input
              id="agentName"
              name="agentName"
              defaultValue={settings.agentName}
              aria-invalid={!!errors.agentName}
            />
            <FieldError errors={errors.agentName} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="greeting">Greeting</Label>
            <Textarea
              id="greeting"
              name="greeting"
              rows={2}
              defaultValue={settings.greeting}
              aria-invalid={!!errors.greeting}
            />
            <FieldError errors={errors.greeting} />
          </div>
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-medium">Tone</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {toneOptions.map((tone) => (
                <label
                  key={tone}
                  className={cn(
                    "has-checked:border-primary has-checked:bg-primary/5 cursor-pointer rounded-lg border p-3 text-sm",
                  )}
                >
                  <input
                    type="radio"
                    name="tone"
                    value={tone}
                    defaultChecked={settings.tone === tone}
                    className="sr-only"
                  />
                  <span className="font-medium">{toneLabels[tone].label}</span>
                  <span className="text-muted-foreground mt-1 block text-xs">
                    &ldquo;{toneLabels[tone].example}&rdquo;
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
          <CardDescription>
            Rules your agent always follows. Write them the way you would brief a new receptionist.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            name="instructions"
            rows={5}
            defaultValue={settings.instructions}
            aria-invalid={!!errors.instructions}
          />
          <FieldError errors={errors.instructions} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Suggested questions</CardTitle>
          <CardDescription>
            Shown as buttons when a visitor opens the chat, so they can tap instead of typing. Leave a
            box empty to show fewer.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: MAX_SUGGESTED_QUESTIONS }, (_, i) => (
            <Input
              key={i}
              name="suggestedQuestions"
              aria-label={`Suggested question ${i + 1}`}
              placeholder={`Option ${i + 1}`}
              maxLength={40}
              defaultValue={settings.suggestedQuestions[i] ?? ""}
            />
          ))}
          <div className="sm:col-span-2">
            <FieldError errors={errors.suggestedQuestions} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What your agent can do</CardTitle>
          <CardDescription>Turn on only what your business needs.</CardDescription>
        </CardHeader>
        <CardContent>
          {toolKeys.map((key, i) => (
            <div key={key}>
              {i > 0 && <Separator />}
              <ToolToggle
                name={`tool.${key}`}
                label={toolLabels[key].label}
                description={toolLabels[key].description}
                defaultChecked={settings.tools[key]}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Approval</CardTitle>
          <CardDescription>Decide how much your agent can do without you.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {approvalModes.map((mode) => (
            <label
              key={mode}
              className="has-checked:border-primary has-checked:bg-primary/5 cursor-pointer rounded-lg border p-3 text-sm"
            >
              <input
                type="radio"
                name="approvalMode"
                value={mode}
                defaultChecked={settings.approvalMode === mode}
                className="sr-only"
              />
              <span className="font-medium">{approvalLabels[mode].label}</span>
              <span className="text-muted-foreground mt-1 block text-xs">
                {approvalLabels[mode].description}
              </span>
            </label>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-4">
        {state.message && (
          <p
            role="status"
            className={cn(
              "text-sm",
              state.status === "success" ? "text-emerald-600" : "text-destructive",
            )}
          >
            {state.message}
          </p>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
