import { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Users, 
  UserPlus, 
  Shield, 
  Building,
  Search,
  MoreVertical,
  Mail,
  Edit,
  Trash2,
  Download,
  ChevronRight,
  History,
  Key,
  Filter,
  X,
  Check,
  AlertCircle,
  UserCheck,
  UserX,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const stats = [
  { icon: Users, label: "Total Utilizadores", value: 156 },
  { icon: UserCheck, label: "Activos", value: 142 },
  { icon: UserX, label: "Inactivos", value: 14 },
  { icon: Building, label: "Unidades", value: 12 },
];

const users = [
  { id: 1, name: "Maria Santos", email: "maria.santos@gov.mz", funcao: "Chefe de Divisão", perfil: "Administrador", unidade: "Direcção de Finanças", estado: "activo", ultimoAcesso: "2024-01-15 14:32" },
  { id: 2, name: "João Silva", email: "joao.silva@gov.mz", funcao: "Técnico Superior", perfil: "Editor", unidade: "Direcção de Procurement", estado: "activo", ultimoAcesso: "2024-01-15 10:15" },
  { id: 3, name: "Ana Costa", email: "ana.costa@gov.mz", funcao: "Técnico", perfil: "Editor", unidade: "Gabinete de Ambiente", estado: "activo", ultimoAcesso: "2024-01-14 16:45" },
  { id: 4, name: "Carlos Pereira", email: "carlos.pereira@gov.mz", funcao: "Assistente", perfil: "Visualizador", unidade: "Direcção de Operações", estado: "inactivo", ultimoAcesso: "2024-01-10 09:00" },
  { id: 5, name: "Luísa Fernandes", email: "luisa.fernandes@gov.mz", funcao: "Director", perfil: "Administrador", unidade: "Direcção de RH", estado: "activo", ultimoAcesso: "2024-01-15 11:20" },
  { id: 6, name: "Pedro Machado", email: "pedro.machado@gov.mz", funcao: "Técnico Superior", perfil: "Revisor", unidade: "Gabinete Jurídico", estado: "activo", ultimoAcesso: "2024-01-14 15:30" },
  { id: 7, name: "Teresa Gomes", email: "teresa.gomes@gov.mz", funcao: "Chefe de Repartição", perfil: "Editor", unidade: "Direcção de TI", estado: "pendente", ultimoAcesso: "Nunca" },
  { id: 8, name: "António Ribeiro", email: "antonio.ribeiro@gov.mz", funcao: "Técnico", perfil: "Visualizador", unidade: "Gabinete de Comunicação", estado: "activo", ultimoAcesso: "2024-01-13 12:00" },
];

const perfis = ["Administrador", "Editor", "Revisor", "Visualizador", "Convidado"];
const unidades = [
  "Direcção de Finanças",
  "Direcção de Procurement", 
  "Gabinete de Ambiente",
  "Direcção de Operações",
  "Direcção de RH",
  "Gabinete Jurídico",
  "Direcção de TI",
  "Gabinete de Comunicação",
];
const estados = ["activo", "inactivo", "pendente"];

const permissions = [
  { category: "Documentos", items: [
    { id: "doc_view", label: "Visualizar documentos", description: "Permite ver documentos e metadados" },
    { id: "doc_create", label: "Criar documentos", description: "Permite criar novos documentos" },
    { id: "doc_edit", label: "Editar documentos", description: "Permite editar documentos existentes" },
    { id: "doc_delete", label: "Eliminar documentos", description: "Permite eliminar documentos" },
    { id: "doc_classify", label: "Classificar documentos", description: "Permite atribuir classificação documental" },
  ]},
  { category: "Processos", items: [
    { id: "proc_view", label: "Visualizar processos", description: "Permite ver processos e workflow" },
    { id: "proc_create", label: "Criar processos", description: "Permite iniciar novos processos" },
    { id: "proc_approve", label: "Aprovar processos", description: "Permite aprovar ou rejeitar processos" },
    { id: "proc_dispatch", label: "Despachar processos", description: "Permite reencaminhar processos" },
  ]},
  { category: "Administração", items: [
    { id: "admin_users", label: "Gerir utilizadores", description: "Permite criar e editar utilizadores" },
    { id: "admin_roles", label: "Gerir perfis", description: "Permite configurar perfis de acesso" },
    { id: "admin_audit", label: "Ver audit logs", description: "Permite consultar registos de actividade" },
    { id: "admin_settings", label: "Configurações do sistema", description: "Acesso às definições gerais" },
  ]},
];

const roles = [
  { name: "Administrador", description: "Acesso total ao sistema", count: 8 },
  { name: "Editor", description: "Criar, editar e submeter documentos", count: 45 },
  { name: "Revisor", description: "Rever e aprovar submissões", count: 32 },
  { name: "Visualizador", description: "Acesso somente leitura", count: 64 },
  { name: "Convidado", description: "Acesso temporário limitado", count: 7 },
];

const departments = [
  { name: "Direcção de Finanças", count: 24 },
  { name: "Direcção de RH", count: 18 },
  { name: "Gabinete Jurídico", count: 12 },
  { name: "Direcção de Operações", count: 35 },
  { name: "Direcção de TI", count: 22 },
];

const UserManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPerfil, setFilterPerfil] = useState("");
  const [filterUnidade, setFilterUnidade] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // Dialogs/Sheets state
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [editPermissionsOpen, setEditPermissionsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<typeof users[0] | null>(null);
  
  // Permission states for edit panel
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>({
    doc_view: true, doc_create: true, doc_edit: true, doc_delete: false, doc_classify: true,
    proc_view: true, proc_create: true, proc_approve: false, proc_dispatch: true,
    admin_users: false, admin_roles: false, admin_audit: true, admin_settings: false,
  });

  const handleEditPermissions = (user: typeof users[0]) => {
    setSelectedUser(user);
    setEditPermissionsOpen(true);
  };

  const handleResetPassword = (user: typeof users[0]) => {
    setSelectedUser(user);
    setResetPasswordOpen(true);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPerfil = !filterPerfil || user.perfil === filterPerfil;
    const matchesUnidade = !filterUnidade || user.unidade === filterUnidade;
    const matchesEstado = !filterEstado || user.estado === filterEstado;
    return matchesSearch && matchesPerfil && matchesUnidade && matchesEstado;
  });

  const activeFiltersCount = [filterPerfil, filterUnidade, filterEstado].filter(Boolean).length;

  const clearFilters = () => {
    setFilterPerfil("");
    setFilterUnidade("");
    setFilterEstado("");
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "activo":
        return <Badge variant="success">Activo</Badge>;
      case "inactivo":
        return <Badge variant="secondary">Inactivo</Badge>;
      case "pendente":
        return <Badge variant="warning">Pendente</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  return (
    <DashboardLayout 
      title="Gestão de Utilizadores" 
      subtitle="Gerir utilizadores, perfis e permissões"
    >
      <PageBreadcrumb items={[{ label: "Gestão de Utilizadores" }]} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Stats */}
        <div className="lg:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <Card key={i} variant="stat">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary-muted flex items-center justify-center">
                  <stat.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Toolbar */}
        <div className="lg:col-span-12 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input 
                  placeholder="Pesquisar por nome..." 
                  className="pl-10 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Pesquisar utilizadores"
                />
              </div>
              <Button 
                variant={showFilters ? "secondary" : "outline"} 
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Filtros
                {activeFiltersCount > 0 && (
                  <Badge variant="default" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
                  <X className="h-4 w-4" />
                  Limpar filtros
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" aria-hidden="true" />
                Exportar
              </Button>
              <Button onClick={() => setCreateUserOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" aria-hidden="true" />
                Criar Utilizador
              </Button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <Card className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Perfil</Label>
                  <Select value={filterPerfil} onValueChange={setFilterPerfil}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os perfis" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os perfis</SelectItem>
                      {perfis.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Unidade</Label>
                  <Select value={filterUnidade} onValueChange={setFilterUnidade}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as unidades" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas as unidades</SelectItem>
                      {unidades.map((u) => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select value={filterEstado} onValueChange={setFilterEstado}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os estados" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os estados</SelectItem>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="inactivo">Inactivo</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* User Table */}
        <Card className="lg:col-span-12 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full" role="grid">
                <thead>
                  <tr className="bg-muted border-b border-border">
                    <th className="px-4 py-3 text-left w-10">
                      <Checkbox aria-label="Selecionar todos os utilizadores" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Função</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Perfil</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Unidade</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Último Acesso</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Acções</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <Checkbox aria-label={`Selecionar ${user.name}`} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium shrink-0">
                            {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{user.funcao}</td>
                      <td className="px-4 py-3">
                        <Badge variant={user.perfil === 'Administrador' ? 'default' : 'secondary'}>
                          {user.perfil}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{user.unidade}</td>
                      <td className="px-4 py-3">{getEstadoBadge(user.estado)}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{user.ultimoAcesso}</td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" aria-label={`Acções para ${user.name}`}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-popover">
                            <DropdownMenuItem onClick={() => handleEditPermissions(user)}>
                              <Shield className="mr-2 h-4 w-4" /> Editar Permissões
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" /> Editar Utilizador
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                              <Key className="mr-2 h-4 w-4" /> Repor Palavra-passe
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="mr-2 h-4 w-4" /> Enviar Email
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" /> Eliminar Utilizador
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        <div className="lg:col-span-12 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            A mostrar {filteredUsers.length} de {users.length} utilizadores
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>Anterior</Button>
            <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">1</Button>
            <Button variant="outline" size="sm">2</Button>
            <Button variant="outline" size="sm">3</Button>
            <Button variant="outline" size="sm">...</Button>
            <Button variant="outline" size="sm">20</Button>
            <Button variant="outline" size="sm">Seguinte</Button>
          </div>
        </div>

        {/* Roles Section */}
        <Card className="lg:col-span-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Perfis de Acesso</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link to="/permissions">
                  <Shield className="h-4 w-4 mr-2" />
                  Gerir Perfis
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {roles.map((role, i) => (
              <Link key={i} to="/permissions">
                <div className="flex items-center justify-between p-3 border border-border rounded-lg hover:border-primary transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-primary-muted rounded-lg flex items-center justify-center">
                      <Shield className="h-5 w-5 text-primary" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{role.name}</p>
                      <p className="text-xs text-muted-foreground">{role.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{role.count} utilizadores</Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </Link>
            ))}
            
            {/* Audit Logs Link */}
            <Link to="/audit-logs">
              <div className="flex items-center justify-between p-3 border border-border rounded-lg hover:border-info transition-colors cursor-pointer mt-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 bg-info-muted rounded-lg flex items-center justify-center">
                    <History className="h-5 w-5 text-info" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Registos de Actividade</p>
                    <p className="text-xs text-muted-foreground">Ver histórico de acções</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Departments Section */}
        <Card className="lg:col-span-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Unidades Orgânicas</CardTitle>
              <Button variant="outline" size="sm">Gerir</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {departments.map((dept, i) => (
              <div key={i} className="flex items-center justify-between p-3 border border-border rounded-lg hover:border-border-strong transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 bg-info-muted rounded-lg flex items-center justify-center">
                    <Building className="h-5 w-5 text-info" aria-hidden="true" />
                  </div>
                  <p className="text-sm font-medium text-foreground">{dept.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1">
                    {[...Array(Math.min(3, Math.ceil(dept.count / 10)))].map((_, j) => (
                      <div key={j} className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] border-2 border-background">
                        {String.fromCharCode(65 + j)}
                      </div>
                    ))}
                  </div>
                  <Badge variant="outline">{dept.count}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Create User Dialog */}
      <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Criar Novo Utilizador</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar uma nova conta de utilizador.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nome</Label>
                <Input id="firstName" placeholder="Nome" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Apelido</Label>
                <Input id="lastName" placeholder="Apelido" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="utilizador@gov.mz" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="funcao">Função</Label>
              <Input id="funcao" placeholder="Ex: Técnico Superior" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Perfil</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    {perfis.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Unidade</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {unidades.map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-info-muted rounded-lg">
              <AlertCircle className="h-4 w-4 text-info" />
              <span className="text-sm text-info">
                O utilizador receberá um email com instruções para definir a palavra-passe.
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateUserOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setCreateUserOpen(false)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Criar Utilizador
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Repor Palavra-passe</DialogTitle>
            <DialogDescription>
              Enviar email de reposição de palavra-passe para o utilizador.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="py-4">
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg mb-4">
                <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-medium">
                  {selectedUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <p className="font-medium text-foreground">{selectedUser.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-warning-muted rounded-lg">
                <AlertCircle className="h-4 w-4 text-warning mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-warning">Atenção</p>
                  <p className="text-muted-foreground">
                    O utilizador receberá um email com um link temporário para definir uma nova palavra-passe. O link expira em 24 horas.
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPasswordOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setResetPasswordOpen(false)}>
              <Mail className="h-4 w-4 mr-2" />
              Enviar Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Permissions Sheet */}
      <Sheet open={editPermissionsOpen} onOpenChange={setEditPermissionsOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Editar Permissões</SheetTitle>
            <SheetDescription>
              Configure as permissões de acesso do utilizador.
            </SheetDescription>
          </SheetHeader>
          {selectedUser && (
            <div className="py-6 space-y-6">
              {/* User Info */}
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-medium">
                  {selectedUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{selectedUser.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.perfil}</p>
                </div>
                <Badge variant={selectedUser.estado === 'activo' ? 'success' : 'secondary'}>
                  {selectedUser.estado}
                </Badge>
              </div>

              {/* Profile Selection */}
              <div className="space-y-2">
                <Label>Perfil Base</Label>
                <Select defaultValue={selectedUser.perfil}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {perfis.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  O perfil base define as permissões padrão. Pode personalizar abaixo.
                </p>
              </div>

              <Separator />

              {/* Permissions List */}
              <div className="space-y-6">
                {permissions.map((category) => (
                  <div key={category.category} className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground">{category.category}</h4>
                    <div className="space-y-2">
                      {category.items.map((perm) => (
                        <div
                          key={perm.id}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg border transition-colors",
                            userPermissions[perm.id] ? "bg-primary/5 border-primary/20" : "border-border"
                          )}
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{perm.label}</p>
                            <p className="text-xs text-muted-foreground">{perm.description}</p>
                          </div>
                          <Switch
                            checked={userPermissions[perm.id]}
                            onCheckedChange={(checked) =>
                              setUserPermissions({ ...userPermissions, [perm.id]: checked })
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setEditPermissionsOpen(false)}>
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={() => setEditPermissionsOpen(false)}>
                  <Check className="h-4 w-4 mr-2" />
                  Guardar Alterações
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default UserManagement;
