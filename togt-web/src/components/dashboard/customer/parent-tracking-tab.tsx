"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Clock3,
  MapPin,
  Phone,
  Radar,
  RefreshCw,
  Search,
  ShieldCheck,
  UserSearch,
  X,
} from "lucide-react";
import {
  cancelTrackingRequest,
  respondTrackingRequest,
  searchTrackingMembers,
  searchTrackingPeople,
  sendTrackingRequest,
  type TrackableMember,
} from "@/lib/api/tracking";
import { GuideMap } from "../guide/guide-map";
import { PageHeader } from "../shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const LIVE_REFRESH_MS = 30_000;

const STATUS_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  SAFE: { color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", label: "With guide" },
  WARNING: { color: "text-amber-600", bg: "bg-amber-50 border-amber-200", label: "Drifting from guide" },
  DANGER: { color: "text-red-600", bg: "bg-red-50 border-red-200", label: "Separated from guide" },
  OFFLINE: { color: "text-gray-500", bg: "bg-gray-50 border-gray-200", label: "Signal offline" },
  UNKNOWN: { color: "text-gray-500", bg: "bg-gray-50 border-gray-200", label: "Awaiting first signal" },
};

const formatDistance = (meters: number | null | undefined) =>
  meters == null ? "—" : meters > 1000 ? `${(meters / 1000).toFixed(1)}km` : `${Math.round(meters)}m`;

const requestMeta = {
  NONE: { label: "Not linked", hint: "Send a request to start tracking", color: "text-gray-500 border-gray-200" },
  PENDING: { label: "Request in progress", hint: "Waiting for their answer", color: "text-amber-600 border-amber-200" },
  ACCEPTED: { label: "Linked", hint: "You can track their trips", color: "text-emerald-600 border-emerald-200" },
  DECLINED: { label: "Declined", hint: "They declined your request", color: "text-red-600 border-red-200" },
  CANCELLED: { label: "Cancelled", hint: "You cancelled this request", color: "text-gray-500 border-gray-200" },
} as const;

export function ParentTrackingTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [focusedId, setFocusedId] = useState<string>();
  const [notice, setNotice] = useState<{ kind: "error" | "info"; text: string } | null>(null);

  const people = useQuery({
    queryKey: ["tracking-people", query],
    queryFn: () => searchTrackingPeople(query),
    retry: false,
    refetchInterval: LIVE_REFRESH_MS,
  });
  const live = useQuery({
    queryKey: ["tracking-live", query],
    queryFn: () => searchTrackingMembers(query),
    retry: false,
    refetchInterval: LIVE_REFRESH_MS,
  });

  const send = useMutation({
    mutationFn: sendTrackingRequest,
    onSuccess: (result) => {
      setNotice({ kind: "info", text: `Tracking request sent to ${result.targetName} — it shows as “in progress” until they answer.` });
      void queryClient.invalidateQueries({ queryKey: ["tracking-people"] });
      void queryClient.invalidateQueries({ queryKey: ["tracking-requests"] });
    },
    onError: (error: Error) => setNotice({ kind: "error", text: error.message }),
  });
  const respond = useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) => respondTrackingRequest(id, accept),
    onSuccess: (_data, variables) => {
      setNotice({ kind: "info", text: variables.accept ? "Request accepted — you can now be followed on trips." : "Request declined." });
      void queryClient.invalidateQueries({ queryKey: ["tracking-people"] });
      void queryClient.invalidateQueries({ queryKey: ["tracking-requests"] });
    },
    onError: (error: Error) => setNotice({ kind: "error", text: error.message }),
  });
  const cancel = useMutation({
    mutationFn: cancelTrackingRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tracking-people"] });
      void queryClient.invalidateQueries({ queryKey: ["tracking-requests"] });
    },
  });

  const incoming = people.data?.filter((person) => person.consent === "PENDING") ?? [];
  const members: TrackableMember[] = live.data ?? [];
  const focused = members.find((member) => member.memberId === focusedId) ?? members[0];

  const points =
    focused?.memberLocation
      ? [
          {
            id: "guide",
            name: focused.guideLocation?.name ?? "Guide",
            latitude: focused.guideLocation?.latitude ?? focused.memberLocation.latitude,
            longitude: focused.guideLocation?.longitude ?? focused.memberLocation.longitude,
            role: "GUIDE" as const,
          },
          {
            id: focused.memberId,
            name: focused.memberName,
            latitude: focused.memberLocation.latitude,
            longitude: focused.memberLocation.longitude,
            distanceMeters: focused.distance ?? undefined,
            role: "MEMBER" as const,
          },
        ]
      : [];

  return (
    <div>
      <PageHeader title="Parent Tracking" description="Ask to follow a loved one's live location during their trips — with their consent." />

      {notice && (
        <div className={`mb-4 rounded-lg border p-3 text-sm ${notice.kind === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-blue-200 bg-blue-50 text-blue-700"}`}>
          {notice.text}
        </div>
      )}

      {/* Incoming requests needing B's answer (accept / decline) */}
      {incoming.length > 0 && (
        <div className="mb-6 rounded-xl border border-togt-orange/30 bg-togt-orange/5 p-4">
          <h3 className="text-sm font-bold text-togt-navy">Tracking requests for you</h3>
          <p className="mt-1 text-xs text-gray-500">Decide who can follow your live location while you travel.</p>
          <div className="mt-3 space-y-2">
            {incoming.map((person) => (
              <div key={person.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-100 bg-white p-3">
                <div>
                  <p className="text-sm font-semibold text-togt-navy">{person.fullName}</p>
                  <p className="text-xs text-gray-500">{person.email}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700" disabled={respond.isPending} onClick={() => respond.mutate({ id: person.id, accept: true })}>
                    <Check className="mr-1 h-4 w-4" />Accept
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600" disabled={respond.isPending} onClick={() => respond.mutate({ id: person.id, accept: false })}>
                    <X className="mr-1 h-4 w-4" />Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live tracking */}
      <section className="mb-6">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-500">
          <Radar className="h-4 w-4 text-togt-orange" /> Live now
        </h3>
        {live.isLoading && members.length === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-500">Loading live tracking…</div>
        ) : members.length === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-500">
            Nobody is on an active trip yet. once a linked traveler joins a group that is marked IN_PROGRESS, their location appears here automatically.
          </div>
          ) : (
          <>
            {members.length > 1 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {members.map((member) => (
                  <button
                    key={member.memberId}
                    onClick={() => setFocusedId(member.memberId)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${focused?.memberId === member.memberId ? "bg-togt-orange text-white" : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"}`}
                  >
                    {member.memberName} · {STATUS_STYLES[member.status]?.label ?? member.status}
                  </button>
                ))}
              </div>
            )}
            {focused && (
              <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                {focused.memberLocation ? (
                  <GuideMap points={points} routeMode="one" focusMemberId={focused.memberId} />
                ) : (
                  <div className="flex h-80 items-center justify-center rounded-xl border border-gray-100 bg-white text-sm text-gray-500">
                    Waiting for the first location signal…
                  </div>
                )}
                <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className={`rounded-lg border p-3 ${STATUS_STYLES[focused.status]?.bg ?? "bg-gray-50 border-gray-200"}`}>
                    <p className={`text-sm font-bold ${STATUS_STYLES[focused.status]?.color ?? "text-gray-500"}`}>
                      {STATUS_STYLES[focused.status]?.label ?? focused.status}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {focused.groupName || "Active trip"} · {formatDistance(focused.distance)} from guide
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-togt-navy">{focused.memberName}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                        <Clock3 className="h-3 w-3" />
                        {focused.lastUpdated ? new Date(focused.lastUpdated).toLocaleTimeString() : "no signal yet"}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => live.refetch()} disabled={live.isFetching}>
                      <RefreshCw className={`mr-1 h-4 w-4 ${live.isFetching ? "animate-spin" : ""}`} />Refresh
                    </Button>
                  </div>
                  {focused.phone && (
                    <a className="mt-3 inline-flex h-8 items-center rounded-lg border px-3 text-sm" href={`tel:${focused.phone}`}>
                      <Phone className="mr-1 h-4 w-4" />Call
                    </a>
                  )}
                  {focused.status === "DANGER" && (
                    <div className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">
                      Your family member may be separated from the guide. The guide has been notified.
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Consent management */}
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-500">
          <ShieldCheck className="h-4 w-4 text-togt-orange" /> People you can track
        </h3>
        <form className="mb-3 flex max-w-xl gap-2" onSubmit={(event) => { event.preventDefault(); setQuery(search.trim()); }}>
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search customers by name or email" />
          <Button type="submit" variant="outline"><Search className="mr-1 h-4 w-4" />Search</Button>
        </form>
        {(people.data?.length ?? 0) === 0 && !people.isLoading ? (
          <div className="rounded-xl border border-gray-100 bg-white p-6 text-center text-sm text-gray-500">
            <UserSearch className="mx-auto mb-2 h-6 w-6 text-gray-400" />
            Search a customer by name or email to send a tracking request. Tracking starts once they accept.
          </div>
        ) : (
          <div className="space-y-2">
            {people.data?.map((person) => {
              const meta = requestMeta[person.consent];
              return (
                <div key={person.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-togt-blue/10 text-sm font-bold text-togt-blue`}>
                      {person.fullName.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p className="flex items-center gap-2 text-sm font-semibold text-togt-navy">
                        {person.fullName}
                        {person.travelingNow && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Traveling now</span>}
                      </p>
                      <p className="text-xs text-gray-500">{person.groupName ?? person.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${meta.color}`}>{meta.label}</span>
                    {person.consent === "NONE" && (
                      <Button size="sm" className="bg-togt-blue text-white" disabled={send.isPending} onClick={() => send.mutate(person.id)}>
                        <MapPin className="mr-1 h-3.5 w-3.5" />Request tracking
                      </Button>
                    )}
                    {person.consent === "PENDING" && (
                      <Button size="sm" variant="outline" disabled={cancel.isPending} onClick={() => cancel.mutate(person.id)}>
                        Cancel request
                      </Button>
                    )}
                    {person.consent === "ACCEPTED" && !person.travelingNow && (
                      <span className="text-[11px] text-gray-400">Tracking starts when their trip is active</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
