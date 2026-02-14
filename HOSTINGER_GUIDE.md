# 🚀 Guia de Deploy na Hostinger

## 📋 Stack Tecnológico do Projeto
- **Backend:** Node.js + **Express**
- **Frontend:** **React** (Vite)
- **Banco de Dados:** SQLite

Este guia explica como colocar seu sistema Center Plaza no ar.

## 🤖 Opção Automática (Recomendada: GitHub Actions)

Esta opção atualiza seu site automaticamente toda vez que você envia o código para o GitHub.

### 1. Configurar o Repositório no GitHub
1. Crie um repositório no GitHub e suba seu código.
2. No seu repositório, vá em **Settings** -> **Secrets and variables** -> **Actions**.
3. Clique em **New repository secret** e adicione as seguintes chaves (pegue os dados no painel da Hostinger em "Contas FTP"):
   - `FTP_SERVER`: O hostname do FTP (ex: `ftp.seusite.com` ou um IP).
   - `FTP_USERNAME`: Seu usuário FTP (ex: `u123456789`).
   - `FTP_PASSWORD`: Sua senha do FTP.

### 2. O que o script faz?
O arquivo `.github/workflows/deploy.yml` que criamos fará o seguinte:
1. Entra na pasta `web`, instala e constrói o site (gera a pasta `dist`).
2. Envia o conteúdo de `dist` para a pasta `public_html` da Hostinger (seu site visível).
3. Envia a pasta `api` para a pasta `api` da Hostinger.

### 3. Pós-Deploy (Apenas na primeira vez ou se mudar dependências)
Após o GitHub terminar o envio:
1. Vá no painel da Hostinger -> **Setup Node.js App**.
2. Se for a primeira vez, certifique-se de que a **Application Root** está como `api`.
3. Clique em **Install NPM Packages** (para instalar as bibliotecas do backend).
4. Clique em **Restart**.

---

## 🖐️ Opção Manual (Via Upload de Arquivos)

## 1. Backend (API Node.js)

A API é o "cérebro" do sistema e precisa rodar em um processo Node.js.

### No Painel da Hostinger (hPanel):
1. Vá para a seção **Site** ou **Hospedagem**.
2. Procure por **Setup Node.js App** (ou Aplicação Node.js).
3. Clique em **Criar Nova Aplicação**:
   - **Versão Node.js:** Escolha a 18 ou superior (Recomendado).
   - **Modo:** Production.
   - **Application Root:** `api` (ou o nome da pasta que você vai criar).
   - **Application Startup File:** `sqlite-server.js`.
4. Clique em **Criar**.

### Subindo os Arquivos:
1. Abra o **Gerenciador de Arquivos** da Hostinger.
2. Navegue até a pasta que você definiu (ex: `public_html/api` ou apenas `api` fora do public_html se preferir segurança extra).
3. Faça upload de **todos os arquivos** da pasta `center-plaza/api` do seu computador, **EXCETO** a pasta `node_modules`.
   - *Dica: Você pode zipar a pasta `api`, subir o zip e extrair lá dentro.*
4. Certifique-se de que o arquivo `package.json` também foi enviado.

### Instalando Dependências:
1. Na tela do **Setup Node.js App** na Hostinger, clique no botão **Enter Control Panel** (ou Terminal).
2. Digite o comando:
   ```bash
   npm install
   ```
3. Após instalar, clique no botão **Restart** na tela do Node.js App.

### Variáveis de Ambiente:
Na mesma tela do Node.js App, você pode definir variáveis de ambiente (Environment Variables):
- `STRIPE_SECRET_KEY`: Sua chave real do Stripe.
- `ADMIN_SECRET`: Sua senha de admin.

---

## 2. Frontend (Site React)

O site é a parte visual. Ele precisa ser "construído" (build) antes de subir.

### No seu Computador:
1. Abra o terminal na pasta `web`.
2. Antes de construir, você precisa apontar o site para a sua API real na Hostinger.
   - Edite o arquivo onde você faz as chamadas (ex: `App.jsx`) e troque `http://localhost:3001` pelo seu domínio real (ex: `https://seusite.com/api` ou `https://api.seusite.com`).
3. Rode o comando de build:
   ```bash
   npm run build
   ```
4. Isso criará uma pasta chamada `dist`.

### Na Hostinger:
1. Abra o **Gerenciador de Arquivos**.
2. Vá para a pasta `public_html`.
3. Apague o arquivo `default.php` se houver.
4. Faça upload de **todo o conteúdo** de dentro da pasta `dist` (que você criou no passo anterior) para dentro da `public_html`.
   - Você deve ver o `index.html` solto dentro da `public_html`.

---

## 3. Banco de Dados (SQLite)

Como estamos usando SQLite, o banco de dados é apenas um arquivo (`centerplaza.db`).
- Ele será criado automaticamente na primeira vez que a API rodar.
- **Importante:** A pasta onde o arquivo `.db` fica precisa ter permissão de escrita. No Gerenciador de Arquivos, clique com botão direito na pasta `database` (dentro da api) -> Permissions -> Marque "Write" para Owner e Group (755 ou 775).