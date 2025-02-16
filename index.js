const { app, BrowserWindow, ipcMain, screen, dialog } = require('electron');
const { autoUpdater } = require('electron-updater'); // ✅ Import updater
const path = require('path');
const fs = require('fs').promises;  // ✅ Use async file system

const DATA_FILE = path.join(app.getPath('userData'), 'cellsData.json');

let mainWindow;

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        icon: path.join(__dirname, 'src', 'Assets', 'logo1.ico'),
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
    mainWindow.maximize();
    mainWindow.setMenuBarVisibility(false); // Hides the menu bar completely

    // ✅ Apply zoom **only if** resolution is 1366x768 or smaller
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    if (width <= 1366 && height <= 768) {
        mainWindow.webContents.once('did-finish-load', () => {
            mainWindow.webContents.setZoomFactor(0.8); // Zoom out AFTER loading
        });
    }

    // ✅ Block DevTools shortcuts (F12 & Ctrl+Shift+I)
    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (
            input.key === 'F12' || 
            (input.control && input.shift && input.key.toLowerCase() === 'i')
        ) {
            event.preventDefault();
        }
    });

    // ✅ Check for updates after the window is ready
    setTimeout(() => {
        checkForUpdates();
    }, 5000); // Delay to ensure the app is fully loaded

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
});

// ✅ Function to check for updates
function checkForUpdates() {
    autoUpdater.checkForUpdatesAndNotify();
}

// ✅ Electron-updater event listeners
autoUpdater.on('update-available', () => {
    dialog.showMessageBox({
        type: 'info',
        title: 'Update Available',
        message: 'A new version is available. Do you want to update now?',
        buttons: ['Yes', 'Later']
    }).then(result => {
        if (result.response === 0) { // User clicked "Yes"
            autoUpdater.downloadUpdate();
        }
    });
});

autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox({
        type: 'info',
        title: 'Update Ready',
        message: 'The update has been downloaded. Restart the app to apply changes.',
        buttons: ['Restart Now', 'Later']
    }).then(result => {
        if (result.response === 0) {
            autoUpdater.quitAndInstall(); // Restart and install
        }
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
