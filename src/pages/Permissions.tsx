import { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Shield, 
  ChevronRight, 
  FileText, 
  Users, 
  Settings, 
  Eye, 
  Pencil, 
  Trash2,
  Plus,
  History,
  Copy,
  Download,
  MoreVertical,
  FolderOpen,
  ClipboardList,
  Package,
  CheckSquare,
  Bell,
  Search,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Role {
  id: number;
  name: string;
  description: string;
  users: number;
  isSystem: boolean;
  permissions: Record<string, string[]>;
}

const initialRoles: Role[] = [
  { 
    id: 1, 
    name: "Administrador", 
    description: "Acesso total ao sistema", 
    users: 8,
    isSystem: true,
    permissions: { 
      documentos: ["ver", "criar", "editar", "eliminar", "classificar", "exportar"],
      processos: ["ver", "criar", "editar", "eliminar", "aprovar", "despachar"],
      expediente: ["ver", "criar", "editar", "eliminar"],
      arquivo: ["ver", "criar", "editar", "eliminar"],
      utilizadores: ["ver", "criar", "editar", "eliminar"],
      configuracoes: ["ver", "editar"]
    }
  },
  { 
    id: 2, 
    name: "Gestor", 
    description: "Gerir documentos e processos da unidade", 
    users: 24,
    isSystem: true,
    permissions: { 
      documentos: ["ver", "criar", "editar", "classificar"],
      processos: ["ver", "criar", "editar", "aprovar", "despachar"],
      expediente: ["ver", "criar", "editar"],
      arquivo: ["ver"],
      utilizadores: ["ver"],
      configuracoes: []
    }
  },
  { 
    id: 3, 
    name: "Editor", 
    description: "Criar e editar documentos e processos", 
    users: 45,
    isSystem: true,
    permissions: { 
      documentos: ["ver", "criar", "editar"],
      processos: ["ver", "criar"],
      expediente: ["ver", "criar"],
      arquivo: ["ver"],
      utilizadores: [],
      configuracoes: []
    }
  },
  { 
    id: 4, 
    name: "Revisor", 
    description: "Rever e aprovar submissões", 
    users: 32,
    isSystem: true,
    permissions: { 
      documentos: ["ver", "editar"],
      processos: ["ver", "editar", "aprovar"],
      expediente: ["ver"],
      arquivo: ["ver"],
      utilizadores: [],
      configuracoes: []
    }
  },
  { 
    id: 5, 
    name: "Visualizador", 
    description: "Acesso somente leitura", 
    users: 64,
    isSystem: true,
    permissions: { 
      documentos: ["ver"],
      processos: ["ver"],
      expediente: ["ver"],
      arquivo: ["ver"],
      utilizadores: [],
      configuracoes: []
    }
  },
  { 
    id: 6, 
    name: "Expediente", 
    description: "Perfil personalizado para registo de correspondência", 
    users: 12,
    isSystem: false,
    permissions: { 
      documentos: ["ver", "criar"],
      processos: ["ver"],
      expediente: ["ver", "criar", "editar", "eliminar"],
      arquivo: [],
      utilizadores: [],
      configuracoes: []
    }
  },
];

const modules = [
  { 
    id: "documentos", 
    name: "Documentos", 
    icon: FileText,
    actions: [
      { id: "ver", label: "Ver" },
      { id: "criar", label: "Criar" },
      { id: "editar", label: "Editar" },
      { id: "eliminar", label: "Eliminar" },
      { id: "classificar", label: "Classificar" },
      { id: "exportar", label: "Exportar" },
    ]
  },
  { 
    id: "processos", 
    name: "Processos", 
    icon: ClipboardList,
    actions: [
      { id: "ver", label: "Ver" },
      { id: "criar", label: "Criar" },
      { id: "editar", label: "Editar" },
      { id: "eliminar", label: "Eliminar" },
      { id: "aprovar", label: "Aprovar" },
      { id: "despachar", label: "Despachar" },
    ]
  },
  { 
    id: "expediente", 
    name: "Expediente", 
    icon: Package,
    actions: [
      { id: "ver", label: "Ver" },
      { id: "criar", label: "Criar" },
      { id: "editar", label: "Editar" },
      { id: "eliminar", label: "Eliminar" },
    ]
  },
  { 
    id: "arquivo", 
    name: "Arquivo", 
    icon: FolderOpen,
    actions: [
      { id: "ver", label: "Ver" },
      { id: "criar", label: "Criar" },
      { id: "editar", label: "Editar" },
      { id: "eliminar", label: "Eliminar" },
    ]
  },
  { 
    id: "utilizadores", 
    name: "Utilizadores", 
    icon: Users,
    actions: [
      { id: "ver", label: "Ver" },
      { id: "criar", label: "Criar" },
      { id: "editar", label: "Editar" },
      { id: "eliminar", label: "Eliminar" },
    ]
  },
  { 
    id: "configuracoes", 
    name: "Configurações", 
    icon: Settings,
    actions: [
      { id: "ver", label: "Ver" },
      { id: "editar", label: "Editar" },
    ]
  },
];

const Permissions = () => {
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [selectedRoleId, setSelectedRoleId] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [createRoleOpen, setCreateRoleOpen] = useState(false);
  const [duplicateRoleOpen, setDuplicateRoleOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [duplicateFromId, setDuplicateFromId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const selectedRole = roles.find(r => r.id === selectedRoleId);
  
  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const togglePermission = (moduleId: string, actionId: string) => {
    if (!selectedRole || !isEditing) return;
    
    setRoles(prev => prev.map(role => {
      if (role.id !== selectedRoleId) return role;
      
      const currentPerms = role.permissions[moduleId] || [];
      const newPerms = currentPerms.includes(actionId)
        ? currentPerms.filter(p => p !== actionId)
        : [...currentPerms, actionId];
      
      return {
        ...role,
        permissions: { ...role.permissions, [moduleId]: newPerms }
      };
    }));
  };

  const hasPermission = (moduleId: string, actionId: string): boolean => {
    if (!selectedRole) return false;
    return (selectedRole.permissions[moduleId] || []).includes(actionId);
  };

  const handleCreateRole = () => {
    const newRole: Role = {
      id: Math.max(...roles.map(r => r.id)) + 1,
      name: newRoleName,
      description: newRoleDescription,
      users: 0,
      isSystem: false,
      permissions: {
        documentos: [],
        processos: [],
        expediente: [],
        arquivo: [],
        utilizadores: [],
        configuracoes: []
      }
    };
    setRoles([...roles, newRole]);
    setSelectedRoleId(newRole.id);
    setCreateRoleOpen(false);
    setNewRoleName("");
    setNewRoleDescription("");
  };

  const handleDuplicateRole = () => {
    const sourceRole = roles.find(r => r.id === duplicateFromId);
    if (!sourceRole) return;

    const newRole: Role = {
      id: Math.max(...roles.map(r => r.id)) + 1,
      name: newRoleName || `${sourceRole.name} (Cópia)`,
      description: newRoleDescription || sourceRole.description,
      users: 0,
      isSystem: false,
      permissions: { ...sourceRole.permissions }
    };
    setRoles([...roles, newRole]);
    setSelectedRoleId(newRole.id);
    setDuplicateRoleOpen(false);
    setNewRoleName("");
    setNewRoleDescription("");
    setDuplicateFromId(null);
  };

  const openDuplicateDialog = (roleId: number) => {
    setDuplicateFromId(roleId);
    const role = roles.find(r => r.id === roleId);
    setNewRoleName(`${role?.name} (Cópia)`);
    setNewRoleDescription(role?.description || "");
    setDuplicateRoleOpen(true);
  };

  const handleExportPermissions = () => {
    const exportData = roles.map(role => ({
      nome: role.name,
      descricao: role.description,
      utilizadores: role.users,
      permissoes: role.permissions
    }));
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'permissoes_perfis.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getPermissionCount = (role: Role): number => {
    return Object.values(role.permissions).flat().length;
  };

  return (
    <DashboardLayout 
      title="Perfis e Permissões" 
      subtitle="Configurar perfis de acesso e permissões do sistema"
    >
      <PageBreadcrumb 
        items={[
          { label: "Gestão de Utilizadores", href: "/users" },
          { label: "Perfis e Permissões" }
        ]} 
      />

      <div className="flex gap-6 h-[calc(100vh-220px)]">
        {/* Left Panel - Roles List */}
        <div className="w-80 shrink-0 flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Perfis</h2>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleExportPermissions}>
                <Download className="h-4 w-4" />
              </Button>
              <Button size="sm" onClick={() => setCreateRoleOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Novo
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar perfis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Roles List */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {filteredRoles.map((role) => (
              <Card 
                key={role.id}
                className={cn(
                  "cursor-pointer transition-all",
                  selectedRoleId === role.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "hover:border-border-strong"
                )}
                onClick={() => setSelectedRoleId(role.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center",
                        selectedRoleId === role.id ? "bg-primary/10" : "bg-muted"
                      )}>
                        <Shield className={cn(
                          "h-5 w-5",
                          selectedRoleId === role.id ? "text-primary" : "text-muted-foreground"
                        )} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{role.name}</p>
                          {role.isSystem && (
                            <Badge variant="outline" className="text-xs">Sistema</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{role.description}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon-sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openDuplicateDialog(role.id)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicar
                        </DropdownMenuItem>
                        {!role.isSystem && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {role.users} utilizadores
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckSquare className="h-3 w-3" />
                      {getPermissionCount(role)} permissões
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Audit Log Link */}
          <Card variant="interactive">
            <Link to="/audit-logs">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-info-muted rounded-lg flex items-center justify-center">
                    <History className="h-5 w-5 text-info" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Audit Logs</p>
                    <p className="text-xs text-muted-foreground">Alterações de permissões</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* Right Panel - Permission Matrix */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="pb-3 border-b border-border shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{selectedRole?.name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{selectedRole?.description}</p>
              </div>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button size="sm" onClick={() => setIsEditing(false)}>
                      <Check className="h-4 w-4 mr-2" />
                      Guardar
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openDuplicateDialog(selectedRoleId)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicar
                    </Button>
                    <Button size="sm" onClick={() => setIsEditing(true)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-0">
            <table className="w-full">
              <thead className="sticky top-0 bg-muted z-10">
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-48">
                    Módulo
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <div className="flex flex-col items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>Ver</span>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <div className="flex flex-col items-center gap-1">
                      <Plus className="h-4 w-4" />
                      <span>Criar</span>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <div className="flex flex-col items-center gap-1">
                      <Pencil className="h-4 w-4" />
                      <span>Editar</span>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <div className="flex flex-col items-center gap-1">
                      <Trash2 className="h-4 w-4" />
                      <span>Eliminar</span>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <div className="flex flex-col items-center gap-1">
                      <CheckSquare className="h-4 w-4" />
                      <span>Aprovar</span>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <div className="flex flex-col items-center gap-1">
                      <Package className="h-4 w-4" />
                      <span>Extra</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {modules.map((module) => (
                  <tr key={module.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-muted rounded-lg flex items-center justify-center">
                          <module.icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <span className="font-medium text-foreground">{module.name}</span>
                      </div>
                    </td>
                    {/* Ver */}
                    <td className="px-3 py-4 text-center">
                      {module.actions.some(a => a.id === "ver") ? (
                        <div className="flex justify-center">
                          <Checkbox 
                            checked={hasPermission(module.id, "ver")}
                            onCheckedChange={() => togglePermission(module.id, "ver")}
                            disabled={!isEditing}
                            className={cn(!isEditing && "opacity-70")}
                          />
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    {/* Criar */}
                    <td className="px-3 py-4 text-center">
                      {module.actions.some(a => a.id === "criar") ? (
                        <div className="flex justify-center">
                          <Checkbox 
                            checked={hasPermission(module.id, "criar")}
                            onCheckedChange={() => togglePermission(module.id, "criar")}
                            disabled={!isEditing}
                            className={cn(!isEditing && "opacity-70")}
                          />
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    {/* Editar */}
                    <td className="px-3 py-4 text-center">
                      {module.actions.some(a => a.id === "editar") ? (
                        <div className="flex justify-center">
                          <Checkbox 
                            checked={hasPermission(module.id, "editar")}
                            onCheckedChange={() => togglePermission(module.id, "editar")}
                            disabled={!isEditing}
                            className={cn(!isEditing && "opacity-70")}
                          />
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    {/* Eliminar */}
                    <td className="px-3 py-4 text-center">
                      {module.actions.some(a => a.id === "eliminar") ? (
                        <div className="flex justify-center">
                          <Checkbox 
                            checked={hasPermission(module.id, "eliminar")}
                            onCheckedChange={() => togglePermission(module.id, "eliminar")}
                            disabled={!isEditing}
                            className={cn(!isEditing && "opacity-70")}
                          />
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    {/* Aprovar */}
                    <td className="px-3 py-4 text-center">
                      {module.actions.some(a => a.id === "aprovar") ? (
                        <div className="flex justify-center">
                          <Checkbox 
                            checked={hasPermission(module.id, "aprovar")}
                            onCheckedChange={() => togglePermission(module.id, "aprovar")}
                            disabled={!isEditing}
                            className={cn(!isEditing && "opacity-70")}
                          />
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    {/* Extra (classificar, exportar, despachar) */}
                    <td className="px-3 py-4 text-center">
                      {module.id === "documentos" && (
                        <div className="flex justify-center gap-2">
                          <div className="flex flex-col items-center">
                            <Checkbox 
                              checked={hasPermission(module.id, "classificar")}
                              onCheckedChange={() => togglePermission(module.id, "classificar")}
                              disabled={!isEditing}
                              className={cn(!isEditing && "opacity-70")}
                            />
                            <span className="text-[10px] text-muted-foreground mt-1">Class.</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <Checkbox 
                              checked={hasPermission(module.id, "exportar")}
                              onCheckedChange={() => togglePermission(module.id, "exportar")}
                              disabled={!isEditing}
                              className={cn(!isEditing && "opacity-70")}
                            />
                            <span className="text-[10px] text-muted-foreground mt-1">Exp.</span>
                          </div>
                        </div>
                      )}
                      {module.id === "processos" && (
                        <div className="flex justify-center">
                          <div className="flex flex-col items-center">
                            <Checkbox 
                              checked={hasPermission(module.id, "despachar")}
                              onCheckedChange={() => togglePermission(module.id, "despachar")}
                              disabled={!isEditing}
                              className={cn(!isEditing && "opacity-70")}
                            />
                            <span className="text-[10px] text-muted-foreground mt-1">Desp.</span>
                          </div>
                        </div>
                      )}
                      {!["documentos", "processos"].includes(module.id) && (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>

          {/* Info Bar */}
          {selectedRole?.isSystem && (
            <div className="p-4 border-t border-border bg-warning-muted/30">
              <div className="flex items-center gap-2 text-sm text-warning">
                <AlertCircle className="h-4 w-4" />
                <span>Este é um perfil de sistema. As alterações afectarão todos os utilizadores com este perfil.</span>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Create Role Dialog */}
      <Dialog open={createRoleOpen} onOpenChange={setCreateRoleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Novo Perfil</DialogTitle>
            <DialogDescription>
              Defina um novo perfil de acesso para o sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="roleName">Nome do Perfil</Label>
              <Input 
                id="roleName" 
                placeholder="Ex: Gestor de Expediente"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roleDescription">Descrição</Label>
              <Textarea 
                id="roleDescription" 
                placeholder="Descreva as responsabilidades deste perfil..."
                value={newRoleDescription}
                onChange={(e) => setNewRoleDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateRoleOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateRole} disabled={!newRoleName.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Perfil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Role Dialog */}
      <Dialog open={duplicateRoleOpen} onOpenChange={setDuplicateRoleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Duplicar Perfil</DialogTitle>
            <DialogDescription>
              Criar uma cópia do perfil com as mesmas permissões.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Perfil de Origem</Label>
              <Select 
                value={duplicateFromId?.toString()} 
                onValueChange={(v) => setDuplicateFromId(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar perfil" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duplicateName">Nome do Novo Perfil</Label>
              <Input 
                id="duplicateName" 
                placeholder="Nome do perfil"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duplicateDescription">Descrição</Label>
              <Textarea 
                id="duplicateDescription" 
                placeholder="Descrição do perfil..."
                value={newRoleDescription}
                onChange={(e) => setNewRoleDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateRoleOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleDuplicateRole} disabled={!newRoleName.trim() || !duplicateFromId}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Permissions;
