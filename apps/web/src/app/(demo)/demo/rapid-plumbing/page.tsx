import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChatWidget, getWidgetConfig, type WidgetConfig } from "@/features/chat-widget";
import { RapidPlumbingSite } from "@/features/demo-site";

// Live data from the API: render on every request, never pre-render at build time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rapid Plumbing (FrontPilot demo)",
  description: "A fictional plumbing business website used to demo the FrontPilot chat agent.",
};

export default async function RapidPlumbingDemoPage() {
  // If the API is down, the business's website must still load, just without the chat.
  // A broken widget should never take a customer's site down with it.
  let config: WidgetConfig | null;
  try {
    config = await getWidgetConfig("rapid-plumbing");
  } catch (error) {
    console.error("[demo] widget config unavailable; rendering site without chat", error);
    return <RapidPlumbingSite />;
  }
  if (!config) notFound(); // outside the try: notFound() works by throwing

  return (
    <>
      <RapidPlumbingSite />
      <ChatWidget config={config} />
    </>
  );
}
