"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2, Plane, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "next-intl";
import {
  createFlightOrder,
  getCurrencyRates,
  getOfferServices,
  getSeatMap,
  payFlightOrder,
  searchFlights,
  type DuffelServiceOption,
  type OfferResult,
} from "@/lib/api/duffel";

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
type Passenger = { title: string; firstName: string; lastName: string; dob: string; gender: string; nationality: string; passportNumber: string; passportExpiry: string };
type Airport = { code: string; city: string };
type Seat = { designator: string; serviceId?: string; price: number; currency?: string; available: boolean };

const AIRPORTS: Airport[] = [
  { code: "ADD", city: "Addis Ababa" }, { code: "JFK", city: "New York" }, { code: "EWR", city: "Newark" },
  { code: "LHR", city: "London" }, { code: "DXB", city: "Dubai" }, { code: "PVD", city: "Providence" },
  { code: "RAI", city: "Praia" }, { code: "JED", city: "Jeddah" }, { code: "IST", city: "Istanbul" },
];
const STEP_LABELS = ["Search", "Select flight", "Fare", "Passengers", "Seats", "Extras", "Review & pay", "Confirmed"];

function emptyPassenger(): Passenger {
  return { title: "Mr", firstName: "", lastName: "", dob: "", gender: "", nationality: "", passportNumber: "", passportExpiry: "" };
}

function time(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "--:--" : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

function seatsFromMaps(value: unknown): Seat[] {
  const seats: Seat[] = [];
  for (const map of value as Array<{ cabins?: Array<{ rows?: Array<{ sections?: Array<{ elements?: Array<Record<string, unknown>> }> }> }> }>) {
    for (const cabin of map.cabins ?? []) for (const row of cabin.rows ?? []) for (const section of row.sections ?? []) for (const element of section.elements ?? []) {
      if (element.type !== "seat" && element.type !== "restricted_seat_general") continue;
      const service = (element.available_services as Array<{ id: string; total_amount?: string; total_currency?: string }> | undefined)?.[0];
      seats.push({ designator: String(element.designator), serviceId: service?.id, price: Number(service?.total_amount ?? 0), currency: service?.total_currency, available: Boolean(service) });
    }
  }
  return seats;
}

function withTimeout<T>(promise: Promise<T>, milliseconds = 30_000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => window.setTimeout(() => reject(new Error("The request timed out. Please try again.")), milliseconds)),
  ]);
}

export function SaudiaFlightBookingWizard() {
  const locale = useLocale();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [tripType, setTripType] = useState<"round" | "oneway">("round");
  const [origin, setOrigin] = useState("ADD");
  const [destination, setDestination] = useState("DXB");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [cabinClass, setCabinClass] = useState("economy");
  const [offers, setOffers] = useState<OfferResult[]>([]);
  const [selected, setSelected] = useState<OfferResult | null>(null);
  const [offerRequestId, setOfferRequestId] = useState("");
  const [passengerIds, setPassengerIds] = useState<string[]>([]);
  const [passengers, setPassengers] = useState<Passenger[]>([emptyPassenger()]);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<Array<{ designator: string; passengerId: string; serviceId?: string; price: number }>>([]);
  const [services, setServices] = useState<DuffelServiceOption[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [sort, setSort] = useState<"cheap" | "departure">("cheap");
  const [displayCurrency, setDisplayCurrency] = useState<"ETB" | "USD">("ETB");
  const [usdToEtb, setUsdToEtb] = useState(55.5);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [bookingReference, setBookingReference] = useState("");

  useEffect(() => { getCurrencyRates().then((value) => setUsdToEtb(value.USD_TO_ETB)).catch(() => undefined); }, []);

  const passengerCount = adults + children + infants;
  const fare = selected?.price ?? 0;
  const seatFee = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  const extrasFee = services.filter((service) => selectedServices.includes(service.id)).reduce((sum, service) => sum + service.price, 0);
  const displayedTotal = fare + seatFee + extrasFee;
  const price = (etb: number, usd?: number) => `${(displayCurrency === "USD" ? (usd ?? etb / usdToEtb) : etb).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${displayCurrency}`;
  const sortedOffers = useMemo(() => [...offers].sort((a, b) => sort === "cheap" ? a.price - b.price : a.departureAt.localeCompare(b.departureAt)), [offers, sort]);

  const next = (target: Step) => { setError(""); setStep(target); window.setTimeout(() => document.getElementById("flight-booking-wizard")?.scrollIntoView({ behavior: "smooth", block: "start" }), 40); };

  async function search() {
    setError("");
    if (!departureDate || (tripType === "round" && !returnDate) || origin === destination) { setError("Choose valid airports and dates first."); return; }
    setBusy(true);
    try {
      const result = await searchFlights({ origin, destination, departureDate, returnDate: tripType === "round" ? returnDate : undefined, adults, children, infants, cabinClass });
      setOffers(result.offers); setOfferRequestId(result.offerRequestId); setPassengerIds(result.passengerIds);
      if (!result.offers.length) setError("No flights were found for this search."); else next(2);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Flight search failed."); } finally { setBusy(false); }
  }

  async function chooseOffer(offer: OfferResult) {
    setSelected(offer); setSeats([]); setSelectedSeats([]); setServices([]); setSelectedServices([]); setError("");
    try {
      const [seatMap, serviceResult] = await Promise.all([getSeatMap(offer.id), getOfferServices(offer.id)]);
      setSeats(seatsFromMaps(seatMap)); setServices(serviceResult.services);
    } catch { setSeats([]); setServices([]); }
    setPassengers(Array.from({ length: passengerCount }, emptyPassenger));
    setEmail(user?.email ?? ""); setPhone(user?.phone ?? ""); next(3);
  }

  function updatePassenger(index: number, key: keyof Passenger, value: string) { setPassengers((current) => current.map((passenger, i) => i === index ? { ...passenger, [key]: value } : passenger)); }

  function validatePassengers() {
    if (passengers.length !== passengerCount || passengers.some((p) => !p.firstName || !p.lastName || !p.dob || !p.gender || !p.nationality || !p.passportNumber || !p.passportExpiry) || !email || !phone) { setError("Complete every passenger and contact field."); return false; }
    return true;
  }

  async function payNow() {
    if (!selected) { setError("Please select a flight first."); return; }
    if (!user) { setError("Please sign in before paying for a flight."); return; }
    setBusy(true); setError("");
    try {
      const order = await withTimeout(createFlightOrder({ offerId: selected.id, offerRequestId, customerCurrency: displayCurrency, passengers: passengers.map((p, i) => ({ passengerId: passengerIds[i], ...p, email, phone })), seatSelection: selectedSeats, services: selectedServices.map((id) => ({ id, quantity: 1 })), seatAmount: seatFee, ancillaryAmount: extrasFee }));
      const checkout = await withTimeout(payFlightOrder(order.id));
      window.location.href = checkout.checkoutUrl;
    } catch (cause) { console.error("Flight Pay Now failed", cause); setError(cause instanceof Error ? cause.message : "Payment could not be initialized."); setBusy(false); }
  }

  async function holdForLater() {
    if (!selected) { setError("Please select a flight first."); return; }
    if (!user) { setError("Please sign in before saving a flight booking."); return; }
    setBusy(true); setError("");
    try {
      const order = await withTimeout(createFlightOrder({ offerId: selected.id, offerRequestId, customerCurrency: displayCurrency, passengers: passengers.map((p, i) => ({ passengerId: passengerIds[i], ...p, email, phone })), seatSelection: selectedSeats, services: selectedServices.map((id) => ({ id, quantity: 1 })), seatAmount: seatFee, ancillaryAmount: extrasFee }));
      setBookingReference(order.duffelBookingRef ?? order.id); next(8);
    } catch (cause) { console.error("Flight Pay Later failed", cause); setError(cause instanceof Error ? cause.message : "Could not hold this flight."); } finally { setBusy(false); }
  }

  return <section id="flight-booking-wizard" className="relative overflow-hidden bg-gradient-to-br from-[#12394F] via-[#1F67B1] to-[#12394F] px-4 py-14 text-white sm:px-6">
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.25em] text-[#FF9300]">TOGT Flight Desk</p><h2 className="mt-2 text-3xl font-extrabold">Book your journey</h2></div><div className="flex rounded-full border border-white/20 bg-white/10 p-1 text-xs">{(["ETB", "USD"] as const).map((currency) => <button key={currency} type="button" onClick={() => setDisplayCurrency(currency)} className={`rounded-full px-3 py-1.5 font-bold ${displayCurrency === currency ? "bg-[#FF9300]" : "text-white/70"}`}>{currency}</button>)}</div></div>
      <div className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">{STEP_LABELS.map((label, index) => { const number = index + 1; return <button key={label} type="button" disabled={number > step && !selected} onClick={() => number < step && next(number as Step)} className={`flex items-center gap-2 rounded-lg p-2 text-left text-xs ${number === step ? "bg-[#FF9300] text-white" : number < step ? "bg-emerald-500/80 text-white" : "bg-white/10 text-white/50"}`}><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/15 font-bold">{number < step ? <Check className="h-3.5 w-3.5" /> : number}</span><span className="hidden sm:block">{label}</span></button>; })}</div>
      {error && <div className="mb-5 rounded-xl border border-red-300/30 bg-red-500/15 p-3 text-sm text-red-100">{error}</div>}

      {step === 1 && <div className="rounded-2xl bg-white p-5 text-[#12394F] shadow-2xl md:p-8"><div className="mb-5 flex gap-2">{(["round", "oneway"] as const).map((type) => <button key={type} type="button" onClick={() => setTripType(type)} className={`rounded-full px-5 py-2 text-sm font-bold ${tripType === type ? "bg-[#FF9300] text-white" : "bg-slate-100"}`}>{type === "round" ? "Round trip" : "One way"}</button>)}</div><div className="grid gap-4 md:grid-cols-4"><label>From<select value={origin} onChange={(e) => setOrigin(e.target.value)} className="mt-1 w-full rounded-lg border p-3">{AIRPORTS.map((airport) => <option key={airport.code} value={airport.code}>{airport.code} · {airport.city}</option>)}</select></label><label>To<select value={destination} onChange={(e) => setDestination(e.target.value)} className="mt-1 w-full rounded-lg border p-3">{AIRPORTS.map((airport) => <option key={airport.code} value={airport.code}>{airport.code} · {airport.city}</option>)}</select></label><label>Departure<input type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} className="mt-1 w-full rounded-lg border p-3" /></label><label>Return{tripType === "round" ? <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className="mt-1 w-full rounded-lg border p-3" /> : <span className="mt-1 block rounded-lg bg-slate-100 p-3 text-slate-400">Not required</span>}</label></div><div className="mt-5 grid gap-4 sm:grid-cols-4"><label>Adults<input type="number" min="1" value={adults} onChange={(e) => setAdults(Number(e.target.value))} className="mt-1 w-full rounded-lg border p-3" /></label><label>Children<input type="number" min="0" value={children} onChange={(e) => setChildren(Number(e.target.value))} className="mt-1 w-full rounded-lg border p-3" /></label><label>Infants<input type="number" min="0" value={infants} onChange={(e) => setInfants(Number(e.target.value))} className="mt-1 w-full rounded-lg border p-3" /></label><label>Cabin<select value={cabinClass} onChange={(e) => setCabinClass(e.target.value)} className="mt-1 w-full rounded-lg border p-3"><option value="economy">Economy</option><option value="premium_economy">Premium economy</option><option value="business">Business</option><option value="first">First</option></select></label></div><button type="button" disabled={busy} onClick={search} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF9300] py-3 font-bold text-white">{busy && <Loader2 className="h-4 w-4 animate-spin" />}Search flights <ArrowRight className="h-4 w-4" /></button></div>}

      {step === 2 && <div className="grid gap-5 lg:grid-cols-[1fr_300px]"><div><div className="mb-3 flex justify-between rounded-xl bg-white/10 p-3 text-sm"><span>{offers.length} offers · {origin} to {destination}</span><select value={sort} onChange={(e) => setSort(e.target.value as "cheap" | "departure")} className="rounded bg-white px-2 py-1 text-[#12394F]"><option value="cheap">Cheapest</option><option value="departure">Earliest departure</option></select></div><div className="space-y-3">{sortedOffers.map((offer) => <article key={offer.id} className="rounded-2xl bg-white p-5 text-[#12394F] shadow-lg"><div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="rounded-full bg-[#1F67B1]/10 p-3"><Plane className="h-5 w-5 text-[#1F67B1]" /></div><div><p className="font-bold">{offer.airline} <span className="font-normal text-slate-500">{offer.flightNumber}</span></p><p className="text-xs text-slate-500">{offer.origin} → {offer.destination} · {offer.stops === 0 ? "Direct" : `${offer.stops} stop(s)`}</p></div></div><div className="text-right"><p className="text-xl font-extrabold text-[#FF9300]">{price(offer.price, offer.usdPrice)}</p><p className="text-xs text-slate-500">{time(offer.departureAt)} → {time(offer.arrivalAt)}</p></div><button type="button" onClick={() => chooseOffer(offer)} className="rounded-full bg-[#FF9300] px-5 py-2 text-sm font-bold text-white">Select</button></div></article>)}</div><button type="button" onClick={() => next(1)} className="mt-4 inline-flex items-center gap-1 text-sm text-white/70"><ArrowLeft className="h-4 w-4" /> Change search</button></div><Summary selected={selected} total={displayedTotal} display={price} /></div>}

      {step === 3 && selected && <Panel title="Choose your fare"><div className="rounded-xl border-2 border-[#FF9300] p-5"><div className="flex items-center justify-between"><div><p className="font-bold">Standard fare</p><p className="mt-1 text-sm text-slate-500">{selected.refundable ? "Refundable conditions available" : "Conditions apply"} · {selected.requiresInstantPayment ? "Instant payment required" : "Hold and pay later available"}</p></div><p className="text-xl font-extrabold text-[#FF9300]">{price(selected.price, selected.usdPrice)}</p></div></div><Continue onClick={() => next(4)} label="Continue to passenger details" back={() => next(2)} /></Panel>}

      {step === 4 && <Panel title="Passenger details"><div className="space-y-5">{passengers.map((passenger, index) => <div key={index} className="rounded-xl border p-4"><p className="mb-3 font-bold text-[#1F67B1]">Passenger {index + 1}</p><div className="grid gap-3 sm:grid-cols-3">{(["title", "firstName", "lastName", "dob", "gender", "nationality", "passportNumber", "passportExpiry"] as const).map((key) => key === "title" || key === "gender" || key === "nationality" ? <label key={key} className="text-xs font-semibold capitalize">{key}<select value={passenger[key]} onChange={(e) => updatePassenger(index, key, e.target.value)} className="mt-1 w-full rounded-lg border p-2.5"><option value="">Select</option>{key === "title" ? <><option>Mr</option><option>Mrs</option><option>Ms</option></> : key === "gender" ? <><option value="m">Male</option><option value="f">Female</option></> : <><option>Ethiopian</option><option>Saudi</option><option>American</option><option>British</option></>}</select></label> : <label key={key} className="text-xs font-semibold capitalize">{key.replace(/([A-Z])/g, " $1")}<input type={key.includes("dob") || key.includes("Expiry") ? "date" : "text"} value={passenger[key]} onChange={(e) => updatePassenger(index, key, e.target.value)} className="mt-1 w-full rounded-lg border p-2.5" /></label>)}</div></div>)}<div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold">Contact email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border p-2.5" /></label><label className="text-xs font-semibold">Contact phone<input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full rounded-lg border p-2.5" /></label></div></div><Continue onClick={() => validatePassengers() && next(5)} label="Continue to seats" back={() => next(3)} /></Panel>}

      {step === 5 && <Panel title="Choose seats"><p className="mb-4 text-sm text-slate-500">Seats are optional. Choose up to {passengerCount}; paid seats are priced in the airline currency.</p>{seats.length ? <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">{seats.map((seat) => { const chosen = selectedSeats.some((item) => item.designator === seat.designator); return <button key={seat.designator} type="button" disabled={!seat.available || (!chosen && selectedSeats.length >= passengerCount)} onClick={() => setSelectedSeats((current) => chosen ? current.filter((item) => item.designator !== seat.designator) : [...current, { designator: seat.designator, passengerId: passengerIds[current.length] ?? passengerIds[0] ?? "", serviceId: seat.serviceId, price: seat.price }])} className={`rounded-lg border p-3 text-xs font-bold ${chosen ? "border-[#FF9300] bg-[#FF9300] text-white" : seat.available ? "border-slate-200 bg-slate-50 text-[#12394F]" : "bg-slate-200 text-slate-400"}`}>{seat.designator}</button>; })}</div> : <div className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">No airline seat map is available for this offer. You can continue without selecting seats.</div>}<Continue onClick={() => next(6)} label="Continue to extras" back={() => next(4)} /></Panel>}

      {step === 6 && <Panel title="Baggage & extras"><div className="space-y-3">{services.length ? services.filter((service) => service.type !== "seat").map((service) => { const checked = selectedServices.includes(service.id); return <label key={service.id} className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 ${checked ? "border-[#FF9300] bg-orange-50" : "border-slate-200"}`}><span><input type="checkbox" checked={checked} onChange={() => setSelectedServices((current) => checked ? current.filter((id) => id !== service.id) : [...current, service.id])} className="mr-3 accent-[#FF9300]" />{service.name || service.type || "Airline service"}</span><b>{service.price} {service.currency}</b></label>; }) : <div className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">No additional services are available for this offer.</div>}</div><Continue onClick={() => next(7)} label="Review booking" back={() => next(5)} /></Panel>}

      {step === 7 && selected && <Panel title="Review & pay"><div className="grid gap-5 lg:grid-cols-[1fr_300px]"><div className="space-y-4 text-sm text-[#12394F]"><div className="rounded-xl border p-4"><p className="font-bold">{selected.airline} {selected.flightNumber}</p><p className="mt-1">{selected.origin} {time(selected.departureAt)} → {selected.destination} {time(selected.arrivalAt)}</p><p className="mt-1 text-slate-500">{selected.stops === 0 ? "Direct" : `${selected.stops} stop(s)`} · {cabinClass}</p></div><div className="rounded-xl border p-4"><p className="font-bold">Passengers ({passengers.length})</p>{passengers.map((p, i) => <p key={i} className="mt-1">{p.title} {p.firstName} {p.lastName}</p>)}</div><div className="rounded-xl border p-4"><p className="font-bold">Selections</p><p className="mt-1">Seats: {selectedSeats.length ? selectedSeats.map((seat) => seat.designator).join(", ") : "None"}</p><p className="mt-1">Extras: {selectedServices.length || "None"}</p></div></div><Summary selected={selected} total={displayedTotal} display={price} seatFee={seatFee} extrasFee={extrasFee} /><div className="lg:col-span-2 flex flex-wrap gap-3"><button type="button" disabled={busy} onClick={payNow} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#FF9300] py-3 font-bold text-white">{busy && <Loader2 className="h-4 w-4 animate-spin" />}Pay now with Chapa</button><button type="button" disabled={busy} onClick={holdForLater} className="rounded-xl border border-[#1F67B1] px-5 py-3 font-bold text-[#1F67B1]">Pay later</button></div></div><button type="button" onClick={() => next(6)} className="mt-4 inline-flex items-center gap-1 text-sm text-[#1F67B1]"><ArrowLeft className="h-4 w-4" /> Edit extras</button></Panel>}

      {step === 8 && <div className="rounded-2xl bg-white p-8 text-center text-[#12394F] shadow-2xl"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><ShieldCheck className="h-8 w-8" /></div><h3 className="mt-4 text-2xl font-extrabold">Booking held</h3><p className="mt-2 text-slate-500">Your booking reference is <b>{bookingReference}</b>. Complete payment before the hold expires.</p><button type="button" onClick={() => window.location.assign(`/${locale}/dashboard/customer?tab=requests`)} className="mt-6 rounded-xl bg-[#1F67B1] px-6 py-3 font-bold text-white">View my trips</button></div>}
    </div>
  </section>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <div className="rounded-2xl bg-white p-5 text-[#12394F] shadow-2xl md:p-8"><h3 className="mb-5 text-2xl font-extrabold">{title}</h3>{children}</div>; }
function Continue({ onClick, label, back }: { onClick: () => void; label: string; back: () => void }) { return <div className="mt-6 flex flex-wrap justify-between gap-3"><button type="button" onClick={back} className="inline-flex items-center gap-1 text-sm font-semibold text-[#1F67B1]"><ArrowLeft className="h-4 w-4" />Back</button><button type="button" onClick={onClick} className="inline-flex items-center gap-2 rounded-xl bg-[#FF9300] px-6 py-3 font-bold text-white">{label}<ArrowRight className="h-4 w-4" /></button></div>; }
function Summary({ selected, total, display, seatFee = 0, extrasFee = 0 }: { selected: OfferResult | null; total: number; display: (etb: number, usd?: number) => string; seatFee?: number; extrasFee?: number }) { return <aside className="h-fit rounded-2xl bg-white p-5 text-[#12394F] shadow-xl lg:sticky lg:top-5"><p className="font-bold">Trip summary</p>{selected && <p className="mt-3 text-sm">{selected.airline} {selected.flightNumber}<br />{selected.origin} → {selected.destination}</p>}<div className="my-4 border-t" /><div className="flex justify-between text-sm"><span>Flight</span><b>{selected ? display(selected.price, selected.usdPrice) : "--"}</b></div><div className="mt-2 flex justify-between text-sm"><span>Seats</span><b>{seatFee ? display(seatFee) : "--"}</b></div><div className="mt-2 flex justify-between text-sm"><span>Extras</span><b>{extrasFee ? display(extrasFee) : "--"}</b></div><div className="mt-4 flex justify-between border-t pt-3 text-lg font-extrabold"><span>Total</span><b className="text-[#FF9300]">{display(total)}</b></div></aside>; }
