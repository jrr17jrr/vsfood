import { z } from "zod";
import { isEmail, onlyDigits } from "@/lib/format";

const whatsappField = z
  .string()
  .trim()
  .min(1, "Informe seu WhatsApp")
  .refine((v) => onlyDigits(v).length >= 10 && onlyDigits(v).length <= 11, "WhatsApp inválido");

const signUpBaseFields = {
  name: z.string().trim().min(2, "Informe seu nome completo"),
  whatsapp: whatsappField,
  email: z.string().trim().min(1, "Informe seu e-mail").email("E-mail inválido"),
  password: z.string().min(6, "A senha precisa ter no mínimo 6 caracteres"),
  confirmPassword: z.string(),
};

const passwordsMatch = (data: { password: string; confirmPassword: string }) => data.password === data.confirmPassword;
const passwordMismatch = { message: "As senhas não coincidem", path: ["confirmPassword"] };

// Usado pelo formulário de cadastro no client (sem `role`, que é definido pela página).
export const signUpFormSchema = z.object(signUpBaseFields).refine(passwordsMatch, passwordMismatch);
export type SignUpFormInput = z.infer<typeof signUpFormSchema>;

// Usado pela Server Action (inclui `role`, definido no servidor a partir do contexto da página).
export const signUpSchema = z
  .object({ ...signUpBaseFields, role: z.enum(["customer", "restaurant_owner"]) })
  .refine(passwordsMatch, passwordMismatch);
export type SignUpInput = z.infer<typeof signUpSchema>;

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Informe seu e-mail ou WhatsApp"),
  password: z.string().min(1, "Informe sua senha"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, "Informe seu e-mail").email("E-mail inválido"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "A senha precisa ter no mínimo 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export function identifierIsEmail(identifier: string): boolean {
  return isEmail(identifier);
}
