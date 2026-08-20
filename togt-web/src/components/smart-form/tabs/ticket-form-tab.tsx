"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ticketFormSchema, AIRLINES, type TicketFormValues } from "@/lib/schemas/smart-form";
import { useMockSubmit } from "../use-mock-submit";
import { FormSuccess } from "../form-success";
import { useProfilePrefill } from "../use-profile-prefill";
import { useSmartForm } from "../smart-form-context";
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

export function TicketFormTab() {
  const tc = useTranslations("SmartForm.common");
  const tt = useTranslations("SmartForm.ticket");
  const { submit, isSubmitting, isSuccess, reset } = useMockSubmit();
  const { selectedPackage } = useSmartForm();

  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      fullName: "",
      packageId: "",
      billingAddress: "",
      phone: "",
      email: "",
      passportNumber: "",
      passportIssuedDate: "",
      passportExpiry: "",
      dob: "",
      nationality: "",
      origin: "",
      destination: "",
      departureDate: "",
      returnDate: "",
      cabinClass: "economy",
      passengerCount: 1,
      children: 0,
      infants: 0,
      airlinePreference: "Ethiopian Airlines",
      specialRequirements: "",
    },
  });
  useProfilePrefill(form);
  useEffect(() => { if (selectedPackage?.id) form.setValue("packageId", selectedPackage.id); }, [selectedPackage, form]);

  if (isSuccess) return <FormSuccess onReset={reset} />;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => submit("ticket", values))}
        className="grid gap-4 sm:grid-cols-2"
      >
        <FormField control={form.control} name="fullName" render={({ field }) => (
          <FormItem><FormLabel>{tc("fullName")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="phone" render={({ field }) => (
          <FormItem><FormLabel>{tc("phone")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem><FormLabel>{tc("email")}</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="billingAddress" render={({ field }) => (
          <FormItem className="sm:col-span-2"><FormLabel>Billing address</FormLabel><FormControl><Input placeholder="Bole, Addis Ababa" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="dob" render={({ field }) => (
          <FormItem><FormLabel>{tt("dob")}</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="nationality" render={({ field }) => (
          <FormItem><FormLabel>{tt("nationality")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
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
        <FormField control={form.control} name="origin" render={({ field }) => (
          <FormItem><FormLabel>{tt("origin")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="destination" render={({ field }) => (
          <FormItem><FormLabel>{tt("destination")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="departureDate" render={({ field }) => (
          <FormItem><FormLabel>{tt("departureDate")}</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="returnDate" render={({ field }) => (
          <FormItem><FormLabel>{tt("returnDate")}</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="passengerCount" render={({ field }) => (
          <FormItem><FormLabel>{tt("passengerCount")}</FormLabel><FormControl><Input type="number" min={1} {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.valueAsNumber)} /></FormControl><FormMessage /></FormItem>
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
                <SelectItem value="economy">{tt("cabinEconomy")}</SelectItem>
                <SelectItem value="premium_economy">{tt("cabinPremiumEconomy")}</SelectItem>
                <SelectItem value="business">{tt("cabinBusiness")}</SelectItem>
                <SelectItem value="first">{tt("cabinFirst")}</SelectItem>
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
                <Input
                  list="airlines-list"
                  placeholder={tt("airlineHint")}
                  {...field}
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
        <FormField control={form.control} name="specialRequirements" render={({ field }) => (
          <FormItem className="sm:col-span-2"><FormLabel>{tt("specialRequirements")}</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
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
