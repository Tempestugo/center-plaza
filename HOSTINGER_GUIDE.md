# 🚀 Guia de Deploy na Hostinger

Este guia explica como colocar seu sistema Center Plaza no ar usando a hospedagem da Hostinger.

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