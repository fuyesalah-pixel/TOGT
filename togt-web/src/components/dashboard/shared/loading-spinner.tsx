import { Plane } from "lucide-react";
import { cn } from "@/lib/utils";

export function LoadingSpinner({ className, label }: { className?: string; label?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 py-12", className)}>
      <div className="relative h-14 w-64 overflow-hidden rounded-full bg-sky-50">
        <div className="absolute left-0 right-0 top-8 border-t-2 border-dashed border-togt-blue/20" />
        <Plane className="absolute top-4 h-7 w-7 animate-[dashboard-flight_2.4s_ease-in-out_infinite] text-togt-orange" />
        <span className="absolute left-8 top-2 animate-pulse text-lg opacity-50">☁</span>
        <span className="absolute right-12 top-7 animate-pulse text-sm opacity-40">☁</span>
      </div>
      {label && <p className="text-sm text-gray-500">{label}</p>}
      <style jsx>{`@keyframes dashboard-flight { 0% { transform: translateX(-2rem) translateY(0) rotate(0deg); } 50% { transform: translateX(12rem) translateY(-0.4rem) rotate(-4deg); } 100% { transform: translateX(17rem) translateY(0) rotate(0deg); } }`}</style>
    </div>
  );
}
