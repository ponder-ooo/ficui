const { spawn } = require('child_process');
const EventEmitter = require('events');

const serverEvent = new EventEmitter();

console.log("FicUI Running");

serverEvent.on('start', function startServer() {
    const server = spawn('node', ['build/server.js'], {
        stdio: [process.stdin, process.stdout, process.stderr, 'ipc']
    });

    server.on('message', (message: any) => {
        if (message === 'restart') {
            server.kill();
            serverEvent.emit('start');
        }
    });
});

serverEvent.emit('start');
