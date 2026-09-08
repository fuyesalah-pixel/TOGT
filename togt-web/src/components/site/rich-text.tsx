"use client";

import { Fragment, type ReactNode } from "react";
import { Check } from "lucide-react";

type RichTextProps = { text: string; className?: string };

function inline(line: string) {
  return line.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) return <strong key={index} className="font-bold text-togt-blue">{part.slice(2, -2)}</strong>;
    return <Fragment key={index}>{part}</Fragment>;
  });
}

export function RichText({ text, className = "" }: RichTextProps) {
  const blocks: ReactNode[] = [];
  let para: string[] = [];
  let list: { kind: "ul" | "ol"; items: string[] } | null = null;

  const flush = (key: number) => {
    if (para.length) {
      blocks.push(<p key={key} className="mt-2 text-sm leading-relaxed">{para.map((line, index) => <Fragment key={index}>{index > 0 && <br />}{inline(line)}</Fragment>)}</p>);
      key += 1;
      para = [];
    }
    if (list) {
      if (list.kind === "ul") blocks.push(<ul key={key} className="mt-2 space-y-1.5 pl-1">{list.items.map((item, index) => <li key={index} className="flex items-start gap-2 text-sm leading-relaxed"><Check className="mt-0.5 h-4 w-4 shrink-0 text-togt-orange" /><span>{inline(item)}</span></li>)}</ul>);
      else blocks.push(<ol key={key} className="mt-2 list-decimal space-y-1.5 pl-5">{list.items.map((item, index) => <li key={index} className="text-sm leading-relaxed">{inline(item)}</li>)}</ol>);
      key += 1;
      list = null;
    }
    return key;
  };

  let key = 0;
  for (const raw of text.split("\n")) {
    const trimmed = raw.trim();
    if (!trimmed) { key = flush(key); continue; }
    if (/^#{1,3}\s+/.test(trimmed)) {
      key = flush(key);
      blocks.push(<h4 key={key} className="mt-2 font-bold text-togt-navy">{inline(trimmed.replace(/^#{1,3}\s+/, ""))}</h4>);
      key += 1;
      continue;
    }
    const bullet = trimmed.match(/^[-*•]\s+(.*)/);
    if (bullet) {
      key = flush(key);
      if (!list) list = { kind: "ul", items: [] };
      list.items.push(bullet[1]);
      continue;
    }
    const numbered = trimmed.match(/^\d+[.)]\s+(.*)/);
    if (numbered) {
      key = flush(key);
      if (!list) list = { kind: "ol", items: [] };
      list.items.push(numbered[1]);
      continue;
    }
    para.push(trimmed);
  }
  flush(key);
  return <div className={className}>{blocks}</div>;
}