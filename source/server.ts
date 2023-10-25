
import http from "http";
import fs from "fs";
import path from "path";

const basePath = path.join(__dirname, "..");

const staticFolder = path.join(basePath, "static");
const mainPath = path.join(staticFolder, "main.html");
const scriptPath = path.join(basePath, "build");
const stylePath = path.join(basePath, "style");


http.createServer((req, res: http.ServerResponse) => {
    console.log(req.url!);

    const tryFolder = (folder: any) => {
        var requestedPath = path.join(folder, req.url!);
        if (fs.existsSync(requestedPath) && fs.lstatSync(requestedPath).isFile()) {
            serveFile(requestedPath, res);
            //res.end();
            return true;
        }
        return false;
    };

    // If the requested path is empty, serve main.html
    var requestedPath = path.join(staticFolder, req.url!);
    if (path.resolve(requestedPath) === path.resolve(staticFolder)) {
        serveFile(mainPath, res);
        //res.end();
        return;
    }

    if (tryFolder(staticFolder)) return;
    if (tryFolder(scriptPath)) return;
    if (tryFolder(stylePath)) return;

    if (req.url! === "/cmd_build") {
        res.end();
        console.log("[== REBUILDING ==]\n");


        try {
            require("child_process").execSync("tsc --build");

            console.log("Build successful. Restarting.");

            process.send!("restart");
        }
        catch (error: any) {
            console.log("Build failed:\n");

            console.error(error.stdout.toString());

            console.log("Not restarting.");
        }

        return;
    }

//    res.writeHead(200, { "Content-Type": "text/plain" });
//    res.write(requestedPath);
//    console.log(req.url!);
    res.end();
})
.listen(8080, () => {
    console.log(`\nLaunching Server\n\nPID ${process.pid} / PORT 8080\n`);
});

function serveFile(filePath: string, res: http.ServerResponse): void {
    console.log("Serving " + filePath);
    const fileExtension = path.extname(filePath);
    const contentType = getContentType(fileExtension);
    res.setHeader("Content-Type", contentType);

    const fileStream = fs.createReadStream(filePath);
    //console.log(fileStream);
    fileStream.pipe(res);
}

function getContentType(fileExtension: string): string {
    switch(fileExtension) {
        case ".html":
            return "text/html";
        case ".js":
            return "text/javascript";
        case ".css":
            return "text/css";
        default:
            return "application/octet-stream";
    }
}

