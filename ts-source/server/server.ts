
import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';

const basePath = path.join(__dirname, '../../..');

const staticPath = path.join(basePath, 'static');
const scriptPath = path.join(basePath, '.build/js/client');
const modulePath = path.join(basePath, '.build/js/modules');
const privateModulePath = path.join(basePath, '.build/js/modules');

const mainPath = path.join(staticPath, 'main.html');

const permittedModules = (() => {
    const modules = process.env.PERMIT_MODULES || '';
    return modules.split(',').map(s => s.trim()).filter(Boolean);
})();

const moduleIsPermitted = permittedModules.includes('*') ?
    (module: string) => true :
    (module: string) => permittedModules.includes(module);

const useSsl = process.env.CERT_PATH && process.env.CERT_KEY_PATH && process.env.DEVELOPMENT_SERVER !== 'true';

const httpsOptions = useSsl ? {
    key: fs.readFileSync(process.env.CERT_KEY_PATH!),
    cert: fs.readFileSync(process.env.CERT_PATH!)
} : {};

const createServer = (f: (req: any, res: http.ServerResponse) => void) => {
    if (useSsl) {
        https.createServer(httpsOptions, f)
            .listen(process.env.PORT_HTTPS, () => {
                console.log(`Listening on ${process.env.PORT_HTTPS} with SSL.`);
            });

        http.createServer((req, res) => {
            res.writeHead(301, { 'Location': 'https://' + req.headers['host'] + req.url });
            res.end();
        }).listen(process.env.PORT_HTTP, () => {
            console.log(`Redirecting from ${process.env.PORT_HTTP}.`);
        });
    } else {
        http.createServer(f)
            .listen(process.env.PORT_HTTP, () => {
                console.log(`Listening on ${process.env.PORT_HTTP}.`);
            });
    }
};

createServer((req, res: http.ServerResponse) => {
    console.log(`\nRequest for ${req.url!}`);

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

    if (tryFolder(req.url!, staticPath)) return;
    if (tryFolder(req.url!, scriptPath)) return;

    if (req.url!.startsWith('/module/')) {
        const strippedUrl = req.url!.substring(8);

        const noExtension = path.basename(strippedUrl, path.extname(strippedUrl));

        if (!moduleIsPermitted(noExtension)) {
            res.writeHead(403);
            res.end();
            return;
        }

        if (tryFolder(strippedUrl, privateModulePath)) return;
        if (tryFolder(strippedUrl, modulePath)) return;
    }

    if (req.url! === '/cmd_build' && process.env.DEVELOPMENT_SERVER === 'true') {
        console.log('\n[== Rebuilding Application ==]\n');
        try {
            require('child_process').execSync('tsc --build');

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


    res.end();
});

function serveFile(filePath: string, res: http.ServerResponse): void {
    console.log('Serving ' + filePath);
    const fileExtension = path.extname(filePath);
    const contentType = getContentType(fileExtension);
    res.setHeader('Content-Type', contentType);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
}

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

