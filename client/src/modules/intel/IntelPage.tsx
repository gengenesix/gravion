import { IntelBriefPanel } from "../osint/components/IntelBriefPanel";
import { IPTracePanel } from "../cyber/components/IPTracePanel";

export function IntelPage() {
  return (
    <div className="h-full bg-gray-950 p-4 grid grid-cols-2 gap-4 overflow-auto">
      <div className="flex flex-col gap-4">
        <div className="text-green-400 font-mono text-xs font-bold tracking-widest border-b border-green-900 pb-2">
          ◈ AI INTELLIGENCE AGENT
        </div>
        <IntelBriefPanel />
      </div>
      <div className="flex flex-col gap-4">
        <div className="text-green-400 font-mono text-xs font-bold tracking-widest border-b border-green-900 pb-2">
          ◈ IP GEOLOCATION TRACE
        </div>
        <IPTracePanel />
      </div>
    </div>
  );
}
