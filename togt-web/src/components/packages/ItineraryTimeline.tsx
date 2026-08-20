import type { PackageItineraryDay } from "@/lib/api/packages";

interface ItineraryTimelineProps {
  itinerary: PackageItineraryDay[];
}

export function ItineraryTimeline({ itinerary }: ItineraryTimelineProps) {
  return (
    <div className="relative">
      {/* Vertical connecting line */}
      <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-gradient-to-b from-[#FF9300] via-[#1F67B1] to-[#1F67B1]/30" />

      <ul className="space-y-4">
        {itinerary.map((item, i) => (
          <li key={item.day} className="relative flex gap-4 pl-1">
            {/* Day circle */}
            <div
              className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md"
              style={{
                background:
                  i === 0
                    ? "#FF9300"
                    : i === itinerary.length - 1
                    ? "#12394F"
                    : "#1F67B1",
              }}
            >
              {item.day}
            </div>

            {/* Content */}
            <div className="flex-1 pb-4">
              <p className="font-semibold text-[#12394F] text-sm leading-tight">
                {item.title}
              </p>
              <p className="text-gray-500 text-sm mt-0.5 leading-relaxed">
                {item.description}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
