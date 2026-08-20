"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { touristFormSchema, AIRLINES, type TouristFormValues } from "@/lib/schemas/smart-form";
import { useMockSubmit } from "../use-mock-submit";
import { useProfilePrefill } from "../use-profile-prefill";
import { useSmartForm } from "../smart-form-context";
import { FormSuccess } from "../form-success";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function TouristFormTab() {
  const tc = useTranslations("SmartForm.common");
  const tt = useTranslations("SmartForm.tourist");
  const tkt = useTranslations("SmartForm.ticket");
  const { submit, isSubmitting, isSuccess, reset } = useMockSubmit();
  const { selectedPackage } = useSmartForm();

  const form = useForm<TouristFormValues>({
    resolver: zodResolver(touristFormSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      route: "",
      arrivalDate: "",
      departureDate: "",
      preferredLanguage: "",
      interests: "",
      numberOfTravelers: 1,
      nationality: "",
      needTicket: false,
    },
  });
  useProfilePrefill(form);

  useEffect(() => {
    if (selectedPackage && selectedPackage.type === "tourist_prebuilt") {
      form.setValue("packageId", selectedPackage.id);
      form.setValue("route", selectedPackage.title);
    }
  }, [selectedPackage, form]);

  const isCustom = !selectedPackage;
  const needTicket = form.watch("needTicket");

  if (isSuccess) return <FormSuccess onReset={reset} />;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => submit("tourist", values))}
        className="grid gap-4 sm:grid-cols-2"
      >
        {selectedPackage && (
          <div className="sm:col-span-2 rounded-lg bg-togt-blue/5 p-3 text-sm text-togt-navy">
            <strong>{tc("selectedPackage")}:</strong> {selectedPackage.title} &mdash;{" "}
            {selectedPackage.currency} {selectedPackage.price.toLocaleString()}
          </div>
        )}

        <FormField control={form.control} name="fullName" render={({ field }) => (
          <FormItem><FormLabel>{tc("fullName")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="phone" render={({ field }) => (
          <FormItem><FormLabel>{tc("phone")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem><FormLabel>{tc("email")}</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="nationality" render={({ field }) => (
          <FormItem><FormLabel>{tt("nationality")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />

        {isCustom && (
          <FormField control={form.control} name="route" render={({ field }) => (
            <FormItem><FormLabel>{tt("route")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        )}

        <FormField control={form.control} name="arrivalDate" render={({ field }) => (
          <FormItem><FormLabel>{tt("arrivalDate")}</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="departureDate" render={({ field }) => (
          <FormItem><FormLabel>{tt("departureDate")}</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="preferredLanguage" render={({ field }) => (
          <FormItem><FormLabel>{tt("preferredLanguage")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="numberOfTravelers" render={({ field }) => (
          <FormItem><FormLabel>{tt("numberOfTravelers")}</FormLabel><FormControl><Input type="number" min={1} {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.valueAsNumber)} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="interests" render={({ field }) => (
          <FormItem className="sm:col-span-2"><FormLabel>{tt("interests")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />

        {/* Need ticket? */}
        <FormField control={form.control} name="needTicket" render={({ field }) => (
          <FormItem className="sm:col-span-2 flex flex-row items-center gap-3 space-y-0 rounded-lg border border-togt-orange/30 bg-togt-orange/5 p-3">
            <FormControl>
              <input
                type="checkbox"
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
                className="h-5 w-5 accent-[#FF9300] cursor-pointer"
              />
            </FormControl>
            <FormLabel className="text-sm font-semibold text-togt-navy cursor-pointer !mt-0">
              {tt("needTicket")}
            </FormLabel>
          </FormItem>
        )} />

        {needTicket && (
          <>
            <div className="sm:col-span-2 mt-1 text-sm font-semibold text-[#FF9300] border-l-4 border-[#FF9300] pl-3">
              {tt("flightDetails")}
            </div>
            <FormField control={form.control} name="ticketAirline" render={({ field }) => (
              <FormItem>
                <FormLabel>{tt("flightAirline")}</FormLabel>
                <FormControl>
                  <div>
                    <Input
                      list="airlines-list"
                      placeholder={tkt("airlineHint")}
                      {...field}
                      value={field.value ?? ""}
                    />
                    <datalist id="airlines-list">
                      {AIRLINES.map((a) => (
                        <option key={a} value={a} />
                      ))}
                    </datalist>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="ticketCabinClass" render={({ field }) => (
              <FormItem>
                <FormLabel>{tt("flightCabin")}</FormLabel>
                <Select value={field.value ?? "economy"} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="economy">{tkt("cabinEconomy")}</SelectItem>
                    <SelectItem value="premium_economy">{tkt("cabinPremiumEconomy")}</SelectItem>
                    <SelectItem value="business">{tkt("cabinBusiness")}</SelectItem>
                    <SelectItem value="first">{tkt("cabinFirst")}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="ticketDepartureDate" render={({ field }) => (
              <FormItem><FormLabel>{tt("flightDeparture")}</FormLabel><FormControl><Input type="date" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="ticketReturnDate" render={({ field }) => (
              <FormItem><FormLabel>{tt("flightReturn")}</FormLabel><FormControl><Input type="date" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="ticketPassportIssuedDate" render={({ field }) => (
              <FormItem><FormLabel>{tt("flightPassportIssued")}</FormLabel><FormControl><Input type="date" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="ticketChildren" render={({ field }) => (
              <FormItem>
                <FormLabel>{tkt("children")}</FormLabel>
                <Select value={String(field.value ?? 0)} onValueChange={(v) => field.onChange(Number(v))}>
                  <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {[0,1,2,3,4,5].map((n) => (
                      <SelectItem key={n} value={String(n)}>{n === 5 ? "5+" : String(n)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="ticketInfants" render={({ field }) => (
              <FormItem>
                <FormLabel>{tkt("infants")}</FormLabel>
                <Select value={String(field.value ?? 0)} onValueChange={(v) => field.onChange(Number(v))}>
                  <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {[0,1,2].map((n) => (
                      <SelectItem key={n} value={String(n)}>{String(n)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
          </>
        )}

        <Button type="submit" disabled={isSubmitting} className="sm:col-span-2 w-full py-3.5 rounded-full font-bold text-white text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100" style={{ background: 'linear-gradient(135deg, #FF9300 0%, #e07d00 100%)', boxShadow: '0 4px 20px rgba(255,147,0,0.32)' }}>
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {tc("submitting")}
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              {tc("submit")}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          )}
        </Button>
      </form>
    </Form>
  );
}
