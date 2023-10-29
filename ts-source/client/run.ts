
finishedLoading(() => {
    fetch('autorun_modules', { method: 'GET' })
        .then(response => response.json())
        .then(json => {
            json.modules.forEach((module: string) => {
                m[module].run();
            });
        })
        .catch(error => console.error(error))
});

