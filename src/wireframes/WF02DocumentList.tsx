import { WireframeLayout, WFCard, WFHeading, WFText, WFButton, WFIcon, WFBadge, WFInput, WFCheckbox } from "./WireframeLayout";

export function WF02DocumentList() {
  return (
    <WireframeLayout title="Document List" screenNumber={2}>
      <div className="grid grid-cols-12 gap-4">
        
        {/* Toolbar - 12 columns */}
        <div className="col-span-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <WFInput width="w-64" />
              <div className="absolute left-3 top-2.5">
                <WFIcon />
              </div>
            </div>
            {/* Filter Button */}
            <WFButton variant="ghost" width="w-9" />
            {/* Filter Tags */}
            <div className="flex gap-2">
              <div className="h-7 w-24 bg-[#E0E0E0] rounded-full flex items-center justify-center gap-1 px-2">
                <WFText width="w-14" height="h-2" />
                <div className="h-3 w-3 bg-[#BDBDBD] rounded" />
              </div>
              <div className="h-7 w-20 bg-[#E0E0E0] rounded-full flex items-center justify-center gap-1 px-2">
                <WFText width="w-12" height="h-2" />
                <div className="h-3 w-3 bg-[#BDBDBD] rounded" />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex border border-[#BDBDBD] rounded p-1">
              <div className="h-7 w-7 bg-[#E0E0E0] rounded" />
              <div className="h-7 w-7 bg-transparent rounded" />
            </div>
            {/* Upload Button */}
            <WFButton variant="primary" width="w-24" />
          </div>
        </div>

        {/* Bulk Actions Bar */}
        <div className="col-span-12 h-10 bg-[#F5F5F5] border border-[#BDBDBD] rounded flex items-center px-4 gap-4">
          <WFCheckbox />
          <WFText width="w-32" height="h-3" />
          <div className="flex gap-2 ml-auto">
            <WFButton variant="ghost" width="w-20" />
            <WFButton variant="ghost" width="w-20" />
            <WFButton variant="ghost" width="w-20" />
          </div>
        </div>

        {/* Document Table - 12 columns */}
        <WFCard className="col-span-12 p-0 overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 bg-[#F5F5F5] px-4 py-3 border-b border-[#BDBDBD] items-center">
            <div className="col-span-1">
              <WFCheckbox />
            </div>
            <div className="col-span-4">
              <WFText width="w-20" height="h-3" />
            </div>
            <div className="col-span-1">
              <WFText width="w-10" height="h-3" />
            </div>
            <div className="col-span-1">
              <WFText width="w-10" height="h-3" />
            </div>
            <div className="col-span-1">
              <WFText width="w-12" height="h-3" />
            </div>
            <div className="col-span-2">
              <WFText width="w-14" height="h-3" />
            </div>
            <div className="col-span-1">
              <WFText width="w-10" height="h-3" />
            </div>
            <div className="col-span-1 text-right">
              <WFText width="w-14" height="h-3" />
            </div>
          </div>
          
          {/* Table Rows */}
          {[...Array(10)].map((_, i) => (
            <div key={i} className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-[#E0E0E0] items-center hover:bg-[#FAFAFA]">
              <div className="col-span-1">
                <WFCheckbox />
              </div>
              <div className="col-span-4 flex items-center gap-3">
                <div className="h-9 w-9 bg-[#E0E0E0] rounded" />
                <div className="space-y-1">
                  <WFText width="w-40" height="h-3" />
                  <WFText width="w-24" height="h-2" />
                </div>
              </div>
              <div className="col-span-1">
                <WFText width="w-10" />
              </div>
              <div className="col-span-1">
                <WFText width="w-14" />
              </div>
              <div className="col-span-1">
                <WFBadge />
              </div>
              <div className="col-span-2">
                <WFText width="w-24" />
              </div>
              <div className="col-span-1">
                <WFText width="w-20" />
              </div>
              <div className="col-span-1 flex justify-end">
                <WFIcon />
              </div>
            </div>
          ))}
        </WFCard>

        {/* Pagination - 12 columns */}
        <div className="col-span-12 flex items-center justify-between">
          <WFText width="w-40" height="h-3" />
          <div className="flex items-center gap-2">
            <WFButton variant="ghost" width="w-20" />
            <div className="flex gap-1">
              <div className="h-8 w-8 bg-[#9E9E9E] rounded" />
              <div className="h-8 w-8 bg-[#E0E0E0] rounded" />
              <div className="h-8 w-8 bg-[#E0E0E0] rounded" />
              <div className="h-8 w-8 bg-[#E0E0E0] rounded" />
            </div>
            <WFButton variant="ghost" width="w-16" />
          </div>
        </div>
        
      </div>
    </WireframeLayout>
  );
}
