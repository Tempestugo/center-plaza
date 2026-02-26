# 🚀 Guia de Deploy na Hostinger (Atualizado)

## 📋 Stack Tecnológico do Projeto
- **Backend:** Node.js + Express
- **Frontend:** React (Vite)
- **Banco de Dados:** SQLite

## ⚠️ Atenção: Método de Deploy
No Web Hosting atual da Hostinger, o upload manual de arquivos não instala as dependências (`node_modules`) automaticamente e você não tem acesso livre ao terminal.
**Você deve usar a funcionalidade "Node.js Apps" e conectar seu repositório Git.**

---

## 🛠️ Passo a Passo: Deploy via Node.js Apps

### 1. Preparar o Repositório (GitHub)
1. Certifique-se de que todo o código (backend e frontend) está no seu repositório.
2. O arquivo `package.json` na raiz deve ter os scripts (já configurados):
   - `"build": "vite build"`
   - `"start": "node server.js"`
3. O arquivo `server.js` deve estar na raiz.

### 2. Criar a Aplicação na Hostinger
1. Acesse o **hPanel** da Hostinger.
2. Vá para **Websites** → **Gerenciar** → **Node.js Apps** (ou Aplicação Node.js).
3. Clique em **Criar Nova Aplicação** (ou Add New):
   - **Versão Node.js:** Escolha a **22** (ou a mais recente recomendada).
   - **Application Mode:** Production.
   - **Application Root:** `./` (Raiz).
   - **Application Startup File:** `server.js`.
4. Clique em **Criar**.

### 3. Conectar o Repositório e Configurar Build
1. Após criar, você verá a seção para conectar o **Git Repository**.
2. Conecte sua conta do GitHub e selecione o repositório do projeto.
3. **Importante:** Nas configurações de **Build Settings** (se disponível no fluxo de deploy) ou após conectar:
   - Certifique-se de que o sistema está configurado para rodar `npm install` e `npm run build`.
   - Isso garantirá que as bibliotecas (como `sqlite3` e `multer`) sejam instaladas e o site (Frontend) seja gerado na pasta `dist`.

### 4. Configurar Variáveis de Ambiente
> **Atenção:** É crucial configurar as variáveis de ambiente corretamente para o Stripe funcionar.

1. Na tela da sua aplicação Node.js no hPanel, procure pela seção **Environment Variables** (Variáveis de Ambiente).
2. Clique em **Adicionar Nova** (Add New) e insira as chaves e valores.
3. Adicione as seguintes variáveis:
   - **Chave:** `STRIPE_SECRET_KEY`, **Valor:** `sk_test_...` (Sua chave secreta do Stripe)
   - **Chave:** `VITE_STRIPE_PUBLISHABLE_KEY`, **Valor:** `pk_test_...` (Sua chave publicável do Stripe)

> **Nota:** A variável `VITE_STRIPE_PUBLISHABLE_KEY` é para o frontend (React/Vite) e a `STRIPE_SECRET_KEY` é para o backend (Node.js). **Nunca exponha a chave secreta no frontend.**
> Futuramente, você também adicionará a `STRIPE_WEBHOOK_SECRET` aqui.

> **Nota:** Variáveis de ambiente com o prefixo `VITE_` são usadas no frontend. O processo de build do Vite as substituirá no código final.

### 5. Finalizar
1. Clique em **Deploy** (ou Salvar).
2. Aguarde o processo finalizar.
3. Acesse a URL da sua aplicação.

### ❓ Solução de Problemas Comuns

**Não encontro o arquivo do banco de dados:**
1. O arquivo `centerplaza.db` só é criado após o servidor iniciar com sucesso.
2. Verifique as permissões da pasta `api/database` pelo **Gerenciador de Arquivos**. Ela deve ter permissão **755** (escrita permitida).

**Erro 500 ou Tela Branca:**
- Verifique os **Logs de Erro** na tela da aplicação Node.js no hPanel.
- Se houver erro de módulo não encontrado, o `npm install` não rodou corretamente. Tente forçar um novo deploy via painel.