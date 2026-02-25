# 🏨 Center Plaza - Sistema de Reservas e Gestão Hoteleira

![Project Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)

O **Center Plaza** é uma solução completa e moderna para gerenciamento de reservas de hotéis e pousadas. Desenvolvido com foco na experiência do usuário e na eficiência administrativa, o sistema oferece uma interface elegante para hóspedes e um painel robusto para administradores.

---

## ✨ Funcionalidades Principais

### 🌍 Portal do Hóspede (Frontend)
- **Busca Inteligente:** Filtros por localização, data, número de hóspedes e comodidades.
- **Detalhes da Acomodação:** Galeria de fotos interativa, lista de comodidades, avaliações e mapa.
- **Fluxo de Reserva:** Processo passo-a-passo intuitivo (Datas -> Hóspedes -> Dados -> Pagamento).
- **Área do Cliente:**
  - Dashboard personalizado.
  - Histórico de reservas (Ativas, Concluídas, Canceladas).
  - Gestão de Favoritos.
  - Download de Vouchers em PDF.
  - Edição de Perfil e Senha.
- **Consulta Rápida:** Localização de reservas via código e sobrenome sem necessidade de login.

### ⚙️ Painel Administrativo (Backoffice)
- **Dashboard Geral:** Visão geral com métricas de receita, ocupação e notificações em tempo real.
- **Gestão de Hospedagens:**
  - CRUD completo de Hotéis e Tipos de Quarto.
  - Upload e gerenciamento de imagens.
  - Definição de preços, capacidade e comodidades.
- **Controle de Reservas:**
  - Listagem com filtros avançados (Status, Data, Hóspede).
  - Alteração de status (Confirmar, Cancelar, Check-in/out).
- **Relatórios e Analytics:**
  - Gráficos de receita mensal.
  - Taxa de ocupação.
  - Ranking de acomodações mais reservadas.

---

## 🛠️ Stack Tecnológica

O projeto utiliza uma arquitetura moderna baseada em React e ecossistema JavaScript.

### Frontend
- **Core:** React 18 + TypeScript
- **Build Tool:** Vite
- **Estilização:** Tailwind CSS + shadcn/ui
- **Roteamento:** React Router DOM
- **Gerenciamento de Estado:** React Context API
- **Ícones:** Lucide React
- **Utilitários:** date-fns (datas), sonner (toasts), zod (validação).

### Backend (Integrado)
- **Runtime:** Node.js + Express
- **Banco de Dados:** SQLite (Arquivo local `centerplaza.db`)
- **Uploads:** Multer (Gerenciamento de arquivos locais)

---

## 🚀 Instalação e Execução

### Pré-requisitos
- Node.js 18 ou superior
- npm ou yarn

### Passo a Passo

1. **Clone o repositório**
   ```bash
   git clone https://github.com/seu-usuario/center-plaza.git
   cd center-plaza
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```
   O frontend estará disponível em `http://localhost:5173`.

4. **Build para Produção**
   ```bash
   npm run build
   ```

---

## 📂 Estrutura do Projeto

```
src/
├── assets/              # Imagens e recursos estáticos
├── components/          # Componentes React reutilizáveis
│   ├── admin/           # Componentes específicos do painel admin
│   ├── ui/              # Componentes base (shadcn/ui)
│   └── ...
├── contexts/            # Gerenciamento de estado global (Auth, Cart, etc)
├── hooks/               # Custom Hooks
├── pages/               # Páginas da aplicação (Rotas)
├── services/            # Integração com API (Axios)
└── lib/                 # Utilitários e configurações
```

---

## 🚢 Deploy

O projeto possui guias detalhados para diferentes plataformas de hospedagem. Consulte os arquivos específicos para mais detalhes:

- **Geral:** DEPLOY.md
- **Hostinger (Node.js):** HOSTINGER_GUIDE.md
- **Vercel/Netlify:** DEPLOYMENT_GUIDE.md

### Resumo para Deploy Estático (Frontend Only)
Se você estiver utilizando apenas o frontend (com API mockada ou externa), o deploy pode ser feito em qualquer host estático:

```bash
npm run build
# O conteúdo da pasta 'dist' está pronto para ser publicado
```

---

## 🤝 Contribuição

Contribuições são bem-vindas! Por favor, leia as diretrizes de contribuição antes de submeter um Pull Request.

1. Faça um Fork do projeto
2. Crie sua Feature Branch (`git checkout -b feature/NovaFeature`)
3. Commit suas mudanças (`git commit -m 'Add: Nova Feature'`)
4. Push para a Branch (`git push origin feature/NovaFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo LICENSE para detalhes.

---

<div align="center">
  <sub>Desenvolvido pela equipe Center Plaza</sub>
</div>
