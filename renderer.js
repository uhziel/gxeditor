// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const gxeditor = require('./gxeditor');
const { ipcRenderer, remote } = require('electron');
const { Menu } = remote;
const fs = require('fs');
const path = require('path');

//读取本应用程序的配置
const configFile = path.join(__dirname, `config.json`);
const configText = fs.readFileSync(configFile, "utf8");
const config = JSON.parse(configText);

let currentFile = null; //当前文档保存的路径
let isSaved = true;     //当前文档是否已保存

document.title = "gxeditor - Untitled"; //设置文档标题，影响窗口标题栏名称

const contextMenuTemplate = [
    { label: "剪切", role: 'cut' },
    { label: "复制", role: 'copy' },
    { label: "粘贴", role: 'paste' },
    { type: 'separator' },
    { label: "全选", role: 'selectall' }
];

const contextMenu = Menu.buildFromTemplate(contextMenuTemplate);
editor.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    contextMenu.popup(remote.getCurrentWindow());
});

//监听与主进程的通信
ipcRenderer.on('action', (event, arg) => {
    switch (arg) {
        case 'open':
            askSaveIfNeed();
            const files = remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
                filters: [
                    { name: "Xml Files", extensions: ['xml'] },
                    { name: 'All Files', extensions: ['*'] }],
                properties: ['openFile']
            });
            if (files) {
                currentFile = files[0];
                fileOnLoad(currentFile);
                document.title = "gxeditor - " + currentFile;
                isSaved = true;
            }
            break;
        case 'save':
            saveCurrentDoc();
            break;
        case 'exiting':
            askSaveIfNeed();
            ipcRenderer.sendSync('reqaction', 'exit');
            break;
        case 'setViewModeRaw':
            gxeditor.setViewModeRaw();
            break;
        case 'setViewModeEasy':
            gxeditor.setViewModeEasy();
            break;
    }
});

//保存当前文档
function saveCurrentDoc() {
    if (!currentFile) {
        const file = remote.dialog.showSaveDialog(remote.getCurrentWindow(), {
            filters: [
                { name: "Xml Files", extensions: ['xml'] },
                { name: 'All Files', extensions: ['*'] }]
        });
        if (file) currentFile = file;
    }
    if (currentFile) {
        const txtSave = Xonomy.harvest();
        gxeditor.writeXMLToFile(currentFile, txtSave);
        isSaved = true;
        document.title = "gxeditor - " + currentFile;
    }
}

function askSaveIfNeed() {
    if (isSaved) return;
    const response = remote.dialog.showMessageBox(remote.getCurrentWindow(), {
        message: 'Do you want to save the current document?',
        type: 'question',
        buttons: ['Yes', 'No']
    });
    if (response == 0) saveCurrentDoc();
}

function fileOnLoad(currentFile) {
    const basename = path.basename(currentFile, ".xml");
    const xmlText = gxeditor.readXMLFromFile(currentFile);
    const testJsonFile = path.join(__dirname, `${config.templateDirectory}/${basename}.json`);
    const testJsonText = fs.readFileSync(testJsonFile, "utf8");
    const testJson = JSON.parse(testJsonText);

    const spec = gxeditor.genDocSpec(testJson);
    spec.onchange = function () {
        if (isSaved) document.title += " *";
        isSaved = false;
    }

    //TODO zhulei 后续去除写死的validate
    if (spec.elements["commodity"]) {
        spec.elements["commodity"].validate = function (jsElement) {
            const buy_price = jsElement.getAttributeValue("buy_price", null);
            const sell_price = jsElement.getAttributeValue("sell_price", null);
            if (buy_price !== null && sell_price !== null) {
                if (Number(buy_price) < Number(sell_price)) {
                    Xonomy.warnings.push({
                        htmlID: jsElement.htmlID,
                        text: `卖价(sell_price)不能高于买价(buy_price)。`
                    });
                }
            }
        };
    }

    var editor = document.getElementById("editor");
    gxeditor.setViewModeEasy();
    Xonomy.render(xmlText, editor, spec);
}
