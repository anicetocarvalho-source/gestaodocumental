import { WireframeLayout, WFCard, WFHeading, WFText, WFButton, WFIcon, WFBadge, WFAvatar, WFCheckbox } from "./WireframeLayout";

export function WF05ProcessDetail() {
  return (
    <WireframeLayout title="Process Detail" screenNumber={5}>
      <div className="grid grid-cols-12 gap-4">
        
        {/* Breadcrumb */}
        <div className="col-span-12 flex items-center gap-2">
          <WFText width="w-20" height="h-3" />
          <WFText width="w-4" height="h-3" />
          <WFText width="w-40" height="h-3" />
        </div>

        {/* Process Header - 12 columns */}
        <WFCard className="col-span-12">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-7 w-64 bg-[#9E9E9E] rounded" />
                <WFBadge />
                <div className="flex items-center gap-1">
                  <WFIcon size="h-4 w-4" />
                  <WFText width="w-12" height="h-3" />
                </div>
              </div>
              <WFText width="w-96" height="h-3" />
              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center gap-1">
                  <WFIcon size="h-4 w-4" />
                  <WFText width="w-24" height="h-2" />
                </div>
                <div className="flex items-center gap-1">
                  <WFIcon size="h-4 w-4" />
                  <WFText width="w-20" height="h-2" />
                </div>
                <div className="flex items-center gap-1">
                  <WFIcon size="h-4 w-4" />
                  <WFText width="w-16" height="h-2" />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <WFButton variant="ghost" width="w-24" />
              <WFButton variant="primary" width="w-32" />
            </div>
          </div>
        </WFCard>

        {/* Stage Progress - 12 columns */}
        <WFCard className="col-span-12">
          <WFHeading width="w-32" />
          <div className="mt-6">
            {/* Stage Stepper */}
            <div className="flex items-center justify-between relative">
              <div className="absolute top-4 left-0 right-0 h-1 bg-[#E0E0E0]">
                <div className="h-1 bg-[#9E9E9E]" style={{ width: '60%' }} />
              </div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex flex-col items-center z-10">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${i < 3 ? 'bg-[#9E9E9E]' : 'bg-[#E0E0E0]'}`}>
                    {i < 2 && <WFIcon size="h-4 w-4" />}
                    {i === 2 && <div className="h-3 w-3 bg-[#BDBDBD] rounded-full" />}
                  </div>
                  <WFText width="w-20" height="h-2" />
                  <WFText width="w-16" height="h-2" />
                </div>
              ))}
            </div>
          </div>
        </WFCard>

        {/* Main Content - 8 columns */}
        <div className="col-span-8 space-y-4">
          {/* Current Stage Tasks */}
          <WFCard>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <WFHeading width="w-28" />
                <WFBadge />
              </div>
              <WFButton variant="ghost" width="w-24" />
            </div>
            
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 border border-[#E0E0E0] rounded">
                  <WFCheckbox />
                  <div className="flex-1 space-y-1">
                    <WFText width="w-48" height="h-3" />
                    <WFText width="w-64" height="h-2" />
                  </div>
                  <div className="flex items-center gap-2">
                    <WFAvatar size="h-6 w-6" />
                    <WFText width="w-20" height="h-2" />
                  </div>
                  <WFBadge />
                </div>
              ))}
            </div>
          </WFCard>

          {/* Attached Documents */}
          <WFCard>
            <div className="flex items-center justify-between mb-4">
              <WFHeading width="w-36" />
              <WFButton variant="ghost" width="w-28" />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 border border-[#E0E0E0] rounded">
                  <div className="h-10 w-10 bg-[#E0E0E0] rounded" />
                  <div className="flex-1 space-y-1">
                    <WFText width="w-32" height="h-3" />
                    <WFText width="w-20" height="h-2" />
                  </div>
                  <WFIcon />
                </div>
              ))}
            </div>
          </WFCard>

          {/* Activity Log */}
          <WFCard>
            <WFHeading width="w-28" />
            <div className="mt-4 space-y-4 relative">
              <div className="absolute left-4 top-2 bottom-2 w-px bg-[#E0E0E0]" />
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4 pl-2">
                  <WFAvatar size="h-8 w-8" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <WFText width="w-24" height="h-3" />
                      <WFText width="w-32" height="h-2" />
                    </div>
                    <WFText width="w-16" height="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </WFCard>
        </div>

        {/* Sidebar - 4 columns */}
        <div className="col-span-4 space-y-4">
          {/* Process Info */}
          <WFCard>
            <WFHeading width="w-28" />
            <div className="space-y-3 mt-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex justify-between py-2 border-b border-[#E0E0E0]">
                  <WFText width="w-20" height="h-2" />
                  <WFText width="w-24" height="h-2" />
                </div>
              ))}
            </div>
          </WFCard>

          {/* Assignees */}
          <WFCard>
            <div className="flex items-center justify-between mb-4">
              <WFHeading width="w-24" />
              <WFButton variant="ghost" width="w-16" />
            </div>
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <WFAvatar />
                  <div className="flex-1 space-y-1">
                    <WFText width="w-24" height="h-3" />
                    <WFText width="w-20" height="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </WFCard>

          {/* Quick Actions */}
          <WFCard>
            <WFHeading width="w-28" />
            <div className="space-y-2 mt-4">
              <WFButton variant="secondary" width="w-full" />
              <WFButton variant="secondary" width="w-full" />
              <WFButton variant="secondary" width="w-full" />
            </div>
          </WFCard>
        </div>
        
      </div>
    </WireframeLayout>
  );
}
