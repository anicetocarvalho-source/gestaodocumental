import { WireframeLayout, WFCard, WFHeading, WFText, WFButton, WFIcon, WFBadge, WFAvatar, WFInput } from "./WireframeLayout";

export function WF03DocumentDetail() {
  return (
    <WireframeLayout title="Document Detail" screenNumber={3}>
      <div className="grid grid-cols-12 gap-4">
        
        {/* Breadcrumb - 12 columns */}
        <div className="col-span-12 flex items-center gap-2">
          <WFText width="w-20" height="h-3" />
          <WFText width="w-4" height="h-3" />
          <WFText width="w-16" height="h-3" />
          <WFText width="w-4" height="h-3" />
          <WFText width="w-32" height="h-3" />
        </div>

        {/* Document Header - 12 columns */}
        <WFCard className="col-span-12">
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className="h-14 w-14 bg-[#E0E0E0] rounded-lg" />
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-64 bg-[#9E9E9E] rounded" />
                  <WFBadge />
                </div>
                <div className="flex items-center gap-4">
                  <WFText width="w-20" />
                  <WFText width="w-24" />
                  <WFText width="w-16" />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <WFButton variant="ghost" width="w-24" />
              <WFButton variant="ghost" width="w-24" />
              <WFButton variant="primary" width="w-28" />
            </div>
          </div>
        </WFCard>

        {/* Document Preview - 8 columns */}
        <div className="col-span-8 space-y-4">
          {/* Preview Toolbar */}
          <div className="h-12 bg-[#E8E8E8] border border-[#BDBDBD] rounded flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <WFIcon />
              <WFIcon />
              <div className="w-px h-6 bg-[#BDBDBD]" />
              <WFIcon />
              <WFIcon />
            </div>
            <div className="flex items-center gap-2">
              <WFText width="w-20" height="h-3" />
              <WFIcon />
              <WFIcon />
            </div>
          </div>
          
          {/* Document Preview Area */}
          <WFCard className="min-h-[500px] flex items-center justify-center">
            <div className="w-[400px] space-y-4 p-8 border border-dashed border-[#BDBDBD] rounded">
              <div className="h-6 w-3/4 bg-[#E0E0E0] rounded mx-auto" />
              <div className="space-y-2">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className={`h-3 bg-[#E8E8E8] rounded ${i % 3 === 2 ? 'w-4/5' : 'w-full'}`} />
                ))}
              </div>
              <div className="h-32 w-full bg-[#F5F5F5] rounded mt-6" />
              <div className="space-y-2 mt-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className={`h-3 bg-[#E8E8E8] rounded ${i % 3 === 2 ? 'w-3/4' : 'w-full'}`} />
                ))}
              </div>
            </div>
          </WFCard>
        </div>

        {/* Sidebar - 4 columns */}
        <div className="col-span-4 space-y-4">
          {/* Document Info */}
          <WFCard>
            <WFHeading width="w-32" />
            <div className="space-y-3 mt-4">
              {[
                { label: "w-20", value: "w-32" },
                { label: "w-16", value: "w-28" },
                { label: "w-24", value: "w-20" },
                { label: "w-16", value: "w-24" },
                { label: "w-20", value: "w-28" },
                { label: "w-24", value: "w-20" },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-[#E0E0E0]">
                  <WFText width={item.label} height="h-3" />
                  <WFText width={item.value} height="h-3" />
                </div>
              ))}
            </div>
          </WFCard>

          {/* Version History */}
          <WFCard>
            <div className="flex justify-between items-center mb-4">
              <WFHeading width="w-32" />
              <WFText width="w-16" height="h-3" />
            </div>
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-2 border border-[#E0E0E0] rounded">
                  <WFAvatar size="h-8 w-8" />
                  <div className="flex-1 space-y-1">
                    <WFText width="w-16" height="h-3" />
                    <WFText width="w-24" height="h-2" />
                    <WFText width="w-20" height="h-2" />
                  </div>
                  {i === 0 && <WFBadge />}
                </div>
              ))}
            </div>
          </WFCard>

          {/* Comments */}
          <WFCard>
            <div className="flex justify-between items-center mb-4">
              <WFHeading width="w-24" />
              <WFText width="w-8" height="h-4" />
            </div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <WFAvatar size="h-8 w-8" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <WFText width="w-20" height="h-3" />
                      <WFText width="w-16" height="h-2" />
                    </div>
                    <div className="p-2 bg-[#F5F5F5] rounded">
                      <WFText width="w-full" height="h-2" />
                      <WFText width="w-3/4" height="h-2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Add Comment */}
            <div className="mt-4 flex gap-2">
              <WFInput width="flex-1" />
              <WFButton variant="primary" width="w-20" />
            </div>
          </WFCard>
        </div>
        
      </div>
    </WireframeLayout>
  );
}
