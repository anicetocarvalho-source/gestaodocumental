import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole, roleLabels } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Camera, Save, Lock, Loader2, User, Phone, Briefcase, Mail, Shield } from "lucide-react";

const Profile = () => {
  const { profile, user, refreshProfile } = useAuth();
  const { primaryRole } = useUserRole();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [position, setPosition] = useState(profile?.position || "");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      toast.error("O nome completo é obrigatório");
      return;
    }
    if (fullName.trim().length > 200) {
      toast.error("O nome não pode exceder 200 caracteres");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          position: position.trim() || null,
        })
        .eq("user_id", user!.id);

      if (error) throw error;
      await refreshProfile();
      toast.success("Perfil actualizado com sucesso");
    } catch {
      toast.error("Erro ao actualizar perfil");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor seleccione uma imagem");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem não pode exceder 5MB");
      return;
    }

    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user!.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: urlData.publicUrl })
        .eq("user_id", user!.id);

      if (updateError) throw updateError;
      await refreshProfile();
      toast.success("Foto de perfil actualizada");
    } catch {
      toast.error("Erro ao carregar imagem");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Preencha todos os campos de password");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("A nova password deve ter pelo menos 8 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As passwords não coincidem");
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password alterada com sucesso");
    } catch {
      toast.error("Erro ao alterar password");
    } finally {
      setChangingPassword(false);
    }
  };

  const roleBadgeVariants: Record<string, "error" | "info" | "success" | "warning"> = {
    admin: "error",
    gestor: "info",
    tecnico: "success",
    consulta: "warning",
  };

  return (
    <DashboardLayout title="Meu Perfil" subtitle="Gerir informações pessoais e segurança">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Avatar & Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações Pessoais
            </CardTitle>
            <CardDescription>Actualize os seus dados pessoais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                    {getInitials(profile?.full_name || "U")}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full shadow-md"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{profile?.full_name}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {profile?.email}
                </p>
                {primaryRole && (
                  <Badge variant={roleBadgeVariants[primaryRole]} className="mt-1">
                    <Shield className="h-3 w-3 mr-1" />
                    {roleLabels[primaryRole]}
                  </Badge>
                )}
              </div>
            </div>

            <Separator />

            {/* Form Fields */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="fullName" className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  Nome Completo
                </Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="O seu nome completo"
                  maxLength={200}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  Telefone
                </Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+244 9XX XXX XXX"
                  maxLength={20}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position" className="flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5" />
                  Cargo
                </Label>
                <Input
                  id="position"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="O seu cargo na organização"
                  maxLength={100}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Guardar Alterações
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Password Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Alterar Password
            </CardTitle>
            <CardDescription>Actualize a sua password de acesso</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="newPassword">Nova Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova password"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleChangePassword} disabled={changingPassword} variant="outline">
                {changingPassword ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Lock className="h-4 w-4 mr-2" />
                )}
                Alterar Password
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
