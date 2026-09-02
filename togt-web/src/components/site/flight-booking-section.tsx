"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plane, Search, ArrowRight, ChevronDown, Plus, Minus, Check, ChevronLeft,
  Users, Armchair, Luggage, UtensilsCrossed, Shield, CreditCard, Smartphone,
  Landmark, Download, CheckCircle2, RotateCcw, Baby,
} from "lucide-react";
import { COUNTRIES } from "@/lib/schemas/smart-form";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "next-intl";
import { BookingAccessDialog } from "./booking-access-dialog";
import { generateTicketPDF } from "@/lib/ticket-pdf";
import {
  searchFlights,
  createFlightOrder,
  payFlightOrder,
  getCurrencyRates,
  getSeatMap,
  getOfferServices,
} from "@/lib/api/duffel";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

function formatTime(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

/* ── Airport data (replace with real API / IATA feed when wired up) ─── */
type Airport = { code: string; city: string; airport: string; country: string };

const AIRPORTS: Airport[] = [
  { code: "ADD", city: "Addis Ababa",   airport: "Bole International",     country: "Ethiopia" },
  { code: "DXB", city: "Dubai",         airport: "Dubai International",    country: "UAE" },
  { code: "JED", city: "Jeddah",        airport: "King Abdulaziz Intl",    country: "Saudi Arabia" },
  { code: "IST", city: "Istanbul",      airport: "Istanbul Airport",       country: "Turkey" },
  { code: "CAI", city: "Cairo",         airport: "Cairo International",    country: "Egypt" },
  { code: "NBO", city: "Nairobi",       airport: "Jomo Kenyatta Intl",     country: "Kenya" },
  { code: "LHR", city: "London",        airport: "Heathrow",               country: "UK" },
  { code: "FRA", city: "Frankfurt",     airport: "Frankfurt Airport",      country: "Germany" },
  { code: "CDG", city: "Paris",         airport: "Charles de Gaulle",      country: "France" },
  { code: "AMS", city: "Amsterdam",     airport: "Schiphol",               country: "Netherlands" },
  { code: "JFK", city: "New York",      airport: "JFK International",      country: "USA" },
  { code: "IAD", city: "Washington DC", airport: "Dulles International",   country: "USA" },
  { code: "YYZ", city: "Toronto",       airport: "Pearson",                country: "Canada" },
  { code: "PEK", city: "Beijing",       airport: "Capital International",  country: "China" },
  { code: "BOM", city: "Mumbai",        airport: "Chhatrapati Shivaji",    country: "India" },
  { code: "DEL", city: "Delhi",         airport: "Indira Gandhi Intl",     country: "India" },
  { code: "BKK", city: "Bangkok",       airport: "Suvarnabhumi",           country: "Thailand" },
  { code: "SIN", city: "Singapore",     airport: "Changi",                 country: "Singapore" },
  { code: "KUL", city: "Kuala Lumpur",  airport: "KLIA",                   country: "Malaysia" },
  { code: "DOH", city: "Doha",          airport: "Hamad International",    country: "Qatar" },
  { code: "RUH", city: "Riyadh",        airport: "King Khalid",            country: "Saudi Arabia" },
  { code: "MED", city: "Madinah",       airport: "Prince Mohammad",       country: "Saudi Arabia" },
  { code: "KRT", city: "Khartoum",      airport: "Khartoum International", country: "Sudan" },
  { code: "JIB", city: "Djibouti",      airport: "Djibouti International",  country: "Djibouti" },
  { code: "ACC", city: "Accra",         airport: "Kotoka International",   country: "Ghana" },
  { code: "LOS", city: "Lagos",         airport: "Murtala Muhammed",       country: "Nigeria" },
  { code: "JNB", city: "Johannesburg",  airport: "O.R. Tambo",            country: "South Africa" },
  { code: "GVA", city: "Geneva",        airport: "Geneva Airport",         country: "Switzerland" },
  { code: "ZRH", city: "Zurich",        airport: "Zurich Airport",         country: "Switzerland" },
  { code: "MAD", city: "Madrid",        airport: "Barajas",                country: "Spain" },
  { code: "BCN", city: "Barcelona",     airport: "El Prat",                country: "Spain" },
  { code: "FCO", city: "Rome",          airport: "Fiumicino",              country: "Italy" },
  { code: "MXP", city: "Milan",         airport: "Malpensa",               country: "Italy" },
  { code: "VIE", city: "Vienna",        airport: "Vienna International",   country: "Austria" },
  { code: "BRU", city: "Brussels",      airport: "Brussels Airport",       country: "Belgium" },
  { code: "ARN", city: "Stockholm",     airport: "Arlanda",                country: "Sweden" },
  { code: "OSL", city: "Oslo",          airport: "Gardermoen",             country: "Norway" },
  { code: "CPH", city: "Copenhagen",    airport: "Kastrup",                country: "Denmark" },
  { code: "HEL", city: "Helsinki",      airport: "Vantaa",                 country: "Finland" },
  { code: "DUB", city: "Dublin",        airport: "Dublin Airport",         country: "Ireland" },
  { code: "MEL", city: "Melbourne",     airport: "Melbourne Airport",      country: "Australia" },
  { code: "SYD", city: "Sydney",        airport: "Kingsford Smith",        country: "Australia" },
  { code: "AKL", city: "Auckland",      airport: "Auckland Airport",       country: "New Zealand" },
  { code: "GRU", city: "Sao Paulo",     airport: "Guarulhos",              country: "Brazil" },
  { code: "EZE", city: "Buenos Aires",  airport: "Ezeiza",                 country: "Argentina" },
  { code: "MEX", city: "Mexico City",   airport: "Benito Juarez",          country: "Mexico" },
  { code: "TLV", city: "Tel Aviv",      airport: "Ben Gurion",             country: "Israel" },
  { code: "BEY", city: "Beirut",        airport: "Rafic Hariri",           country: "Lebanon" },
  { code: "AMM", city: "Amman",         airport: "Queen Alia",             country: "Jordan" },
];

const findAirport = (code: string | null): Airport | null =>
  code ? AIRPORTS.find((a) => a.code === code) ?? null : null;

/* ── Searchable city selector ────────────────────────────────────── */
function CitySelect({
  value,
  onChange,
  placeholder,
  testId,
}: {
  value: Airport | null;
  onChange: (a: Airport | null) => void;
  placeholder: string;
  testId: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const filtered = search.trim()
    ? AIRPORTS.filter(
        (a) =>
          a.city.toLowerCase().includes(search.toLowerCase()) ||
          a.code.toLowerCase().includes(search.toLowerCase()) ||
          a.country.toLowerCase().includes(search.toLowerCase())
      )
    : AIRPORTS;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        data-testid={testId}
        className="w-full px-4 py-3 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl text-left flex items-center justify-between transition-colors"
      >
        <div className="flex items-baseline gap-2 min-w-0">
          {value ? (
            <>
              <span className="text-2xl font-extrabold text-white tracking-wide">{value.code}</span>
              <span className="text-white/80 text-sm truncate">{value.city}</span>
            </>
          ) : (
            <span className="text-white/50 text-sm">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-white/60 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, ease: EASE }}
          className="absolute z-30 w-full mt-1 bg-white rounded-xl shadow-2xl overflow-hidden"
        >
          <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search city or airport..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#FF9300]/30"
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-400">No airports match &ldquo;{search}&rdquo;</div>
            ) : (
              filtered.map((a) => (
                <button
                  key={a.code}
                  type="button"
                  onClick={() => {
                    onChange(a);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-baseline gap-2 border-b border-gray-50 last:border-b-0 ${
                    value?.code === a.code ? "bg-[#FF9300]/10" : ""
                  }`}
                >
                  <span className="font-extrabold text-[#12394F] text-base w-12 shrink-0">{a.code}</span>
                  <span className="text-gray-800 text-sm font-medium">{a.city}</span>
                  <span className="text-gray-400 text-xs truncate">· {a.airport} · {a.country}</span>
                </button>
              ))
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ── Passenger counter popover ────────────────────────────────────── */
function PassengerCounter({
  adults,
  childrenCount,
  infants,
  onChange,
  labels,
}: {
  adults: number;
  childrenCount: number;
  infants: number;
  onChange: (next: { adults: number; childrenCount: number; infants: number }) => void;
  labels: { passengers: string; adults: string; children: string; infants: string };
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const summary = `${adults} ${labels.adults}, ${childrenCount} ${labels.children}`;

  const inc = (key: "adults" | "childrenCount" | "infants") => {
    if (key === "adults") onChange({ adults: adults + 1, childrenCount, infants });
    if (key === "childrenCount") onChange({ adults, childrenCount: childrenCount + 1, infants });
    if (key === "infants") onChange({ adults, childrenCount, infants: infants + 1 });
  };
  const dec = (key: "adults" | "childrenCount" | "infants", min: number) => {
    if (key === "adults") onChange({ adults: Math.max(min, adults - 1), childrenCount, infants });
    if (key === "childrenCount") onChange({ adults, childrenCount: Math.max(0, childrenCount - 1), infants });
    if (key === "infants") onChange({ adults, childrenCount, infants: Math.max(0, infants - 1) });
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        data-testid="passengers-counter"
        className="w-full px-4 py-3 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl text-white flex items-center justify-between transition-colors"
      >
        <span className="text-sm">{summary}</span>
        <ChevronDown className={`w-4 h-4 text-white/60 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, ease: EASE }}
          className="absolute z-30 w-full mt-1 bg-white rounded-xl shadow-2xl p-4 space-y-1"
        >
          <CounterRow
            label={labels.adults}
            value={adults}
            min={1}
            onInc={() => inc("adults")}
            onDec={() => dec("adults", 1)}
          />
          <CounterRow
            label={labels.children}
            value={childrenCount}
            min={0}
            onInc={() => inc("childrenCount")}
            onDec={() => dec("childrenCount", 0)}
          />
          <CounterRow
            label={labels.infants}
            value={infants}
            min={0}
            onInc={() => inc("infants")}
            onDec={() => dec("infants", 0)}
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-2 w-full py-2 rounded-lg bg-[#FF9300] text-white text-sm font-semibold"
          >
            Done
          </button>
        </motion.div>
      )}
    </div>
  );
}

function CounterRow({ label, value, min, onInc, onDec }: { label: string; value: number; min: number; onInc: () => void; onDec: () => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex items-center gap-3">
        <button type="button" onClick={onDec} disabled={value <= min} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center disabled:opacity-40 hover:border-[#FF9300] hover:text-[#FF9300] transition-colors">
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="w-6 text-center font-bold text-[#12394F]">{value}</span>
        <button type="button" onClick={onInc} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:border-[#FF9300] hover:text-[#FF9300] transition-colors">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ── Flight search results (from Duffel API backend) ──────────────── */
type FlightResult = {
  id: string;
  airline: string;
  airlineCode: string;
  flight: string;
  departure: string;
  arrival: string;
  duration: string;
  price: number;
  currency: string;
  stops: string;
  stopsKey: "direct" | "onestop";
  offerId: string;
  duffelPrice: number;
  duffelCurrency: string;
  usdPrice?: number;
  tripSummary: TripSummary;
};

type TripSummary = {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string | null;
  outbound?: { departureAt: string; arrivalAt: string; segments: Segment[] } | null;
  return?: { departureAt: string; arrivalAt: string; segments: Segment[] } | null;
};

type Segment = {
  origin: string;
  destination: string;
  departAt: string;
  arriveAt: string;
  flightNumber: string;
  airline: string;
  airlineCode: string;
};

type DuffelSeat = { designator: string; name?: string; serviceId?: string; price?: number; currency?: string; available: boolean };

function flattenDuffelSeats(maps: unknown[]): DuffelSeat[] {
  const seats: DuffelSeat[] = [];
  for (const map of maps as Array<{ cabins?: Array<{ rows?: Array<{ sections?: Array<{ elements?: Array<Record<string, unknown>> }> }> }> }>) {
    for (const cabin of map.cabins ?? []) for (const row of cabin.rows ?? []) for (const section of row.sections ?? []) for (const element of section.elements ?? []) {
      if (element.type !== "seat" && element.type !== "restricted_seat_general") continue;
      const services = (element.available_services as Array<{ id: string; total_amount?: string; total_currency?: string }> | undefined) ?? [];
      const service = services[0];
      seats.push({ designator: String(element.designator), name: String(element.name ?? "Standard"), serviceId: service?.id, price: Number(service?.total_amount ?? 0), currency: service?.total_currency, available: services.length > 0 });
    }
  }
  return seats;
}

const MOCK_RESULTS: FlightResult[] = [
  { id: "mock-1", airline: "Ethiopian Airlines", airlineCode: "ET", flight: "ET 612",  departure: "08:30", arrival: "11:45", duration: "4h 15m", price: 45000, currency: "ETB", stops: "Direct",      stopsKey: "direct",   offerId: "", duffelPrice: 0, duffelCurrency: "USD", tripSummary: null as unknown as TripSummary },
  { id: "mock-2", airline: "Emirates",          airlineCode: "EK", flight: "EK 724",  departure: "14:20", arrival: "18:35", duration: "4h 15m", price: 68000, currency: "ETB", stops: "1 Stop (DXB)", stopsKey: "onestop", offerId: "", duffelPrice: 0, duffelCurrency: "USD", tripSummary: null as unknown as TripSummary },
  { id: "mock-3", airline: "Qatar Airways",     airlineCode: "QR", flight: "QR 1406", departure: "22:10", arrival: "02:25", duration: "4h 15m", price: 72000, currency: "ETB", stops: "1 Stop (DOH)", stopsKey: "onestop", offerId: "", duffelPrice: 0, duffelCurrency: "USD", tripSummary: null as unknown as TripSummary },
];

const POPULAR_ROUTES: { from: string; to: string; label: string }[] = [
  { from: "ADD", to: "DXB", label: "ADD → DXB" },
  { from: "ADD", to: "JED", label: "ADD → JED" },
  { from: "ADD", to: "IST", label: "ADD → IST" },
  { from: "ADD", to: "LHR", label: "ADD → LHR" },
  { from: "ADD", to: "JFK", label: "ADD → JFK" },
];

/* ── Seat map helpers ─────────────────────────────────────────────── */
const SEAT_ROWS = Array.from({ length: 18 }, (_, i) => i + 1); // rows 1-18
const LEGROOM_ROWS = new Set([1, 2, 12]);
const SEAT_LETTERS = ["A", "B", "C", "D", "E", "F"] as const;
const LEGROOM_SEAT_PRICE = 1000;

function isSeatOccupied(row: number, letter: string): boolean {
  const idx = row * 6 + SEAT_LETTERS.indexOf(letter as (typeof SEAT_LETTERS)[number]);
  return ((idx * 2654435761) >>> 0) % 5 < 2; // ~40% deterministic occupancy
}

/* ── Pricing constants (mock; replace with API fare rules) ────────── */
const CHILD_RATE = 0.75;
const INFANT_RATE = 0.1;
const TAX_RATE = 0.18;
const BAGGAGE_PRICE = 15000;
const INSURANCE_PRICE = 5000;

/* ── Step indicator (always visible) ──────────────────────────────── */
function StepsBar({ current, labels }: { current: number; labels: string[] }) {
  return (
    <div className="mb-8">
      {/* Step circles + connectors */}
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        {labels.map((label, i) => {
          const idx = i + 1;
          const active = idx === current;
          const done = idx < current || current === 5;
          return (
            <div key={label} className="flex items-center gap-2 sm:gap-3">
              {i > 0 && <div className={`w-6 sm:w-10 md:w-16 h-1 rounded-full ${done ? "bg-green-500" : "bg-white/20"}`} />}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  done ? "bg-green-500 text-white"
                    : active ? "bg-[#FF9300] text-white ring-4 ring-[#FF9300]/25"
                    : "bg-white/10 text-white/50 border border-white/20"
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : idx}
              </div>
            </div>
          );
        })}
      </div>
      {/* Step labels */}
      <div className="flex justify-center gap-3 md:gap-8 text-[11px] sm:text-xs mt-2">
        {labels.map((label, i) => {
          const idx = i + 1;
          const active = idx === current;
          const done = idx < current || current === 5;
          return (
            <span
              key={label}
              className={done ? "text-green-400 font-semibold" : active ? "text-[#FF9300] font-semibold" : "text-white/50"}
            >
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/* ── Seat map ─────────────────────────────────────────────────────── */
function SeatMap({
  selected,
  max,
  onToggle,
  occupied,
  t,
}: {
  selected: string[];
  max: number;
  onToggle: (seat: string) => void;
  occupied: Set<string>;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
}) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[340px] mx-auto">
        <p className="text-center text-[10px] text-gray-400 uppercase tracking-widest mb-4">
          ✈ {t("frontOfAircraft")} →
        </p>

        {SEAT_ROWS.map((row) => {
          const legroom = LEGROOM_ROWS.has(row);
          return (
            <div key={row} className="flex items-center justify-center gap-2 mb-1.5">
              <span className="w-6 text-[10px] text-gray-400 font-medium">{row}</span>
              {/* Left side A B C */}
              <div className="flex gap-1">
                {SEAT_LETTERS.slice(0, 3).map((letter) => (
                  <SeatButton
                    key={`${row}${letter}`}
                    seat={`${row}${letter}`}
                    legroom={legroom}
                    selected={selected.includes(`${row}${letter}`)}
                    disabled={occupied.has(`${row}${letter}`) || (selected.length >= max && !selected.includes(`${row}${letter}`))}
                    onToggle={onToggle}
                  />
                ))}
              </div>
              {/* Aisle */}
              <div className="w-6" />
              {/* Right side D E F */}
              <div className="flex gap-1">
                {SEAT_LETTERS.slice(3).map((letter) => (
                  <SeatButton
                    key={`${row}${letter}`}
                    seat={`${row}${letter}`}
                    legroom={legroom}
                    selected={selected.includes(`${row}${letter}`)}
                    disabled={occupied.has(`${row}${letter}`) || (selected.length >= max && !selected.includes(`${row}${letter}`))}
                    onToggle={onToggle}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* Legend */}
        <div className="flex flex-wrap gap-3 sm:gap-4 justify-center mt-5 text-[11px] text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-gray-200 border border-gray-300" /> {t("legendAvailable")}</span>
          <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-[#FF9300]" /> {t("legendSelected")}</span>
          <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-gray-400" /> {t("legendOccupied")}</span>
          <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-[#1F67B1]" /> {t("legendLegroom")}</span>
        </div>
      </div>
    </div>
  );
}

function SeatButton({
  seat, legroom, selected, disabled, onToggle,
}: {
  seat: string;
  legroom: boolean;
  selected: boolean;
  disabled: boolean;
  onToggle: (seat: string) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onToggle(seat)}
      data-testid={`seat-${seat}`}
      title={seat}
      className={`w-7 h-7 rounded text-[10px] font-semibold transition-all flex items-center justify-center ${
        selected
          ? "bg-[#FF9300] text-white scale-110 shadow-md"
          : disabled
            ? "bg-gray-400 text-white/60 cursor-not-allowed"
            : legroom
              ? "bg-[#1F67B1] text-white hover:brightness-110"
              : "bg-gray-200 text-gray-600 hover:bg-gray-300"
      }`}
    >
      {seat}
    </button>
  );
}

/* ── Passenger type labels ────────────────────────────────────────── */
type PaxType = "adult" | "child" | "infant";
const PAX_ICONS: Record<PaxType, typeof Users> = { adult: Users, child: Users, infant: Baby };

type PassengerForm = {
  firstName: string;
  lastName: string;
  passportNumber: string;
  passportExpiry: string;
  dob: string;
  nationality: string;
  gender: string;
};

/* ── Main section ─────────────────────────────────────────────────── */
export function FlightBookingSection() {
  const t = useTranslations("FlightBooking");
  const locale = useLocale();
  const { user, isLoading: authLoading } = useAuth();

  // ── Search state ──────────────────────────────────────────────────
  const [tripType, setTripType] = useState<"round" | "oneway" | "multi">("round");
  const [from, setFrom] = useState<Airport | null>(findAirport("ADD"));
  const [to, setTo] = useState<Airport | null>(null);
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [directOnly, setDirectOnly] = useState(false);
  const [flexibleDates, setFlexibleDates] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Booking flow state ────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1); // 1 search, 2 results, 3 passengers+seat+extras, 4 payment, 5 confirmation
  const [selectedFlight, setSelectedFlight] = useState<FlightResult | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [baggage, setBaggage] = useState(false);
  const [meal, setMeal] = useState(false);
  const [insurance, setInsurance] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "telebirr" | "bank">("card");
  const [paying, setPaying] = useState(false);
  const [bookingRef, setBookingRef] = useState("");
  const [flowError, setFlowError] = useState<string | null>(null);
  const [roleDenied, setRoleDenied] = useState(false);
  const [passengerForms, setPassengerForms] = useState<PassengerForm[]>([]);
  const [results, setResults] = useState<FlightResult[]>([]);
  const [offerRequestId, setOfferRequestId] = useState("");
  const [passengerIds, setPassengerIds] = useState<string[]>([]);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [displayCurrency, setDisplayCurrency] = useState<"ETB" | "USD">("ETB");
  const [usdToEtb, setUsdToEtb] = useState(55.5);
  const [currencyFallback, setCurrencyFallback] = useState(false);
  const [duffelSeats, setDuffelSeats] = useState<DuffelSeat[]>([]);
  const [selectedDuffelSeats, setSelectedDuffelSeats] = useState<Array<{ designator: string; passengerId: string; serviceId?: string; price: number }>>([]);
  const [serviceOptions, setServiceOptions] = useState<Array<{ id: string; name?: string; type?: string; price: number; currency: string; maximumQuantity: number }>>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  useEffect(() => {
    getCurrencyRates().then((rates) => {
      setUsdToEtb(rates.USD_TO_ETB);
      setCurrencyFallback(rates.isFallback);
    }).catch(() => setCurrencyFallback(true));
  }, []);

  const displayPrice = (etb: number, usd?: number) => {
    const value = displayCurrency === "USD" ? (usd ?? etb / usdToEtb) : etb;
    return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${displayCurrency}`;
  };

  useEffect(() => {
    if (authLoading) return;
    try {
      const pending = window.localStorage.getItem("pendingBooking") ?? window.localStorage.getItem("pendingFlightBooking");
      if (!pending || !user) return;
      const saved = JSON.parse(pending) as { flight?: FlightResult; selectedFlight?: FlightResult; from?: Airport; to?: Airport; searchData?: { from: Airport; to: Airport; departureDate: string; returnDate: string; adults: number; children: number; infants: number }; departureDate?: string; returnDate?: string; adults?: number; children?: number; infants?: number };
      const search = saved.searchData ?? { from: saved.from!, to: saved.to!, departureDate: saved.departureDate!, returnDate: saved.returnDate ?? "", adults: saved.adults ?? 1, children: saved.children ?? 0, infants: saved.infants ?? 0 };
      const savedFlight = saved.selectedFlight ?? saved.flight;
      if (!savedFlight || !search.from || !search.to) return;
      setFrom(search.from); setTo(search.to); setDepartureDate(search.departureDate); setReturnDate(search.returnDate); setAdults(search.adults); setChildren(search.children); setInfants(search.infants);
      const flight = MOCK_RESULTS.find((result) => result.flight === savedFlight.flight) ?? savedFlight;
      setSelectedFlight(flight); setPassengerForms(Array.from({ length: search.adults + search.children + search.infants }, () => ({ firstName: "", lastName: "", passportNumber: "", passportExpiry: "", dob: "", nationality: "", gender: "" }))); setCurrentStep(3); window.localStorage.removeItem("pendingBooking"); window.localStorage.removeItem("pendingFlightBooking");
    } catch { window.localStorage.removeItem("pendingBooking"); window.localStorage.removeItem("pendingFlightBooking"); }
  }, [authLoading, user]);

  const passengerList = useMemo<PaxType[]>(() => {
    const list: PaxType[] = [];
    for (let i = 0; i < adults; i++) list.push("adult");
    for (let i = 0; i < children; i++) list.push("child");
    for (let i = 0; i < infants; i++) list.push("infant");
    return list;
  }, [adults, children, infants]);

  const occupiedSeats = useMemo(() => {
    const set = new Set<string>();
    for (const row of SEAT_ROWS) {
      for (const letter of SEAT_LETTERS) {
        if (isSeatOccupied(row, letter)) set.add(`${row}${letter}`);
      }
    }
    return set;
  }, []);

  const totalPax = adults + children + infants;
  const baseFare = selectedFlight
    ? Math.round(selectedFlight.price * (adults + children * CHILD_RATE + infants * INFANT_RATE))
    : 0;
  const taxes = Math.round(baseFare * TAX_RATE);
  const seatsCost = selectedSeats.reduce(
    (sum, seat) => sum + (LEGROOM_ROWS.has(parseInt(seat, 10)) ? LEGROOM_SEAT_PRICE : 0),
    0
  );
  const duffelSeatCost = selectedDuffelSeats.reduce((sum, seat) => sum + (seat.price ?? 0), 0);
  const ancillaryCost = serviceOptions.filter((service) => selectedServiceIds.includes(service.id)).reduce((sum, service) => sum + service.price, 0);
  const extrasCost = (baggage ? BAGGAGE_PRICE : 0) + (insurance ? INSURANCE_PRICE : 0) + ancillaryCost;
  const grandTotal = baseFare + taxes + seatsCost + extrasCost;

  // ── Navigation ────────────────────────────────────────────────────
  const goToStep = (step: 1 | 2 | 3 | 4 | 5) => {
    setCurrentStep(step);
    window.setTimeout(() => {
      document.getElementById("flight-booking-flow")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    if (!from) { setError("from"); return; }
    if (!to)   { setError("to");   return; }
    if (from.code === to.code) { setError("same"); return; }
    if (!departureDate) { setError("date"); return; }
    if (tripType === "round" && !returnDate) { setError("return"); return; }

    setSelectedFlight(null);
    setSelectedSeats([]);
    setBaggage(false);
    setMeal(false);
    setInsurance(false);
    setLoading(true);
    setFlowError(null);
    try {
      const res = await searchFlights({
        origin: from.code,
        destination: to.code,
        departureDate,
        returnDate: tripType === "round" && returnDate ? returnDate : undefined,
        adults,
        children,
        infants,
        cabinClass: "economy",
        directOnly,
      });
      const mapped: FlightResult[] = res.offers.map((o) => ({
        id: o.id,
        airline: o.airline,
        airlineCode: o.airlineCode,
        flight: o.flightNumber,
        departure: formatTime(o.departureAt),
        arrival: formatTime(o.arrivalAt),
        duration: o.duration || "",
        price: o.price,
        currency: o.currency,
        stops: o.stops === 0 ? "" : `${o.stops} Stop(s)`,
        stopsKey: o.direct ? "direct" : "onestop",
        offerId: o.id,
        duffelPrice: o.duffelPrice,
        duffelCurrency: o.duffelCurrency,
        usdPrice: o.usdPrice,
        tripSummary: o.tripSummary,
      }));
      setResults(mapped);
      setOfferRequestId(res.offerRequestId);
      setPassengerIds(res.passengerIds);
      if (mapped.length === 0) {
        setFlowError("noFlights");
      } else {
        setFlowError(null);
        setCurrentStep(2);
        window.setTimeout(() => {
          document.getElementById("flight-booking-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 80);
      }
    } catch (err) {
      setResults([]);
      setFlowError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const applyPopular = (r: { from: string; to: string }) => {
    setFrom(findAirport(r.from));
    setTo(findAirport(r.to));
  };

  const filteredResults = directOnly && results.length > 0
    ? results.filter((r) => r.stopsKey === "direct")
    : results;

  const handleSelectFlight = (r: FlightResult) => {
    if (authLoading) return;
    if (user && user.role !== "CUSTOMER") { setRoleDenied(true); return; }
    if (!user) {
      const pendingBooking = { currentStep: 3, selectedFlight: r, searchData: { from, to, departureDate, returnDate, adults, children, infants } };
      window.localStorage.setItem("pendingBooking", JSON.stringify(pendingBooking));
      window.localStorage.setItem("pendingFlightBooking", JSON.stringify({ flight: r, from, to, departureDate, returnDate, adults, children, infants }));
      window.location.href = `/${locale}/login?redirect=flight-booking`;
      return;
    }
    setSelectedFlight(r);
    setSelectedSeats([]);
    setBaggage(false);
    setMeal(false);
    setInsurance(false);
    setDuffelSeats([]);
    setSelectedDuffelSeats([]);
    setServiceOptions([]);
    setSelectedServiceIds([]);
    Promise.all([getSeatMap(r.offerId), getOfferServices(r.offerId)]).then(([maps, services]) => {
      setDuffelSeats(flattenDuffelSeats(maps));
      setServiceOptions(services.services);
    }).catch(() => {
      setDuffelSeats([]);
      setServiceOptions([]);
    });
    setFlowError(null);
    setContactEmail(user.email ?? "");
    setContactPhone(user.phone ?? "");
    setPassengerForms(
      passengerList.map(() => ({ firstName: "", lastName: "", passportNumber: "", passportExpiry: "", dob: "", nationality: "", gender: "" }))
    );
    goToStep(3);
  };

  const updatePassenger = (i: number, key: keyof PassengerForm, value: string) => {
    setPassengerForms((prev) => prev.map((p, idx) => (idx === i ? { ...p, [key]: value } : p)));
  };

  const toggleSeat = (seat: string) => {
    setSelectedSeats((prev) =>
      prev.includes(seat) ? prev.filter((s) => s !== seat) : prev.length < totalPax ? [...prev, seat] : prev
    );
  };

  const toggleDuffelSeat = (seat: DuffelSeat) => {
    if (!seat.available) return;
    setSelectedDuffelSeats((current) => {
      const existing = current.find((item) => item.designator === seat.designator);
      if (existing) return current.filter((item) => item.designator !== seat.designator);
      if (current.length >= totalPax) return current;
      return [...current, { designator: seat.designator, passengerId: passengerIds[current.length] ?? passengerIds[0] ?? "", serviceId: seat.serviceId, price: seat.price ?? 0 }];
    });
  };

  const goToPayment = () => {
    setFlowError(null);
    const valid = passengerForms.length > 0 && passengerForms.every(
      (f) => f.firstName.trim() && f.lastName.trim() && f.passportNumber.trim() && f.passportExpiry && f.dob && f.nationality.trim() && f.gender
    );
    if (!valid) {
      setFlowError("passengers");
      document.getElementById("flight-booking-flow")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    goToStep(4);
  };

  const handlePay = async () => {
    if (!user || user.role !== "CUSTOMER" || !selectedFlight || !from || !to) return;
    if (!selectedFlight.offerId) { setFlowError("noFlights"); return; }
    if (!contactEmail.trim() || !contactPhone.trim()) { setFlowError("contact"); return; }
    setPaying(true);
    setFlowError(null);
    try {
      const order = await createFlightOrder({
        offerId: selectedFlight.offerId,
        offerRequestId,
        passengers: passengerForms.map((p, i) => ({
          passengerId: passengerIds[i],
          firstName: p.firstName,
          lastName: p.lastName,
          dob: p.dob,
          gender: p.gender,
          email: contactEmail,
          phone: contactPhone,
          passportNumber: p.passportNumber,
          passportExpiry: p.passportExpiry,
          nationality: p.nationality,
        })),
        seatSelection: selectedDuffelSeats,
        services: serviceOptions.filter((service) => selectedServiceIds.includes(service.id)).map((service) => ({ id: service.id, quantity: 1 })),
        seatAmount: duffelSeatCost,
        ancillaryAmount: ancillaryCost,
        customerCurrency: displayCurrency,
      });
      const checkout = await payFlightOrder(order.id);
      setPaying(false);
      window.location.href = checkout.checkoutUrl;
    } catch (err) {
      console.error("Flight payment initialization failed", err);
      setPaying(false);
      setFlowError(err instanceof Error ? err.message : "Could not complete the booking");
    }
  };

  const handleDownloadTicket = async () => {
    if (!selectedFlight || !from || !to) return;
    await generateTicketPDF({ ticketNumber: bookingRef, bookingReference: bookingRef, airline: selectedFlight.airline, flightNumber: selectedFlight.flight, origin: from.code, destination: to.code, departureAt: new Date(`${departureDate}T${selectedFlight.departure}:00`).toISOString(), passengerName: passengerForms.map((p) => `${p.firstName.trim()} ${p.lastName.trim()}`).join(", "), seat: selectedSeats.join(", "), cabinClass: "Economy", totalAmount: grandTotal, currency: "ETB" });
  };

  const handleFinish = () => {
    setCurrentStep(1);
    setSelectedFlight(null);
    setSelectedSeats([]);
    setBaggage(false);
    setMeal(false);
    setInsurance(false);
    setPaymentMethod("card");
    setPaying(false);
    setBookingRef("");
    setFlowError(null);
    setPassengerForms([]);
    document.getElementById("flight-booking")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const paxTypeLabel = (p: PaxType) =>
    p === "adult" ? t("typeAdult") : p === "child" ? t("typeChild") : t("typeInfant");

  const stepsLabels = [t("stepSearch"), t("stepSelect"), t("stepPassengers"), t("stepPayment")];

  return (
    <section id="flight-booking" className="relative py-16 md:py-20 overflow-hidden bg-gradient-to-br from-[#12394F] via-[#1F67B1] to-[#12394F]">
      {/* Decorative blurred orbs */}
      <div className="pointer-events-none absolute inset-0 -z-0">
        <div className="absolute -top-24 -left-24 w-[480px] h-[480px] rounded-full blur-3xl opacity-20 bg-[#FF9300]" />
        <div className="absolute -bottom-24 -right-24 w-[520px] h-[520px] rounded-full blur-3xl opacity-15 bg-[#FF9300]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl opacity-10 bg-white" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Section Header — Outside step condition, ALWAYS visible */}
        <motion.div
          className="text-center mb-8 md:mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-[2px] w-8 md:w-10 bg-gradient-to-r from-transparent to-[#FF9300]" />
            <span className="text-[#FF9300] font-semibold tracking-[0.25em] text-xs md:text-sm uppercase">
              {t("eyebrow")}
            </span>
            <div className="h-[2px] w-8 md:w-10 bg-gradient-to-l from-transparent to-[#FF9300]" />
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight">
            {t("title")} <span className="text-[#FF9300]">{t("titleHighlight")}</span>
          </h2>

          <p className="text-white/65 text-sm md:text-base mt-2 max-w-xl mx-auto">
            {currentStep === 1 && t("subtitleStep1")}
            {currentStep === 2 && t("subtitleStep2")}
            {currentStep === 3 && t("subtitleStep3")}
            {currentStep === 4 && t("subtitleStep4")}
            {currentStep === 5 && t("subtitleStep5")}
          </p>
        </motion.div>

        {/* Progress indicator — always visible */}
        <StepsBar current={currentStep} labels={stepsLabels} />

        <div className="flex justify-end mb-4">
          <div className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 p-1 text-xs">
            {(["ETB", "USD"] as const).map((code) => (
              <button key={code} type="button" onClick={() => setDisplayCurrency(code)} className={`rounded-full px-3 py-1 font-semibold ${displayCurrency === code ? "bg-[#FF9300] text-white" : "text-white/70"}`}>
                {code}
              </button>
            ))}
          </div>
        </div>
        {currencyFallback && <p className="mb-3 text-right text-[11px] text-white/60">Using fallback exchange rate</p>}

        <div id="flight-booking-flow">
          {/* ── STEP 1: SEARCH (only visible) ─────────────────────────── */}
          {currentStep === 1 && (
            <motion.form
              onSubmit={handleSearch}
              className="rounded-2xl md:rounded-3xl bg-white/8 backdrop-blur-xl border border-white/15 p-5 md:p-7 shadow-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              {/* Trip type toggle */}
              <div className="inline-flex flex-wrap gap-1 bg-white/10 rounded-full p-1 mb-5">
                {(["round", "oneway", "multi"] as const).map((tt) => (
                  <button
                    key={tt}
                    type="button"
                    onClick={() => setTripType(tt)}
                    data-testid={`trip-${tt}`}
                    className={`px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                      tripType === tt
                        ? "bg-[#FF9300] text-white shadow-md"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    {t(tt === "round" ? "roundTrip" : tt === "oneway" ? "oneWay" : "multiCity")}
                  </button>
                ))}
              </div>

              {/* From / To / Dates / Passengers */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                {/* From */}
                <div className="md:col-span-4 lg:col-span-4">
                  <label className="text-white/60 text-[10px] font-semibold tracking-widest uppercase mb-1 block">{t("from")}</label>
                  <CitySelect value={from} onChange={setFrom} placeholder={t("from")} testId="from-input" />
                </div>
                {/* Swap button */}
                <div className="md:col-span-1 flex items-end justify-center pb-1">
                  <button
                    type="button"
                    onClick={swap}
                    data-testid="swap-btn"
                    aria-label="Swap origin and destination"
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#FF9300] border border-white/20 flex items-center justify-center transition-colors group"
                  >
                    <ArrowRight className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
                  </button>
                </div>
                {/* To */}
                <div className="md:col-span-3 lg:col-span-3">
                  <label className="text-white/60 text-[10px] font-semibold tracking-widest uppercase mb-1 block">{t("to")}</label>
                  <CitySelect value={to} onChange={setTo} placeholder={t("to")} testId="to-input" />
                </div>
                {/* Departure */}
                <div className="md:col-span-4 lg:col-span-2">
                  <label className="text-white/60 text-[10px] font-semibold tracking-widest uppercase mb-1 block">{t("departure")}</label>
                  <input
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    data-testid="departure-date"
                    className="w-full px-4 py-3 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9300]/40 [color-scheme:dark]"
                  />
                </div>
                {/* Return (only for round trip) */}
                {tripType === "round" && (
                  <div className="md:col-span-4 lg:col-span-2">
                    <label className="text-white/60 text-[10px] font-semibold tracking-widest uppercase mb-1 block">{t("return")}</label>
                    <input
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      min={departureDate}
                      data-testid="return-date"
                      className="w-full px-4 py-3 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9300]/40 [color-scheme:dark]"
                    />
                  </div>
                )}
              </div>

              {/* Passengers + Options */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-3">
                <div className={`${tripType === "round" ? "md:col-span-4 lg:col-span-4" : "md:col-span-7 lg:col-span-6"}`}>
                  <label className="text-white/60 text-[10px] font-semibold tracking-widest uppercase mb-1 block">{t("passengers")}</label>
                  <PassengerCounter
                    adults={adults}
                    childrenCount={children}
                    infants={infants}
                    onChange={({ adults: a, childrenCount: c, infants: i }) => {
                      setAdults(a); setChildren(c); setInfants(i);
                    }}
                    labels={{
                      passengers: t("passengers"),
                      adults: t("adults"),
                      children: t("children"),
                      infants: t("infants"),
                    }}
                  />
                </div>
                <div className={`${tripType === "round" ? "md:col-span-8 lg:col-span-8" : "md:col-span-5 lg:col-span-6"} flex flex-wrap items-end gap-x-5 gap-y-2 pb-1`}>
                  <label className="inline-flex items-center gap-2 text-white/80 text-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={directOnly}
                      onChange={(e) => setDirectOnly(e.target.checked)}
                      data-testid="direct-only"
                      className="w-4 h-4 accent-[#FF9300]"
                    />
                    {t("directFlights")}
                  </label>
                  <label className="inline-flex items-center gap-2 text-white/80 text-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={flexibleDates}
                      onChange={(e) => setFlexibleDates(e.target.checked)}
                      data-testid="flexible-dates"
                      className="w-4 h-4 accent-[#FF9300]"
                    />
                    {t("flexibleDates")}
                  </label>
                </div>
              </div>

              {/* Error */}
              {error && (
                <p className="mt-3 text-sm text-[#FF9300] flex items-center gap-1.5">
                  <span className="font-bold">!</span>
                  <span>
                    {error === "from" && t("errFrom")}
                    {error === "to" && t("errTo")}
                    {error === "same" && t("errSame")}
                    {error === "date" && t("errDate")}
                    {error === "return" && t("errReturn")}
                  </span>
                </p>
              )}

              {/* No flights result */}
              {flowError === "noFlights" && (
                <p className="mt-3 text-sm text-white/80 bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                  {t("noResults")}
                </p>
              )}

              {/* Search button */}
              <button
                type="submit"
                disabled={loading}
                data-testid="search-flights-btn"
                className="mt-5 w-full bg-gradient-to-r from-[#FF9300] to-[#e07d00] hover:brightness-110 disabled:opacity-70 disabled:cursor-not-allowed text-white font-extrabold py-4 rounded-xl text-base sm:text-lg flex items-center justify-center gap-2.5 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-[#FF9300]/30"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {t("loading")}
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    {t("searchFlights")}
                  </>
                )}
              </button>

              {/* Popular routes */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                <span className="text-white/40 text-xs uppercase tracking-wider">{t("popular")}</span>
                {POPULAR_ROUTES.map((r) => (
                  <button
                    key={r.label}
                    type="button"
                    onClick={() => applyPopular(r)}
                    data-testid={`popular-${r.from}-${r.to}`}
                    className="text-white/65 hover:text-[#FF9300] text-sm font-semibold transition-colors"
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </motion.form>
          )}

          {/* ── STEP 2: RESULTS (only visible) ────────────────────────── */}
          <AnimatePresence>
            {currentStep === 2 && (
              <motion.div
                id="flight-booking-results"
                key="results"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease: EASE }}
                className="mt-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3 px-1">
                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    data-testid="back-to-search"
                    className="inline-flex items-center gap-1.5 text-white/60 hover:text-[#FF9300] text-xs font-semibold transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    {t("backToSearch")}
                  </button>
                  <h3 className="text-white/70 text-sm font-semibold uppercase tracking-wider">
                    {t("results")} · {from?.code} → {to?.code}
                  </h3>
                </div>
                <div className="space-y-3">
                  {filteredResults.map((r, i) => (
                    <motion.div
                      key={r.flight}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: i * 0.06, ease: EASE }}
                      className="bg-white rounded-xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:shadow-xl transition-shadow"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-full bg-[#1F67B1]/10 flex items-center justify-center text-[#1F67B1] font-bold flex-shrink-0">
                          <Plane className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[#12394F] truncate">{r.airline}</p>
                          <p className="text-xs text-gray-500">{r.flight} · <span className="text-gray-400">{t(r.stopsKey === "direct" ? "direct" : "stops")}: {r.stops}</span></p>
                        </div>
                      </div>
                      <div className="text-center sm:text-left">
                        <p className="font-semibold text-[#12394F]">{r.departure} <span className="text-gray-300 mx-1">→</span> {r.arrival}</p>
                        <p className="text-xs text-gray-500">{r.duration}</p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4 sm:min-w-[180px]">
                        <div className="text-right">
                          <p className="text-xs text-gray-400">from</p>
                           <p className="font-extrabold text-[#FF9300] text-lg leading-none">{displayPrice(r.price, r.usdPrice)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSelectFlight(r)}
                          data-testid={`select-flight-${i}`}
                          className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-[#FF9300] hover:bg-[#E88400] text-white text-sm font-bold transition-colors"
                        >
                          {t("select")}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                  {filteredResults.length === 0 && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center text-white/60 text-sm">
                      {t("noResults")}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── STEP 3: PASSENGERS + SEAT + EXTRAS (only visible) ─────── */}
          <AnimatePresence>
            {currentStep === 3 && selectedFlight && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: EASE }}
                className="mt-2 grid grid-cols-1 lg:grid-cols-3 gap-5 items-start"
              >
                {/* Main column */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Selected flight strip */}
                  <div className="bg-white rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#1F67B1]/10 flex items-center justify-center text-[#1F67B1] flex-shrink-0">
                        <Plane className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-[#12394F] text-sm truncate">{selectedFlight.airline} · {selectedFlight.flight}</p>
                        <p className="text-xs text-gray-500">
                          {from?.code} {selectedFlight.departure} → {to?.code} {selectedFlight.arrival} · {selectedFlight.duration}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => goToStep(2)}
                      data-testid="back-to-flights"
                      className="inline-flex items-center gap-1.5 text-[#1F67B1] hover:text-[#FF9300] text-xs font-semibold transition-colors"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      {t("changeFlight")}
                    </button>
                  </div>

                  {/* 3A. Passenger details */}
                  <div className="bg-white rounded-xl shadow-md p-5 md:p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="w-5 h-5 text-[#1F67B1]" />
                      <h3 className="font-bold text-lg text-[#12394F]">{t("passengerDetails")}</h3>
                    </div>

                    {passengerForms.map((p, i) => {
                      const PaxIcon = PAX_ICONS[passengerList[i]];
                      return (
                        <div key={i} className={`border-b border-gray-100 pb-5 mb-5 last:border-b-0 last:pb-0 last:mb-0 ${i > 0 ? "pt-5" : ""}`}>
                          <p className="font-semibold text-[#1F67B1] mb-3 flex items-center gap-2">
                            <PaxIcon className="w-4 h-4" />
                            {t("passengerTitle", { n: i + 1 })} <span className="text-xs font-medium text-gray-400">({paxTypeLabel(passengerList[i])})</span>
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Field label={t("firstName")}>
                              <input
                                type="text"
                                value={p.firstName}
                                onChange={(e) => updatePassenger(i, "firstName", e.target.value)}
                                data-testid={`firstName-${i}`}
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9300]/30 focus:border-[#FF9300]"
                              />
                            </Field>
                            <Field label={t("lastName")}>
                              <input
                                type="text"
                                value={p.lastName}
                                onChange={(e) => updatePassenger(i, "lastName", e.target.value)}
                                data-testid={`lastName-${i}`}
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9300]/30 focus:border-[#FF9300]"
                              />
                            </Field>
                            <Field label={t("passportNumber")}>
                              <input
                                type="text"
                                value={p.passportNumber}
                                onChange={(e) => updatePassenger(i, "passportNumber", e.target.value)}
                                data-testid={`passportNumber-${i}`}
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9300]/30 focus:border-[#FF9300]"
                              />
                            </Field>
                            <Field label={t("passportExpiry")}>
                              <input
                                type="date"
                                value={p.passportExpiry}
                                onChange={(e) => updatePassenger(i, "passportExpiry", e.target.value)}
                                data-testid={`passportExpiry-${i}`}
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9300]/30 focus:border-[#FF9300]"
                              />
                            </Field>
                            <Field label={t("dateOfBirth")}>
                              <input
                                type="date"
                                value={p.dob}
                                onChange={(e) => updatePassenger(i, "dob", e.target.value)}
                                data-testid={`dob-${i}`}
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9300]/30 focus:border-[#FF9300]"
                              />
                            </Field>
                            <Field label={t("nationality")}>
                              <select
                                value={p.nationality}
                                onChange={(e) => updatePassenger(i, "nationality", e.target.value)}
                                data-testid={`nationality-${i}`}
                                className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#FF9300]/30 focus:border-[#FF9300]"
                              >
                                <option value="">{t("selectNationality")}</option>
                                {COUNTRIES.map((c) => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                            </Field>
                            <Field label={t("gender")}>
                              <select
                                value={p.gender}
                                onChange={(e) => updatePassenger(i, "gender", e.target.value)}
                                data-testid={`gender-${i}`}
                                className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#FF9300]/30 focus:border-[#FF9300]"
                              >
                                <option value="">{t("selectGender")}</option>
                                <option value="m">Male</option>
                                <option value="f">Female</option>
                              </select>
                            </Field>
                          </div>
                        </div>
                      );
                    })}

                    {flowError === "passengers" && (
                      <p className="mt-3 text-sm text-red-500 font-medium flex items-center gap-1.5">
                        <span>!</span>{t("errPassengers")}
                      </p>
                    )}

                    {flowError === "contact" && (
                      <p className="mt-3 text-sm text-red-500 font-medium flex items-center gap-1.5">
                        <span>!</span>{t("errContact")}
                      </p>
                    )}

                    {/* Contact details (used for the Duffel e-ticket + payment receipt) */}
                    <div className="border-t border-gray-100 mt-5 pt-5">
                      <p className="font-semibold text-[#1F67B1] mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {t("contactDetails")}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Field label={t("contactEmail")}>
                          <input
                            type="email"
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            data-testid="contact-email"
                            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9300]/30 focus:border-[#FF9300]"
                          />
                        </Field>
                        <Field label={t("contactPhone")}>
                          <input
                            type="tel"
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                            data-testid="contact-phone"
                            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9300]/30 focus:border-[#FF9300]"
                          />
                        </Field>
                      </div>
                    </div>
                  </div>

                  {/* 3B. Seat selection */}
                  <div className="bg-white rounded-xl shadow-md p-5 md:p-6">
                    <div className="flex items-center gap-2 mb-1">
                      <Armchair className="w-5 h-5 text-[#1F67B1]" />
                      <h3 className="font-bold text-lg text-[#12394F]">{t("seatSelection")}</h3>
                    </div>
                    <p className="text-xs text-gray-400 mb-4">
                      {selectedSeats.length}/{totalPax} {t("seatPicked")} {selectedSeats.length > 0 && `· ${selectedSeats.join(", ")}`}
                    </p>
                    <SeatMap
                      selected={selectedSeats}
                      max={totalPax}
                      onToggle={toggleSeat}
                      occupied={occupiedSeats}
                      t={t}
                    />
                    {duffelSeats.length > 0 && (
                      <div className="mt-6 border-t border-gray-100 pt-5">
                        <p className="mb-3 text-sm font-semibold text-[#12394F]">Airline seat map</p>
                        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                          {duffelSeats.map((seat) => {
                            const selected = selectedDuffelSeats.some((item) => item.designator === seat.designator);
                            return <button key={seat.designator} type="button" disabled={!seat.available || (!selected && selectedDuffelSeats.length >= totalPax)} onClick={() => toggleDuffelSeat(seat)} title={seat.name} className={`rounded-md border px-2 py-2 text-xs font-semibold ${selected ? "border-[#FF9300] bg-[#FF9300] text-white" : seat.available ? "border-gray-200 bg-gray-50 text-[#12394F]" : "cursor-not-allowed border-gray-200 bg-gray-200 text-gray-400"}`}>{seat.designator}</button>;
                          })}
                        </div>
                        <p className="mt-2 text-xs text-gray-400">{selectedDuffelSeats.length}/{totalPax} airline seats selected{duffelSeatCost ? ` · ${duffelSeatCost} ${selectedFlight.duffelCurrency}` : ""}</p>
                      </div>
                    )}
                    <p className="text-[11px] text-gray-400 mt-3 text-center">
                      {t("seatPrice", { price: LEGROOM_SEAT_PRICE.toLocaleString() })}
                    </p>
                  </div>

                  {/* 3C. Extras */}
                  <div className="bg-white rounded-xl shadow-md p-5 md:p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Luggage className="w-5 h-5 text-[#1F67B1]" />
                      <h3 className="font-bold text-lg text-[#12394F]">{t("extras")}</h3>
                    </div>
                    <div className="space-y-3">
                      <ExtraRow
                        icon={Luggage}
                        title={t("extraBaggage")}
                        price={t("extraBaggagePrice")}
                        selected={baggage}
                        testId="extra-baggage"
                        onToggle={() => setBaggage((v) => !v)}
                      />
                      {serviceOptions.filter((service) => service.type !== "seat").map((service) => (
                        <ExtraRow key={service.id} icon={Luggage} title={service.name || service.type || "Airline service"} price={`${service.price} ${service.currency}`} selected={selectedServiceIds.includes(service.id)} testId={`duffel-service-${service.id}`} onToggle={() => setSelectedServiceIds((ids) => ids.includes(service.id) ? ids.filter((id) => id !== service.id) : [...ids, service.id])} />
                      ))}
                      <ExtraRow
                        icon={UtensilsCrossed}
                        title={t("specialMeal")}
                        price={t("specialMealPrice")}
                        selected={meal}
                        testId="extra-meal"
                        onToggle={() => setMeal((v) => !v)}
                      />
                      <ExtraRow
                        icon={Shield}
                        title={t("travelInsurance")}
                        price={t("travelInsurancePrice")}
                        selected={insurance}
                        testId="extra-insurance"
                        onToggle={() => setInsurance((v) => !v)}
                      />
                    </div>
                  </div>
                </div>

                {/* Sidebar: summary + continue */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-xl shadow-xl p-5 md:sticky md:top-4">
                    <h4 className="font-bold text-[#12394F] mb-3">{t("bookingSummary")}</h4>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">{t("flight")} ({totalPax} {t(totalPax === 1 ? "paxSingular" : "paxPlural")})</span>
                        <span className="font-semibold text-[#12394F]">{displayPrice(baseFare)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">{t("taxesFees")}</span>
                        <span className="font-semibold text-[#12394F]">{displayPrice(taxes)}</span>
                      </div>
                      <div className="flex justify-between text-[#FF9300]">
                        <span className="text-gray-500">{t("seatLabel")}</span>
                        <span className="font-semibold">{selectedSeats.length ? displayPrice(seatsCost) : "—"}</span>
                      </div>
                      <div className="flex justify-between text-[#FF9300]">
                        <span className="text-gray-500">{t("baggageLabel")}</span>
                        <span className="font-semibold">{baggage ? displayPrice(BAGGAGE_PRICE) : "—"}</span>
                      </div>
                      <div className="flex justify-between text-[#FF9300]">
                        <span className="text-gray-500">{t("insuranceLabel")}</span>
                        <span className="font-semibold">{insurance ? displayPrice(INSURANCE_PRICE) : "—"}</span>
                      </div>
                      <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-lg text-[#12394F]">
                        <span>{t("total")}</span>
                        <span>{displayPrice(grandTotal)}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={goToPayment}
                      data-testid="continue-payment"
                      className="mt-4 w-full bg-[#FF9300] hover:bg-[#E88400] text-white font-bold py-3 rounded-lg transition-colors"
                    >
                      {t("continuePayment")} →
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── STEP 4: PAYMENT (only visible) ────────────────────────── */}
          <AnimatePresence>
            {currentStep === 4 && selectedFlight && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: EASE }}
                className="mt-2 grid grid-cols-1 lg:grid-cols-3 gap-5 items-start"
              >
                {/* Main column: flight recap + payment methods */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Flight recap */}
                  <div className="bg-white rounded-xl p-4 shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#1F67B1]/10 flex items-center justify-center text-[#1F67B1] flex-shrink-0">
                        <Plane className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-[#12394F] text-sm truncate">{selectedFlight.airline} · {selectedFlight.flight}</p>
                        <p className="text-xs text-gray-500">
                          {from?.code} {selectedFlight.departure} → {to?.code} {selectedFlight.arrival} · {departureDate || "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Payment methods */}
                  <div className="bg-white rounded-xl shadow-md p-5 md:p-6">
                    <h4 className="font-bold text-[#12394F] mb-3">{t("paymentMethods")}</h4>
                    <div className="space-y-2">
                      <PaymentRow
                        icon={CreditCard}
                        label={t("methodCard")}
                        active={paymentMethod === "card"}
                        testId="pay-card"
                        onClick={() => setPaymentMethod("card")}
                      />
                      <PaymentRow
                        icon={Smartphone}
                        label={t("methodTelebirr")}
                        active={paymentMethod === "telebirr"}
                        testId="pay-telebirr"
                        onClick={() => setPaymentMethod("telebirr")}
                      />
                      <PaymentRow
                        icon={Landmark}
                        label={t("methodBank")}
                        active={paymentMethod === "bank"}
                        testId="pay-bank"
                        onClick={() => setPaymentMethod("bank")}
                      />
                    </div>
                  </div>
                </div>

                {/* Sidebar: summary + pay */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-xl shadow-xl p-5 md:sticky md:top-4">
                    <h4 className="font-bold text-[#12394F] mb-3">{t("bookingSummary")}</h4>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">{t("flight")} ({totalPax} {t(totalPax === 1 ? "paxSingular" : "paxPlural")})</span>
                        <span className="font-semibold text-[#12394F]">{displayPrice(baseFare)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">{t("taxesFees")}</span>
                        <span className="font-semibold text-[#12394F]">{displayPrice(taxes)}</span>
                      </div>
                      <div className="flex justify-between text-[#FF9300]">
                        <span className="text-gray-500">{t("seatLabel")}</span>
                        <span className="font-semibold">{selectedSeats.length ? displayPrice(seatsCost) : "—"}</span>
                      </div>
                      <div className="flex justify-between text-[#FF9300]">
                        <span className="text-gray-500">{t("baggageLabel")}</span>
                        <span className="font-semibold">{baggage ? displayPrice(BAGGAGE_PRICE) : "—"}</span>
                      </div>
                      <div className="flex justify-between text-[#FF9300]">
                        <span className="text-gray-500">{t("insuranceLabel")}</span>
                        <span className="font-semibold">{insurance ? displayPrice(INSURANCE_PRICE) : "—"}</span>
                      </div>
                      <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-lg text-[#12394F]">
                        <span>{t("total")}</span>
                        <span>{displayPrice(grandTotal)}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handlePay}
                      disabled={paying}
                      data-testid="pay-now"
                      className="mt-4 w-full bg-[#FF9300] hover:bg-[#E88400] disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {paying ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          {t("processing")}
                        </>
                      ) : (
                        t("payNow")
                      )}
                    </button>

                    {flowError && flowError !== "passengers" && flowError !== "contact" && currentStep === 4 && (
                      <p className="mt-3 text-sm text-red-500 font-medium text-center">{flowError}</p>
                    )}

                    <button
                      type="button"
                      onClick={() => goToStep(3)}
                      data-testid="back-to-details"
                      className="mt-3 w-full inline-flex items-center justify-center gap-1.5 text-[#1F67B1] hover:text-[#FF9300] text-xs font-semibold transition-colors"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      {t("backToDetails")}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── STEP 5: CONFIRMATION (only visible) ───────────────────── */}
          <AnimatePresence>
      {roleDenied && user && user.role !== "CUSTOMER" && <BookingAccessDialog role={user.role} onClose={() => setRoleDenied(false)} />}
      {currentStep === 5 && (
              <motion.div
                key="confirmed"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: EASE }}
                className="bg-white/8 backdrop-blur-xl border border-white/15 rounded-2xl p-8 md:p-12 text-center shadow-2xl"
              >
                <div className="w-20 h-20 rounded-full bg-green-100/90 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-white">{t("bookingConfirmed")}</h2>
                <p className="text-white/70 mt-2">{t("bookingReference", { ref: bookingRef })}</p>
                <p className="text-white/50 text-sm mt-1">{t("confirmationSent")}</p>

                <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-x-6 gap-y-2 bg-white/10 border border-white/15 rounded-xl px-6 py-3 text-sm text-white/80">
                  <span>{selectedFlight?.airline} · {selectedFlight?.flight}</span>
                  <span className="text-white/40">|</span>
                  <span>{from?.code} → {to?.code}</span>
                  <span className="text-white/40">|</span>
                  <span>{selectedSeats.length > 0 ? selectedSeats.join(", ") : "—"}</span>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleDownloadTicket}
                    data-testid="download-ticket"
                    className="inline-flex items-center gap-2 bg-[#1F67B1] hover:bg-[#1a5799] text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    {t("downloadTicket")}
                  </button>
                  <button
                    type="button"
                    onClick={handleFinish}
                    data-testid="finish-btn"
                    className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    {t("finish")}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

/* ── Small presentational helpers ─────────────────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-gray-500 mb-1 block">{label} *</label>
      {children}
    </div>
  );
}

function ExtraRow({
  icon: Icon,
  title,
  price,
  selected,
  testId,
  onToggle,
}: {
  icon: typeof Luggage;
  title: string;
  price: string;
  selected: boolean;
  testId: string;
  onToggle: () => void;
}) {
  return (
    <div className={`flex items-center justify-between border rounded-lg p-3 transition-colors ${selected ? "border-[#FF9300] bg-[#FF9300]/5" : "border-gray-200"}`}>
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${selected ? "text-[#FF9300]" : "text-[#1F67B1]"}`} />
        <div>
          <p className="font-semibold text-sm text-[#12394F]">{title}</p>
          <p className="text-xs text-gray-500">{price}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={selected}
        data-testid={testId}
        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
          selected
            ? "bg-[#FF9300] border-[#FF9300] text-white"
            : "border-[#1F67B1] text-[#1F67B1] hover:bg-[#1F67B1]/5"
        }`}
      >
        {selected ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
      </button>
    </div>
  );
}

function PaymentRow({
  icon: Icon,
  label,
  active,
  testId,
  onClick,
}: {
  icon: typeof CreditCard;
  label: string;
  active: boolean;
  testId: string;
  onClick: () => void;
}) {
  return (
    <label
      data-testid={testId}
      className={`flex items-center gap-3 border rounded-lg p-3 cursor-pointer transition-colors ${
        active ? "border-[#FF9300] bg-[#FF9300]/5" : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <input
        type="radio"
        name="payment"
        checked={active}
        onChange={onClick}
        className="accent-[#FF9300]"
      />
      <Icon className={`w-5 h-5 ${active ? "text-[#FF9300]" : "text-[#1F67B1]"}`} />
      <span className="text-sm font-semibold text-[#12394F]">{label}</span>
    </label>
  );
}
