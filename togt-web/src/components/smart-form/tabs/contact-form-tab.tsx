"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactFormSchema, type ContactFormValues } from "@/lib/schemas/smart-form";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CONTACT } from "@/lib/contact";

export function ContactFormTab() {
  const t = useTranslations("SmartForm");
  const tc = useTranslations("SmartForm.common");
  const { submit, isSubmitting, isSuccess, reset } = useMockSubmit();
  const { selectedPackage } = useSmartForm();

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { fullName: "", phone: "", email: "", packageId: "", subject: "", message: "" },
  });
  useProfilePrefill(form);
  useEffect(() => { if (selectedPackage?.id) form.setValue("packageId", selectedPackage.id); }, [selectedPackage, form]);

  if (isSuccess) return <FormSuccess onReset={reset} />;

  return (
    <Form {...form}>
      <div className="mb-5 rounded-xl border border-togt-blue/15 bg-togt-blue/5 p-4 text-sm text-togt-navy"><p className="font-bold">TOGT Customer Support</p><p className="mt-1">{CONTACT.address}</p><p className="mt-1">{CONTACT.phones.map((phone) => <a key={phone.href} href={phone.href} className="mr-3 text-togt-blue hover:underline">{phone.display}</a>)}<a href={`mailto:${CONTACT.email}`} className="text-togt-blue hover:underline">{CONTACT.email}</a></p><a href={CONTACT.map} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block font-semibold text-togt-orange hover:underline">View on Google Maps</a></div>
      <form
        onSubmit={form.handleSubmit((values) => submit("consulting", values))}
        className="grid gap-4 sm:grid-cols-2"
      >
        <FormField control={form.control} name="fullName" render={({ field }) => (
          <FormItem><FormLabel>{tc("fullName")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="phone" render={({ field }) => (
          <FormItem><FormLabel>{tc("phone")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem className="sm:col-span-2"><FormLabel>{tc("email")}</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="subject" render={({ field }) => (
          <FormItem className="sm:col-span-2"><FormLabel>{t("contact.subject")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="message" render={({ field }) => (
          <FormItem className="sm:col-span-2"><FormLabel>{t("contact.message")}</FormLabel><FormControl><Textarea rows={5} {...field} /></FormControl><FormMessage /></FormItem>
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
