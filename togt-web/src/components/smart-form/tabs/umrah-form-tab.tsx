"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { umrahFormSchema, type UmrahFormValues } from "@/lib/schemas/smart-form";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function UmrahFormTab() {
  const t = useTranslations("SmartForm");
  const tc = useTranslations("SmartForm.common");
  const { submit, isSubmitting, isSuccess, reset } = useMockSubmit();
  const { selectedPackage } = useSmartForm();

  const form = useForm<UmrahFormValues>({
    resolver: zodResolver(umrahFormSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      packageType: "umrah_custom",
      groupSize: 1,
      includeImam: true,
      preferredDates: "",
      numberOfTravelers: 1,
      passportNumber: "",
      passportExpiry: "",
      isGift: false,
    },
  });

  useEffect(() => {
    if (selectedPackage && selectedPackage.type.startsWith("umrah_")) {
      form.setValue("packageId", selectedPackage.id);
      form.setValue("packageType", selectedPackage.type as UmrahFormValues["packageType"]);
    }
  }, [selectedPackage, form]);

  const isGift = form.watch("isGift");
  const giftType = form.watch("giftType");
  const isCustom = !selectedPackage;

  if (isSuccess) return <FormSuccess onReset={reset} />;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => submit("umrah", values))}
        className="grid gap-4 sm:grid-cols-2"
      >
        {selectedPackage && (
          <div className="sm:col-span-2 rounded-lg bg-togt-blue/5 p-3 text-sm text-togt-navy">
            <strong>{tc("selectedPackage")}:</strong> {selectedPackage.title} &mdash;{" "}
            {selectedPackage.currency} {selectedPackage.price.toLocaleString()}
          </div>
        )}

        {isCustom && (
          <FormField control={form.control} name="packageType" render={({ field }) => (
            <FormItem>
              <FormLabel>{t("umrah.packageType")}</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="umrah_economy">Economy</SelectItem>
                  <SelectItem value="umrah_vip">VIP</SelectItem>
                  <SelectItem value="umrah_honeymoon">Honeymoon</SelectItem>
                  <SelectItem value="umrah_custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
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
        <FormField control={form.control} name="passportNumber" render={({ field }) => (
          <FormItem><FormLabel>{tc("passportNumber")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="passportExpiry" render={({ field }) => (
          <FormItem><FormLabel>{tc("passportExpiry")}</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="preferredDates" render={({ field }) => (
          <FormItem><FormLabel>{t("umrah.preferredDates")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="numberOfTravelers" render={({ field }) => (
          <FormItem><FormLabel>{t("umrah.numberOfTravelers")}</FormLabel><FormControl><Input type="number" min={1} {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.valueAsNumber)} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="mahramRelationship" render={({ field }) => (
          <FormItem><FormLabel>{t("umrah.mahramRelationship")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />

        {isCustom && (
          <>
            <FormField control={form.control} name="hotelTier" render={({ field }) => (
              <FormItem><FormLabel>{t("umrah.hotelTier")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="transportType" render={({ field }) => (
              <FormItem><FormLabel>{t("umrah.transportType")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="groupSize" render={({ field }) => (
              <FormItem><FormLabel>{t("umrah.groupSize")}</FormLabel><FormControl><Input type="number" min={1} {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.valueAsNumber)} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="includeImam" render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 space-y-0 pt-6">
                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                <FormLabel className="!mt-0">{t("umrah.includeImam")}</FormLabel>
              </FormItem>
            )} />
          </>
        )}

        <FormField control={form.control} name="isGift" render={({ field }) => (
          <FormItem className="sm:col-span-2 flex flex-row items-center gap-2 space-y-0 rounded-lg border border-togt-orange/30 bg-togt-orange/5 p-3">
            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
            <FormLabel className="!mt-0">{t("umrah.isGift")}</FormLabel>
          </FormItem>
        )} />

        {isGift && (
          <>
            <FormField control={form.control} name="giftType" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("umrah.giftType")}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="full">{t("umrah.giftFull")}</SelectItem>
                    <SelectItem value="half">{t("umrah.giftHalf")}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="recipientName" render={({ field }) => (
              <FormItem><FormLabel>{t("umrah.recipientName")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="recipientPhone" render={({ field }) => (
              <FormItem><FormLabel>{t("umrah.recipientPhone")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="recipientEmail" render={({ field }) => (
              <FormItem><FormLabel>{t("umrah.recipientEmail")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            {giftType === "half" && (
              <p className="sm:col-span-2 text-sm text-togt-orange">{t("umrah.giftHalfNote")}</p>
            )}
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
