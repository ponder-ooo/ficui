
import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';

// Set up paths
const basePath = path.join(__dirname, '../../..');

const staticPath = path.join(basePath, 'static');
const scriptPath = path.join(basePath, '.build/js/client');
const modulePath = path.join(basePath, '.build/js/client/modules');
const privateModulePath = path.join(basePath, '.build/js/client/modules/private');

const mainPath = path.join(staticPath, 'main.html');

// Load module configuration info
const permittedModules = (() => {
    const modules = process.env.PERMIT_MODULES || '';
    return modules.split(',').map(s => s.trim()).filter(Boolean);
})();

const moduleIsPermitted = permittedModules.includes('*') ?
    (module: string) => true :
    (module: string) => permittedModules.includes(module);

const useSsl = process.env.CERT_PATH && process.env.CERT_KEY_PATH && process.env.DEVELOPMENT_SERVER !== 'true';

// Set up SSL
const httpsOptions = useSsl ? {
    key: fs.readFileSync(process.env.CERT_KEY_PATH!),
    cert: fs.readFileSync(process.env.CERT_PATH!)
} : {};

const createServer = (f: (req: any, res: http.ServerResponse) => void) => {
    if (useSsl) {
        https.createServer(httpsOptions, f)
            .listen(process.env.PORT_HTTPS, () => {
                console.log(`Listening on ${process.env.PORT_HTTPS} with SSL.\n`);
            });

        http.createServer((req, res) => {
            res.writeHead(301, { 'Location': 'https://' + req.headers['host'] + req.url });
            res.end();
        }).listen(process.env.PORT_HTTP, () => {
            console.log(`Redirecting from ${process.env.PORT_HTTP}.\n`);
        });
    } else {
        http.createServer(f)
            .listen(process.env.PORT_HTTP, () => {
                console.log(`Listening on ${process.env.PORT_HTTP}.\n`);
            });
    }
};

// The server!
createServer((req, res: http.ServerResponse) => {
    // Given a request url and a folder, serve that file from that folder if it can be found.
    // Return boolean representing success.
    const tryFolder = (requestUrl: string, folder: any) => {
        var requestedPath = path.join(folder, requestUrl);
        if (fs.existsSync(requestedPath) && fs.lstatSync(requestedPath).isFile()) {
            serveFile(requestedPath, res);
            return true;
        }
        return false;
    };

    // If the requested path is empty, serve main.html
    var requestedPath = path.join(staticPath, req.url!);
    if (path.resolve(requestedPath) === path.resolve(staticPath)) {
        serveFile(mainPath, res);
        return;
    }

    // Try static and script folders
    if (tryFolder(req.url!, staticPath)) return;
    if (tryFolder(req.url!, scriptPath)) return;

    // For modules we have to check if the module is enabled first
    if (req.url!.startsWith('/module/') || req.url!.startsWith('/modules/')) {
        const strippedUrl = req.url!.substring(8);

        const noExtension = path.basename(strippedUrl, path.extname(strippedUrl));

        if (!moduleIsPermitted(noExtension)) {
            res.writeHead(403);
            res.end();
            return;
        }

        if (tryFolder(strippedUrl, privateModulePath)) return;
        if (tryFolder(strippedUrl, modulePath)) return;

        res.writeHead(403);
        res.end();
    }

    // Rebuild all modules & the server and reboot it.
    // Server does not reboot if there are build errors.
    if (req.url! === '/cmd_build' && process.env.DEVELOPMENT_SERVER === 'true') {
        console.log('\n[== Rebuilding Application ==]\n');
        try {
            require('child_process').execSync('tsc --build ./ts-source');

            console.log('Build successful. Restarting.');

            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('success');

            process.send!('restart');
        }
        catch (error: any) {
            console.log('Build failed:\n');

            console.error(error.stdout.toString());

            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('failure');

            console.log('Not restarting.');
        }

        return;
    }

    // Return the modules that should "auto-load" and "auto-run".
    if (req.url! === '/autoload_modules') {
        const modules = process.env.AUTOLOAD_MODULES || '';
        const modulesArray = modules.split(',').filter(Boolean);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ modules: modulesArray }));
        return;
    }

    if (req.url! === '/autorun_modules') {
        const modules = process.env.AUTORUN_MODULES || '';
        const modulesArray = modules.split(',').filter(Boolean);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ modules: modulesArray }));
        return;
    }

    // Log unhandled requests and shrug.
    console.log(`[UNHANDLED REQUEST] ${req.url!}`);
    res.end();
});

// Stream a file out. If the file is html, we do a little extra processing.
function serveFile(filePath: string, res: http.ServerResponse): void {
    const fileExtension = path.extname(filePath);
    const contentType = getContentType(fileExtension);
    res.setHeader('Content-Type', contentType);

    if (fileExtension === '.html') {
        serveHtml(filePath, res);
    } else {
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
    }
    if (process.env.LOG_LEVEL !== 'quiet') {
        console.log('[SERVED] ' + filePath);
    }
}

// Replace ENV:VARIABLE_NAME with the corresponding env var, throughout the document.
function serveHtml(filePath: string, res: http.ServerResponse): void {
    fs.readFile(filePath, 'utf-8', (err, data) => {
        if (err) {
            console.error(err);
            res.end('File read error');
            return;
        }
        const replacedData = data.replace(/ENV:([a-zA-Z0-9_]+)/g, (_, variableName) => {
            return process.env[variableName] || `ENV:${variableName} not found`;
        });
        res.end(replacedData);
    });
}

// Mime types
function getContentType(fileExtension: string): string {
    switch(fileExtension) {
        case '.html':
            return 'text/html';
        case '.js':
            return 'text/javascript';
        case '.css':
            return 'text/css';
        case '.png':
            return 'image/png';
        default:
            return 'application/octet-stream';
    }
}

