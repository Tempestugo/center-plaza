# Center Plaza - Sistema de Reservas e Gestão Hoteleira

O Center Plaza é um sistema para gerenciamento de reservas de hotéis e pousadas. O projeto engloba uma interface para hóspedes e um painel para administradores.

## Funcionalidades Principais

### Portal do Hóspede (Frontend)
- **Busca Inteligente:** Filtros por localização, data, número de hóspedes e comodidades.
- **Detalhes da Acomodação:** Galeria de fotos, lista de comodidades, avaliações e mapa.
- **Fluxo de Reserva:** Processo estruturado em etapas (Datas, Hóspedes, Dados e Pagamento).
- **Área do Cliente:**
  - Histórico de reservas (Ativas, Concluídas, Canceladas).
  - Gestão de Favoritos.
  - Download de Vouchers em PDF.
  - Edição de perfil e senha.
- **Consulta Rápida:** Localização de reservas via código e sobrenome sem necessidade de login.

### Painel Administrativo (Backoffice)
- **Métricas:** Visão geral com métricas de receita, ocupação e notificações.
- **Gestão de Hospedagens:**
  - Cadastro e edição de hotéis e tipos de quartos.
  - Upload e gerenciamento de imagens das acomodações.
  - Configuração de preços, capacidade e comodidades.
- **Controle de Reservas:**
  - Listagem com filtros avançados (Status, Data, Hóspede).
  - Alteração de status (Confirmação, Cancelamento, Check-in/Check-out).
- **Relatórios:**
  - Gráficos de receita mensal e taxa de ocupação.
  - Ranking de acomodações mais reservadas.

## Stack Tecnológica

### Frontend
- **Core:** React 18 + TypeScript
- **Ferramenta de Build:** Vite
- **Estilização:** Tailwind CSS + shadcn/ui
- **Roteamento:** React Router DOM
- **Gerenciamento de Estado:** React Context API
- **Ícones:** Lucide React
- **Auxiliares:** date-fns, sonner, zod.

### Backend
- **Ambiente:** Node.js + Express
- **Banco de Dados:** MySQL
- **Uploads:** Multer

## Instalação e Execução

### Pré-requisitos
- Node.js 18 ou superior
- npm

### Configuração Local

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/center-plaza.git
   cd center-plaza
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   O frontend estará disponível em `http://localhost:5173`.

4. Build para produção:
   ```bash
   npm run build
   ```

## Estrutura do Projeto

```
src/
├── assets/              # Imagens e recursos estáticos
├── components/          # Componentes React reutilizáveis
│   ├── admin/           # Componentes específicos do painel admin
│   └── ui/              # Componentes base (shadcn/ui)
├── contexts/            # Gerenciamento de estado (Auth, Reservation, Favorites)
├── hooks/               # Custom Hooks
├── pages/               # Páginas da aplicação (Rotas)
├── services/            # Integração com API
└── lib/                 # Utilitários e configurações
```

## Deploy

Guias de deploy específicos:
- **Geral:** DEPLOY.md
- **Hostinger (Node.js):** HOSTINGER_GUIDE.md
- **Vercel/Netlify:** DEPLOYMENT_GUIDE.md

### Deploy Estático (Somente Frontend)
```bash
npm run build
# Os arquivos gerados na pasta 'dist' estão prontos para publicação
```

## Contribuição

1. Faça um Fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFeature`)
3. Commite suas alterações (`git commit -m 'Add: Nova Feature'`)
4. Envie para a branch (`git push origin feature/NovaFeature`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a Licença MIT.
