const { app, BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const fs = require('fs').promises;  // ✅ Use async file system

const DATA_FILE = path.join(app.getPath('userData'), 'cellsData.json');

let mainWindow;

// app.on('browser-window-created', (event, window) => {
//     window.setMenu(null);  // Removes the menu bar
//     window.setMenuBarVisibility(false); // Hides the menu bar completely
//   });

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        icon: path.join(__dirname,'src', 'Assets', 'logo1.ico'),
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
    mainWindow.maximize();

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
});

// ✅ Ensure data file exists
(async () => {
    try {
        await fs.access(DATA_FILE);
    } catch {
        await fs.writeFile(DATA_FILE, '{}', 'utf-8');
    }
})();

// ✅ Save cell data to file
ipcMain.handle('save-data', async (event, data) => {
    try {
        await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error saving data:', error);
    }
});

// ✅ Load cell data from file
ipcMain.handle('load-data', async () => {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading data:', error);
        return {};
    }
});



// ✅ Handle macOS behavior
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

