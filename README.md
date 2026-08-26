# 🤍 Together - Planejador de Casal

O **Together** é um aplicativo web moderno, responsivo e focado em casais, criado para organizar, sortear, e registrar planos e memórias a dois. Construído com foco absoluto em usabilidade, performance e *design offline-first* e elegante.

---

## 📸 Funcionalidades

- **Espaço do Casal Compartilhado:** Um ambiente privado e exclusivo com códigos de convite para conectar parceiros.
- **Gestão de Planos:** Crie, edite e acompanhe os planos a fazer, os concluídos e os pendentes.
- **Roleta de Planos (Sorteador):** Não sabem o que fazer no final de semana? O aplicativo sorteia um plano da lista de "A Fazer" para vocês!
- **Galeria e Memórias:** Envie e armazene fotos exclusivas de cada plano que foi concluído, construindo um mural de memórias do casal.
- **Diário/Avaliações:** Após completar um plano, vocês podem deixar avaliações, definir um nível de diversão, registrar gastos e adicionar comentários.
- **Feed de Notificações em Tempo Real:** Saiba na hora quando o parceiro adicionar um plano, completar uma meta ou interagir com o espaço de vocês.
- **PWA (Progressive Web App):** Instale o aplicativo no celular para acessar rápido diretamente pela tela inicial.
- **Modo Offline & Skeletons:** O aplicativo lida graciosamente com o carregamento via *Skeletons* polidos e trata perfeitamente perdas de conexão com estados vazios e *Error Boundaries*.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite 6](https://vitejs.dev/)
- **Estilização:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Roteamento:** [React Router 7](https://reactrouter.com/) (com Lazy Loading & Code Splitting)
- **Animações:** [Motion (Framer Motion)](https://motion.dev/)
- **Ícones:** [Lucide React](https://lucide.dev/)
- **Backend/Database:** [Supabase](https://supabase.com/) (PostgreSQL + Auth + Storage + Realtime)
- **Notificações em Tela:** [React Hot Toast](https://react-hot-toast.com/)

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/en/) (Versão 18+ recomendada)
- Uma conta e projeto ativo no [Supabase](https://supabase.com/)

### 1. Clonar o Repositório
```bash
git clone https://github.com/seu-usuario/together.git
cd together
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Configurar Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto e configure as chaves do seu Supabase:

```env
VITE_SUPABASE_URL=sua_url_do_supabase_aqui
VITE_SUPABASE_ANON_KEY=sua_anon_key_do_supabase_aqui
```

### 4. Estrutura do Banco de Dados (Supabase)
O sistema exige algumas tabelas básicas no Supabase (`couples`, `couple_members`, `plans`, `plan_photos`, `comments` e `notifications`), além do bucket de storage chamado `memories`.

### 5. Executar o Servidor de Desenvolvimento
```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`.

---

## 📱 Build para Produção

Para otimizar e gerar o pacote de arquivos estáticos, execute:

```bash
npm run build
```
O build ficará na pasta `/dist`, otimizado com *Code Splitting*, separação de chunks e gerando os *Service Workers* graças ao Vite PWA.

---

## 🎨 Design System
O projeto abandona padrões genéricos (nada de interfaces sobrecarregadas ou termos bregas em excesso). O layout foca no uso elegante de **tons de pedra (stone)** da paleta do Tailwind, bordas suaves, leitura focada (limite tipográfico seguro), botões responsivos e animações sutis (`motion`).

---

Feito com cuidado para ajudar casais a construírem histórias. ✨
