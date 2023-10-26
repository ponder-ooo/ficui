
import http from 'http';
import fs from 'fs';
import path from 'path';

const basePath = path.join(__dirname, '../../..');

const staticPath = path.join(basePath, 'static');
const scriptPath = path.join(basePath, '.build/js/page');

const mainPath = path.join(staticPath, 'main.html');

http.createServer((req, res: http.ServerResponse) => {
    console.log(`\nRequest for ${req.url!}`);

    const tryFolder = (folder: any) => {
        var requestedPath = path.join(folder, req.url!);
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

    if (tryFolder(staticPath)) return;
    if (tryFolder(scriptPath)) return;

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

    res.end();
})
.listen(8080, () => {
    console.log(`\nLaunching Server\n\nPID ${process.pid} / PORT 8080\n`);
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

