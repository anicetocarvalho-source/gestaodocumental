import { WireframeLayout, WFCard, WFHeading, WFText, WFButton, WFIcon, WFBadge, WFAvatar, WFCheckbox } from "./WireframeLayout";

export function WF08ApprovalQueue() {
  return (
    <WireframeLayout title="Approval Queue" screenNumber={8}>
      <div className="grid grid-cols-12 gap-4">
        
        {/* Stats */}
        <div className="col-span-12 grid grid-cols-4 gap-4">
          {[
            { count: 12, label: "Pending" },
            { count: 5, label: "Urgent" },
            { count: 28, label: "Approved Today" },
            { count: 3, label: "Rejected" },
          ].map((stat, i) => (
            <WFCard key={i}>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-[#E0E0E0] rounded-lg" />
                <div>
                  <div className="h-6 w-8 bg-[#9E9E9E] rounded" />
                  <WFText width="w-16" height="h-2" />
                </div>
              </div>
            </WFCard>
          ))}
        </div>

        {/* Tabs & Filter */}
        <div className="col-span-12 flex items-center justify-between">
          <div className="flex border-b border-[#BDBDBD]">
            {['All', 'Documents', 'Processes', 'Dispatches'].map((tab, i) => (
              <div key={tab} className={`px-4 py-2 ${i === 0 ? 'border-b-2 border-[#9E9E9E]' : ''}`}>
                <WFText width="w-16" height="h-3" />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 h-9 px-3 border border-[#BDBDBD] rounded">
              <WFText width="w-16" height="h-3" />
              <WFIcon size="h-4 w-4" />
            </div>
            <WFButton variant="ghost" width="w-9" />
          </div>
        </div>

        {/* Queue List - 8 columns */}
        <div className="col-span-8 space-y-3">
          {[...Array(6)].map((_, i) => (
            <WFCard key={i} className="hover:border-[#9E9E9E] cursor-pointer">
              <div className="flex gap-4">
                {/* Checkbox & Icon */}
                <div className="flex items-start gap-3">
                  <WFCheckbox />
                  <div className="h-12 w-12 bg-[#E0E0E0] rounded-lg" />
                </div>
                
                {/* Content */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <WFText width="w-48" height="h-4" />
                        <WFBadge />
                        {i < 2 && (
                          <div className="h-5 w-14 bg-[#E0E0E0] rounded-full flex items-center justify-center">
                            <WFText width="w-10" height="h-2" />
                          </div>
                        )}
                      </div>
                      <WFText width="w-72" height="h-2" />
                    </div>
                    <WFText width="w-20" height="h-2" />
                  </div>
                  
                  {/* Meta Row */}
                  <div className="flex items-center gap-6 pt-2">
                    <div className="flex items-center gap-2">
                      <WFAvatar size="h-6 w-6" />
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
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <WFButton variant="primary" width="w-24" />
                    <WFButton variant="ghost" width="w-24" />
                    <WFButton variant="ghost" width="w-28" />
                  </div>
                </div>
              </div>
            </WFCard>
          ))}
          
          {/* Pagination */}
          <div className="flex items-center justify-between pt-4">
            <WFText width="w-40" height="h-3" />
            <div className="flex items-center gap-2">
              <WFButton variant="ghost" width="w-20" />
              <div className="flex gap-1">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className={`h-8 w-8 rounded ${i === 0 ? 'bg-[#9E9E9E]' : 'bg-[#E0E0E0]'}`} />
                ))}
              </div>
              <WFButton variant="ghost" width="w-16" />
            </div>
          </div>
        </div>

        {/* Preview Panel - 4 columns */}
        <div className="col-span-4 space-y-4">
          <WFCard>
            <div className="flex items-center justify-between mb-4">
              <WFHeading width="w-28" />
              <WFButton variant="ghost" width="w-20" />
            </div>
            
            {/* Document Preview */}
            <div className="h-48 bg-[#F5F5F5] border border-[#BDBDBD] rounded mb-4 flex items-center justify-center">
              <div className="space-y-2 text-center">
                <WFIcon size="h-8 w-8" />
                <WFText width="w-24" height="h-2" />
              </div>
            </div>
            
            {/* Details */}
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex justify-between py-2 border-b border-[#E0E0E0]">
                  <WFText width="w-20" height="h-2" />
                  <WFText width="w-28" height="h-2" />
                </div>
              ))}
            </div>
          </WFCard>

          {/* Approval History */}
          <WFCard>
            <WFHeading width="w-36" />
            <div className="space-y-3 mt-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <WFAvatar size="h-8 w-8" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <WFText width="w-20" height="h-3" />
                      <WFBadge />
                    </div>
                    <WFText width="w-32" height="h-2" />
                    <WFText width="w-16" height="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </WFCard>

          {/* Quick Actions */}
          <div className="space-y-2">
            <WFButton variant="primary" width="w-full" />
            <WFButton variant="secondary" width="w-full" />
            <WFButton variant="ghost" width="w-full" />
          </div>
        </div>
        
      </div>
    </WireframeLayout>
  );
}
