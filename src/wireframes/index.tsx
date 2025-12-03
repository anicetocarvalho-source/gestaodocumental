import { useState } from "react";
import { WF01Dashboard } from "./WF01Dashboard";
import { WF02DocumentList } from "./WF02DocumentList";
import { WF03DocumentDetail } from "./WF03DocumentDetail";
import { WF04ProcessList } from "./WF04ProcessList";
import { WF05ProcessDetail } from "./WF05ProcessDetail";
import { WF06DispatchManagement } from "./WF06DispatchManagement";
import { WF07CreateForm } from "./WF07CreateForm";
import { WF08ApprovalQueue } from "./WF08ApprovalQueue";
import { WF09UserManagement } from "./WF09UserManagement";
import { WF10Settings } from "./WF10Settings";
import { WF11SearchResults } from "./WF11SearchResults";

const wireframes = [
  { id: 1, name: "Dashboard", component: WF01Dashboard },
  { id: 2, name: "Document List", component: WF02DocumentList },
  { id: 3, name: "Document Detail", component: WF03DocumentDetail },
  { id: 4, name: "Process List", component: WF04ProcessList },
  { id: 5, name: "Process Detail", component: WF05ProcessDetail },
  { id: 6, name: "Dispatch Management", component: WF06DispatchManagement },
  { id: 7, name: "Create Form", component: WF07CreateForm },
  { id: 8, name: "Approval Queue", component: WF08ApprovalQueue },
  { id: 9, name: "User Management", component: WF09UserManagement },
  { id: 10, name: "Settings", component: WF10Settings },
  { id: 11, name: "Search Results", component: WF11SearchResults },
];

export function WireframeGallery() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const CurrentWireframe = wireframes[currentIndex].component;

  return (
    <div className="font-mono">
      {/* Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#424242] text-white px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold">WIREFRAME GALLERY</span>
          <span className="text-xs text-[#9E9E9E]">
            {currentIndex + 1} of {wireframes.length}
          </span>
        </div>
        
        {/* Screen Selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="px-3 py-1 bg-[#616161] hover:bg-[#757575] disabled:opacity-50 rounded text-sm"
          >
            ← Prev
          </button>
          
          <select
            value={currentIndex}
            onChange={(e) => setCurrentIndex(Number(e.target.value))}
            className="bg-[#616161] text-white px-3 py-1 rounded text-sm"
          >
            {wireframes.map((wf, i) => (
              <option key={wf.id} value={i}>
                {wf.id}. {wf.name}
              </option>
            ))}
          </select>
          
          <button
            onClick={() => setCurrentIndex(Math.min(wireframes.length - 1, currentIndex + 1))}
            disabled={currentIndex === wireframes.length - 1}
            className="px-3 py-1 bg-[#616161] hover:bg-[#757575] disabled:opacity-50 rounded text-sm"
          >
            Next →
          </button>
        </div>
        
        {/* Thumbnail Navigation */}
        <div className="flex gap-1">
          {wireframes.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`h-2 w-2 rounded-full ${i === currentIndex ? 'bg-white' : 'bg-[#757575]'}`}
            />
          ))}
        </div>
      </div>
      
      {/* Wireframe Content */}
      <div className="pt-10">
        <CurrentWireframe />
      </div>
    </div>
  );
}

export default WireframeGallery;
