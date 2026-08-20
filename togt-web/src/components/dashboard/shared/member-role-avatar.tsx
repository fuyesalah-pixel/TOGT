import { UserRound, GraduationCap } from "lucide-react";

export function MemberRoleAvatar({ role, self = false }: { role: "MEMBER" | "GUIDE"; self?: boolean }) {
  const guide = role === "GUIDE";
  return (
    <span className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-500" title={guide ? "Guide" : "Member"}>
      {guide ? <span className="flex h-10 w-10 items-center justify-center rounded-full bg-togt-blue text-white"><GraduationCap className="h-5 w-5" /></span> : <UserRound className="h-5 w-5" />}
      {guide && <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-white bg-togt-orange" />}
      {self && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded bg-togt-orange px-1 text-[8px] font-bold text-white">YOU</span>}
    </span>
  );
}

export function MemberRoleLabel({ role, self = false }: { role: "MEMBER" | "GUIDE"; self?: boolean }) {
  return <span className={`text-[10px] font-bold uppercase tracking-wide ${role === "GUIDE" ? "text-togt-blue" : "text-gray-400"}`}>{self ? "You · " : ""}{role === "GUIDE" ? "Guide" : "Member"}</span>;
}
