import { WireframeLayout, WFCard, WFHeading, WFText, WFButton, WFIcon, WFBadge, WFAvatar, WFInput, WFCheckbox } from "./WireframeLayout";

export function WF11SearchResults() {
  return (
    <WireframeLayout title="Search Results" screenNumber={11}>
      <div className="grid grid-cols-12 gap-4">
        
        {/* Search Header - 12 columns */}
        <div className="col-span-12">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <WFInput width="w-full" />
              <div className="absolute left-3 top-2.5">
                <WFIcon />
              </div>
              <div className="absolute right-3 top-2">
                <WFButton variant="primary" width="w-20" />
              </div>
            </div>
          </div>
          
          {/* Search Info */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <WFText width="w-48" height="h-4" />
              <WFText width="w-24" height="h-3" />
            </div>
            <div className="flex items-center gap-2">
              <WFText width="w-16" height="h-3" />
              <div className="h-9 w-32 border border-[#BDBDBD] rounded flex items-center justify-between px-3">
                <WFText width="w-20" height="h-3" />
                <WFIcon size="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters Sidebar - 3 columns */}
        <div className="col-span-3 space-y-4">
          <WFCard>
            <div className="flex items-center justify-between mb-4">
              <WFHeading width="w-16" />
              <WFText width="w-16" height="h-3" />
            </div>
            
            {/* Type Filter */}
            <div className="space-y-3 pb-4 border-b border-[#E0E0E0]">
              <WFText width="w-12" height="h-3" />
              {['Documents', 'Processes', 'Dispatches', 'Users'].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <WFCheckbox />
                    <WFText width="w-20" height="h-2" />
                  </div>
                  <WFText width="w-6" height="h-2" />
                </div>
              ))}
            </div>
            
            {/* Status Filter */}
            <div className="space-y-3 py-4 border-b border-[#E0E0E0]">
              <WFText width="w-12" height="h-3" />
              {['Active', 'Pending', 'Completed', 'Archived'].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <WFCheckbox />
                    <WFText width="w-16" height="h-2" />
                  </div>
                  <WFText width="w-6" height="h-2" />
                </div>
              ))}
            </div>
            
            {/* Date Range */}
            <div className="space-y-3 py-4 border-b border-[#E0E0E0]">
              <WFText width="w-20" height="h-3" />
              <div className="space-y-2">
                <div className="h-9 w-full border border-[#BDBDBD] rounded flex items-center px-3 gap-2">
                  <WFIcon size="h-4 w-4" />
                  <WFText width="w-20" height="h-2" />
                </div>
                <div className="h-9 w-full border border-[#BDBDBD] rounded flex items-center px-3 gap-2">
                  <WFIcon size="h-4 w-4" />
                  <WFText width="w-20" height="h-2" />
                </div>
              </div>
            </div>
            
            {/* Department Filter */}
            <div className="space-y-3 pt-4">
              <WFText width="w-24" height="h-3" />
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <WFCheckbox />
                    <WFText width="w-24" height="h-2" />
                  </div>
                  <WFText width="w-6" height="h-2" />
                </div>
              ))}
            </div>
          </WFCard>
        </div>

        {/* Search Results - 9 columns */}
        <div className="col-span-9 space-y-4">
          {/* Result Tabs */}
          <div className="flex items-center gap-4 border-b border-[#BDBDBD]">
            {['All (156)', 'Documents (89)', 'Processes (42)', 'Dispatches (18)', 'Users (7)'].map((tab, i) => (
              <div key={tab} className={`pb-2 ${i === 0 ? 'border-b-2 border-[#9E9E9E]' : ''}`}>
                <WFText width="w-24" height="h-3" />
              </div>
            ))}
          </div>

          {/* Results List */}
          {[...Array(6)].map((_, i) => (
            <WFCard key={i} className="hover:border-[#9E9E9E] cursor-pointer">
              <div className="flex gap-4">
                <div className="h-12 w-12 bg-[#E0E0E0] rounded-lg shrink-0" />
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <WFText width="w-64" height="h-4" />
                        <WFBadge />
                      </div>
                      {/* Highlighted Text */}
                      <div className="flex items-center gap-1">
                        <WFText width="w-20" height="h-2" />
                        <div className="h-3 w-24 bg-[#E0E0E0] rounded" />
                        <WFText width="w-32" height="h-2" />
                        <div className="h-3 w-16 bg-[#E0E0E0] rounded" />
                        <WFText width="w-24" height="h-2" />
                      </div>
                    </div>
                    <WFIcon size="h-4 w-4" />
                  </div>
                  
                  {/* Meta */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <WFIcon size="h-3 w-3" />
                      <WFText width="w-20" height="h-2" />
                    </div>
                    <div className="flex items-center gap-1">
                      <WFIcon size="h-3 w-3" />
                      <WFText width="w-16" height="h-2" />
                    </div>
                    <div className="flex items-center gap-1">
                      <WFAvatar size="h-5 w-5" />
                      <WFText width="w-24" height="h-2" />
                    </div>
                  </div>
                </div>
              </div>
            </WFCard>
          ))}

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4">
            <WFText width="w-48" height="h-3" />
            <div className="flex items-center gap-2">
              <WFButton variant="ghost" width="w-20" />
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={`h-8 w-8 rounded ${i === 0 ? 'bg-[#9E9E9E]' : 'bg-[#E0E0E0]'}`} />
                ))}
              </div>
              <WFButton variant="ghost" width="w-16" />
            </div>
          </div>
        </div>
        
      </div>
    </WireframeLayout>
  );
}
