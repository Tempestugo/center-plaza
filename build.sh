#!/bin/bash
set -e
cd /home/u556180082/domains/lightgrey-echidna-641630.hostingersite.com/nodejs


cat > index.html << 'HTMLEOF'
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Center Plaza Hotel</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
HTMLEOF

chmod +x node_modules/vite/node_modules/@esbuild/linux-x64/bin/esbuild
/opt/alt/alt-nodejs18/root/usr/bin/node node_modules/.bin/vite build


echo "BUILD OK — dist/ atualizado"