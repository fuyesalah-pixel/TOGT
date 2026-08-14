"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { domesticFormSchema, type DomesticFormValues } from "@/lib/schemas/smart-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function DomesticFormTab() {
  const t = useTranslations("SmartForm");
  const tc = useTranslations("SmartForm.common");
  const { submit, isSubmitting, isSuccess, reset } = useMockSubmit();
  const { selectedPackage } = useSmartForm();

  const form = useForm<DomesticFormValues>({
    resolver: zodResolver(domesticFormSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      segment: "custom",
      destinations: "",
      dates: "",
      groupSize: 1,
    },
  });

  useEffect(() => {
    if (selectedPackage && selectedPackage.type === "domestic_prebuilt") {
      form.setValue("packageId", selectedPackage.id);
      form.setValue("destinations", selectedPackage.title);
    }
  }, [selectedPackage, form]);

  const isCustom = !selectedPackage;

  if (isSuccess) return <FormSuccess onReset={reset} />;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => submit("domestic", values))}
        className="grid gap-4 sm:grid-cols-2"
      >
        {selectedPackage && (
          <div className="sm:col-span-2 rounded-lg bg-togt-blue/5 p-3 text-sm text-togt-navy">
            <strong>{tc("selectedPackage")}:</strong> {selectedPackage.title} &mdash;{" "}
            {selectedPackage.currency} {selectedPackage.price.toLocaleString()}
          </div>
        )}

        <FormField control={form.control} name="segment" render={({ field }) => (
          <FormItem>
            <FormLabel>{t("domestic.segment")}</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="school">{t("domestic.segmentSchool")}</SelectItem>
                <SelectItem value="honeymoon">{t("domestic.segmentHoneymoon")}</SelectItem>
                <SelectItem value="friends">{t("domestic.segmentFriends")}</SelectItem>
                <SelectItem value="corporate">{t("domestic.segmentCorporate")}</SelectItem>
                <SelectItem value="custom">{t("domestic.segmentCustom")}</SelectItem>
              </SelectContent>
            </Select>
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

        {isCustom && (
          <FormField control={form.control} name="destinations" render={({ field }) => (
            <FormItem><FormLabel>{t("domestic.destinations")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        )}

        <FormField control={form.control} name="dates" render={({ field }) => (
          <FormItem><FormLabel>{t("domestic.dates")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="groupSize" render={({ field }) => (
          <FormItem><FormLabel>{t("domestic.groupSize")}</FormLabel><FormControl><Input type="number" min={1} {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.valueAsNumber)} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="transportPreference" render={({ field }) => (
          <FormItem><FormLabel>{t("domestic.transportPreference")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="hotelTier" render={({ field }) => (
          <FormItem><FormLabel>{t("domestic.hotelTier")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
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
