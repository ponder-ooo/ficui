
# FicUI

Quick overview of what's going on here:

## ts-source/

### server/

#### main.ts

Pulls in config changes and launches the server (`server.ts`) whenever the server goes down.

#### server.ts

Serves scripts from the `client/` and `static/` directories. Also serves some files from the `modules/` directory, as configured.

### client/

#### load.ts

Loads user preferences such as theme, sets up a loading animation, then adds all `AUTOLOAD_MODULES` to the document, as configured. Finally, adds `page.ts` to the document.

#### page.ts

Clears the loading animation and runs all `AUTORUN_MODULES`, as configured.

### modules/

#### dev.ts

The development module. Right now, pretty much all it does is let you hit `ctrl+shift+R` to recompile the whole app, restart the server, and refresh the page. Also adds some hotkeys for toggling theme and loading animation behavior.

#### diffusion.ts

WIP - stable diffusion ui

#### placeholder.ts

Just adds some text to the page as a placeholder for any actual content.

#### private/

Modules in this folder will be .gitignore'd

## static

Just contains html, css, and the site icon. Might also include some fonts and such. It's a static assets folder idk if it really needs explaining.

## config

There are two files here, `base.env` and `secrets.env`. The secret config is .gitignore'd, and will override the base config if it exists. So that's where the production config goes.

