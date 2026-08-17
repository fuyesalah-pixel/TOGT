"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { foreignTravelFormSchema, AIRLINES, COUNTRIES, type ForeignTravelFormValues } from "@/lib/schemas/smart-form";
import { useMockSubmit } from "../use-mock-submit";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ForeignTravelFormTab() {
  const tc = useTranslations("SmartForm.common");
  const tt = useTranslations("SmartForm.foreignTravel");
  const tkt = useTranslations("SmartForm.ticket");
  const { submit, isSubmitting, isSuccess, reset } = useMockSubmit();
  const { selectedPackage } = useSmartForm();

  const form = useForm<ForeignTravelFormValues>({
    resolver: zodResolver(foreignTravelFormSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      destinationCountry: "",
      departureDate: "",
      returnDate: "",
      adults: 1,
      children: 0,
      infants: 0,
      cabinClass: "economy",
      airlinePreference: "Ethiopian Airlines",
      passportNumber: "",
      passportIssuedDate: "",
      passportExpiry: "",
      additionalRequirements: "",
    },
  });

  /* Pre-fill destination when a foreign package is selected (e.g. from the
     "Travel Abroad" section's "Book Now" button). */
  useEffect(() => {
    if (selectedPackage && selectedPackage.type === "foreign_prebuilt" && selectedPackage.destination) {
      form.setValue("destinationCountry", selectedPackage.destination, { shouldValidate: true });
    }
  }, [selectedPackage, form]);

  if (isSuccess) return <FormSuccess onReset={reset} />;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => submit("foreignTravel", values))}
        className="grid gap-4 sm:grid-cols-2"
      >
        <FormField control={form.control} name="destinationCountry" render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>{tt("destinationCountry")}</FormLabel>
            <FormControl>
              <div>
                <Input list="countries-list" placeholder="United Arab Emirates" {...field} />
                <datalist id="countries-list">
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="fullName" render={({ field }) => (
          <FormItem><FormLabel>{tc("fullName")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="phone" render={({ field }) => (
          <FormItem><FormLabel>{tc("phone")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem><FormLabel>{tc("email")}</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="departureDate" render={({ field }) => (
          <FormItem><FormLabel>{tt("departureDate")}</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="returnDate" render={({ field }) => (
          <FormItem><FormLabel>{tt("returnDate")}</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
        )} />

        <FormField control={form.control} name="adults" render={({ field }) => (
          <FormItem>
            <FormLabel>{tt("adults")}</FormLabel>
            <Select value={String(field.value ?? 1)} onValueChange={(v) => field.onChange(Number(v))}>
              <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                {[1,2,3,4,5,6].map((n) => (
                  <SelectItem key={n} value={String(n)}>{String(n)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="children" render={({ field }) => (
          <FormItem>
            <FormLabel>{tt("children")}</FormLabel>
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
        <FormField control={form.control} name="infants" render={({ field }) => (
          <FormItem>
            <FormLabel>{tt("infants")}</FormLabel>
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

        <FormField control={form.control} name="cabinClass" render={({ field }) => (
          <FormItem>
            <FormLabel>{tt("cabinClass")}</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
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
        <FormField control={form.control} name="airlinePreference" render={({ field }) => (
          <FormItem>
            <FormLabel>{tt("airlinePreference")}</FormLabel>
            <FormControl>
              <div>
                <Input list="airlines-list" placeholder={tkt("airlineHint")} {...field} />
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

        <FormField control={form.control} name="passportNumber" render={({ field }) => (
          <FormItem><FormLabel>{tc("passportNumber")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="passportIssuedDate" render={({ field }) => (
          <FormItem><FormLabel>{tc("passportIssuedDate")}</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="passportExpiry" render={({ field }) => (
          <FormItem><FormLabel>{tc("passportExpiry")}</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
        )} />

        <FormField control={form.control} name="additionalRequirements" render={({ field }) => (
          <FormItem className="sm:col-span-2"><FormLabel>{tt("additionalRequirements")}</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
        )} />

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
