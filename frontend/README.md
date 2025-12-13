# Zyva Frontend

Frontend do Zyva CRM desenvolvido com Next.js 15, React 19 e Tailwind CSS.

## ✅ Status

- [x] Next.js 15 configurado
- [x] React 19 instalado
- [x] Tailwind CSS configurado
- [x] Zustand para gerenciamento de estado
- [x] React Hook Form + Zod para validação
- [x] Axios para requisições HTTP
- [x] Páginas de Login e Cadastro criadas
- [x] Dashboard básico criado
- [x] Servidor rodando em http://localhost:3000

## 🚀 Como Rodar

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

O arquivo `.env.local` já está configurado com:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Iniciar servidor de desenvolvimento

```bash
npm run dev
```

O aplicativo estará disponível em: http://localhost:3000

## 📡 Páginas Disponíveis

### Home
- **URL**: http://localhost:3000
- **Descrição**: Landing page com apresentação do produto
- **Features**: Links para Login e Cadastro

### Login
- **URL**: http://localhost:3000/login
- **Descrição**: Página de autenticação
- **Campos**: Email, Senha
- **Validação**: Zod schema
- **Integração**: POST /api/auth/login

### Cadastro
- **URL**: http://localhost:3000/cadastro
- **Descrição**: Página de registro de novo usuário
- **Campos**: Nome, Email, Senha, Confirmar Senha
- **Validação**: Zod schema com confirmação de senha
- **Integração**: POST /api/auth/register

### Dashboard
- **URL**: http://localhost:3000/dashboard
- **Descrição**: Painel do usuário autenticado
- **Proteção**: Redireciona para /login se não autenticado
- **Features**:
  - Exibe informações do usuário
  - Mostra dados da organização
  - Limites do plano
  - Botão de logout

## 🔐 Autenticação

### Flow de Autenticação

1. **Registro**:
   - Usuário preenche formulário em `/cadastro`
   - Dados são validados com Zod
   - Request para `/api/auth/register`
   - Token JWT é salvo no Zustand e localStorage
   - Redirect para `/dashboard`

2. **Login**:
   - Usuário preenche formulário em `/login`
   - Dados são validados com Zod
   - Request para `/api/auth/login`
   - Token JWT é salvo no Zustand e localStorage
   - Redirect para `/dashboard`

3. **Logout**:
   - Usuário clica em "Sair" no dashboard
   - Token e dados são removidos do Zustand e localStorage
   - Redirect para `/login`

4. **Persistência**:
   - Zustand persiste dados no localStorage
   - Token é enviado automaticamente em todas as requests (axios interceptor)
   - Se token inválido (401), usuário é redirecionado para `/login`

## 📁 Estrutura de Pastas

```
frontend/
├── app/
│   ├── globals.css         # Estilos globais + Tailwind
│   ├── layout.tsx          # Layout raiz
│   ├── page.tsx            # Home/Landing page
│   ├── login/
│   │   └── page.tsx        # Página de login
│   ├── cadastro/
│   │   └── page.tsx        # Página de cadastro
│   └── dashboard/
│       └── page.tsx        # Dashboard do usuário
├── lib/
│   └── api.ts              # Cliente Axios configurado
├── stores/
│   └── auth.ts             # Zustand store de autenticação
├── .env.local              # Variáveis de ambiente
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## 🎨 Tecnologias

- **Next.js 15** - Framework React
- **React 19** - UI Library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Axios** - HTTP client
- **Lucide React** - Icons (instalado, pronto para usar)
- **Framer Motion** - Animations (instalado, pronto para usar)

## 🧪 Testar Autenticação

### 1. Criar novo usuário

1. Acesse http://localhost:3000/cadastro
2. Preencha:
   - Nome: Seu Nome
   - Email: seu@email.com
   - Senha: senha123
   - Confirmar Senha: senha123
3. Clique em "Criar conta grátis"
4. Você será redirecionado para o dashboard

### 2. Fazer login

1. Acesse http://localhost:3000/login
2. Preencha:
   - Email: seu@email.com (ou teste@zyva.com se criou no backend)
   - Senha: senha123
3. Clique em "Entrar"
4. Você será redirecionado para o dashboard

### 3. Verificar dados

No dashboard você verá:
- Seu nome e email
- Plano (FREE por padrão)
- Dados da organização
- Limites de uso

## 🛠️ Scripts Disponíveis

- `npm run dev` - Iniciar servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm start` - Iniciar servidor de produção
- `npm run lint` - Executar linter

## 🔗 Integração com Backend

O frontend se comunica com o backend através da lib `api.ts`:

```typescript
import { api } from '@/lib/api';

// Fazer login
const response = await api.post('/api/auth/login', {
  email: 'user@example.com',
  password: 'password123'
});

// O token é adicionado automaticamente em todas as requests
// através do axios interceptor
```

## 📱 Responsivo

Todas as páginas são totalmente responsivas:
- ✅ Mobile (< 768px)
- ✅ Tablet (768px - 1024px)
- ✅ Desktop (> 1024px)

## 🎯 Próximos Passos

Agora que a autenticação está funcionando, você pode:

1. **Testar o fluxo completo** - Criar conta, fazer login, ver dashboard
2. **Implementar CRUD de Contatos** - Seguir FASE 2 do plano
3. **Adicionar mais páginas** - Kanban, Flows, Campanhas, etc.
4. **Melhorar UI/UX** - Adicionar animações com Framer Motion
5. **Adicionar componentes** - Shadcn/UI ou criar seus próprios

## 📞 Suporte

- Documentação principal: `/doc/PLANO_DESENVOLVIMENTO.md`
- Backend README: `/backend/README.md`

## 🎉 Status Atual

**FRONTEND COMPLETO E FUNCIONAL!** ✅

- ✅ Setup completo
- ✅ Autenticação funcionando
- ✅ Integrado com backend
- ✅ Pronto para uso

**Acesse agora**: http://localhost:3000
