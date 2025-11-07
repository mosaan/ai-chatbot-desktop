import path from 'node:path';
import { fileURLToPath, parse } from 'node:url';
import { createServer } from 'node:http';
import { app, BrowserWindow, Menu, shell, screen, protocol } from 'electron';
import defaultMenu from 'electron-default-menu';
import dotenv from 'dotenv';
import { WebLLMMiddleware } from 'web-llm-middleware';
import { createHandler } from 'next-electron-rsc';

// Get the directory name of the current module
const appPath = app.getAppPath();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = app.isPackaged
  ? path.join(process.resourcesPath, '.env')
  : path.join(__dirname, '../.env');

// Load environment variables from .env file
dotenv.config({
  path: envPath,
  processEnv: {
    ELECTRON_DISABLE_SECURITY_WARNINGS: 'true',
    ELECTRON_ENABLE_LOGGING: 'true',
  },
});

// Register a custom protocol for the app
process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));

/// Prepare runtime environment
const dev = process.env.NODE_ENV === 'development';
const port = Number.parseInt(process.env.PORT ?? '3000', 10);
const turbo = Boolean(process.env.VERCEL_TURBO_PACK === 'true' || false); // Packed with turbo cause rendering errors in production mode
const devTools = !dev && !app.isPackaged; // Enable devTools only in development mode and when not packaged

let mainWindow: BrowserWindow | null = null;
let stopIntercept: (() => void) | undefined;

console.log(
  `[Electron] Starting with environment: dev:${dev}, port:${port}, turbo:${turbo}, devTools:${devTools}`,
);

// Initialize next-electron-rsc handler
const dir = dev ? appPath : path.join(appPath, '.next', 'standalone', 'ai-chatbot-desktop');
const { createInterceptor, localhostUrl } = createHandler({
  dev,
  dir,
  protocol,
  debug: true,
  turbo,
});

const createWindow = async () => {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  mainWindow = new BrowserWindow({
    title: 'Chatbot SDK for Desktop',
    frame: true,
    autoHideMenuBar: true,
    resizable: true,
    width: width * 0.8,
    height: height * 0.8,
    webPreferences: {
      contextIsolation: true, // protect against prototype pollution
      devTools,
    },
  });

  mainWindow.once('ready-to-show', () =>
    mainWindow?.webContents.openDevTools(),
  );
  // }

  mainWindow.on('closed', () => {
    stopIntercept?.();
    mainWindow = null;
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!isLocalhostURL(url)) {
      shell.openExternal(url);
      event.preventDefault();
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      if (isLocalhostURL(url)) {
        return { action: 'allow' };
      }

      shell.openExternal(url);
    } catch (e) {
      console.error('[Electron] Error opening external URL:', e);
    }
    return { action: 'deny' };
  });

  Menu.setApplicationMenu(Menu.buildFromTemplate(defaultMenu(app, shell)));

  await app.whenReady();

  try {
    await startWebLLM({ dev, model: 'Llama-3.2-1B-Instruct-q4f32_1-MLC' });

    console.log(
      `[Electron] Loaded WebLLM at http://localhost:15408 in ${dev ? 'development' : 'production'} mode`,
    );

    // Use next-electron-rsc instead of manual HTTP server
    stopIntercept = await createInterceptor({
      session: mainWindow.webContents.session,
    });

    console.log(
      `[Electron] Loaded Next.js app with next-electron-rsc at ${localhostUrl} in ${dev ? 'development' : 'production'} mode`,
    );

    await mainWindow.loadURL(localhostUrl + '/');
  } catch (error: unknown) {
    console.error(`[Electron] Error initializing server: ${error}`);

    const errorMessage = error instanceof Error ? error.message : String(error);
    await mainWindow.loadURL(
      `data:text/html,<html><body><h1>Error</h1><p>${errorMessage}</p></body></html>`,
    );
  }
};

app.on('ready', createWindow);

app.on('window-all-closed', () => app.quit());

app.on(
  'activate',
  () =>
    BrowserWindow.getAllWindows().length === 0 && !mainWindow && createWindow(),
);

function isLocalhostURL(url: string) {
  return url.startsWith('http://localhost');
}

// NOTE: Removed startNextApp - now using next-electron-rsc instead of manual HTTP server
// Refer to https://github.com/zaidmukaddam/scira-mcp-chat/blob/desktop/electron/main.ts#L24

async function startWebLLM({
  dev,
  model,
  port = 15408,
}: { dev?: boolean; model?: string; port?: number }) {
  return new Promise<string>((resolve, reject) => {
    try {
      // next start doesn't support standalocne
      const app = new WebLLMMiddleware({
        dev: true,
        model,
      });

      const handler = app.getRequestHandler();

      const server = createServer((req, res) => {
        const parsedUrl = parse(req.url ?? '/', true);
        handler(req, res, parsedUrl);
      });

      server.listen(port, () => resolve(`http://localhost:${port}`));
    } catch (error) {
      reject(
        new Error(
          `Failed to start Next.js app: ${error instanceof Error ? error.message : String(error)}`,
        ),
      );
    }
  });
}
