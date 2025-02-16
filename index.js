const { app, BrowserWindow, ipcMain, screen, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs').promises;

const DATA_FILE = path.join(app.getPath('userData'), 'cellsData.json');

let mainWindow;
let progressWindow; // ✅ Progress bar window

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
    mainWindow.setMenuBarVisibility(false);

    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    if (width <= 1366 && height <= 768) {
        mainWindow.webContents.once('did-finish-load', () => {
            mainWindow.webContents.setZoomFactor(0.8);
        });
    }

    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
            event.preventDefault();
        }
    });

    setTimeout(() => {
        checkForUpdates();
    }, 5000);

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
});

// ✅ Function to check for updates
function checkForUpdates() {
    autoUpdater.checkForUpdatesAndNotify();
}

// ✅ Create a small progress window
function createProgressWindow() {
    if (progressWindow) return;

    progressWindow = new BrowserWindow({
        width: 400,
        height: 150,
        parent: mainWindow,
        modal: true,
        frame: false,
        alwaysOnTop: true,
        resizable: false,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true
        }
    });

    progressWindow.loadURL(`data:text/html,
        <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 20px; background: #222; color: white; }
            #progress-container { width: 100%; background: #444; border-radius: 5px; overflow: hidden; }
            #progress-bar { width: 0%; height: 20px; background: #007bff; transition: width 0.3s; }
            #progress-text { margin-top: 10px; font-size: 14px; }
        </style>
        <body>
            <h3>Downloading Update...</h3>
            <div id="progress-container"><div id="progress-bar"></div></div>
            <p id="progress-text">0%</p>
            <script>
                require('electron').ipcRenderer.on('download-progress', (event, percent) => {
                    document.getElementById('progress-bar').style.width = percent + '%';
                    document.getElementById('progress-text').textContent = percent.toFixed(1) + '%';
                });
            </script>
        </body>
    `);
}

// ✅ Show update available dialog
autoUpdater.on('update-available', () => {
    dialog.showMessageBox({
        type: 'info',
        title: 'Update Available',
        message: 'A new version is available. Downloading now...',
        buttons: ['OK']
    });

    createProgressWindow();
    autoUpdater.downloadUpdate();
});

// ✅ Update progress in progress window
autoUpdater.on('download-progress', (progressObj) => {
    if (progressWindow) {
        progressWindow.webContents.send('download-progress', progressObj.percent);
    }
});

// ✅ When update is downloaded
autoUpdater.on('update-downloaded', () => {
    if (progressWindow) {
        progressWindow.close();
        progressWindow = null;
    }

    dialog.showMessageBox({
        type: 'info',
        title: 'Update Ready',
        message: 'The update has been downloaded. Restart now to apply changes?',
        buttons: ['Restart Now', 'Later']
    }).then(result => {
        if (result.response === 0) {
            autoUpdater.quitAndInstall();
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
