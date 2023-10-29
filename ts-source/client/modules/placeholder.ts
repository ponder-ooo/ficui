
export const run = () => {
    let emptiness = document.createElement('div');

    emptiness.classList.add('nothing');
    emptiness.innerText = 'nothing :)';

    document.body.appendChild(emptiness);
}

