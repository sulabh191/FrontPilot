import Link from "next/link";

const features = [
  {
    title: "Website Chat",
    body: "Answers visitor questions 24/7 using your own services, prices and policies, with sources, never guesses.",
  },
  {
    title: "Lead Qualification",
    body: "Asks the questions you choose (budget, timeline, service needed) and scores every lead automatically.",
  },
  {
    title: "Appointment Booking",
    body: "Checks your availability, books the slot, and sends the customer a confirmation by email or text.",
  },
  {
    title: "Customer Follow-up",
    body: "Sends reminders before appointments and checks in afterwards, so no lead goes cold.",
  },
  {
    title: "Built-in CRM",
    body: "Every conversation, lead and booking lands in one place, organized by pipeline stage.",
  },
];

const steps = [
  {
    n: "1",
    title: "Describe your business",
    body: "Upload your FAQ, price list or policies, and set your agent's name and tone.",
  },
  {
    n: "2",
    title: "Choose what it can do",
    body: "Switch on chat, lead qualification, booking and follow-ups. No code, just toggles.",
  },
  {
    n: "3",
    title: "Add it to your website",
    body: "Paste one line of code. Your agent goes live in minutes.",
  },
];

const audiences = ["Home services", "Clinics & dentists", "Salons & spas", "Agencies", "Real estate", "Local shops"];

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Nav */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Front<span className="text-indigo-600">Pilot</span>
          </Link>
          <nav className="hidden gap-8 text-sm text-slate-600 md:flex">
            <a href="#features" className="hover:text-slate-900">Features</a>
            <a href="#how" className="hover:text-slate-900">How it works</a>
            <Link href="/demo/rapid-plumbing" className="hover:text-slate-900">Live demo</Link>
          </nav>
          <Link
            href="/dashboard"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Get started
          </Link>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
          <div>
            <p className="mb-4 inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
              No-code AI agents for small business
            </p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              Build an AI agent that talks to your customers, in minutes.
            </h1>
            <p className="mt-6 text-lg text-slate-600">
              FrontPilot lets any business create its own AI agent, with no code. It chats with website
              visitors, qualifies leads, books appointments and follows up, and logs everything in a
              built-in CRM.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="rounded-lg bg-indigo-600 px-5 py-3 font-medium text-white hover:bg-indigo-500"
              >
                Build your agent free
              </Link>
              <Link
                href="/demo/rapid-plumbing"
                className="rounded-lg border border-slate-300 px-5 py-3 font-medium hover:bg-slate-50"
              >
                See a live demo
              </Link>
            </div>
            <p className="mt-4 text-sm text-slate-500">Set up in under 10 minutes · You approve before anything is sent</p>
          </div>

          {/* Chat preview */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2 border-b border-slate-200 pb-3">
              <div className="h-8 w-8 rounded-full bg-indigo-600" />
              <div>
                <p className="text-sm font-semibold">Rapid Plumbing assistant</p>
                <p className="text-xs text-green-600">Online</p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-indigo-600 px-4 py-2 text-white">
                My kitchen sink is leaking. Can someone come tomorrow?
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-white px-4 py-2 shadow-sm">
                Sorry to hear that! We have openings tomorrow at 9:00 AM and 2:30 PM. Is the leak
                under the sink or from the faucet?
              </div>
              <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-indigo-600 px-4 py-2 text-white">
                Under the sink. 9 AM works.
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-white px-4 py-2 shadow-sm">
                You&apos;re booked for 9:00 AM tomorrow. I&apos;ve texted you a confirmation. 👍
              </div>
              <div className="flex flex-wrap gap-2 pt-1 text-xs">
                <span className="rounded-full bg-green-100 px-2 py-1 text-green-700">Appointment booked</span>
                <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-700">Lead: hot</span>
                <span className="rounded-full bg-slate-200 px-2 py-1 text-slate-700">Added to CRM</span>
              </div>
            </div>
          </div>
        </section>

        {/* Audiences */}
        <section className="border-y border-slate-200 bg-slate-50">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-6 py-6 text-sm text-slate-500">
            <span className="font-medium text-slate-700">Built for</span>
            {audiences.map((a) => (
              <span key={a}>{a}</span>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-3xl font-bold tracking-tight">One agent. Five jobs.</h2>
          <p className="mt-3 max-w-2xl text-slate-600">
            Turn on what your business needs. Your agent handles it around the clock and hands off to you
            when a human touch is needed.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl border border-slate-200 p-6 hover:shadow-sm">
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="bg-slate-900 text-white">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <h2 className="text-3xl font-bold tracking-tight">Live in three steps</h2>
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {steps.map((s) => (
                <div key={s.n}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500 font-semibold">
                    {s.n}
                  </div>
                  <h3 className="mt-4 font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm text-slate-300">{s.body}</p>
                </div>
              ))}
            </div>
            <pre className="mt-10 overflow-x-auto rounded-lg bg-slate-800 p-4 text-sm text-slate-200">
              {`<script src="https://frontpilot.app/widget.js" data-agent-key="pk_your_key" async></script>`}
            </pre>
          </div>
        </section>

        {/* Control */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <h3 className="font-semibold">You stay in control</h3>
              <p className="mt-2 text-sm text-slate-600">
                Start in review mode and approve every reply, or let it send automatically once you trust it.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Answers from your info only</h3>
              <p className="mt-2 text-sm text-slate-600">
                If your agent doesn&apos;t know, it says so and passes the question to you.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Your data stays yours</h3>
              <p className="mt-2 text-sm text-slate-600">
                Each business&apos;s data is kept separate and is never used to train models.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="rounded-2xl bg-indigo-600 px-8 py-14 text-center text-white">
            <h2 className="text-3xl font-bold tracking-tight">Give your business a front desk that never sleeps.</h2>
            <p className="mt-3 text-indigo-100">Free while in beta. No credit card needed.</p>
            <Link
              href="/dashboard"
              className="mt-8 inline-block rounded-lg bg-white px-6 py-3 font-medium text-indigo-700 hover:bg-indigo-50"
            >
              Build your agent
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-2 px-6 py-8 text-sm text-slate-500 md:flex-row">
          <p>© {new Date().getFullYear()} FrontPilot</p>
          <p>A portfolio project by Sulabh Agarwal</p>
        </div>
      </footer>
    </div>
  );
}