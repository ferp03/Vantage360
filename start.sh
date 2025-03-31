#!/bin/bash

# Abrir una nueva ventana en iTerm2 con perfil por defecto y asignarla a una variable
osascript -e 'tell application "iTerm2"
    set newWindow to (create window with default profile)
    tell newWindow
        tell current session to write text "cd web && cd back && node server.js"
    end tell
end tell'

# Abrir otra pestaña en la misma ventana y ejecutar el frontend
osascript -e 'tell application "iTerm2"
    tell front window
        create tab with default profile
        tell current session to write text "cd web && cd front && ng serve --open"
    end tell
end tell'
