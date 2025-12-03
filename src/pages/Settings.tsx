import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Settings as SettingsIcon, 
  User, 
  Shield, 
  Bell, 
  Plug,
  Workflow,
  FileText,
  Database,
  ScrollText,
  Upload,
  AlertTriangle
} from "lucide-react";

const navItems = [
  { icon: SettingsIcon, label: "General", active: true },
  { icon: User, label: "Profile", active: false },
  { icon: Shield, label: "Security", active: false },
  { icon: Bell, label: "Notifications", active: false },
  { icon: Plug, label: "Integrations", active: false },
  { icon: Workflow, label: "Workflow", active: false },
  { icon: FileText, label: "Templates", active: false },
  { icon: Database, label: "Backup", active: false },
  { icon: ScrollText, label: "Audit Log", active: false },
];

const preferences = [
  { label: "Email notifications", description: "Receive email updates for important actions", enabled: true },
  { label: "Two-factor authentication", description: "Add an extra layer of security", enabled: true },
  { label: "Auto-save drafts", description: "Automatically save document drafts", enabled: false },
  { label: "Dark mode", description: "Use dark theme for the interface", enabled: false },
  { label: "Compact view", description: "Show more items with reduced spacing", enabled: false },
];

const Settings = () => {
  return (
    <DashboardLayout 
      title="Settings" 
      subtitle="Manage your account and preferences"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Settings Navigation - 3 columns */}
        <div className="lg:col-span-3">
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted border-b border-border py-3">
              <CardTitle className="text-base">Settings</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <nav aria-label="Settings navigation">
                {navItems.map((item, i) => (
                  <button
                    key={i}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      item.active 
                        ? 'bg-primary-muted text-primary font-medium' 
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                    aria-current={item.active ? 'page' : undefined}
                  >
                    <item.icon className="h-4 w-4" aria-hidden="true" />
                    {item.label}
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Settings Content - 9 columns */}
        <div className="lg:col-span-9 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">General Settings</h2>
              <p className="text-sm text-muted-foreground">Manage your organization settings and preferences</p>
            </div>
            <Button>Save Changes</Button>
          </div>

          {/* Organization Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Organization Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization Name</Label>
                  <Input id="org-name" defaultValue="Government Agency" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-code">Organization Code</Label>
                  <Input id="org-code" defaultValue="GOV-001" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Admin Email</Label>
                  <Input id="admin-email" type="email" defaultValue="admin@gov.org" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" defaultValue="+1 (555) 000-0000" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <textarea 
                    id="address"
                    className="w-full h-24 px-3 py-2 border border-input rounded-md bg-background text-sm resize-none focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    defaultValue="123 Government Street, Capital City, ST 12345"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Branding */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Branding</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Logo Upload */}
                <div className="space-y-3">
                  <Label>Organization Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                      <Upload className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm">
                        Upload Logo
                      </Button>
                      <p className="text-xs text-muted-foreground">PNG, JPG up to 2MB</p>
                    </div>
                  </div>
                </div>
                
                {/* Theme Colors */}
                <div className="space-y-3">
                  <Label>Primary Color</Label>
                  <div className="flex gap-3">
                    {['#1e3a5f', '#2563eb', '#059669', '#dc2626', '#7c3aed'].map((color, i) => (
                      <button
                        key={i}
                        className={`h-10 w-10 rounded-full border-2 transition-all ${i === 0 ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'}`}
                        style={{ backgroundColor: color }}
                        aria-label={`Select color ${color}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {preferences.map((pref, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div className="space-y-0.5">
                      <Label htmlFor={`pref-${i}`} className="text-sm font-medium cursor-pointer">
                        {pref.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">{pref.description}</p>
                    </div>
                    <Switch 
                      id={`pref-${i}`}
                      defaultChecked={pref.enabled}
                      aria-label={pref.label}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Regional Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Regional Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <select 
                    id="language"
                    className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
                  >
                    <option>English (US)</option>
                    <option>English (UK)</option>
                    <option>Portuguese</option>
                    <option>Spanish</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <select 
                    id="timezone"
                    className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
                  >
                    <option>UTC-5 (Eastern Time)</option>
                    <option>UTC-8 (Pacific Time)</option>
                    <option>UTC+0 (GMT)</option>
                    <option>UTC+1 (CET)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-format">Date Format</Label>
                  <select 
                    id="date-format"
                    className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
                  >
                    <option>MM/DD/YYYY</option>
                    <option>DD/MM/YYYY</option>
                    <option>YYYY-MM-DD</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <select 
                    id="currency"
                    className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
                  >
                    <option>USD ($)</option>
                    <option>EUR (€)</option>
                    <option>GBP (£)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-error/50">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="h-10 w-10 bg-error-muted rounded-lg flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-5 w-5 text-error" aria-hidden="true" />
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="text-sm font-semibold text-foreground">Danger Zone</h3>
                  <p className="text-sm text-muted-foreground">
                    Once you delete your organization, there is no going back. All data will be permanently removed.
                    Please be certain before proceeding.
                  </p>
                </div>
                <Button variant="destructive" className="shrink-0">
                  Delete Organization
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
