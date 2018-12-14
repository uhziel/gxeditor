// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const { ipcRenderer, remote } = require('electron');
const { Menu } = remote;
const path = require('path');
const Config = require('./utils/config');

//读取本应用程序的配置
const configFile = path.join(__dirname, `config.json`);
const config = new Config(configFile);

const curProjectPath = config.get('projectPath');

//读取当前项目的配置
const curProjectConfigFile = path.join(curProjectPath, 'gxproject.json');
const curProjectConfig = new Config(curProjectConfigFile);

let currentFile = curProjectConfig.get('curFilePath');

if (currentFile) {
    fileOnLoad(currentFile);
}

let isSaved = true;     //当前文档是否已保存

function genAppTitle() {
    let projectName = null;
    if (curProjectPath === null) {
        projectName = '无项目';
    } else {
        projectName = path.basename(curProjectPath);
    }

    let fileName = currentFile;
    if (fileName === null) {
        fileName = 'Untitled';
    }

    return `${projectName} - ${fileName}`;
}

document.title = genAppTitle();

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
                defaultPath: path.join(curProjectPath, curProjectConfig.get('dataPath')),
                filters: [
                    { name: "Xml Files", extensions: ['xml'] },
                    { name: 'All Files', extensions: ['*'] }],
                properties: ['openFile']
            });
            if (files) {
                currentFile = files[0];
                fileOnLoad(currentFile);
                document.title = genAppTitle();
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
        document.title = genAppTitle();
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
    const xmlText = gxeditor.readXMLFromFile(currentFile);

    curProjectConfig.set('curFilePath', currentFile);

    const basename = path.basename(currentFile, ".xml");
    const templateFile = path.join(curProjectPath, `template/${basename}.json`);
    const templateConfig = new Config(templateFile);
   
    const spec = gxeditor.genDocSpec(templateConfig.all());
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
