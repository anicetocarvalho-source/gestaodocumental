import { WireframeLayout, WFCard, WFHeading, WFText, WFButton, WFIcon, WFBadge, WFAvatar, WFInput, WFCheckbox } from "./WireframeLayout";

export function WF06DispatchManagement() {
  return (
    <WireframeLayout title="Dispatch Management" screenNumber={6}>
      <div className="grid grid-cols-12 gap-4">
        
        {/* Stats Row */}
        <div className="col-span-12 grid grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <WFCard key={i}>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-[#E0E0E0] rounded-lg" />
                <div>
                  <div className="h-5 w-10 bg-[#9E9E9E] rounded mb-1" />
                  <WFText width="w-16" height="h-2" />
                </div>
              </div>
            </WFCard>
          ))}
        </div>

        {/* Toolbar */}
        <div className="col-span-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <WFInput width="w-64" />
            <WFButton variant="ghost" width="w-9" />
            {/* Date Range */}
            <div className="flex items-center gap-2 h-9 px-3 border border-[#BDBDBD] rounded">
              <WFIcon size="h-4 w-4" />
              <WFText width="w-32" height="h-3" />
            </div>
            {/* Status Filter */}
            <div className="flex items-center gap-2 h-9 px-3 border border-[#BDBDBD] rounded">
              <WFText width="w-16" height="h-3" />
              <WFIcon size="h-4 w-4" />
            </div>
          </div>
          <div className="flex gap-2">
            <WFButton variant="ghost" width="w-28" />
            <WFButton variant="primary" width="w-32" />
          </div>
        </div>

        {/* Kanban View - 12 columns divided into 4 */}
        <div className="col-span-12 grid grid-cols-4 gap-4">
          {['Pending', 'In Transit', 'Delivered', 'Returned'].map((status, colIndex) => (
            <div key={status} className="space-y-3">
              {/* Column Header */}
              <div className="flex items-center justify-between p-3 bg-[#E8E8E8] rounded-t border border-[#BDBDBD]">
                <div className="flex items-center gap-2">
                  <WFText width="w-20" height="h-3" />
                  <div className="h-5 w-6 bg-[#BDBDBD] rounded-full flex items-center justify-center">
                    <span className="text-[10px] text-[#616161]">{3 + colIndex}</span>
                  </div>
                </div>
                <WFIcon size="h-4 w-4" />
              </div>
              
              {/* Cards */}
              <div className="space-y-3">
                {[...Array(3 - Math.floor(colIndex / 2))].map((_, i) => (
                  <WFCard key={i} className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <WFText width="w-24" height="h-3" />
                        <WFText width="w-32" height="h-2" />
                      </div>
                      <WFIcon size="h-4 w-4" />
                    </div>
                    
                    {/* Recipient */}
                    <div className="p-2 bg-[#F5F5F5] rounded space-y-1">
                      <WFText width="w-16" height="h-2" />
                      <WFText width="w-28" height="h-2" />
                      <WFText width="w-24" height="h-2" />
                    </div>
                    
                    {/* Meta */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#E0E0E0]">
                      <div className="flex items-center gap-2">
                        <WFIcon size="h-3 w-3" />
                        <WFText width="w-16" height="h-2" />
                      </div>
                      <WFBadge />
                    </div>
                  </WFCard>
                ))}
                
                {/* Add Button */}
                <button className="w-full h-10 border-2 border-dashed border-[#BDBDBD] rounded flex items-center justify-center">
                  <WFIcon size="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Dispatches Table */}
        <WFCard className="col-span-12 p-0 overflow-hidden mt-4">
          <div className="flex items-center justify-between p-4 border-b border-[#BDBDBD]">
            <WFHeading width="w-36" />
            <div className="flex items-center gap-2">
              <WFButton variant="ghost" width="w-24" />
              <WFButton variant="ghost" width="w-20" />
            </div>
          </div>
          
          {/* Table Header */}
          <div className="grid grid-cols-8 gap-4 bg-[#F5F5F5] px-4 py-3 border-b border-[#BDBDBD]">
            <WFCheckbox />
            <WFText width="w-16" height="h-3" />
            <WFText width="w-20" height="h-3" />
            <WFText width="w-16" height="h-3" />
            <WFText width="w-16" height="h-3" />
            <WFText width="w-14" height="h-3" />
            <WFText width="w-12" height="h-3" />
            <WFText width="w-14" height="h-3" />
          </div>
          
          {/* Table Rows */}
          {[...Array(5)].map((_, i) => (
            <div key={i} className="grid grid-cols-8 gap-4 px-4 py-3 border-b border-[#E0E0E0] items-center">
              <WFCheckbox />
              <WFText width="w-20" />
              <WFText width="w-28" />
              <WFText width="w-24" />
              <WFText width="w-20" />
              <WFBadge />
              <WFText width="w-20" />
              <WFIcon />
            </div>
          ))}
        </WFCard>
        
      </div>
    </WireframeLayout>
  );
}
