"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { visaFormSchema, type VisaFormValues } from "@/lib/schemas/smart-form";
import { useMockSubmit } from "../use-mock-submit";
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

export function VisaFormTab() {
  const t = useTranslations("SmartForm");
  const tc = useTranslations("SmartForm.common");
  const { submit, isSubmitting, isSuccess, reset } = useMockSubmit();

  const form = useForm<VisaFormValues>({
    resolver: zodResolver(visaFormSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      visaType: "visit",
      destinationCountry: "",
      purposeDetails: "",
      passportNumber: "",
      passportExpiry: "",
    },
  });

  const visaType = form.watch("visaType");

  if (isSuccess) return <FormSuccess onReset={reset} />;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => submit("visa", values))}
        className="grid gap-4 sm:grid-cols-2"
      >
        <FormField control={form.control} name="visaType" render={({ field }) => (
          <FormItem>
            <FormLabel>{t("visa.visaType")}</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="visit">{t("visa.visaVisit")}</SelectItem>
                <SelectItem value="medical">{t("visa.visaMedical")}</SelectItem>
                <SelectItem value="family">{t("visa.visaFamily")}</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="destinationCountry" render={({ field }) => (
          <FormItem><FormLabel>{t("visa.destinationCountry")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
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
        <FormField control={form.control} name="passportNumber" render={({ field }) => (
          <FormItem><FormLabel>{tc("passportNumber")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="passportExpiry" render={({ field }) => (
          <FormItem><FormLabel>{tc("passportExpiry")}</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
        )} />

        {visaType === "family" && (
          <FormField control={form.control} name="sponsorRelationship" render={({ field }) => (
            <FormItem><FormLabel>{t("visa.sponsorRelationship")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        )}
        {visaType === "medical" && (
          <FormField control={form.control} name="hospitalName" render={({ field }) => (
            <FormItem><FormLabel>{t("visa.hospitalName")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        )}

        <FormField control={form.control} name="purposeDetails" render={({ field }) => (
          <FormItem className="sm:col-span-2"><FormLabel>{t("visa.purposeDetails")}</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
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
