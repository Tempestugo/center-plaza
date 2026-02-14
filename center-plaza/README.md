# 🏨 Center Plaza - Sistema de Reservas

Um sistema completo de reservas para acomodações, desenvolvido com React, TypeScript e Vite. O Center Plaza oferece uma experiência moderna e intuitiva para reserva de hospedagens.

## 🚀 Funcionalidades

### 👤 Sistema de Autenticação
- ✅ Login e registro de usuários
- ✅ Proteção de rotas
- ✅ Contexto de autenticação global
- ✅ Modal de autenticação responsivo

### 🏠 Gestão de Acomodações
- ✅ Catálogo de acomodações
- ✅ Detalhes completos das propriedades
- ✅ Sistema de favoritos persistente
- ✅ Compartilhamento de acomodações
- ✅ Galeria de imagens

### 📅 Sistema de Reservas
- ✅ Fluxo completo de reserva
- ✅ Seleção de datas e hóspedes
- ✅ Cálculo automático de preços
- ✅ Múltiplas formas de pagamento (PIX, Cartão)
- ✅ Confirmação e voucher de reserva
- ✅ Consulta de reservas por código

### 👨‍💼 Painel do Usuário
- ✅ Dashboard personalizado
- ✅ Histórico de reservas
- ✅ Gerenciamento de favoritos
- ✅ Perfil do usuário editável
- ✅ Download de vouchers

### 🔧 Painel Administrativo
- ✅ Gestão de hospedagens
- ✅ Controle de reservas
- ✅ Relatórios e estatísticas
- ✅ Dashboard administrativo

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Roteamento**: React Router DOM
- **Gerenciamento de Estado**: Context API
- **Persistência**: localStorage
- **Ícones**: Lucide React
- **Formulários**: React Hook Form + Zod
- **Componentes**: Radix UI

## 📦 Instalação e Desenvolvimento

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn

### Passos para instalação

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/center-plaza.git

# 2. Navegue para o diretório
cd center-plaza

# 3. Instale as dependências
npm install

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

O projeto estará disponível em `http://localhost:5173`

## 🚀 Deploy

### Build de Produção

```bash
# Gerar build de produção
npm run build

# Testar build localmente
npm run preview
```

### Scripts de Deploy Disponíveis

```bash
# Deploy genérico (apenas build)
npm run deploy

# Deploy para Vercel
npm run deploy:vercel

# Deploy para Netlify
npm run deploy:netlify

# Deploy para Surge
npm run deploy:surge

# Build + Preview
npm run serve
```

### Plataformas Suportadas

- **Vercel** (Recomendado) - Configuração automática
- **Netlify** - Com redirects para SPA
- **GitHub Pages** - Via GitHub Actions
- **Surge.sh** - Deploy rápido
- **Servidor próprio** - Arquivos estáticos

### Deploy Automático

O projeto inclui GitHub Actions para deploy automático:
- ✅ Build e testes em múltiplas versões do Node.js
- ✅ Deploy automático para Vercel, Netlify e GitHub Pages
- ✅ Configurações de cache otimizadas
- ✅ Headers de segurança

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── ui/             # Componentes base (shadcn/ui)
│   ├── AccommodationCard.tsx
│   ├── AuthModal.tsx
│   ├── BookingFlow.tsx
│   └── ...
├── contexts/           # Contextos React
│   ├── AuthContext.tsx
│   ├── FavoritesContext.tsx
│   └── ReservationContext.tsx
├── pages/              # Páginas da aplicação
│   ├── Index.tsx
│   ├── UserDashboard.tsx
│   ├── AdminDashboard.tsx
│   └── ...
├── hooks/              # Hooks customizados
├── lib/                # Utilitários
└── assets/             # Imagens e recursos
```

## 🌟 Características Principais

- **Responsivo**: Interface adaptável para desktop, tablet e mobile
- **Performance**: Build otimizado com Vite e lazy loading
- **Acessibilidade**: Componentes acessíveis com Radix UI
- **SEO**: Meta tags otimizadas e estrutura semântica
- **Segurança**: Headers de segurança e validação de dados
- **PWA Ready**: Preparado para implementação de PWA

## 🔧 Configuração de Ambiente

### Variáveis de Ambiente (Opcional)

Crie um arquivo `.env.local` na raiz do projeto:

```env
VITE_API_URL=https://api.centerplaza.com
VITE_APP_ENV=production
VITE_ANALYTICS_ID=your-analytics-id
```

## 📊 Scripts Disponíveis

| Script | Descrição |
|--------|----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Gera build de produção |
| `npm run preview` | Testa build localmente |
| `npm run lint` | Executa linter |
| `npm run deploy` | Script de deploy genérico |
| `npm run deploy:vercel` | Deploy para Vercel |
| `npm run deploy:netlify` | Deploy para Netlify |
| `npm run serve` | Build + Preview |

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Equipe

- **Desenvolvimento**: Equipe Center Plaza
- **Design**: UI/UX Team
- **Backend**: API Team

## 📞 Suporte

Para suporte técnico ou dúvidas:
- Email: devturco@gmail.com
