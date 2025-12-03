import { WireframeLayout, WFCard, WFHeading, WFText, WFButton, WFIcon, WFBadge, WFAvatar, WFInput, WFCheckbox } from "./WireframeLayout";

export function WF09UserManagement() {
  return (
    <WireframeLayout title="User Management" screenNumber={9}>
      <div className="grid grid-cols-12 gap-4">
        
        {/* Stats */}
        <div className="col-span-12 grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <WFCard key={i}>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-[#E0E0E0] rounded-lg" />
                <div>
                  <div className="h-6 w-10 bg-[#9E9E9E] rounded" />
                  <WFText width="w-20" height="h-2" />
                </div>
              </div>
            </WFCard>
          ))}
        </div>

        {/* Toolbar */}
        <div className="col-span-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <WFInput width="w-64" />
            <div className="flex items-center gap-2 h-9 px-3 border border-[#BDBDBD] rounded">
              <WFText width="w-12" height="h-3" />
              <WFIcon size="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 h-9 px-3 border border-[#BDBDBD] rounded">
              <WFText width="w-20" height="h-3" />
              <WFIcon size="h-4 w-4" />
            </div>
          </div>
          <div className="flex gap-2">
            <WFButton variant="ghost" width="w-28" />
            <WFButton variant="primary" width="w-28" />
          </div>
        </div>

        {/* User Table - 12 columns */}
        <WFCard className="col-span-12 p-0 overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 bg-[#F5F5F5] px-4 py-3 border-b border-[#BDBDBD] items-center">
            <div className="col-span-1">
              <WFCheckbox />
            </div>
            <div className="col-span-3">
              <WFText width="w-12" height="h-3" />
            </div>
            <div className="col-span-2">
              <WFText width="w-10" height="h-3" />
            </div>
            <div className="col-span-2">
              <WFText width="w-20" height="h-3" />
            </div>
            <div className="col-span-1">
              <WFText width="w-12" height="h-3" />
            </div>
            <div className="col-span-1">
              <WFText width="w-16" height="h-3" />
            </div>
            <div className="col-span-1">
              <WFText width="w-14" height="h-3" />
            </div>
            <div className="col-span-1 text-right">
              <WFText width="w-14" height="h-3" />
            </div>
          </div>
          
          {/* Table Rows */}
          {[...Array(8)].map((_, i) => (
            <div key={i} className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-[#E0E0E0] items-center hover:bg-[#FAFAFA]">
              <div className="col-span-1">
                <WFCheckbox />
              </div>
              <div className="col-span-3 flex items-center gap-3">
                <WFAvatar />
                <div className="space-y-1">
                  <WFText width="w-28" height="h-3" />
                  <WFText width="w-36" height="h-2" />
                </div>
              </div>
              <div className="col-span-2">
                <WFBadge />
              </div>
              <div className="col-span-2">
                <WFText width="w-28" />
              </div>
              <div className="col-span-1">
                <div className={`h-2 w-2 rounded-full ${i % 3 === 0 ? 'bg-[#9E9E9E]' : 'bg-[#BDBDBD]'}`} />
              </div>
              <div className="col-span-1">
                <WFText width="w-16" />
              </div>
              <div className="col-span-1">
                <WFText width="w-20" />
              </div>
              <div className="col-span-1 flex justify-end gap-1">
                <WFIcon size="h-4 w-4" />
                <WFIcon size="h-4 w-4" />
                <WFIcon size="h-4 w-4" />
              </div>
            </div>
          ))}
        </WFCard>

        {/* Pagination */}
        <div className="col-span-12 flex items-center justify-between">
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

        {/* Roles Section */}
        <WFCard className="col-span-6">
          <div className="flex items-center justify-between mb-4">
            <WFHeading width="w-20" />
            <WFButton variant="ghost" width="w-24" />
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border border-[#E0E0E0] rounded">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-[#E0E0E0] rounded" />
                  <div className="space-y-1">
                    <WFText width="w-24" height="h-3" />
                    <WFText width="w-40" height="h-2" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <WFText width="w-16" height="h-2" />
                  <WFIcon size="h-4 w-4" />
                </div>
              </div>
            ))}
          </div>
        </WFCard>

        {/* Departments Section */}
        <WFCard className="col-span-6">
          <div className="flex items-center justify-between mb-4">
            <WFHeading width="w-28" />
            <WFButton variant="ghost" width="w-24" />
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border border-[#E0E0E0] rounded">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-[#E0E0E0] rounded" />
                  <div className="space-y-1">
                    <WFText width="w-32" height="h-3" />
                    <WFText width="w-20" height="h-2" />
                  </div>
                </div>
                <div className="flex -space-x-1">
                  {[...Array(3)].map((_, j) => (
                    <WFAvatar key={j} size="h-6 w-6" />
                  ))}
                  <div className="h-6 w-6 bg-[#E0E0E0] rounded-full flex items-center justify-center text-[10px]">+{2 + i}</div>
                </div>
              </div>
            ))}
          </div>
        </WFCard>
        
      </div>
    </WireframeLayout>
  );
}
