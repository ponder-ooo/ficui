# FicUI

I'm not sure where this project is going just yet.

Quick overview of what's going on here:

main.ts - Launch build/server.js, and relaunch it whenever it exits

server.ts - Serve files from the build/, static/, and style/ directories. Rebuilds itself and exits when it receives a request for "cmd_build"

load.ts - Initial script to make a simple loading screen while other scripts load

page.ts - The main behavior of the page. Doesn't do much just yet
