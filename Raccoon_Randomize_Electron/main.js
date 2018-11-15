const electron = require('electron');
const url = require('url');
const path = require('path');

const {app,  BrowserWindow, Menu, ipcMain} = electron;

let mainWindow;


process.env.NODE_ENV = 'rre_production';

// Listener foor app to be ready
app.on('ready', function(){
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        frame: false
    });
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'mainWindow.html'),
        protocol: 'file',
        slashes: true
    }));
    //Menu from template
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    Menu.setApplicationMenu(mainMenu);
    console.log("Aplication started.");

    // Quit app when main windows close, don't working
    mainWindow.on('closed', function(){
    nainWindow = null;
    app.quit();
});
});


// New Menu template
const mainMenuTemplate = [
    {
        label:'File',
        submenu:[
            {
                label:'Exit',
                accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
                click(){
                    app.quit();
                }
            }
        ]
    }
]

// Add developer tools
if(process.env.NODE_ENV !== 'rre_production'){
    mainMenuTemplate.push({
        label: 'Tools',
        submenu:[
            {
                label: 'Dev Tools',
                accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
                click(item, focusedWindow){
                    focusedWindow.toggleDevTools();
                }
            },
            {
                role: 'reload'
            }
        ]
    });
}
