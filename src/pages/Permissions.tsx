import { useState, useEffect } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Search,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useCustomRoles,
  useCreateCustomRole,
  useUpdateCustomRole,
  useDeleteCustomRole,
  useDuplicateCustomRole,
  CustomRole,
} from "@/hooks/useCustomRoles";

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
  const { data: roles = [], isLoading } = useCustomRoles();
  const createRole = useCreateCustomRole();
  const updateRole = useUpdateCustomRole();
  const deleteRole = useDeleteCustomRole();
  const duplicateRole = useDuplicateCustomRole();

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [createRoleOpen, setCreateRoleOpen] = useState(false);
  const [duplicateRoleOpen, setDuplicateRoleOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [duplicateFromId, setDuplicateFromId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPermissions, setEditedPermissions] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (roles.length > 0 && !selectedRoleId) {
      setSelectedRoleId(roles[0].id);
    }
  }, [roles, selectedRoleId]);

  const selectedRole = roles.find(r => r.id === selectedRoleId);
  
  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (role.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const startEditing = () => {
    if (selectedRole) {
      setEditedPermissions(selectedRole.permissions as Record<string, string[]>);
      setIsEditing(true);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditedPermissions({});
  };

  const saveEditing = () => {
    if (selectedRole && isEditing) {
      updateRole.mutate({ id: selectedRole.id, permissions: editedPermissions });
      setIsEditing(false);
    }
  };

  const togglePermission = (moduleId: string, actionId: string) => {
    if (!isEditing) return;
    
    setEditedPermissions(prev => {
      const currentPerms = prev[moduleId] || [];
      const newPerms = currentPerms.includes(actionId)
        ? currentPerms.filter(p => p !== actionId)
        : [...currentPerms, actionId];
      
      return { ...prev, [moduleId]: newPerms };
    });
  };

  const hasPermission = (moduleId: string, actionId: string): boolean => {
    if (isEditing) {
      return (editedPermissions[moduleId] || []).includes(actionId);
    }
    if (!selectedRole) return false;
    const perms = selectedRole.permissions as Record<string, string[]>;
    return (perms[moduleId] || []).includes(actionId);
  };

  const handleCreateRole = () => {
    createRole.mutate({
      name: newRoleName,
      description: newRoleDescription,
      permissions: {
        documentos: [],
        processos: [],
        expediente: [],
        arquivo: [],
        utilizadores: [],
        configuracoes: []
      }
    }, {
      onSuccess: (data) => {
        setSelectedRoleId(data.id);
        setCreateRoleOpen(false);
        setNewRoleName("");
        setNewRoleDescription("");
      }
    });
  };

  const handleDuplicateRole = () => {
    const sourceRole = roles.find(r => r.id === duplicateFromId);
    if (!sourceRole) return;

    duplicateRole.mutate(sourceRole, {
      onSuccess: (data) => {
        setSelectedRoleId(data.id);
        setDuplicateRoleOpen(false);
        setNewRoleName("");
        setNewRoleDescription("");
        setDuplicateFromId(null);
      }
    });
  };

  const openDuplicateDialog = (roleId: string) => {
    setDuplicateFromId(roleId);
    const role = roles.find(r => r.id === roleId);
    setNewRoleName(`${role?.name} (Cópia)`);
    setNewRoleDescription(role?.description || "");
    setDuplicateRoleOpen(true);
  };

  const handleDeleteRole = (roleId: string) => {
    deleteRole.mutate(roleId, {
      onSuccess: () => {
        if (selectedRoleId === roleId && roles.length > 1) {
          setSelectedRoleId(roles.find(r => r.id !== roleId)?.id || null);
        }
      }
    });
  };

  const handleExportPermissions = () => {
    const exportData = roles.map(role => ({
      nome: role.name,
      descricao: role.description,
      utilizadores: role.user_count,
      permissoes: role.permissions
    }));
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'permissoes_perfis.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Permissões exportadas");
  };

  const getPermissionCount = (role: CustomRole): number => {
    const perms = role.permissions as Record<string, string[]>;
    return Object.values(perms).flat().length;
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Perfis e Permissões" subtitle="Configurar perfis de acesso e permissões do sistema">
        <PageBreadcrumb items={[{ label: "Gestão de Utilizadores", href: "/users" }, { label: "Perfis e Permissões" }]} />
        <div className="flex gap-6 h-[calc(100vh-220px)]">
          <div className="w-80 shrink-0 space-y-4">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="flex-1" />
        </div>
      </DashboardLayout>
    );
  }

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
                          {role.is_system && (
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
                        {!role.is_system && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDeleteRole(role.id)}
                            >
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
                      {role.user_count} utilizadores
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
                    <Button variant="outline" size="sm" onClick={cancelEditing}>
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={saveEditing}
                      disabled={updateRole.isPending}
                    >
                      {updateRole.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      Guardar
                    </Button>
                  </>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={startEditing}
                    disabled={selectedRole?.is_system}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {modules.map((module) => {
                const ModuleIcon = module.icon;
                return (
                  <div key={module.id} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                        <ModuleIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <h3 className="font-medium">{module.name}</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pl-10">
                      {module.actions.map((action) => {
                        const isChecked = hasPermission(module.id, action.id);
                        return (
                          <div
                            key={action.id}
                            className={cn(
                              "flex items-center gap-2 p-2 rounded-md border transition-colors",
                              isEditing ? "cursor-pointer hover:bg-muted/50" : "cursor-default",
                              isChecked ? "border-primary/50 bg-primary/5" : "border-border"
                            )}
                            onClick={() => isEditing && togglePermission(module.id, action.id)}
                          >
                            <Checkbox
                              checked={isChecked}
                              disabled={!isEditing}
                              className="pointer-events-none"
                            />
                            <span className="text-sm">{action.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Role Dialog */}
      <Dialog open={createRoleOpen} onOpenChange={setCreateRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Perfil</DialogTitle>
            <DialogDescription>
              Defina um novo perfil de permissões para utilizadores do sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="roleName">Nome do Perfil</Label>
              <Input
                id="roleName"
                placeholder="Ex: Supervisor de Departamento"
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
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateRoleOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateRole}
              disabled={!newRoleName.trim() || createRole.isPending}
            >
              {createRole.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Criar Perfil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Role Dialog */}
      <Dialog open={duplicateRoleOpen} onOpenChange={setDuplicateRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicar Perfil</DialogTitle>
            <DialogDescription>
              Crie uma cópia do perfil com as mesmas permissões.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="duplicateName">Nome do Novo Perfil</Label>
              <Input
                id="duplicateName"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duplicateDescription">Descrição</Label>
              <Textarea
                id="duplicateDescription"
                value={newRoleDescription}
                onChange={(e) => setNewRoleDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateRoleOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleDuplicateRole}
              disabled={duplicateRole.isPending}
            >
              {duplicateRole.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              Duplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Permissions;
