# Guia de Deploy na Hostinger

## Stack Tecnológico do Projeto
- **Backend:** Node.js + Express
- **Frontend:** React (Vite)
- **Banco de Dados:** MySQL

## Método de Deploy
No Web Hosting atual da Hostinger, o upload manual de arquivos não instala as dependências (`node_modules`) automaticamente e você não tem acesso livre ao terminal.
**Você deve usar a funcionalidade "Node.js Apps" e conectar seu repositório Git.**

---

## Passo a Passo: Deploy via Node.js Apps

### 1. Preparar o Repositório (GitHub)
1. Certifique-se de que todo o código (backend e frontend) está no seu repositório.
2. O arquivo `package.json` na raiz deve ter os scripts:
   - `"build": "vite build"`
   - `"start": "node server.js"`
3. O arquivo `server.js` deve estar na raiz.

### 2. Criar a Aplicação na Hostinger
1. Acesse o hPanel da Hostinger.
2. Vá para Websites -> Gerenciar -> Node.js Apps.
3. Clique em Criar Nova Aplicação:
   - **Versão Node.js:** Escolha a 22 (ou a mais recente estável).
   - **Application Mode:** Production.
   - **Application Root:** `./` (Raiz).
   - **Application Startup File:** `server.js`.
4. Clique em Criar.

### 3. Conectar o Repositório e Configurar Build
1. Após criar, conecte seu Git Repository.
2. Conecte sua conta do GitHub e selecione o repositório do projeto.
3. Nas configurações de Build Settings:
   - Certifique-se de que o sistema está configurado para rodar `npm install` e `npm run build`.
   - Isso garantirá que as bibliotecas (como `mysql2` e `multer`) sejam instaladas e o site (Frontend) seja gerado na pasta `dist`.

### 4. Configurar Variáveis de Ambiente
Atenção: É crucial configurar as variáveis de ambiente corretamente para o Stripe funcionar.

1. Na tela da sua aplicação Node.js no hPanel, acesse a seção de Variáveis de Ambiente.
2. Adicione as seguintes variáveis:
   - **STRIPE_SECRET_KEY**: Sua chave secreta do Stripe (sk_test_...)
   - **VITE_STRIPE_PUBLISHABLE_KEY**: Sua chave publicável do Stripe (pk_test_...)

Nota: A variável `VITE_STRIPE_PUBLISHABLE_KEY` é para o frontend (React/Vite) e a `STRIPE_SECRET_KEY` é para o backend (Node.js). Nunca exponha a chave secreta no frontend.
Também é necessário adicionar a `STRIPE_WEBHOOK_SECRET` posteriormente.

Nota: Variáveis de ambiente com o prefixo `VITE_` são usadas no frontend. O processo de build do Vite as substituirá no código final.

### 5. Finalizar
1. Clique em Deploy.
2. Aguarde o processo finalizar.
3. Acesse a URL da sua aplicação.

### Solução de Problemas Comuns

**Erro de conexão com o Banco de Dados (MySQL):**
1. Certifique-se de configurar as variáveis de ambiente de acesso ao MySQL (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` ou `DATABASE_URL`) no hPanel da Hostinger.
2. O servidor inicializará e criará as tabelas MySQL automaticamente no primeiro boot.

**Erro 500 ou Tela Branca:**
- Verifique os logs de erro na tela da aplicação Node.js no hPanel.
- Se houver erro de módulo não encontrado, o `npm install` não rodou corretamente. Tente forçar um novo deploy via painel.
