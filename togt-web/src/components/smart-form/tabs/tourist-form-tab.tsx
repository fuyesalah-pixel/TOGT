"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { touristFormSchema, type TouristFormValues } from "@/lib/schemas/smart-form";
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
import { Button } from "@/components/ui/button";

export function TouristFormTab() {
  const t = useTranslations("SmartForm");
  const tc = useTranslations("SmartForm.common");
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
    },
  });

  useEffect(() => {
    if (selectedPackage && selectedPackage.type === "tourist_prebuilt") {
      form.setValue("packageId", selectedPackage.id);
      form.setValue("route", selectedPackage.title);
    }
  }, [selectedPackage, form]);

  const isCustom = !selectedPackage;

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
          <FormItem><FormLabel>{t("tourist.nationality")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />

        {isCustom && (
          <FormField control={form.control} name="route" render={({ field }) => (
            <FormItem><FormLabel>{t("tourist.route")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        )}

        <FormField control={form.control} name="arrivalDate" render={({ field }) => (
          <FormItem><FormLabel>{t("tourist.arrivalDate")}</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="departureDate" render={({ field }) => (
          <FormItem><FormLabel>{t("tourist.departureDate")}</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="preferredLanguage" render={({ field }) => (
          <FormItem><FormLabel>{t("tourist.preferredLanguage")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="numberOfTravelers" render={({ field }) => (
          <FormItem><FormLabel>{t("tourist.numberOfTravelers")}</FormLabel><FormControl><Input type="number" min={1} {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.valueAsNumber)} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="interests" render={({ field }) => (
          <FormItem className="sm:col-span-2"><FormLabel>{t("tourist.interests")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
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
