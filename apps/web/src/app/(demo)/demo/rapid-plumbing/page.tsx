import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChatWidget, getWidgetConfig } from "@/features/chat-widget";
import { RapidPlumbingSite } from "@/features/demo-site";

export const metadata: Metadata = {
  title: "Rapid Plumbing (FrontPilot demo)",
  description: "A fictional plumbing business website used to demo the FrontPilot chat agent.",
};

export default async function RapidPlumbingDemoPage() {
  const config = await getWidgetConfig("rapid-plumbing");
  if (!config) notFound();

  return (
    <>
      <RapidPlumbingSite />
      <ChatWidget config={config} />
    </>
  );
}
