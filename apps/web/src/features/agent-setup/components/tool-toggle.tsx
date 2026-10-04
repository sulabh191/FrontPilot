"use client";

import { useState } from "react";
import { Switch } from "@/shared/ui/switch";

type ToolToggleProps = {
  name: string;
  label: string;
  description: string;
  defaultChecked: boolean;
};

export function ToolToggle({ name, label, description, defaultChecked }: ToolToggleProps) {
  const [checked, setChecked] = useState(defaultChecked);
  const id = `toggle-${name}`;

  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div>
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={setChecked} />
      {/* The switch is a button, so a hidden input carries its value in the form. */}
      <input type="hidden" name={name} value={String(checked)} />
    </div>
  );
}
