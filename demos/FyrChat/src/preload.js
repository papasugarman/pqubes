const {contextBridge, ipcRenderer} = require("electron");

const api={
    getVals: () =>ipcRenderer.invoke("getVals"),
    resize: () =>ipcRenderer.invoke("resize"),
    genKP: () =>ipcRenderer.invoke("genKP"),
    sendCmd: (opts) => ipcRenderer.invoke("sendCmd",opts),
    listenCmd: (opts) =>ipcRenderer.invoke("listenCmd",opts),
    stopCmd: () =>ipcRenderer.invoke("stopCmd"),
    focus: () => ipcRenderer.invoke("focus-fix"),
    getMsgs: () => ipcRenderer.invoke("getMsgs"),
    delMsgs: () =>ipcRenderer.invoke("delMsgs")
}

contextBridge.exposeInMainWorld("api",api);