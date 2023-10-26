
import { readFileSync } from 'fs';
import { resolve } from 'path';

const { spawn } = require('child_process');
const EventEmitter = require('events');

const serverEvent = new EventEmitter();

console.log('FicUI Running');

const readConfig = (fileName: string) => {
    try {
        const file = readFileSync(resolve(__dirname, `../../../config/${fileName}.env`), 'utf8');

        file.split('\n').forEach((line: string) => {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key] = value;
            }
        });
    }
    catch (error) {
        console.error(`Missing config file (config/${fileName}.env)`);
    }
}

serverEvent.on('start', function startServer() {
    readConfig('base');
    readConfig('secrets');

    const server = spawn('node', ['.build/js/server/server.js'], {
        stdio: [process.stdin, process.stdout, process.stderr, 'ipc'],
        env: {
            ...process.env,
        }
    });

    server.on('message', (message: any) => {
        if (message === 'restart') {
            server.kill();
            serverEvent.emit('start');
        }
    });
});

serverEvent.emit('start');
