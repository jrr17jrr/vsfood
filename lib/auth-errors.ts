const MESSAGES: Record<string, string> = {
  auth: "Não foi possível concluir a autenticação. Tente novamente.",
  oauth_access_denied: "Login com Google cancelado.",
  oauth_conflict: "Este e-mail já está cadastrado com senha. Entre com e-mail e senha, ou confirme seu cadastro antes de usar o Google.",
  oauth_exchange: "Não foi possível continuar com o Google. Tente novamente.",
};

export function getAuthErrorMessage(code: string | null | undefined): string | null {
  if (!code) return null;
  return MESSAGES[code] ?? "Não foi possível continuar com o Google. Tente novamente.";
}
