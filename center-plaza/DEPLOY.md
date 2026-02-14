# Deploy Guide - Center Plaza

## Build de Produção

O projeto foi configurado e testado com sucesso para produção.

### Comandos de Build

```bash
# Gerar build de produção
npm run build

# Testar build localmente
npm run preview
```

### Arquivos Gerados

O build gera os seguintes arquivos na pasta `dist/`:
- `index.html` (1.28 kB)
- `assets/index-D2Hl-8xU.css` (75.37 kB)
- Imagens otimizadas das acomodações
- JavaScript bundles

### Opções de Deploy

#### 1. Vercel (Recomendado)
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel
```

#### 2. Netlify
```bash
# Instalar Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

#### 3. GitHub Pages
1. Fazer push do código para GitHub
2. Configurar GitHub Actions para build automático
3. Ativar GitHub Pages nas configurações do repositório

#### 4. Servidor Próprio
1. Fazer upload dos arquivos da pasta `dist/` para o servidor
2. Configurar servidor web (Apache/Nginx) para servir arquivos estáticos
3. Configurar redirecionamento para `index.html` (SPA)

### Configurações de Servidor

Para SPAs (Single Page Applications), configure o servidor para redirecionar todas as rotas para `index.html`:

**Nginx:**
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

**Apache (.htaccess):**
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

### Variáveis de Ambiente

Para produção, configure as seguintes variáveis se necessário:
- `VITE_API_URL`: URL da API backend
- `VITE_APP_ENV`: production

### Performance

O build atual tem alguns chunks grandes (>500KB). Para otimizar:
1. Implementar code splitting com dynamic imports
2. Configurar manual chunks no Vite
3. Lazy loading de componentes

### Status do Deploy

✅ Build de produção funcionando
✅ Preview server testado (http://localhost:4173/)
✅ Todas as funcionalidades operacionais
✅ Sistema de autenticação funcionando
✅ Sistema de reservas funcionando
✅ Sistema de favoritos funcionando
✅ Painel do usuário completo
✅ Consulta de reservas funcionando

### Próximos Passos

1. Escolher plataforma de deploy
2. Configurar domínio personalizado
3. Configurar SSL/HTTPS
4. Implementar monitoramento
5. Configurar backup dos dados (localStorage)