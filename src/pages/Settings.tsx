import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { AuditLogReference } from "@/components/common/AuditLogReference";
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
  { icon: SettingsIcon, label: "Geral", active: true },
  { icon: User, label: "Perfil", active: false },
  { icon: Shield, label: "Segurança", active: false },
  { icon: Bell, label: "Notificações", active: false },
  { icon: Plug, label: "Integrações", active: false },
  { icon: Workflow, label: "Fluxos", active: false },
  { icon: FileText, label: "Modelos", active: false },
  { icon: Database, label: "Cópia de Segurança", active: false },
  { icon: ScrollText, label: "Registo de Auditoria", active: false },
];

const preferences = [
  { label: "Notificações por email", description: "Receber actualizações por email para acções importantes", enabled: true },
  { label: "Autenticação de dois factores", description: "Adicionar uma camada extra de segurança", enabled: true },
  { label: "Guardar rascunhos automaticamente", description: "Guardar automaticamente rascunhos de documentos", enabled: false },
  { label: "Modo escuro", description: "Utilizar tema escuro na interface", enabled: false },
  { label: "Vista compacta", description: "Mostrar mais itens com espaçamento reduzido", enabled: false },
];

const Settings = () => {
  return (
    <DashboardLayout 
      title="Definições" 
      subtitle="Gerir a sua conta e preferências"
    >
      <PageBreadcrumb items={[{ label: "Definições" }]} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Navegação de Definições - 3 colunas */}
        <div className="lg:col-span-3">
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted border-b border-border py-3">
              <CardTitle className="text-base">Definições</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <nav aria-label="Navegação de definições">
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

        {/* Conteúdo de Definições - 9 colunas */}
        <div className="lg:col-span-9 space-y-6">
          {/* Cabeçalho */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Definições Gerais</h2>
              <p className="text-sm text-muted-foreground">Gerir as definições e preferências da organização</p>
            </div>
            <Button>Guardar Alterações</Button>
          </div>

          {/* Informação da Organização */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Informação da Organização</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Nome da Organização</Label>
                  <Input id="org-name" defaultValue="MINAGRIF" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-code">Código da Organização</Label>
                  <Input id="org-code" defaultValue="MINAGRIF-001" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email do Administrador</Label>
                  <Input id="admin-email" type="email" defaultValue="admin@minagrif.gov.mz" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Número de Telefone</Label>
                  <Input id="phone" type="tel" defaultValue="+258 21 000 000" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="address">Morada</Label>
                  <textarea 
                    id="address"
                    className="w-full h-24 px-3 py-2 border border-input rounded-md bg-background text-sm resize-none focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    defaultValue="Av. 25 de Setembro, Maputo, Moçambique"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Marca */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Marca</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Carregamento de Logótipo */}
                <div className="space-y-3">
                  <Label>Logótipo da Organização</Label>
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                      <Upload className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm">
                        Carregar Logótipo
                      </Button>
                      <p className="text-xs text-muted-foreground">PNG, JPG até 2MB</p>
                    </div>
                  </div>
                </div>
                
                {/* Cores do Tema */}
                <div className="space-y-3">
                  <Label>Cor Principal</Label>
                  <div className="flex gap-3">
                    {['#1e3a5f', '#2563eb', '#059669', '#dc2626', '#7c3aed'].map((color, i) => (
                      <button
                        key={i}
                        className={`h-10 w-10 rounded-full border-2 transition-all ${i === 0 ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'}`}
                        style={{ backgroundColor: color }}
                        aria-label={`Seleccionar cor ${color}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preferências */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Preferências</CardTitle>
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

          {/* Definições Regionais */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Definições Regionais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Idioma</Label>
                  <select 
                    id="language"
                    className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
                  >
                    <option>Português (Portugal)</option>
                    <option>Português (Brasil)</option>
                    <option>Inglês (EUA)</option>
                    <option>Espanhol</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuso Horário</Label>
                  <select 
                    id="timezone"
                    className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
                  >
                    <option>UTC+2 (CAT - Hora da África Central)</option>
                    <option>UTC+0 (GMT)</option>
                    <option>UTC+1 (CET)</option>
                    <option>UTC-3 (BRT)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-format">Formato de Data</Label>
                  <select 
                    id="date-format"
                    className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
                  >
                    <option>DD/MM/AAAA</option>
                    <option>AAAA-MM-DD</option>
                    <option>MM/DD/AAAA</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Moeda</Label>
                  <select 
                    id="currency"
                    className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
                  >
                    <option>MZN (MT)</option>
                    <option>USD ($)</option>
                    <option>EUR (€)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Zona de Perigo */}
          <Card className="border-error/50">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="h-10 w-10 bg-error-muted rounded-lg flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-5 w-5 text-error" aria-hidden="true" />
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="text-sm font-semibold text-foreground">Zona de Perigo</h3>
                  <p className="text-sm text-muted-foreground">
                    Uma vez eliminada a organização, não há volta atrás. Todos os dados serão permanentemente removidos.
                    Por favor, tenha a certeza antes de prosseguir.
                  </p>
                </div>
                <Button variant="destructive" className="shrink-0">
                  Eliminar Organização
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Referência ao Registo de Auditoria */}
          <AuditLogReference context="Ver histórico de alterações de definições" />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
