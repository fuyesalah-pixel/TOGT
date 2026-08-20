"use client";

import { useGroupPlan } from "@/hooks/useGroups";

export function GroupProgress({ groupId }: { groupId: string }) {
  const { data: steps } = useGroupPlan(groupId);
  const total = steps?.length ?? 0;
  const completed = steps?.filter((step) => step.status === "COMPLETED" || step.status === "DONE").length ?? 0;
  const percentage = total ? Math.round((completed / total) * 100) : 0;
  return <div className="mt-3"><div className="mb-1 flex justify-between text-xs"><span className="text-gray-500">Progress</span><span className="font-semibold text-togt-blue">{percentage}% ({completed}/{total} orders)</span></div><div className="h-2 overflow-hidden rounded-full bg-gray-200"><div className={`h-full rounded-full transition-all duration-500 ${percentage === 100 ? "bg-emerald-500" : percentage > 50 ? "bg-togt-blue" : percentage > 0 ? "bg-togt-orange" : "bg-gray-300"}`} style={{ width: `${percentage}%` }} /></div></div>;
}
