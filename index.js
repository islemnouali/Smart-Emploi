const { app, BrowserWindow, ipcMain, screen, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs').promises;
const { shell } = require('electron');

const DATA_FILE = path.join(app.getPath('userData'), 'cellsData.json');

let mainWindow;
let updateWindow = null; // ✅ Only one update window



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

    setTimeout(() => {
        checkForUpdates();
    }, 5000);

    // ✅ Block DevTools shortcuts (F12 & Ctrl+Shift+I)
    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (
            input.key === 'F12' || 
            (input.control && input.shift && input.key.toLowerCase() === 'i')
        ) {
            event.preventDefault();
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
});

ipcMain.on("open-resources", (event, matiereName, darkMode) => {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize; // Get screen dimensions

    let popupWidth = Math.floor(0.95 * width);
    let popupHeight = Math.floor(0.95 * height);

    let resourcesWindow = new BrowserWindow({
        icon: path.join(__dirname, 'src', 'Assets', 'logo1.ico'),
        width: popupWidth,
        height: popupHeight,
        x: (width - popupWidth) / 2,
        y: (height - popupHeight) / 2,
        resizable: false,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: false
        }
    });

    resourcesWindow.loadURL(`file://${path.join(__dirname, "src", "resources.html")}?matiere=${encodeURIComponent(matiereName)}&dark=${darkMode}`);

    // ✅ Block DevTools shortcuts (F12 & Ctrl+Shift+I)
    resourcesWindow.webContents.on('before-input-event', (event, input) => {
        if (
            input.key === 'F12' || 
            (input.control && input.shift && input.key.toLowerCase() === 'i')
        ) {
            event.preventDefault();
        }
    });
});


// ✅ Function to check for updates
function checkForUpdates() {
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.checkForUpdates();
}

// ✅ Handle update available
autoUpdater.on('update-available', () => {
    dialog.showMessageBox({
        type: 'info',
        title: 'Update Available',
        message: 'A new version is available. Do you want to download it now?',
        buttons: ['Yes', 'Later']
    }).then(result => {
        if (result.response === 0) { // User clicked "Yes"
            showUpdateWindow(); // ✅ Show a single update progress window
            autoUpdater.downloadUpdate();
        }
    });
});

// ✅ Handle update downloaded
autoUpdater.on('update-downloaded', () => {
    if (updateWindow) {
        updateWindow.close(); // ✅ Close progress window
        updateWindow = null;
    }

    dialog.showMessageBox({
        type: 'info',
        title: 'Update Ready',
        message: 'The update has been downloaded. Restart the app to apply changes.',
        buttons: ['Restart Now', 'Later']
    }).then(result => {
        if (result.response === 0) {
            autoUpdater.quitAndInstall();
        }
    });
});

// ✅ Handle update errors
autoUpdater.on('error', (error) => {
    console.error('Update error:', error);
    if (updateWindow) {
        updateWindow.webContents.send('update-progress', 'Update Failed!');
        setTimeout(() => {
            updateWindow.close();
            updateWindow = null;
        }, 2000);
    }
});

// ✅ Create a single update progress window
function showUpdateWindow() {
    if (!updateWindow) {
        updateWindow = new BrowserWindow({
            width: 500,
            height: 120,
            resizable: false,
            minimizable: false,
            maximizable: false,
            alwaysOnTop: false,
            frame: false,   
            autoHideMenuBar: true,
            title: "Updating...",
            parent: mainWindow,
            modal: true,
            webPreferences: {
                nodeIntegration: true
            }
        });

        updateWindow.loadURL(`data:text/html,
            <html>
                <body style="text-align: center; font-family: Arial; padding: 20px;">
                    <h3 id="status">Downloading update... Dont close the app!</h3>
                    <script>
                        const { ipcRenderer } = require('electron');
                        ipcRenderer.on('update-progress', (event, progress) => {
                            document.getElementById('status').innerText = "Downloading update... Dont close the app! ";
                        });
                    </script>
                </body>
            </html>
        `);
    }
}

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

ipcMain.handle("get-file-path", async () => {
    const result = await dialog.showOpenDialog({
        title: "Select files",
        properties: ["openFile", "multiSelections"], // ✅ Allows selecting multiple files
        filters: [{ name: "All Files", extensions: ["*"] }],
    });

    if (result.canceled || result.filePaths.length === 0) {
        return [];
    }

    return result.filePaths; // ✅ Return an array of file paths
});

ipcMain.on("open-file", (event, filePath) => {
    if (!filePath) {
        console.error("Error: Received undefined filePath");
        return;
    }

    console.log("Opening file:", filePath);
    shell.openPath(filePath);
});




