import { Clock, MapPin, Phone, ShieldCheck, Wrench } from "lucide-react";
import { rapidPlumbing as biz } from "../content";
import { DemoBanner } from "./demo-banner";

export function RapidPlumbingSite() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <DemoBanner />

      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 text-lg font-bold text-blue-800">
            <Wrench className="size-5" />
            {biz.name}
          </div>
          <a
            href={`tel:${biz.phone}`}
            className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
          >
            <Phone className="size-4" />
            {biz.phone}
          </a>
        </div>
      </header>

      <section className="bg-blue-50">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-blue-950 md:text-5xl">
            Plumbing problems fixed today.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-slate-600">{biz.tagline}</p>
          <ul className="mt-8 space-y-2">
            {biz.promises.map((promise) => (
              <li key={promise} className="flex items-center gap-2 text-slate-700">
                <ShieldCheck className="size-5 text-blue-700" />
                {promise}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="bg-red-600 px-6 py-3 text-center text-sm font-medium text-white">
        Flooding or a gas smell? Call our 24/7 emergency line: {biz.emergencyPhone}
      </div>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-bold tracking-tight">Services and starting prices</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {biz.services.map((service) => (
            <div key={service.name} className="rounded-xl border border-slate-200 p-5">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-semibold">{service.name}</h3>
                <span className="text-sm font-medium text-blue-700">{service.price}</span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{service.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-2">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Clock className="size-5 text-blue-700" /> Hours
            </h2>
            <dl className="mt-4 space-y-2 text-sm">
              {biz.hours.map((row) => (
                <div key={row.days} className="flex justify-between border-b border-slate-200 pb-2">
                  <dt className="text-slate-600">{row.days}</dt>
                  <dd className="font-medium">{row.time}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <MapPin className="size-5 text-blue-700" /> Service area
            </h2>
            <p className="mt-4 text-sm text-slate-600">{biz.serviceArea}</p>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 px-6 py-8 text-center text-xs text-slate-500">
        © {biz.name} (fictional demo business)
      </footer>
    </div>
  );
}
