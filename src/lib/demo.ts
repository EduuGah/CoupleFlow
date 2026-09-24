/**
 * Contas de demonstração: as duas pessoas de um mesmo casal.
 *
 * Servem para quem chega pelo portfólio testar sem criar conta. Com as duas
 * abertas em abas diferentes dá para ver o que o app tem de mais seu: o plano
 * criado por uma pessoa aparece para a outra, com notificação.
 *
 * O script `demo-accounts.sql` cria as contas e o casal. As senhas são
 * públicas de propósito: estão impressas na tela de entrada.
 */
export const DEMO_EMAIL_DOMAIN = 'demo.coupleflow.app';

export const DEMO_ACCOUNTS = [
  { username: 'admin', password: 'admin', name: 'Ana' },
  { username: 'parceiro', password: 'parceiro', name: 'Léo' },
] as const;

/** Aceita e-mail ou usuário: "admin" vira admin@demo.coupleflow.app. */
export function resolveLoginEmail(input: string): string {
  const value = input.trim().toLowerCase();
  return value.includes('@') ? value : `${value}@${DEMO_EMAIL_DOMAIN}`;
}
