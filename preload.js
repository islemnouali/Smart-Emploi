const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    saveData: (data) => ipcRenderer.invoke("save-data", data),
    loadData: () => ipcRenderer.invoke("load-data"),
    openFile: (filePath) => ipcRenderer.send("open-file", filePath),

    // ✅ Allow selecting both files & folders
    getFilePath: async () => {
        return await ipcRenderer.invoke("get-file-path");
    },

    // ✅ Allow selecting folders
    getFolderPath: async () => {
        return await ipcRenderer.invoke("get-folder-path");
    },

    openResources: (matiereName, darkMode) => ipcRenderer.send("open-resources", matiereName, darkMode)
});
