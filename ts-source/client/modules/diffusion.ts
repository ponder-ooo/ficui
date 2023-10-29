
export function run() {
    let button = document.createElement('button');
    button.innerText = 'Connect to SD API';
    button.addEventListener('click', () => m.websocket.connect('diffusion'));
    document.body.appendChild(button);

    let statusDisplay = document.createElement('p');
    statusDisplay.innerText = 'no connection';
    document.body.appendChild(statusDisplay);

    m.websocket.onStatusUpdate('diffusion', (status: string) => {
        if (status === 'open') {
            statusDisplay.innerText = 'connected';
        } else {
            statusDisplay.innerText = 'no connection';
        }
    });

    m.diffusion.send = m.websocket.sender('diffusion');
}

