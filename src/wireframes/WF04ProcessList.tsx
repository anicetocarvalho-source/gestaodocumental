import { WireframeLayout, WFCard, WFHeading, WFText, WFButton, WFIcon, WFBadge, WFAvatar, WFInput } from "./WireframeLayout";

export function WF04ProcessList() {
  return (
    <WireframeLayout title="Process List" screenNumber={4}>
      <div className="grid grid-cols-12 gap-4">
        
        {/* Stats Summary - 12 columns */}
        <div className="col-span-12 grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <WFCard key={i}>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-[#E0E0E0] rounded-lg" />
                <div>
                  <div className="h-6 w-8 bg-[#9E9E9E] rounded mb-1" />
                  <WFText width="w-16" height="h-2" />
                </div>
              </div>
            </WFCard>
          ))}
        </div>

        {/* Filters & Actions - 12 columns */}
        <div className="col-span-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <WFInput width="w-56" />
            {/* Filter Tabs */}
            <div className="flex border border-[#BDBDBD] rounded p-1">
              <div className="h-7 px-3 bg-[#9E9E9E] rounded flex items-center">
                <WFText width="w-8" height="h-2" />
              </div>
              <div className="h-7 px-3 flex items-center">
                <WFText width="w-12" height="h-2" />
              </div>
              <div className="h-7 px-3 flex items-center">
                <WFText width="w-16" height="h-2" />
              </div>
              <div className="h-7 px-3 flex items-center">
                <WFText width="w-12" height="h-2" />
              </div>
            </div>
          </div>
          <WFButton variant="primary" width="w-32" />
        </div>

        {/* Section Header */}
        <div className="col-span-12 flex items-center justify-between">
          <WFHeading width="w-28" />
          <div className="flex items-center gap-2">
            <WFText width="w-16" height="h-3" />
            <WFIcon />
          </div>
        </div>

        {/* Process Cards - Grid Layout */}
        {[...Array(6)].map((_, i) => (
          <WFCard key={i} className="col-span-6">
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <WFText width="w-48" height="h-4" />
                  <WFBadge />
                  <div className="flex items-center gap-1">
                    <WFIcon size="h-3 w-3" />
                    <WFText width="w-12" height="h-2" />
                  </div>
                </div>
                <WFText width="w-64" height="h-2" />
              </div>
              <WFIcon />
            </div>

            {/* Progress Section */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <WFText width="w-12" height="h-2" />
                  <WFText width="w-24" height="h-3" />
                </div>
                <WFText width="w-8" height="h-3" />
              </div>
              <div className="h-2 w-full bg-[#E0E0E0] rounded">
                <div className="h-2 bg-[#9E9E9E] rounded" style={{ width: `${30 + i * 12}%` }} />
              </div>
              {/* Stage Labels */}
              <div className="flex justify-between">
                {[...Array(4)].map((_, j) => (
                  <WFText key={j} width="w-16" height="h-2" />
                ))}
              </div>
            </div>

            {/* Meta Row */}
            <div className="flex items-center gap-6 pt-3 border-t border-[#E0E0E0]">
              <div className="flex items-center gap-1">
                <WFIcon size="h-4 w-4" />
                <WFText width="w-20" height="h-2" />
              </div>
              <div className="flex items-center gap-1">
                <WFIcon size="h-4 w-4" />
                <div className="flex -space-x-1">
                  {[...Array(3)].map((_, j) => (
                    <WFAvatar key={j} size="h-5 w-5" />
                  ))}
                </div>
                {i > 2 && <WFText width="w-6" height="h-2" />}
              </div>
              <div className="flex items-center gap-1 ml-auto">
                <WFIcon size="h-4 w-4" />
                <WFText width="w-16" height="h-2" />
              </div>
            </div>
          </WFCard>
        ))}

        {/* Load More */}
        <div className="col-span-12 flex justify-center">
          <WFButton variant="ghost" width="w-32" />
        </div>
        
      </div>
    </WireframeLayout>
  );
}
