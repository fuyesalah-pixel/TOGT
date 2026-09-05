"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import type { CallRecord } from "@/lib/api/types";

export const verificationUrl = (id: string) =>
  `https://travel.togttrading.com/verify?id=${encodeURIComponent(id)}`;

function resolveImageUrl(url: string) {
  if (/^https?:\/\//i.test(url)) return url;
  if (typeof window === "undefined") return url;
  return new URL(url, window.location.origin).toString();
}

export function CallRecordIdCard({ record }: { record: CallRecord }) {
  const [qrCode, setQrCode] = useState("");
  const [photoFailed, setPhotoFailed] = useState(false);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(verificationUrl(record.id), {
      width: 180,
      margin: 1,
      color: { dark: "#12394F", light: "#FFFFFF" },
    }).then((url) => {
      if (active) setQrCode(url);
    }).catch(() => {
      if (active) setQrCode("");
    });
    return () => { active = false; };
  }, [record.id]);

  return (
    <article
      id="id-card-master"
      data-record-id={record.id}
      className="id-card-master relative mx-auto flex flex-col overflow-hidden rounded-[26px] bg-white text-togt-navy shadow-2xl"
      style={{ width: 360, height: 560, minWidth: 360, minHeight: 560, maxWidth: 360, maxHeight: 560, border: "1px solid rgba(31,103,177,.16)", fontFamily: "Arial, Helvetica, sans-serif" }}
    >
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-togt-blue/10" />
      <div className="absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-togt-orange/10" />
      <div className="h-3 bg-gradient-to-r from-togt-navy via-togt-blue to-togt-orange" />
      <div className="relative flex flex-1 flex-col px-7 py-5 text-center">
        <div className="flex items-center justify-between">
        <img
          src="/images/logo/TOGT_Tour_Travel_Final_Logo_For_Print.jpg"
          alt="TOGT Tour & Travel"
          className="h-10 w-auto max-w-[190px] object-contain object-left"
        />
        <span className="text-2xl" aria-label="Ethiopian flag">🇪🇹</span>
        </div>
        <div className="mt-5 flex h-32 w-32 self-center items-center justify-center overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-[0_0_0_3px_#FF9300,0_8px_20px_rgba(18,57,79,.18)]">
          {record.idImageUrl && !photoFailed ? (
            <img data-export-photo="true" src={resolveImageUrl(record.idImageUrl)} alt={record.name} onError={() => setPhotoFailed(true)} className="h-full w-full object-cover" />
          ) : (
            <span className="text-4xl font-bold text-togt-blue">{record.name.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <h2 className="mt-5 max-w-full truncate text-2xl font-extrabold text-togt-navy">{record.name}</h2>
        <p className="mt-1 text-xs font-semibold uppercase tracking-[.18em] text-togt-blue">Team {record.teamNumber}</p>
        <div className="my-5 h-px w-full bg-gradient-to-r from-transparent via-togt-orange/60 to-transparent" />
        <div className="flex min-h-[148px] flex-col items-center justify-between">
          {qrCode ? <img src={qrCode} alt="Scan to verify this ID" className="h-[118px] w-[118px]" /> : <div className="h-[118px] w-[118px] rounded bg-slate-100" />}
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-[.2em] text-togt-blue">Scan to verify</p>
        </div>
        <div className="mt-auto w-full border-t border-slate-100 pt-4 text-center">
          <p className="text-sm font-bold text-togt-navy">TOGT Tour &amp; Travel</p>
          <p className="mt-1 text-xs text-slate-500">+251 99 797 9741 · +251 99 797 9740</p>
          <p className="text-xs text-slate-500">info@togttrading.com</p>
        </div>
      </div>
    </article>
  );
}
