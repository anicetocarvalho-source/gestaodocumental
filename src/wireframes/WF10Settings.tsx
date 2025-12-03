import { WireframeLayout, WFCard, WFHeading, WFText, WFButton, WFIcon, WFInput } from "./WireframeLayout";

export function WF10Settings() {
  return (
    <WireframeLayout title="Settings" screenNumber={10}>
      <div className="grid grid-cols-12 gap-4">
        
        {/* Settings Navigation - 3 columns */}
        <div className="col-span-3">
          <WFCard className="p-0 overflow-hidden">
            <div className="p-4 bg-[#F5F5F5] border-b border-[#BDBDBD]">
              <WFHeading width="w-20" />
            </div>
            <div className="p-2">
              {[
                'General',
                'Profile',
                'Security',
                'Notifications',
                'Integrations',
                'Workflow',
                'Templates',
                'Backup',
                'Audit Log',
              ].map((item, i) => (
                <div
                  key={item}
                  className={`flex items-center gap-3 px-3 py-2 rounded cursor-pointer ${i === 0 ? 'bg-[#E0E0E0]' : 'hover:bg-[#F5F5F5]'}`}
                >
                  <WFIcon size="h-4 w-4" />
                  <WFText width="w-20" height="h-3" />
                </div>
              ))}
            </div>
          </WFCard>
        </div>

        {/* Settings Content - 9 columns */}
        <div className="col-span-9 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <WFHeading width="w-36" />
              <WFText width="w-64" height="h-3" />
            </div>
            <WFButton variant="primary" width="w-32" />
          </div>

          {/* Organization Settings */}
          <WFCard>
            <WFHeading width="w-40" />
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <WFText width="w-32" height="h-3" />
                <WFInput />
              </div>
              <div className="space-y-2">
                <WFText width="w-28" height="h-3" />
                <WFInput />
              </div>
              <div className="space-y-2">
                <WFText width="w-24" height="h-3" />
                <WFInput />
              </div>
              <div className="space-y-2">
                <WFText width="w-20" height="h-3" />
                <WFInput />
              </div>
              <div className="col-span-2 space-y-2">
                <WFText width="w-20" height="h-3" />
                <div className="h-24 w-full border border-[#BDBDBD] rounded bg-[#F5F5F5]" />
              </div>
            </div>
          </WFCard>

          {/* Branding */}
          <WFCard>
            <WFHeading width="w-24" />
            <div className="grid grid-cols-2 gap-6 mt-4">
              {/* Logo Upload */}
              <div className="space-y-2">
                <WFText width="w-16" height="h-3" />
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 bg-[#E0E0E0] rounded-lg flex items-center justify-center">
                    <WFIcon size="h-8 w-8" />
                  </div>
                  <div className="space-y-2">
                    <WFButton variant="ghost" width="w-24" />
                    <WFText width="w-32" height="h-2" />
                  </div>
                </div>
              </div>
              
              {/* Theme */}
              <div className="space-y-2">
                <WFText width="w-20" height="h-3" />
                <div className="flex gap-3">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-10 w-10 rounded-full border-2 ${i === 0 ? 'border-[#9E9E9E]' : 'border-[#E0E0E0]'}`}
                      style={{ backgroundColor: `hsl(0, 0%, ${60 + i * 10}%)` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </WFCard>

          {/* Preferences */}
          <WFCard>
            <WFHeading width="w-28" />
            <div className="space-y-4 mt-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-[#E0E0E0]">
                  <div className="space-y-1">
                    <WFText width="w-40" height="h-3" />
                    <WFText width="w-64" height="h-2" />
                  </div>
                  {i < 3 ? (
                    <div className="h-6 w-11 bg-[#E0E0E0] rounded-full relative">
                      <div className={`h-5 w-5 bg-[#9E9E9E] rounded-full absolute top-0.5 ${i === 0 ? 'right-0.5' : 'left-0.5'}`} />
                    </div>
                  ) : (
                    <div className="h-9 w-40 border border-[#BDBDBD] rounded flex items-center justify-between px-3">
                      <WFText width="w-24" height="h-3" />
                      <WFIcon size="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </WFCard>

          {/* Danger Zone */}
          <WFCard className="border-[#E0E0E0]">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 bg-[#E0E0E0] rounded-lg" />
              <div className="flex-1 space-y-1">
                <WFText width="w-24" height="h-4" />
                <WFText width="w-full" height="h-2" />
                <WFText width="w-3/4" height="h-2" />
              </div>
              <WFButton variant="secondary" width="w-32" />
            </div>
          </WFCard>
        </div>
        
      </div>
    </WireframeLayout>
  );
}
