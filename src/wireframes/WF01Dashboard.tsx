import { WireframeLayout, WFCard, WFHeading, WFText, WFButton, WFIcon, WFBadge, WFAvatar } from "./WireframeLayout";

export function WF01Dashboard() {
  return (
    <WireframeLayout title="Dashboard" screenNumber={1}>
      {/* 12-Column Grid Container */}
      <div className="grid grid-cols-12 gap-4">
        
        {/* Stats Row - Spans all 12 columns */}
        <div className="col-span-12 grid grid-cols-12 gap-4">
          {[...Array(6)].map((_, i) => (
            <WFCard key={i} className="col-span-2">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <WFText width="w-20" height="h-2" />
                  <div className="h-7 w-16 bg-[#9E9E9E] rounded" />
                  <WFText width="w-24" height="h-2" />
                </div>
                <div className="h-10 w-10 bg-[#E0E0E0] rounded-lg" />
              </div>
            </WFCard>
          ))}
        </div>

        {/* Quick Actions - Spans 12 columns */}
        <WFCard className="col-span-12">
          <WFHeading width="w-28" />
          <div className="grid grid-cols-8 gap-3 mt-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 p-3 border border-[#E0E0E0] rounded">
                <div className="h-8 w-8 bg-[#E0E0E0] rounded-lg" />
                <WFText width="w-16" height="h-2" />
                <WFText width="w-12" height="h-2" />
              </div>
            ))}
          </div>
        </WFCard>

        {/* Recent Documents Table - 8 columns */}
        <WFCard className="col-span-8">
          <div className="flex justify-between items-center mb-4">
            <WFHeading width="w-36" />
            <WFButton variant="secondary" width="w-20" />
          </div>
          
          {/* Table */}
          <div className="border border-[#E0E0E0] rounded">
            {/* Header */}
            <div className="grid grid-cols-6 gap-4 bg-[#F5F5F5] px-4 py-3 border-b border-[#BDBDBD]">
              <WFText width="w-20" height="h-3" />
              <WFText width="w-12" height="h-3" />
              <WFText width="w-14" height="h-3" />
              <WFText width="w-16" height="h-3" />
              <WFText width="w-12" height="h-3" />
              <WFText width="w-16" height="h-3" />
            </div>
            {/* Rows */}
            {[...Array(5)].map((_, i) => (
              <div key={i} className="grid grid-cols-6 gap-4 px-4 py-3 border-b border-[#E0E0E0] items-center">
                <div className="flex items-center gap-2">
                  <WFIcon />
                  <WFText width="w-28" />
                </div>
                <WFText width="w-10" />
                <WFBadge />
                <WFText width="w-20" />
                <WFText width="w-20" />
                <WFIcon />
              </div>
            ))}
          </div>
        </WFCard>

        {/* Activity Feed - 4 columns */}
        <WFCard className="col-span-4">
          <div className="flex justify-between items-center mb-4">
            <WFHeading width="w-28" />
            <WFText width="w-14" height="h-3" />
          </div>
          
          {/* Timeline */}
          <div className="space-y-4 relative">
            <div className="absolute left-4 top-4 bottom-4 w-px bg-[#E0E0E0]" />
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex gap-3 pl-2">
                <div className="h-8 w-8 bg-[#E0E0E0] rounded-full z-10 shrink-0" />
                <div className="space-y-1 pt-1">
                  <WFText width="w-24" height="h-3" />
                  <WFText width="w-40" height="h-2" />
                  <WFText width="w-16" height="h-2" />
                </div>
              </div>
            ))}
          </div>
        </WFCard>

        {/* Active Processes - 12 columns */}
        <WFCard className="col-span-12">
          <div className="flex justify-between items-center mb-4">
            <WFHeading width="w-32" />
            <WFButton variant="secondary" width="w-20" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border border-[#E0E0E0] rounded p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <WFText width="w-36" height="h-4" />
                      <WFBadge />
                    </div>
                    <WFText width="w-48" height="h-2" />
                  </div>
                  <WFIcon />
                </div>
                
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <WFText width="w-20" height="h-2" />
                    <WFText width="w-8" height="h-2" />
                  </div>
                  <div className="h-2 w-full bg-[#E0E0E0] rounded">
                    <div className="h-2 w-3/4 bg-[#9E9E9E] rounded" />
                  </div>
                </div>
                
                {/* Meta */}
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1">
                    <WFIcon />
                    <WFText width="w-20" height="h-2" />
                  </div>
                  <div className="flex items-center gap-1">
                    <WFIcon />
                    <div className="flex -space-x-1">
                      {[...Array(3)].map((_, j) => (
                        <WFAvatar key={j} size="h-5 w-5" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </WFCard>
        
      </div>
    </WireframeLayout>
  );
}
