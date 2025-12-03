import { WireframeLayout, WFCard, WFHeading, WFText, WFButton, WFIcon, WFInput, WFCheckbox } from "./WireframeLayout";

export function WF07CreateForm() {
  return (
    <WireframeLayout title="Create Document Form" screenNumber={7}>
      <div className="grid grid-cols-12 gap-4">
        
        {/* Breadcrumb */}
        <div className="col-span-12 flex items-center gap-2">
          <WFText width="w-20" height="h-3" />
          <WFText width="w-4" height="h-3" />
          <WFText width="w-32" height="h-3" />
        </div>

        {/* Form Header */}
        <div className="col-span-12 flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-6 w-48 bg-[#9E9E9E] rounded" />
            <WFText width="w-64" height="h-3" />
          </div>
          <div className="flex gap-2">
            <WFButton variant="ghost" width="w-24" />
            <WFButton variant="ghost" width="w-32" />
            <WFButton variant="primary" width="w-28" />
          </div>
        </div>

        {/* Progress Steps */}
        <div className="col-span-12 flex items-center justify-center gap-4 py-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${i === 0 ? 'bg-[#9E9E9E]' : 'bg-[#E0E0E0]'}`}>
                <span className="text-xs text-[#F5F5F5]">{i + 1}</span>
              </div>
              <WFText width="w-20" height="h-3" />
              {i < 3 && <div className="w-16 h-px bg-[#BDBDBD]" />}
            </div>
          ))}
        </div>

        {/* Main Form - 8 columns */}
        <div className="col-span-8 space-y-4">
          {/* Basic Information */}
          <WFCard>
            <WFHeading width="w-36" />
            <div className="grid grid-cols-2 gap-4 mt-4">
              {/* Document Title */}
              <div className="col-span-2 space-y-2">
                <WFText width="w-24" height="h-3" />
                <WFInput />
              </div>
              
              {/* Document Type */}
              <div className="space-y-2">
                <WFText width="w-28" height="h-3" />
                <div className="h-9 w-full border border-[#BDBDBD] rounded flex items-center justify-between px-3">
                  <WFText width="w-24" height="h-3" />
                  <WFIcon size="h-4 w-4" />
                </div>
              </div>
              
              {/* Category */}
              <div className="space-y-2">
                <WFText width="w-20" height="h-3" />
                <div className="h-9 w-full border border-[#BDBDBD] rounded flex items-center justify-between px-3">
                  <WFText width="w-28" height="h-3" />
                  <WFIcon size="h-4 w-4" />
                </div>
              </div>
              
              {/* Description */}
              <div className="col-span-2 space-y-2">
                <WFText width="w-24" height="h-3" />
                <div className="h-24 w-full border border-[#BDBDBD] rounded bg-[#F5F5F5]" />
              </div>
              
              {/* Department */}
              <div className="space-y-2">
                <WFText width="w-24" height="h-3" />
                <div className="h-9 w-full border border-[#BDBDBD] rounded flex items-center justify-between px-3">
                  <WFText width="w-32" height="h-3" />
                  <WFIcon size="h-4 w-4" />
                </div>
              </div>
              
              {/* Due Date */}
              <div className="space-y-2">
                <WFText width="w-20" height="h-3" />
                <div className="h-9 w-full border border-[#BDBDBD] rounded flex items-center justify-between px-3">
                  <WFText width="w-24" height="h-3" />
                  <WFIcon size="h-4 w-4" />
                </div>
              </div>
            </div>
          </WFCard>

          {/* File Upload */}
          <WFCard>
            <WFHeading width="w-28" />
            <div className="mt-4">
              {/* Dropzone */}
              <div className="border-2 border-dashed border-[#BDBDBD] rounded-lg p-8 flex flex-col items-center justify-center">
                <div className="h-12 w-12 bg-[#E0E0E0] rounded-lg mb-3" />
                <WFText width="w-48" height="h-3" />
                <WFText width="w-40" height="h-2" />
                <WFButton variant="ghost" width="w-32" />
              </div>
              
              {/* Uploaded Files */}
              <div className="mt-4 space-y-2">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 border border-[#E0E0E0] rounded">
                    <div className="h-8 w-8 bg-[#E0E0E0] rounded" />
                    <div className="flex-1 space-y-1">
                      <WFText width="w-40" height="h-3" />
                      <WFText width="w-20" height="h-2" />
                    </div>
                    <div className="h-1 w-32 bg-[#E0E0E0] rounded">
                      <div className="h-1 w-full bg-[#9E9E9E] rounded" />
                    </div>
                    <WFIcon size="h-4 w-4" />
                  </div>
                ))}
              </div>
            </div>
          </WFCard>

          {/* Metadata */}
          <WFCard>
            <WFHeading width="w-24" />
            <div className="grid grid-cols-2 gap-4 mt-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <WFText width="w-24" height="h-3" />
                  <WFInput />
                </div>
              ))}
            </div>
            <button className="mt-4 flex items-center gap-2 text-[#9E9E9E]">
              <WFIcon size="h-4 w-4" />
              <WFText width="w-28" height="h-3" />
            </button>
          </WFCard>
        </div>

        {/* Sidebar - 4 columns */}
        <div className="col-span-4 space-y-4">
          {/* Workflow Assignment */}
          <WFCard>
            <WFHeading width="w-36" />
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <WFText width="w-20" height="h-3" />
                <div className="h-9 w-full border border-[#BDBDBD] rounded flex items-center justify-between px-3">
                  <WFText width="w-32" height="h-3" />
                  <WFIcon size="h-4 w-4" />
                </div>
              </div>
              
              <div className="space-y-2">
                <WFText width="w-24" height="h-3" />
                <div className="h-9 w-full border border-[#BDBDBD] rounded flex items-center justify-between px-3">
                  <WFText width="w-28" height="h-3" />
                  <WFIcon size="h-4 w-4" />
                </div>
              </div>
            </div>
          </WFCard>

          {/* Reviewers */}
          <WFCard>
            <div className="flex items-center justify-between mb-4">
              <WFHeading width="w-24" />
              <WFButton variant="ghost" width="w-16" />
            </div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2 border border-[#E0E0E0] rounded">
                  <div className="h-8 w-8 bg-[#BDBDBD] rounded-full" />
                  <div className="flex-1 space-y-1">
                    <WFText width="w-24" height="h-3" />
                    <WFText width="w-20" height="h-2" />
                  </div>
                  <WFIcon size="h-4 w-4" />
                </div>
              ))}
            </div>
          </WFCard>

          {/* Settings */}
          <WFCard>
            <WFHeading width="w-20" />
            <div className="space-y-3 mt-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <WFText width="w-32" height="h-3" />
                  <div className="h-5 w-9 bg-[#E0E0E0] rounded-full">
                    <div className="h-5 w-5 bg-[#BDBDBD] rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </WFCard>

          {/* Help */}
          <div className="p-4 bg-[#F5F5F5] border border-[#BDBDBD] rounded">
            <div className="flex items-start gap-3">
              <WFIcon size="h-5 w-5" />
              <div className="space-y-1">
                <WFText width="w-20" height="h-3" />
                <WFText width="w-full" height="h-2" />
                <WFText width="w-3/4" height="h-2" />
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </WireframeLayout>
  );
}
