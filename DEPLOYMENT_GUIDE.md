# 🚀 Guia de Deploy - Center Plaza

## ✅ Status do Projeto

- ✅ Build de produção criado com sucesso
- ✅ Arquivos otimizados e comprimidos
- ✅ Aplicação testada e funcionando
- ✅ Pronto para deploy

## 📁 Arquivos de Produção

O build está localizado na pasta `dist/` com os seguintes arquivos:

```
dist/
├── assets/
│   ├── accommodation-1-ymyyJMDn.jpg (171KB)
│   ├── accommodation-2-BJaeP26a.jpg (49KB)
│   ├── accommodation-3-CfceqvWp.jpg (91KB)
│   ├── hero-accommodation-DPyEuprj.jpg (288KB)
│   ├── index-bvzutRT9.js (599KB) - JavaScript principal
│   └── index-D2Hl-8xU.css (75KB) - Estilos CSS
├── favicon.ico
├── index.html
├── placeholder.svg
└── robots.txt
```

## 🌐 Opções de Deploy

### 1. Vercel (Recomendado)

**Deploy Automático via GitHub:**
1. Faça push do código para o GitHub
2. Conecte o repositório no [Vercel](https://vercel.com)
3. O deploy será automático a cada push

**Deploy Manual:**
```bash
npm install -g vercel
vercel --prod
```

**Configuração:**
- ✅ `vercel.json` já configurado
- ✅ Build command: `npm run build`
- ✅ Output directory: `dist`

### 2. Netlify

**Deploy via GitHub:**
1. Conecte o repositório no [Netlify](https://netlify.com)
2. Configure:
   - Build command: `npm run build`
   - Publish directory: `dist`

**Deploy Manual:**
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

**Configuração:**
- ✅ `netlify.toml` já configurado
- ✅ Redirects para SPA configurados
- ✅ Headers de segurança configurados

### 3. GitHub Pages

**Deploy Automático:**
- ✅ GitHub Actions configurado (`.github/workflows/deploy.yml`)
- O deploy acontece automaticamente a cada push na branch `main`

**Deploy Manual:**
```bash
npm run build
npm install -g gh-pages
gh-pages -d dist
```

### 4. Surge.sh

```bash
npm install -g surge
npm run build
surge dist
```

### 5. Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### 6. AWS S3 + CloudFront

1. Crie um bucket S3
2. Configure para hosting estático
3. Faça upload dos arquivos da pasta `dist`
4. Configure CloudFront para CDN

### 7. Servidor Próprio

**Nginx:**
```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    root /var/www/center-plaza/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Apache (.htaccess):**
```apache
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
</IfModule>
```

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview do build
npm run preview

# Deploy automático
npm run deploy

# Deploy específico
npm run deploy:vercel
npm run deploy:netlify
npm run deploy:surge

# Servir arquivos localmente
npm run serve
```

## 🌍 Variáveis de Ambiente

Crie um arquivo `.env.local` se necessário:

```env
# Opcional - URLs da API
VITE_API_URL=https://api.centerplaza.com
VITE_PAYMENT_API=https://payments.centerplaza.com

# Opcional - Chaves de serviços externos
VITE_GOOGLE_MAPS_API_KEY=sua_chave_aqui
VITE_ANALYTICS_ID=seu_id_aqui
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51T54VULq8ZIJ5qgnpNvpGadJXo4BJDeF0CvxWDw7sch3RMLWD08KwyrBVAoVLT8EPsYoocx48i9i8aVUIyx2mrvA00kUulFZAV
```

## 📊 Métricas do Build

- **JavaScript:** 599KB (comprimido)
- **CSS:** 75KB (comprimido)
- **Imagens:** ~600KB total
- **Total:** ~1.3MB

## 🔍 Verificação Pós-Deploy

1. ✅ Página inicial carrega corretamente
2. ✅ Navegação entre páginas funciona
3. ✅ Sistema de autenticação funciona
4. ✅ Reservas podem ser criadas
5. ✅ Dashboard do usuário funciona
6. ✅ Painel administrativo funciona
7. ✅ Responsividade em dispositivos móveis
8. ✅ Performance adequada (Lighthouse)

## 🆘 Suporte

Em caso de problemas:

1. Verifique os logs do build
2. Teste localmente com `npm run preview`
3. Verifique as configurações de DNS
4. Confirme que todos os arquivos foram enviados

## 📝 Próximos Passos

1. **Domínio Personalizado:** Configure seu domínio
2. **SSL/HTTPS:** Ative certificado SSL
3. **CDN:** Configure para melhor performance
4. **Monitoramento:** Configure analytics e monitoramento
5. **Backup:** Configure backup automático

---

**🎉 Projeto Center Plaza está pronto para produção!**

Escolha a plataforma de deploy que melhor se adequa às suas necessidades e siga as instruções correspondentes.