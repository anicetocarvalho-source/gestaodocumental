import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { AuditLogReference } from "@/components/common/AuditLogReference";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationPreferencesPanel } from "@/components/notifications/NotificationPreferencesPanel";
import { 
  useOrganizationSettings, 
  useSaveOrganizationSettings,
  useDocumentTemplates,
  useCreateDocumentTemplate,
  useUpdateDocumentTemplate,
  useDeleteDocumentTemplate,
  useIntegrationConnections,
  useToggleIntegration,
} from "@/hooks/useSettings";
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
  Lock,
  Eye,
  EyeOff,
  Check,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";

// Animation variants with proper typing
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0
  }
};

const cardHoverVariants: Variants = {
  rest: { scale: 1 },
  hover: { 
    scale: 1.01
  }
};

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
                  <motion.button
                    key={item.section}
                    onClick={() => setActiveSection(item.section)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeSection === item.section 
                        ? 'bg-primary-muted text-primary font-medium' 
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                    aria-current={activeSection === item.section ? 'page' : undefined}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.div
                      animate={activeSection === item.section ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      <item.icon className="h-4 w-4" aria-hidden="true" />
                    </motion.div>
                    {item.label}
                  </motion.button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Conteúdo de Definições - 9 colunas */}
        <div className="lg:col-span-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={containerVariants}
              className="space-y-6"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
};

// ========== SCHEMAS DE VALIDAÇÃO ==========
const organizacaoSchema = z.object({
  orgName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome muito longo"),
  orgCode: z.string().min(3, "Código deve ter pelo menos 3 caracteres").max(20, "Código muito longo"),
  adminEmail: z.string().email("Email inválido"),
  phone: z.string().min(9, "Telefone deve ter pelo menos 9 dígitos").max(20, "Telefone muito longo"),
  address: z.string().min(5, "Morada deve ter pelo menos 5 caracteres").max(200, "Morada muito longa"),
});

const perfilSchema = z.object({
  fullName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome muito longo"),
  phone: z.string().max(20, "Telefone muito longo").optional().or(z.literal("")),
  position: z.string().max(100, "Cargo muito longo").optional().or(z.literal("")),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(8, "Palavra-passe deve ter pelo menos 8 caracteres"),
  newPassword: z.string()
    .min(8, "Nova palavra-passe deve ter pelo menos 8 caracteres")
    .regex(/[A-Z]/, "Deve conter pelo menos uma letra maiúscula")
    .regex(/[a-z]/, "Deve conter pelo menos uma letra minúscula")
    .regex(/[0-9]/, "Deve conter pelo menos um número"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As palavras-passe não coincidem",
  path: ["confirmPassword"],
});

// ========== COMPONENTE DE INPUT COM FEEDBACK ==========
interface FormInputProps {
  label: string;
  error?: string;
  children: React.ReactNode;
}

const FormInputWrapper = ({ label, error, children }: FormInputProps) => (
  <motion.div 
    className="space-y-2"
    initial={false}
    animate={error ? { x: [0, -5, 5, -5, 5, 0] } : {}}
    transition={{ duration: 0.4 }}
  >
    <Label className={error ? "text-destructive" : ""}>{label}</Label>
    {children}
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="flex items-center gap-1 text-destructive text-sm"
        >
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);

// ========== SECÇÃO GERAL ==========
const GeralSection = () => {
  const { data: settings, isLoading } = useOrganizationSettings();
  const saveSettings = useSaveOrganizationSettings();

  const form = useForm<z.infer<typeof organizacaoSchema>>({
    resolver: zodResolver(organizacaoSchema),
    defaultValues: {
      orgName: "",
      orgCode: "",
      adminEmail: "",
      phone: "",
      address: "",
    },
  });

  const [preferences, setPreferences] = useState({
    auto_save_drafts: false,
    dark_mode: false,
    compact_view: false,
  });

  // Load data from database
  useEffect(() => {
    if (settings) {
      form.reset({
        orgName: settings.org_name,
        orgCode: settings.org_code,
        adminEmail: settings.admin_email,
        phone: settings.phone,
        address: settings.address,
      });
      setPreferences({
        auto_save_drafts: settings.auto_save_drafts,
        dark_mode: settings.dark_mode,
        compact_view: settings.compact_view,
      });
    }
  }, [settings, form]);

  const onSubmit = async (data: z.infer<typeof organizacaoSchema>) => {
    try {
      await saveSettings.mutateAsync({
        org_name: data.orgName,
        org_code: data.orgCode,
        admin_email: data.adminEmail,
        phone: data.phone,
        address: data.address,
      });
      toast({
        title: "Alterações guardadas",
        description: "As definições da organização foram actualizadas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível guardar as alterações.",
        variant: "destructive",
      });
    }
  };

  const handlePreferenceChange = async (key: keyof typeof preferences, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    try {
      await saveSettings.mutateAsync({ [key]: value });
    } catch (error) {
      // Revert on error
      setPreferences(prev => ({ ...prev, [key]: !value }));
    }
  };

  const preferencesList = [
    { key: 'auto_save_drafts' as const, label: "Guardar rascunhos automaticamente", description: "Guardar automaticamente rascunhos de documentos" },
    { key: 'dark_mode' as const, label: "Modo escuro", description: "Utilizar tema escuro na interface" },
    { key: 'compact_view' as const, label: "Vista compacta", description: "Mostrar mais itens com espaçamento reduzido" },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <>
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Definições Gerais</h2>
          <p className="text-sm text-muted-foreground">Gerir as definições e preferências da organização</p>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={saveSettings.isPending}>
            {saveSettings.isPending ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2"
              />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            {saveSettings.isPending ? "A guardar..." : "Guardar Alterações"}
          </Button>
        </motion.div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <motion.div variants={cardHoverVariants} initial="rest" whileHover="hover">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Informação da Organização</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="orgName"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className={fieldState.error ? "text-destructive" : ""}>Nome da Organização</FormLabel>
                        <FormControl>
                          <motion.div
                            animate={fieldState.error ? { x: [0, -5, 5, -5, 5, 0] } : {}}
                            transition={{ duration: 0.4 }}
                          >
                            <Input 
                              {...field} 
                              className={fieldState.error ? "border-destructive focus-visible:ring-destructive" : ""}
                            />
                          </motion.div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="orgCode"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className={fieldState.error ? "text-destructive" : ""}>Código da Organização</FormLabel>
                        <FormControl>
                          <motion.div
                            animate={fieldState.error ? { x: [0, -5, 5, -5, 5, 0] } : {}}
                            transition={{ duration: 0.4 }}
                          >
                            <Input 
                              {...field} 
                              className={fieldState.error ? "border-destructive focus-visible:ring-destructive" : ""}
                            />
                          </motion.div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="adminEmail"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className={fieldState.error ? "text-destructive" : ""}>Email do Administrador</FormLabel>
                        <FormControl>
                          <motion.div
                            animate={fieldState.error ? { x: [0, -5, 5, -5, 5, 0] } : {}}
                            transition={{ duration: 0.4 }}
                          >
                            <Input 
                              type="email"
                              {...field} 
                              className={fieldState.error ? "border-destructive focus-visible:ring-destructive" : ""}
                            />
                          </motion.div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className={fieldState.error ? "text-destructive" : ""}>Número de Telefone</FormLabel>
                        <FormControl>
                          <motion.div
                            animate={fieldState.error ? { x: [0, -5, 5, -5, 5, 0] } : {}}
                            transition={{ duration: 0.4 }}
                          >
                            <Input 
                              type="tel"
                              {...field} 
                              className={fieldState.error ? "border-destructive focus-visible:ring-destructive" : ""}
                            />
                          </motion.div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field, fieldState }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className={fieldState.error ? "text-destructive" : ""}>Morada</FormLabel>
                        <FormControl>
                          <motion.div
                            animate={fieldState.error ? { x: [0, -5, 5, -5, 5, 0] } : {}}
                            transition={{ duration: 0.4 }}
                          >
                            <textarea 
                              {...field}
                              className={`w-full h-24 px-3 py-2 border rounded-md bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                                fieldState.error 
                                  ? "border-destructive focus:ring-destructive/20" 
                                  : "border-input focus:border-primary"
                              }`}
                            />
                          </motion.div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <motion.div variants={cardHoverVariants} initial="rest" whileHover="hover">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Marca</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>Logótipo da Organização</Label>
                  <div className="flex items-center gap-4">
                    <motion.div 
                      className="h-20 w-20 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border cursor-pointer"
                      whileHover={{ scale: 1.05, borderColor: "hsl(var(--primary))" }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Upload className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                    </motion.div>
                    <div className="space-y-2">
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button variant="outline" size="sm">Carregar Logótipo</Button>
                      </motion.div>
                      <p className="text-xs text-muted-foreground">PNG, JPG até 2MB</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label>Cor Principal</Label>
                  <div className="flex gap-3">
                    {['#1e3a5f', '#2563eb', '#059669', '#dc2626', '#7c3aed'].map((color, i) => (
                      <motion.button
                        key={i}
                        className={`h-10 w-10 rounded-full border-2 ${i === 0 ? 'border-foreground' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                        aria-label={`Seleccionar cor ${color}`}
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Preferências</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {preferencesList.map((pref, i) => (
                <motion.div 
                  key={pref.key} 
                  className="flex items-center justify-between py-3 border-b border-border last:border-0"
                  whileHover={{ x: 4, backgroundColor: "hsl(var(--muted) / 0.3)" }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="space-y-0.5">
                    <Label htmlFor={`pref-${i}`} className="text-sm font-medium cursor-pointer">{pref.label}</Label>
                    <p className="text-xs text-muted-foreground">{pref.description}</p>
                  </div>
                  <Switch 
                    id={`pref-${i}`} 
                    checked={preferences[pref.key]} 
                    onCheckedChange={(checked) => handlePreferenceChange(pref.key, checked)}
                    aria-label={pref.label} 
                  />
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
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
      </motion.div>

      <motion.div variants={itemVariants}>
        <motion.div 
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="border-error/50">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <motion.div 
                  className="h-10 w-10 bg-error-muted rounded-lg flex items-center justify-center shrink-0"
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                >
                  <AlertTriangle className="h-5 w-5 text-error" aria-hidden="true" />
                </motion.div>
                <div className="flex-1 space-y-1">
                  <h3 className="text-sm font-semibold text-foreground">Zona de Perigo</h3>
                  <p className="text-sm text-muted-foreground">
                    Uma vez eliminada a organização, não há volta atrás. Todos os dados serão permanentemente removidos.
                  </p>
                </div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button variant="destructive" className="shrink-0">Eliminar Organização</Button>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <AuditLogReference context="Ver histórico de alterações de definições" />
      </motion.div>
    </>
  );
};

// ========== SECÇÃO PERFIL ==========
const PerfilSection = () => {
  const { profile, user, refreshProfile } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof perfilSchema>>({
    resolver: zodResolver(perfilSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      position: "",
    },
  });

  // Load profile data when available
  useEffect(() => {
    if (profile) {
      form.reset({
        fullName: profile.full_name || "",
        phone: profile.phone || "",
        position: profile.position || "",
      });
    }
  }, [profile, form]);

  const onSubmit = async (data: z.infer<typeof perfilSchema>) => {
    if (!profile) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: data.fullName,
          phone: data.phone || null,
          position: data.position || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (error) throw error;

      await refreshProfile();
      
      toast({
        title: "Perfil actualizado",
        description: "As suas informações foram guardadas com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao actualizar perfil",
        description: error.message || "Ocorreu um erro ao guardar as alterações.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !profile) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Ficheiro inválido",
        description: "Por favor, seleccione uma imagem (JPG, PNG ou GIF).",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Ficheiro muito grande",
        description: "O tamanho máximo é 2MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Update profile with avatar URL (add cache buster)
      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
        .eq("id", profile.id);

      if (updateError) throw updateError;

      await refreshProfile();
      
      toast({
        title: "Foto actualizada",
        description: "A sua foto de perfil foi actualizada com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao carregar foto",
        description: error.message || "Ocorreu um erro ao carregar a foto.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user || !profile) return;

    setIsUploadingAvatar(true);
    try {
      // List files in user folder
      const { data: files } = await supabase.storage
        .from("avatars")
        .list(user.id);

      // Delete all avatar files
      if (files && files.length > 0) {
        const filePaths = files.map((f) => `${user.id}/${f.name}`);
        await supabase.storage.from("avatars").remove(filePaths);
      }

      // Update profile to remove avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: null, updated_at: new Date().toISOString() })
        .eq("id", profile.id);

      if (updateError) throw updateError;

      await refreshProfile();
      
      toast({
        title: "Foto removida",
        description: "A sua foto de perfil foi removida.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao remover foto",
        description: error.message || "Ocorreu um erro ao remover a foto.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Perfil do Utilizador</h2>
          <p className="text-sm text-muted-foreground">Gerir as suas informações pessoais</p>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isSaving}>
            {isSaving ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2"
              />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            {isSaving ? "A guardar..." : "Guardar Alterações"}
          </Button>
        </motion.div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <motion.div variants={cardHoverVariants} initial="rest" whileHover="hover">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Informação Pessoal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-6 mb-6">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarUpload}
                  accept="image/*"
                  className="hidden"
                />
                <motion.div 
                  className="h-24 w-24 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold shrink-0 cursor-pointer overflow-hidden relative"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => !isUploadingAvatar && fileInputRef.current?.click()}
                >
                  {isUploadingAvatar ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-8 w-8 border-3 border-primary-foreground border-t-transparent rounded-full"
                    />
                  ) : profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    profile?.full_name ? getInitials(profile.full_name) : "?"
                  )}
                </motion.div>
                <div className="space-y-2">
                  <h3 className="font-medium">Foto de Perfil</h3>
                  <p className="text-sm text-muted-foreground">JPG, PNG ou GIF. Máximo 2MB.</p>
                  <div className="flex gap-2">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                      >
                        {isUploadingAvatar ? "A carregar..." : "Carregar Foto"}
                      </Button>
                    </motion.div>
                    {profile?.avatar_url && (
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive"
                          onClick={handleRemoveAvatar}
                          disabled={isUploadingAvatar}
                        >
                          Remover
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field, fieldState }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className={fieldState.error ? "text-destructive" : ""}>Nome Completo</FormLabel>
                        <FormControl>
                          <motion.div
                            animate={fieldState.error ? { x: [0, -5, 5, -5, 5, 0] } : {}}
                            transition={{ duration: 0.4 }}
                          >
                            <Input 
                              {...field} 
                              className={fieldState.error ? "border-destructive focus-visible:ring-destructive" : ""}
                            />
                          </motion.div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div>
                    <FormLabel>Email</FormLabel>
                    <Input 
                      value={user?.email || profile?.email || ""} 
                      disabled 
                      className="bg-muted/50"
                    />
                    <p className="text-xs text-muted-foreground mt-1">O email não pode ser alterado aqui</p>
                  </div>
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className={fieldState.error ? "text-destructive" : ""}>Telefone</FormLabel>
                        <FormControl>
                          <motion.div
                            animate={fieldState.error ? { x: [0, -5, 5, -5, 5, 0] } : {}}
                            transition={{ duration: 0.4 }}
                          >
                            <Input 
                              type="tel"
                              placeholder="+258 84 000 0000"
                              {...field} 
                              className={fieldState.error ? "border-destructive focus-visible:ring-destructive" : ""}
                            />
                          </motion.div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className={fieldState.error ? "text-destructive" : ""}>Cargo</FormLabel>
                        <FormControl>
                          <motion.div
                            animate={fieldState.error ? { x: [0, -5, 5, -5, 5, 0] } : {}}
                            transition={{ duration: 0.4 }}
                          >
                            <Input 
                              placeholder="Ex: Director de Expediente"
                              {...field} 
                              className={fieldState.error ? "border-destructive focus-visible:ring-destructive" : ""}
                            />
                          </motion.div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Assinatura Digital</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <motion.div 
                className="flex items-center justify-between p-4 border border-border rounded-lg"
                whileHover={{ scale: 1.01, borderColor: "hsl(var(--success))" }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-3">
                  <motion.div 
                    className="h-10 w-10 bg-success-muted rounded-lg flex items-center justify-center"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Key className="h-5 w-5 text-success" />
                  </motion.div>
                  <div>
                    <p className="font-medium">Certificado Digital</p>
                    <p className="text-sm text-muted-foreground">Válido até 15/12/2025</p>
                  </div>
                </div>
                <Badge variant="success">Activo</Badge>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button variant="outline">Renovar Certificado</Button>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
};

// ========== SECÇÃO SEGURANÇA ==========
const SegurancaSection = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof passwordSchema>) => {
    setIsSaving(true);
    
    try {
      // Import supabase dynamically to avoid circular dependencies
      const { supabase } = await import("@/integrations/supabase/client");
      
      // First verify current password by trying to sign in
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.email) {
        throw new Error("Utilizador não encontrado");
      }
      
      // Verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userData.user.email,
        password: data.currentPassword,
      });
      
      if (signInError) {
        toast({
          title: "Erro",
          description: "A palavra-passe actual está incorrecta.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }
      
      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.newPassword,
      });
      
      if (updateError) {
        throw updateError;
      }
      
      toast({
        title: "Palavra-passe actualizada",
        description: "A sua palavra-passe foi alterada com sucesso.",
      });
      form.reset();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao alterar a palavra-passe.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Segurança</h2>
          <p className="text-sm text-muted-foreground">Gerir a segurança da sua conta</p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <motion.div variants={cardHoverVariants} initial="rest" whileHover="hover">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Alterar Palavra-passe
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-md">
                  <FormField
                    control={form.control}
                    name="currentPassword"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className={fieldState.error ? "text-destructive" : ""}>Palavra-passe Actual</FormLabel>
                        <FormControl>
                          <motion.div
                            animate={fieldState.error ? { x: [0, -5, 5, -5, 5, 0] } : {}}
                            transition={{ duration: 0.4 }}
                            className="relative"
                          >
                            <Input 
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              {...field} 
                              className={fieldState.error ? "border-destructive focus-visible:ring-destructive pr-10" : "pr-10"}
                            />
                            <motion.button 
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </motion.button>
                          </motion.div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className={fieldState.error ? "text-destructive" : ""}>Nova Palavra-passe</FormLabel>
                        <FormControl>
                          <motion.div
                            animate={fieldState.error ? { x: [0, -5, 5, -5, 5, 0] } : {}}
                            transition={{ duration: 0.4 }}
                          >
                            <Input 
                              type="password"
                              placeholder="••••••••"
                              {...field} 
                              className={fieldState.error ? "border-destructive focus-visible:ring-destructive" : ""}
                            />
                          </motion.div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className={fieldState.error ? "text-destructive" : ""}>Confirmar Nova Palavra-passe</FormLabel>
                        <FormControl>
                          <motion.div
                            animate={fieldState.error ? { x: [0, -5, 5, -5, 5, 0] } : {}}
                            transition={{ duration: 0.4 }}
                          >
                            <Input 
                              type="password"
                              placeholder="••••••••"
                              {...field} 
                              className={fieldState.error ? "border-destructive focus-visible:ring-destructive" : ""}
                            />
                          </motion.div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2"
                        />
                      ) : null}
                      {isSaving ? "A actualizar..." : "Actualizar Palavra-passe"}
                    </Button>
                  </motion.div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Autenticação de Dois Factores (2FA)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <motion.div 
                className="flex items-center justify-between p-4 border border-success/50 bg-success-muted/30 rounded-lg"
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-3">
                  <motion.div 
                    className="h-10 w-10 bg-success-muted rounded-lg flex items-center justify-center"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Check className="h-5 w-5 text-success" />
                  </motion.div>
                  <div>
                    <p className="font-medium">Autenticação por SMS</p>
                    <p className="text-sm text-muted-foreground">Terminado em ****0000</p>
                  </div>
                </div>
                <Badge variant="success">Activo</Badge>
              </motion.div>
              
              <motion.div 
                className="flex items-center justify-between p-4 border border-border rounded-lg"
                whileHover={{ scale: 1.01, borderColor: "hsl(var(--primary))" }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center">
                    <Smartphone className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Aplicação Autenticadora</p>
                    <p className="text-sm text-muted-foreground">Google Authenticator, Authy, etc.</p>
                  </div>
                </div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" size="sm">Configurar</Button>
                </motion.div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
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
                <motion.div 
                  key={i} 
                  className="flex items-center justify-between p-3 border border-border rounded-lg"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.01, x: 4 }}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{session.device}</p>
                      {session.current && <Badge variant="info" className="text-xs">Sessão actual</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{session.location} • {session.date}</p>
                  </div>
                  {!session.current && (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button variant="ghost" size="sm" className="text-destructive">Terminar</Button>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
            <motion.div className="mt-4" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button variant="outline">Terminar Todas as Outras Sessões</Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
};

// ========== SECÇÃO NOTIFICAÇÕES ==========
const NotificacoesSection = () => {
  return (
    <>
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Notificações</h2>
          <p className="text-sm text-muted-foreground">Escolha como deseja ser notificado</p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <NotificationPreferencesPanel />
      </motion.div>
    </>
  );
};

// ========== SECÇÃO INTEGRAÇÕES ==========
const IntegracoesSection = () => {
  const { data: integrations, isLoading } = useIntegrationConnections();
  const toggleIntegration = useToggleIntegration();

  const handleToggle = async (id: string, currentlyConnected: boolean) => {
    try {
      await toggleIntegration.mutateAsync({ id, connect: !currentlyConnected });
      toast({
        title: currentlyConnected ? "Desconectado" : "Conectado",
        description: currentlyConnected 
          ? "Integração desconectada com sucesso." 
          : "Integração conectada com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível alterar a integração.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Integrações</h2>
          <p className="text-sm text-muted-foreground">Conectar com sistemas externos</p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(integrations || []).map((integration, i) => (
          <motion.div
            key={integration.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <motion.div 
                    className="h-12 w-12 bg-primary-muted rounded-lg flex items-center justify-center text-primary font-bold text-lg shrink-0"
                    whileHover={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 0.3 }}
                  >
                    {integration.icon || integration.display_name.charAt(0)}
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-medium">{integration.display_name}</h3>
                      {integration.is_connected ? (
                        <Badge variant="success">Conectado</Badge>
                      ) : (
                        <Badge variant="secondary">Desconectado</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{integration.description}</p>
                    <div className="mt-3">
                      {integration.is_connected ? (
                        <div className="flex gap-2">
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button variant="outline" size="sm">Configurar</Button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-destructive"
                              onClick={() => handleToggle(integration.id, true)}
                              disabled={toggleIntegration.isPending}
                            >
                              Desconectar
                            </Button>
                          </motion.div>
                        </div>
                      ) : (
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button 
                            size="sm"
                            onClick={() => handleToggle(integration.id, false)}
                            disabled={toggleIntegration.isPending}
                          >
                            <Plug className="h-4 w-4 mr-2" />
                            Conectar
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">API e Webhooks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Label>Chave de API</Label>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="ghost" size="sm">Regenerar</Button>
                  </motion.div>
                </div>
                <code className="text-sm font-mono bg-background p-2 rounded block overflow-x-auto">
                  sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
                </code>
              </div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver Documentação da API
                </Button>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
};

// ========== SECÇÃO FLUXOS ==========
const FluxosSection = () => {
  return (
    <>
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Fluxos de Trabalho</h2>
          <p className="text-sm text-muted-foreground">Configurar fluxos e automações</p>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button asChild>
            <Link to="/workflow-builder">
              <Plus className="h-4 w-4 mr-2" />
              Novo Fluxo
            </Link>
          </Button>
        </motion.div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="p-6">
            <motion.div 
              className="text-center py-8"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Workflow className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              </motion.div>
              <h3 className="font-medium mb-2">Gerir Fluxos de Trabalho</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Configure e personalize os fluxos de aprovação e tramitação de documentos.
              </p>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button variant="outline" asChild>
                  <Link to="/workflow-builder">Ir para Configuração de Fluxos</Link>
                </Button>
              </motion.div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
};

// ========== SECÇÃO MODELOS ==========
const ModelosSection = () => {
  const { data: templates, isLoading } = useDocumentTemplates();
  const createTemplate = useCreateDocumentTemplate();
  const updateTemplate = useUpdateDocumentTemplate();
  const deleteTemplate = useDeleteDocumentTemplate();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateDescription, setNewTemplateDescription] = useState("");
  const [newTemplateCategory, setNewTemplateCategory] = useState("geral");

  const handleCreate = async () => {
    if (!newTemplateName.trim()) {
      toast({ title: "Erro", description: "O nome é obrigatório.", variant: "destructive" });
      return;
    }
    try {
      await createTemplate.mutateAsync({
        name: newTemplateName.trim(),
        description: newTemplateDescription.trim() || null,
        category: newTemplateCategory,
        content: null,
        file_path: null,
        is_active: true,
      });
      toast({ title: "Sucesso", description: "Modelo criado com sucesso." });
      setShowCreateForm(false);
      setNewTemplateName("");
      setNewTemplateDescription("");
      setNewTemplateCategory("geral");
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível criar o modelo.", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTemplate.mutateAsync(id);
      toast({ title: "Sucesso", description: "Modelo eliminado com sucesso." });
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível eliminar o modelo.", variant: "destructive" });
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      await updateTemplate.mutateAsync({ id, is_active: !currentActive });
      toast({ title: "Sucesso", description: currentActive ? "Modelo desactivado." : "Modelo activado." });
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível actualizar o modelo.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const categories = ["geral", "ofício", "memorando", "circular", "relatório", "contrato"];

  return (
    <>
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Modelos de Documentos</h2>
          <p className="text-sm text-muted-foreground">Gerir modelos e templates</p>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Modelo
          </Button>
        </motion.div>
      </motion.div>

      {showCreateForm && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Criar Novo Modelo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input 
                    value={newTemplateName} 
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="Ex: Ofício Padrão"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <select 
                    className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
                    value={newTemplateCategory}
                    onChange={(e) => setNewTemplateCategory(e.target.value)}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input 
                  value={newTemplateDescription} 
                  onChange={(e) => setNewTemplateDescription(e.target.value)}
                  placeholder="Breve descrição do modelo"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreate} disabled={createTemplate.isPending}>
                  {createTemplate.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Criar Modelo
                </Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>Cancelar</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Biblioteca de Modelos</CardTitle>
          </CardHeader>
          <CardContent>
            {!templates?.length ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">Sem modelos</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Crie o seu primeiro modelo de documento.
                </p>
                <Button variant="outline" onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Modelo
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {templates.map((template, i) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-primary-muted rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{template.name}</p>
                          <Badge variant={template.is_active ? "success" : "secondary"}>
                            {template.is_active ? "Activo" : "Inactivo"}
                          </Badge>
                          <Badge variant="outline">{template.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{template.description || "Sem descrição"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={template.is_active}
                        onCheckedChange={() => handleToggleActive(template.id, template.is_active)}
                      />
                      <Button 
                        variant="ghost" 
                        size="icon-sm"
                        onClick={() => handleDelete(template.id)}
                        disabled={deleteTemplate.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
};

// ========== SECÇÃO BACKUP ==========
const BackupSection = () => {
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsCreatingBackup(false);
    toast({
      title: "Backup criado",
      description: "A cópia de segurança foi criada com sucesso.",
    });
  };

  return (
    <>
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Cópia de Segurança</h2>
          <p className="text-sm text-muted-foreground">Gerir backups e recuperação de dados</p>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button onClick={handleCreateBackup} disabled={isCreatingBackup}>
            {isCreatingBackup ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2"
              />
            ) : (
              <Database className="h-4 w-4 mr-2" />
            )}
            {isCreatingBackup ? "A criar..." : "Criar Backup Agora"}
          </Button>
        </motion.div>
      </motion.div>

      <motion.div variants={itemVariants}>
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
                <motion.div 
                  key={i} 
                  className="flex items-center justify-between p-3 border border-border rounded-lg"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.01, x: 4 }}
                >
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className="h-10 w-10 bg-success-muted rounded-lg flex items-center justify-center"
                      whileHover={{ rotate: 10 }}
                    >
                      <Database className="h-5 w-5 text-success" />
                    </motion.div>
                    <div>
                      <p className="font-medium">{backup.date}</p>
                      <p className="text-sm text-muted-foreground">{backup.size} • {backup.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button variant="ghost" size="sm">Restaurar</Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button variant="ghost" size="sm">Baixar</Button>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Configuração de Backup Automático</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <motion.div 
                className="flex items-center justify-between"
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
              >
                <div>
                  <p className="font-medium">Backup Automático Diário</p>
                  <p className="text-sm text-muted-foreground">Executar às 02:00</p>
                </div>
                <Switch defaultChecked />
              </motion.div>
              <motion.div 
                className="flex items-center justify-between"
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
              >
                <div>
                  <p className="font-medium">Retenção de Backups</p>
                  <p className="text-sm text-muted-foreground">Manter últimos 30 dias</p>
                </div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" size="sm">Configurar</Button>
                </motion.div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
};

// ========== SECÇÃO AUDITORIA ==========
const AuditoriaSection = () => {
  return (
    <>
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Registo de Auditoria</h2>
          <p className="text-sm text-muted-foreground">Ver histórico de actividades do sistema</p>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button variant="outline" asChild>
            <Link to="/audit-logs">
              <ExternalLink className="h-4 w-4 mr-2" />
              Exportar Registos
            </Link>
          </Button>
        </motion.div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="p-6">
            <motion.div 
              className="text-center py-8"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <ScrollText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              </motion.div>
              <h3 className="font-medium mb-2">Registos de Auditoria</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Aceda ao histórico completo de actividades e alterações no sistema.
              </p>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button variant="outline" asChild>
                  <Link to="/audit-logs">Ver Registos Completos</Link>
                </Button>
              </motion.div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <AuditLogReference context="Ver histórico completo de auditoria" />
      </motion.div>
    </>
  );
};

export default Settings;
