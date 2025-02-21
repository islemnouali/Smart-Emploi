const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  saveData: (data) => ipcRenderer.invoke("save-data", data),
  loadData: () => ipcRenderer.invoke("load-data"),
  openFile: (filePath) => ipcRenderer.send("open-file", filePath),
  
  getFilePath: async () => {  // ✅ Don't pass file.name, just open the dialog
      return await ipcRenderer.invoke("get-file-path");
  },

  openResources: (matiereName, darkMode) => ipcRenderer.send("open-resources", matiereName, darkMode)
});
