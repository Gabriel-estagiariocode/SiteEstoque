const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const { loadEnvFile } = require('./env');

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8'
};

const DEFAULT_CONFIG = {
  supabaseUrl: 'https://vqrogebjodwaioyjcrws.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxcm9nZWJqb2R3YWlveWpjcndzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDMxNjMsImV4cCI6MjA5MTQxOTE2M30.m9VnXhQebf-U0Ivn3nkO-wSM9dweYMjLNs8tYvXB0fI',
  recaptchaSiteKey: '6LfBFtIsAAAAAAO3pz90sd3q8rcuUsxDxgcD2ciS',
  desktopInstallerUrl: ''
};
const DEFAULT_PORT = 43128;

function getAppConfig() {
  return {
    supabaseUrl: process.env.SUPABASE_URL || DEFAULT_CONFIG.supabaseUrl,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || DEFAULT_CONFIG.supabaseAnonKey,
    recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY || DEFAULT_CONFIG.recaptchaSiteKey,
    desktopInstallerUrl: process.env.DESKTOP_INSTALLER_URL || DEFAULT_CONFIG.desktopInstallerUrl
  };
}

function sendJson(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function sendText(res, statusCode, body, contentType) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', contentType);
  res.end(body);
}

function resolveStaticPath(projectRoot, requestPath) {
  const normalized = requestPath === '/' ? '/index.html' : requestPath;
  const cleanPath = normalized.split('?')[0];
  const relativePath = cleanPath.replace(/^\/+/, '');
  const absolutePath = path.normalize(path.join(projectRoot, relativePath));

  if (!absolutePath.startsWith(projectRoot)) {
    return null;
  }

  return absolutePath;
}

function serveStaticFile(projectRoot, req, res) {
  const filePath = resolveStaticPath(projectRoot, req.url || '/');
  if (!filePath || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    sendText(res, 404, 'Arquivo nao encontrado.', 'text/plain; charset=utf-8');
    return;
  }

  const extension = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[extension] || 'application/octet-stream';

  res.statusCode = 200;
  res.setHeader('Content-Type', contentType);
  fs.createReadStream(filePath).pipe(res);
}

function serveAppConfig(res) {
  const script = `window.APP_CONFIG = ${JSON.stringify(getAppConfig())};`;
  sendText(res, 200, script, 'application/javascript; charset=utf-8');
}

async function handleApi(projectRoot, req, res) {
  const routeName = path.basename((req.url || '').split('?')[0]);
  const handlerPath = path.join(projectRoot, 'api', `${routeName}.js`);

  if (!fs.existsSync(handlerPath)) {
    sendJson(res, 404, { error: 'Rota nao encontrada.' });
    return;
  }

  try {
    delete require.cache[require.resolve(handlerPath)];
    const handler = require(handlerPath);
    await handler(req, res);
  } catch (error) {
    console.error('Erro ao executar rota local:', routeName, error);
    sendJson(res, 500, { error: 'Falha interna ao processar a rota local.' });
  }
}

async function createLocalServer(projectRoot) {
  loadEnvFile(projectRoot);

  const server = http.createServer(async (req, res) => {
    const requestUrl = req.url || '/';

    if (requestUrl === '/app-config.js') {
      serveAppConfig(res);
      return;
    }

    if (requestUrl.startsWith('/api/')) {
      await handleApi(projectRoot, req, res);
      return;
    }

    serveStaticFile(projectRoot, req, res);
  });

  await new Promise((resolve, reject) => {
    const tryListen = port => {
      const handleError = error => {
        server.off('error', handleError);
        if (port !== 0 && error?.code === 'EADDRINUSE') {
          tryListen(0);
          return;
        }
        reject(error);
      };

      server.once('error', handleError);
      server.listen(port, '127.0.0.1', () => {
        server.off('error', handleError);
        resolve();
      });
    };

    tryListen(DEFAULT_PORT);
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Nao foi possivel obter a porta do servidor local.');
  }

  return {
    server,
    port: address.port,
    url: `http://127.0.0.1:${address.port}`
  };
}

module.exports = {
  createLocalServer
};
