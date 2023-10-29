
export function connect(name: string, uri: string = 'localhost:8765') {
    statusUpdate(name, 'closed');

    if (name in m.websocket.sockets) {
        m.websocket.sockets[name].close();
    }

    var ws = new WebSocket('ws://localhost:8765');

    ws.addEventListener('message', (event) => {
        console.log(event.data);
    });

    ws.addEventListener('open', () => { statusUpdate(name, 'open'); });
    ws.addEventListener('close', () => { statusUpdate(name, 'closed'); });

    m.websocket.sockets[name] = ws;
}

export function onStatusUpdate(name: string, handler: (status: string) => void) {
    m.websocket.statusHandlers[name] = handler;
}

function statusUpdate(name: string, status: string) {
    if (name in m.websocket.statusHandlers) {
        m.websocket.statusHandlers[name](status);
    }
}

export var sockets: any = {};
export var statusHandlers: any = {};

export function send(name: string, data: any) {
    if (m.websocket.sockets[name].readyState === WebSocket.OPEN) {
        m.websocket.sockets[name].send(JSON.stringify(data));
        return;
    }
    m.websocket.sockets[name].addEventListener('open', () => {
        m.websocket.sockets[name].send(JSON.stringify(data));
    }, { once: true });
}

export function sender(name: string) { return (data: any) => send(name, data) }

