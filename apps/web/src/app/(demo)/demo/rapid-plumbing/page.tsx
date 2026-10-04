import type { Metadata } from "next";
import { RapidPlumbingSite } from "@/features/demo-site";

export const metadata: Metadata = {
  title: "Rapid Plumbing (FrontPilot demo)",
  description: "A fictional plumbing business website used to demo the FrontPilot chat agent.",
};

export default function RapidPlumbingDemoPage() {
  return <RapidPlumbingSite />;
}
