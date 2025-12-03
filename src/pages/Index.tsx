import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentDocuments } from "@/components/dashboard/RecentDocuments";
import { ActiveProcesses } from "@/components/dashboard/ActiveProcesses";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { FileText, FolderOpen, ClipboardList, Users, CheckCircle, Clock } from "lucide-react";

const Index = () => {
  return (
    <DashboardLayout 
      title="Dashboard" 
      subtitle="Welcome back, John. Here's your overview."
    >
      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title="Total Documents"
          value="1,284"
          icon={FileText}
          trend={{ value: 12, isPositive: true }}
          description="from last month"
          variant="default"
        />
        <StatCard
          title="Active Folders"
          value="48"
          icon={FolderOpen}
          trend={{ value: 3, isPositive: true }}
          description="from last month"
          variant="info"
        />
        <StatCard
          title="Active Processes"
          value="23"
          icon={ClipboardList}
          variant="warning"
        />
        <StatCard
          title="Pending Reviews"
          value="7"
          icon={Clock}
          variant="error"
        />
        <StatCard
          title="Completed Today"
          value="15"
          icon={CheckCircle}
          variant="success"
        />
        <StatCard
          title="Team Members"
          value="42"
          icon={Users}
          variant="info"
        />
      </div>

      {/* Quick Actions */}
      <div className="mt-6">
        <QuickActions />
      </div>

      {/* Main Content Grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Recent Documents - Takes 2 columns */}
        <div className="lg:col-span-2">
          <RecentDocuments />
        </div>
        
        {/* Activity Feed - Takes 1 column */}
        <div>
          <ActivityFeed />
        </div>
      </div>

      {/* Active Processes */}
      <div className="mt-6">
        <ActiveProcesses />
      </div>
    </DashboardLayout>
  );
};

export default Index;
