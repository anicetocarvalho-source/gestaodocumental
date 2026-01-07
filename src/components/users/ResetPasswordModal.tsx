import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, KeyRound, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";

const resetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .regex(/[A-Z]/, "Deve conter uma letra maiúscula")
    .regex(/[a-z]/, "Deve conter uma letra minúscula")
    .regex(/[0-9]/, "Deve conter um número"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As passwords não coincidem",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    user_id: string;
    full_name: string;
  } | null;
}

export function ResetPasswordModal({ open, onOpenChange, user }: ResetPasswordModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!user) return;
    
    setIsSubmitting(true);

    try {
      const { data: response, error } = await supabase.functions.invoke(
        "reset-user-password",
        {
          body: {
            user_id: user.user_id,
            new_password: data.newPassword,
          },
        }
      );

      if (error) {
        throw new Error(error.message || "Erro ao redefinir password");
      }

      if (response?.error) {
        throw new Error(response.error);
      }

      toast.success(`Password de ${user.full_name} redefinida com sucesso!`);
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast.error(error.message || "Erro ao redefinir password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Redefinir Password
          </DialogTitle>
          <DialogDescription>
            Definir nova password para <strong>{user?.full_name}</strong>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nova Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Mínimo 8 caracteres"
                        {...field}
                        disabled={isSubmitting}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Repetir password"
                        {...field}
                        disabled={isSubmitting}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <p className="text-xs text-muted-foreground">
              A password deve ter pelo menos 8 caracteres, incluindo uma letra maiúscula, 
              uma minúscula e um número.
            </p>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    A redefinir...
                  </>
                ) : (
                  <>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Redefinir Password
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
