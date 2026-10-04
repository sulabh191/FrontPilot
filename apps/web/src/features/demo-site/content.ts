// Content for the fictional demo business. Everything here is made up for showcasing.
export const rapidPlumbing = {
  name: "Rapid Plumbing",
  tagline: "Licensed plumbers in Springfield. Same-day service, upfront prices.",
  phone: "(555) 010-2468",
  emergencyPhone: "(555) 010-9111",
  serviceArea: "Springfield and surrounding towns, within 25 miles",
  timeZone: "America/New_York",
  hours: [
    { days: "Monday – Friday", time: "7:00 AM – 7:00 PM" },
    { days: "Saturday", time: "8:00 AM – 4:00 PM" },
    { days: "Sunday", time: "Emergencies only" },
  ],
  services: [
    { name: "Leak repair", price: "from $149", description: "Sinks, faucets, pipes and fixtures." },
    { name: "Drain cleaning", price: "from $189", description: "Kitchen, bathroom and main lines." },
    { name: "Water heaters", price: "from $1,450 installed", description: "Tank and tankless, repair or replace." },
    { name: "Toilet repair", price: "from $129", description: "Running, clogged or leaking toilets." },
    { name: "Burst pipes", price: "from $249", description: "Fast response to stop the damage." },
    { name: "Sump pumps", price: "from $950 installed", description: "Install, replace and test." },
  ],
  promises: [
    "Upfront price before any work starts",
    "Licensed and insured technicians",
    "1-year warranty on labor",
  ],
} as const;
