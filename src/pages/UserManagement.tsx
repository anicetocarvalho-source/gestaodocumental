import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { Switch } from "@/components/ui/switch";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Users, 
  Shield, 
  Search,
  MoreVertical,
  UserCheck,
  UserX,
  AlertTriangle,
  UserPlus,
} from "lucide-react";
import { CreateUserModal } from "@/components/users/CreateUserModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useUsersWithRoles, useAssignRole, useRemoveRole, useUpdateUserStatus } from "@/hooks/useUsersManagement";
import { useUserRole, AppRole, roleLabels, roleDescriptions } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";

const allRoles: AppRole[] = ["admin", "gestor", "tecnico", "consulta"];

const roleBadgeVariants: Record<AppRole, "error" | "info" | "success" | "warning"> = {
  admin: "error",
  gestor: "info",
  tecnico: "success",
  consulta: "warning",
};

const UserManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [editRolesOpen, setEditRolesOpen] = useState(false);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    user_id: string;
    full_name: string;
    roles: AppRole[];
  } | null>(null);
  
  const { data: users, isLoading, error } = useUsersWithRoles();
  const { isAdmin } = useUserRole();
  const { user: currentUser } = useAuth();
  const assignRole = useAssignRole();
  const removeRole = useRemoveRole();
  const updateStatus = useUpdateUserStatus();

  // Filter users
  const filteredUsers = (users || []).filter((user) => {
    const matchesSearch = 
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = !filterRole || user.roles.includes(filterRole as AppRole);
    const matchesStatus = 
      !filterStatus || 
      (filterStatus === "active" && user.is_active) ||
      (filterStatus === "inactive" && !user.is_active);
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Stats
  const totalUsers = users?.length || 0;
  const activeUsers = users?.filter((u) => u.is_active).length || 0;
  const inactiveUsers = totalUsers - activeUsers;
  const adminCount = users?.filter((u) => u.roles.includes("admin")).length || 0;

  const handleEditRoles = (user: typeof filteredUsers[0]) => {
    setSelectedUser({
      user_id: user.user_id,
      full_name: user.full_name,
      roles: user.roles,
    });
    setEditRolesOpen(true);
  };

  const handleToggleRole = async (role: AppRole) => {
    if (!selectedUser) return;

    const hasRole = selectedUser.roles.includes(role);

    try {
      if (hasRole) {
        // Don't allow removing the last role
        if (selectedUser.roles.length === 1) {
          toast.error("O utilizador deve ter pelo menos um role");
          return;
        }
        await removeRole.mutateAsync({ userId: selectedUser.user_id, role });
        setSelectedUser({
          ...selectedUser,
          roles: selectedUser.roles.filter((r) => r !== role),
        });
        toast.success(`Role ${roleLabels[role]} removido`);
      } else {
        await assignRole.mutateAsync({ userId: selectedUser.user_id, role });
        setSelectedUser({
          ...selectedUser,
          roles: [...selectedUser.roles, role],
        });
        toast.success(`Role ${roleLabels[role]} atribuído`);
      }
    } catch (err) {
      toast.error("Erro ao atualizar role");
    }
  };

  const handleToggleStatus = async (user: typeof filteredUsers[0]) => {
    try {
      await updateStatus.mutateAsync({
        profileId: user.id,
        isActive: !user.is_active,
      });
      toast.success(
        user.is_active ? "Utilizador desativado" : "Utilizador ativado"
      );
    } catch (err) {
      toast.error("Erro ao atualizar estado");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  // Access control
  if (!isAdmin) {
    return (
      <DashboardLayout 
        title="Gestão de Utilizadores" 
        subtitle="Acesso restrito"
      >
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertTriangle className="h-12 w-12 text-warning mb-4" />
          <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground">
            Apenas administradores podem aceder à gestão de utilizadores.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Gestão de Utilizadores" 
      subtitle="Gerir utilizadores e permissões"
    >
      <PageBreadcrumb items={[{ label: "Gestão de Utilizadores" }]} />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card variant="stat">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary-muted flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalUsers}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </div>
        </Card>
        <Card variant="stat">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
              <UserCheck className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeUsers}</p>
              <p className="text-sm text-muted-foreground">Activos</p>
            </div>
          </div>
        </Card>
        <Card variant="stat">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
              <UserX className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{inactiveUsers}</p>
              <p className="text-sm text-muted-foreground">Inactivos</p>
            </div>
          </div>
        </Card>
        <Card variant="stat">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-error/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-error" />
            </div>
            <div>
              <p className="text-2xl font-bold">{adminCount}</p>
              <p className="text-sm text-muted-foreground">Admins</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar por nome ou email..." 
              className="pl-10 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Todos os roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os roles</SelectItem>
              {allRoles.map((role) => (
                <SelectItem key={role} value={role}>{roleLabels[role]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setCreateUserOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Novo Utilizador
        </Button>
      </div>

      {/* User Table */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-center text-error">
              Erro ao carregar utilizadores
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              Nenhum utilizador encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted border-b border-border">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Utilizador
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Cargo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Roles
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Unidade
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Acções
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr 
                      key={user.id} 
                      className="border-b border-border hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium shrink-0">
                            {getInitials(user.full_name)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {user.full_name}
                              {user.user_id === currentUser?.id && (
                                <span className="ml-2 text-xs text-muted-foreground">(você)</span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {user.position || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {user.roles.length > 0 ? (
                            user.roles.map((role) => (
                              <Badge key={role} variant={roleBadgeVariants[role]}>
                                {roleLabels[role]}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">Sem role</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {user.unit_name || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={user.is_active ? "success" : "secondary"}>
                          {user.is_active ? "Activo" : "Inactivo"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => handleEditRoles(user)}>
                              <Shield className="mr-2 h-4 w-4" /> 
                              Gerir Roles
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleToggleStatus(user)}
                              disabled={user.user_id === currentUser?.id}
                            >
                              {user.is_active ? (
                                <>
                                  <UserX className="mr-2 h-4 w-4" /> 
                                  Desativar
                                </>
                              ) : (
                                <>
                                  <UserCheck className="mr-2 h-4 w-4" /> 
                                  Ativar
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Roles Dialog */}
      <Dialog open={editRolesOpen} onOpenChange={setEditRolesOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gerir Roles</DialogTitle>
            <DialogDescription>
              Atribuir ou remover roles para {selectedUser?.full_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {allRoles.map((role) => {
              const hasRole = selectedUser?.roles.includes(role) || false;
              const isOnlyRole = hasRole && selectedUser?.roles.length === 1;
              const isLoading = assignRole.isPending || removeRole.isPending;
              
              return (
                <div 
                  key={role} 
                  className="flex items-center justify-between p-3 rounded-lg border border-border"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={roleBadgeVariants[role]}>
                        {roleLabels[role]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {roleDescriptions[role]}
                    </p>
                  </div>
                  <Switch
                    checked={hasRole}
                    onCheckedChange={() => handleToggleRole(role)}
                    disabled={isLoading || isOnlyRole}
                  />
                </div>
              );
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRolesOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Modal */}
      <CreateUserModal open={createUserOpen} onOpenChange={setCreateUserOpen} />
    </DashboardLayout>
  );
};

export default UserManagement;
