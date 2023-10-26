
setTimeout(finishedLoading, 1000);

var mainInput = document.createElement('textarea');

mainInput.id = 'mainInput';
mainInput.style.width = '90px';
mainInput.style.height = '90px';
document.body.appendChild(mainInput);

document.body.addEventListener('keydown', (event) => {
    if (event.key === 'F12') {
        return;
    }

    if (event.key === 'R' && event.ctrlKey) {
        event.preventDefault();
        fetch('/cmd_build', { method: 'GET' })
            .then(response => response.text())
            .then(text => {
                if (text === 'success') {
                    setTimeout(() => location.reload(), 500);
                    return;
                }
                console.warn('failed build');
            })
            .catch(error => {
                console.error(error);
            });

        return;
    }

    if (event.key === 'T' && event.ctrlKey) {
        event.preventDefault();
        userPreferences.toggleTheme();
        return;
    }
});

