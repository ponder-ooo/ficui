
let m: any = {};

let userPreferences: any = {
    setTheme: (theme: string | null) => {
        if (theme === null) theme = 'void';
        userPreferences.theme = theme;
        localStorage.setItem('theme', theme);
        const themeLink = document.getElementById('themeLink') as HTMLLinkElement;
        themeLink!.href = `style/theme/${theme}.css`;
    },

    setLoadButton: (show: string | null) => {
        if (show === null) show = 'show';
        userPreferences.loadButton = show;
        localStorage.setItem('loadButton', show);
    },

    toggleTheme: () => {
        if (userPreferences.theme === 'void') {
            userPreferences.setTheme('parchment');
        } else {
            userPreferences.setTheme('void');
        }
    },

    toggleLoadButton: () => {
        if (userPreferences.loadButton === 'show') {
            userPreferences.setLoadButton('hide');
        } else {
            userPreferences.setLoadButton('show');
        }
    }
};

userPreferences.setTheme(localStorage.getItem('theme'));
userPreferences.setLoadButton(localStorage.getItem('loadButton'));

// Put a loading animation on the page and return a function for removing it.
let finishedLoading = (() => {
    let loader = document.createElement('div');

    let orb0 = document.createElement('div');
    let orb1 = document.createElement('div');
    let orb2 = document.createElement('div');

    let button = document.createElement('button');
    button.innerText = 'enter';
    button.classList.add('loader-button');

    loader.classList.add('loader');
    orb0.classList.add('loader-orb');
    orb0.classList.add('0');
    orb1.classList.add('loader-orb');
    orb1.classList.add('1');
    orb2.classList.add('loader-orb');
    orb2.classList.add('2');

    document.body.appendChild(loader);
    document.body.appendChild(button);
    loader.appendChild(orb0);
    orb0.appendChild(orb1);
    orb1.appendChild(orb2);

    let initialElements = Array.prototype.slice.call(document.body.children);

    let removeLoader = (continuation: any) => {
        loader.style.opacity = '0';
        button.style.opacity = '0';
        orb0.style.left = '50%';
        orb1.style.left = '50%';
        orb2.style.left = '50%';

        setTimeout(() => {
            initialElements.forEach((element: any) => {
                document.body.removeChild(element);
            });
            finishedLoading = () => console.warn('finishedLoading should not be called twice.');
            continuation();
        }, 1500);

    };

    return userPreferences.loadButton === 'hide' ? removeLoader : (continuation: any) => {
        setTimeout(() => {
            button.style.opacity = '1';
            button.addEventListener('click', (event) => removeLoader(continuation));
        }, 100);
        button.style.display = 'initial';
    };
})();

let loadModule = async (module: string, overwrite: boolean = false) => {
    if (m[module] !== undefined && !overwrite) {
        console.warn(`Module ${module} is already loaded. Aborting extraneous load.`);
        return;
    }

    m[module] = {...await import(`./module/${module}.js`)};
};

fetch('autoload_modules', { method: 'GET' })
    .then(response => response.json())
    .then(json => {
        json.modules.reduce(
            (acc: any, module: any) => acc.then(async () => { m[module] = {...await import(`./module/${module}.js`)} }),
            Promise.resolve()
        ).finally(() => {
            finishedLoading(() => {
                fetch('autorun_modules', { method: 'GET' })
                    .then(response => response.json())
                    .then(json => {
                        json.modules.forEach((module: string) => {
                            m[module].run();
                        });
                    })
                    .catch(console.error)
            });

        });
    })
    .catch(console.error)

