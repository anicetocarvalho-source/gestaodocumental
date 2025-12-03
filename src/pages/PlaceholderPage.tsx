import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  subtitle?: string;
}

const PlaceholderPage = ({ title, subtitle }: PlaceholderPageProps) => {
  return (
    <DashboardLayout 
      title={title} 
      subtitle={subtitle || `${title} management and overview`}
    >
      <Card className="flex min-h-[400px] flex-col items-center justify-center">
        <CardContent className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Construction className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-foreground">Coming Soon</h2>
          <p className="max-w-md text-muted-foreground">
            The {title.toLowerCase()} module is currently under development. 
            Check back soon for updates.
          </p>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default PlaceholderPage;
