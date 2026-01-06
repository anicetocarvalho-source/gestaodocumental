import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
  AlertTriangle,
  Key,
  Smartphone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  ExternalLink
} from "lucide-react";

type SettingsSection = 
  | "geral" 
  | "perfil" 
  | "seguranca" 
  | "notificacoes" 
  | "integracoes" 
  | "fluxos" 
  | "modelos" 
  | "backup" 
  | "auditoria";

const navItems: { icon: typeof SettingsIcon; label: string; section: SettingsSection }[] = [
  { icon: SettingsIcon, label: "Geral", section: "geral" },
  { icon: User, label: "Perfil", section: "perfil" },
  { icon: Shield, label: "Segurança", section: "seguranca" },
  { icon: Bell, label: "Notificações", section: "notificacoes" },
  { icon: Plug, label: "Integrações", section: "integracoes" },
  { icon: Workflow, label: "Fluxos", section: "fluxos" },
  { icon: FileText, label: "Modelos", section: "modelos" },
  { icon: Database, label: "Cópia de Segurança", section: "backup" },
  { icon: ScrollText, label: "Registo de Auditoria", section: "auditoria" },
];

const Settings = () => {
  const [activeSection, setActiveSection] = useState<SettingsSection>("geral");

  const renderContent = () => {
    switch (activeSection) {
      case "geral":
        return <GeralSection />;
      case "perfil":
        return <PerfilSection />;
      case "seguranca":
        return <SegurancaSection />;
      case "notificacoes":
        return <NotificacoesSection />;
      case "integracoes":
        return <IntegracoesSection />;
      case "fluxos":
        return <FluxosSection />;
      case "modelos":
        return <ModelosSection />;
      case "backup":
        return <BackupSection />;
      case "auditoria":
        return <AuditoriaSection />;
      default:
        return <GeralSection />;
    }
  };

  const getSectionTitle = () => {
    const item = navItems.find(n => n.section === activeSection);
    return item?.label || "Definições";
  };

  return (
    <DashboardLayout 
      title="Definições" 
      subtitle="Gerir a sua conta e preferências"
    >
      <PageBreadcrumb items={[{ label: "Definições" }, { label: getSectionTitle() }]} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Navegação de Definições - 3 colunas */}
        <div className="lg:col-span-3">
          <Card className="overflow-hidden sticky top-4">
            <CardHeader className="bg-muted border-b border-border py-3">
              <CardTitle className="text-base">Definições</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <nav aria-label="Navegação de definições">
                {navItems.map((item) => (
                  <button
                    key={item.section}
                    onClick={() => setActiveSection(item.section)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeSection === item.section 
                        ? 'bg-primary-muted text-primary font-medium' 
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                    aria-current={activeSection === item.section ? 'page' : undefined}
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
          {renderContent()}
        </div>
      </div>
    </DashboardLayout>
  );
};

// ========== SECÇÃO GERAL ==========
const GeralSection = () => {
  const preferences = [
    { label: "Guardar rascunhos automaticamente", description: "Guardar automaticamente rascunhos de documentos", enabled: false },
    { label: "Modo escuro", description: "Utilizar tema escuro na interface", enabled: false },
    { label: "Vista compacta", description: "Mostrar mais itens com espaçamento reduzido", enabled: false },
  ];

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Definições Gerais</h2>
          <p className="text-sm text-muted-foreground">Gerir as definições e preferências da organização</p>
        </div>
        <Button>Guardar Alterações</Button>
      </div>

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

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Marca</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>Logótipo da Organização</Label>
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                  <Upload className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                </div>
                <div className="space-y-2">
                  <Button variant="outline" size="sm">Carregar Logótipo</Button>
                  <p className="text-xs text-muted-foreground">PNG, JPG até 2MB</p>
                </div>
              </div>
            </div>
            
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

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Preferências</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {preferences.map((pref, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div className="space-y-0.5">
                  <Label htmlFor={`pref-${i}`} className="text-sm font-medium cursor-pointer">{pref.label}</Label>
                  <p className="text-xs text-muted-foreground">{pref.description}</p>
                </div>
                <Switch id={`pref-${i}`} defaultChecked={pref.enabled} aria-label={pref.label} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Definições Regionais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language">Idioma</Label>
              <select id="language" className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm">
                <option>Português (Portugal)</option>
                <option>Português (Brasil)</option>
                <option>Inglês (EUA)</option>
                <option>Espanhol</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Fuso Horário</Label>
              <select id="timezone" className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm">
                <option>UTC+2 (CAT - Hora da África Central)</option>
                <option>UTC+0 (GMT)</option>
                <option>UTC+1 (CET)</option>
                <option>UTC-3 (BRT)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-format">Formato de Data</Label>
              <select id="date-format" className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm">
                <option>DD/MM/AAAA</option>
                <option>AAAA-MM-DD</option>
                <option>MM/DD/AAAA</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Moeda</Label>
              <select id="currency" className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm">
                <option>MZN (MT)</option>
                <option>USD ($)</option>
                <option>EUR (€)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

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
              </p>
            </div>
            <Button variant="destructive" className="shrink-0">Eliminar Organização</Button>
          </div>
        </CardContent>
      </Card>

      <AuditLogReference context="Ver histórico de alterações de definições" />
    </>
  );
};

// ========== SECÇÃO PERFIL ==========
const PerfilSection = () => {
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Perfil do Utilizador</h2>
          <p className="text-sm text-muted-foreground">Gerir as suas informações pessoais</p>
        </div>
        <Button>Guardar Alterações</Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Informação Pessoal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6 mb-6">
            <div className="h-24 w-24 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold shrink-0">
              MS
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Foto de Perfil</h3>
              <p className="text-sm text-muted-foreground">JPG, PNG ou GIF. Máximo 2MB.</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Carregar Foto</Button>
                <Button variant="ghost" size="sm" className="text-destructive">Remover</Button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first-name">Nome</Label>
              <Input id="first-name" defaultValue="Maria" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last-name">Apelido</Label>
              <Input id="last-name" defaultValue="Silva" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-email">Email</Label>
              <Input id="user-email" type="email" defaultValue="maria.silva@minagrif.gov.mz" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-phone">Telefone</Label>
              <Input id="user-phone" type="tel" defaultValue="+258 84 000 0000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Departamento</Label>
              <Input id="department" defaultValue="Gabinete do Ministro" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Cargo</Label>
              <Input id="position" defaultValue="Directora de Expediente" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Assinatura Digital</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-success-muted rounded-lg flex items-center justify-center">
                  <Key className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="font-medium">Certificado Digital</p>
                  <p className="text-sm text-muted-foreground">Válido até 15/12/2025</p>
                </div>
              </div>
              <Badge variant="success">Activo</Badge>
            </div>
            <Button variant="outline">Renovar Certificado</Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

// ========== SECÇÃO SEGURANÇA ==========
const SegurancaSection = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Segurança</h2>
          <p className="text-sm text-muted-foreground">Gerir a segurança da sua conta</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Alterar Palavra-passe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="current-password">Palavra-passe Actual</Label>
              <div className="relative">
                <Input 
                  id="current-password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Palavra-passe</Label>
              <Input id="new-password" type="password" placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Nova Palavra-passe</Label>
              <Input id="confirm-password" type="password" placeholder="••••••••" />
            </div>
            <Button>Actualizar Palavra-passe</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            Autenticação de Dois Factores (2FA)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-success/50 bg-success-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-success-muted rounded-lg flex items-center justify-center">
                  <Check className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="font-medium">Autenticação por SMS</p>
                  <p className="text-sm text-muted-foreground">Terminado em ****0000</p>
                </div>
              </div>
              <Badge variant="success">Activo</Badge>
            </div>
            
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center">
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Aplicação Autenticadora</p>
                  <p className="text-sm text-muted-foreground">Google Authenticator, Authy, etc.</p>
                </div>
              </div>
              <Button variant="outline" size="sm">Configurar</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Sessões Activas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { device: "Chrome no Windows", location: "Maputo, MZ", current: true, date: "Agora" },
              { device: "Safari no iPhone", location: "Maputo, MZ", current: false, date: "Há 2 horas" },
              { device: "Firefox no Linux", location: "Beira, MZ", current: false, date: "Ontem às 14:30" },
            ].map((session, i) => (
              <div key={i} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{session.device}</p>
                    {session.current && <Badge variant="info" className="text-xs">Sessão actual</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{session.location} • {session.date}</p>
                </div>
                {!session.current && (
                  <Button variant="ghost" size="sm" className="text-destructive">Terminar</Button>
                )}
              </div>
            ))}
          </div>
          <Button variant="outline" className="mt-4">Terminar Todas as Outras Sessões</Button>
        </CardContent>
      </Card>
    </>
  );
};

// ========== SECÇÃO NOTIFICAÇÕES ==========
const NotificacoesSection = () => {
  const notifications = [
    { category: "Documentos", items: [
      { label: "Novo documento recebido", email: true, push: true, sms: false },
      { label: "Documento requer aprovação", email: true, push: true, sms: true },
      { label: "Documento assinado", email: true, push: false, sms: false },
    ]},
    { category: "Processos", items: [
      { label: "Processo atribuído", email: true, push: true, sms: false },
      { label: "Prazo a expirar", email: true, push: true, sms: true },
      { label: "Processo concluído", email: true, push: false, sms: false },
    ]},
    { category: "Sistema", items: [
      { label: "Actualizações de segurança", email: true, push: false, sms: false },
      { label: "Manutenção programada", email: true, push: true, sms: false },
      { label: "Relatórios semanais", email: true, push: false, sms: false },
    ]},
  ];

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Notificações</h2>
          <p className="text-sm text-muted-foreground">Escolha como deseja ser notificado</p>
        </div>
        <Button>Guardar Preferências</Button>
      </div>

      {notifications.map((group) => (
        <Card key={group.category}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{group.category}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="grid grid-cols-4 gap-4 pb-2 border-b border-border text-sm font-medium text-muted-foreground">
                <div className="col-span-1">Notificação</div>
                <div className="text-center">Email</div>
                <div className="text-center">Push</div>
                <div className="text-center">SMS</div>
              </div>
              {group.items.map((item, i) => (
                <div key={i} className="grid grid-cols-4 gap-4 py-3 border-b border-border last:border-0 items-center">
                  <div className="col-span-1 text-sm">{item.label}</div>
                  <div className="flex justify-center">
                    <Switch defaultChecked={item.email} aria-label={`${item.label} por email`} />
                  </div>
                  <div className="flex justify-center">
                    <Switch defaultChecked={item.push} aria-label={`${item.label} por push`} />
                  </div>
                  <div className="flex justify-center">
                    <Switch defaultChecked={item.sms} aria-label={`${item.label} por SMS`} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
};

// ========== SECÇÃO INTEGRAÇÕES ==========
const IntegracoesSection = () => {
  const integrations = [
    { name: "Microsoft 365", description: "Sincronizar com Outlook, OneDrive e SharePoint", connected: true, icon: "M" },
    { name: "Google Workspace", description: "Integrar com Gmail, Drive e Calendar", connected: false, icon: "G" },
    { name: "SIGOF", description: "Sistema de Gestão Orçamental e Financeira", connected: true, icon: "S" },
    { name: "eSISTAFE", description: "Sistema de Administração Financeira do Estado", connected: true, icon: "E" },
    { name: "Portal do Governo", description: "Integração com portal gov.mz", connected: false, icon: "P" },
  ];

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Integrações</h2>
          <p className="text-sm text-muted-foreground">Conectar com sistemas externos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((integration) => (
          <Card key={integration.name}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 bg-primary-muted rounded-lg flex items-center justify-center text-primary font-bold text-lg shrink-0">
                  {integration.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-medium">{integration.name}</h3>
                    {integration.connected ? (
                      <Badge variant="success">Conectado</Badge>
                    ) : (
                      <Badge variant="secondary">Desconectado</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{integration.description}</p>
                  <div className="mt-3">
                    {integration.connected ? (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Configurar</Button>
                        <Button variant="ghost" size="sm" className="text-destructive">Desconectar</Button>
                      </div>
                    ) : (
                      <Button size="sm">
                        <Plug className="h-4 w-4 mr-2" />
                        Conectar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">API e Webhooks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Label>Chave de API</Label>
                <Button variant="ghost" size="sm">Regenerar</Button>
              </div>
              <code className="text-sm font-mono bg-background p-2 rounded block overflow-x-auto">
                sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
              </code>
            </div>
            <Button variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver Documentação da API
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

// ========== SECÇÃO FLUXOS ==========
const FluxosSection = () => {
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Fluxos de Trabalho</h2>
          <p className="text-sm text-muted-foreground">Configurar fluxos e automações</p>
        </div>
        <Button>Novo Fluxo</Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Workflow className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">Gerir Fluxos de Trabalho</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Configure e personalize os fluxos de aprovação e tramitação de documentos.
            </p>
            <Button variant="outline">Ir para Configuração de Fluxos</Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

// ========== SECÇÃO MODELOS ==========
const ModelosSection = () => {
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Modelos de Documentos</h2>
          <p className="text-sm text-muted-foreground">Gerir modelos e templates</p>
        </div>
        <Button>Novo Modelo</Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">Biblioteca de Modelos</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Crie e gira modelos de documentos para agilizar a criação de novos documentos.
            </p>
            <Button variant="outline">Ver Modelos</Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

// ========== SECÇÃO BACKUP ==========
const BackupSection = () => {
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Cópia de Segurança</h2>
          <p className="text-sm text-muted-foreground">Gerir backups e recuperação de dados</p>
        </div>
        <Button>Criar Backup Agora</Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Backups Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { date: "06 Jan 2026, 02:00", size: "2.4 GB", type: "Automático", status: "success" },
              { date: "05 Jan 2026, 02:00", size: "2.3 GB", type: "Automático", status: "success" },
              { date: "04 Jan 2026, 02:00", size: "2.3 GB", type: "Automático", status: "success" },
              { date: "03 Jan 2026, 15:30", size: "2.2 GB", type: "Manual", status: "success" },
            ].map((backup, i) => (
              <div key={i} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-success-muted rounded-lg flex items-center justify-center">
                    <Database className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="font-medium">{backup.date}</p>
                    <p className="text-sm text-muted-foreground">{backup.size} • {backup.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">Restaurar</Button>
                  <Button variant="ghost" size="sm">Baixar</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Configuração de Backup Automático</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Backup Automático Diário</p>
                <p className="text-sm text-muted-foreground">Executar às 02:00</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Retenção de Backups</p>
                <p className="text-sm text-muted-foreground">Manter últimos 30 dias</p>
              </div>
              <Button variant="outline" size="sm">Configurar</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

// ========== SECÇÃO AUDITORIA ==========
const AuditoriaSection = () => {
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Registo de Auditoria</h2>
          <p className="text-sm text-muted-foreground">Ver histórico de actividades do sistema</p>
        </div>
        <Button variant="outline">Exportar Registos</Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <ScrollText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">Registos de Auditoria</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Aceda ao histórico completo de actividades e alterações no sistema.
            </p>
            <Button variant="outline" asChild>
              <a href="/audit-logs">Ver Registos Completos</a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <AuditLogReference context="Ver histórico completo de auditoria" />
    </>
  );
};

export default Settings;
