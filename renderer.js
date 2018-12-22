// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const { ipcRenderer, remote } = require('electron');
const { Menu } = remote;
const GXTemplate = require('./utils/gx_template');
const GXPage = require('./gxpage.js');
const CodeGenerator = require('./utils/gx_code_generator');

let gxpage = new GXPage();

fileOnLoad();
document.title = gxpage.genAppTitle();

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
        case 'openProject':
        {
            askSaveIfNeed();
            const files = remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
                properties: ['openDirectory']
            });
            if (files) {
                if (gxpage.switchProject(files[0])) {
                    fileOnLoad();
                    document.title = gxpage.genAppTitle(); 
                } else {
                    remote.dialog.showErrorBox('错误', '不是合法的工程目录，目录内必须带gxproject.json。');
                }              
            }
            break;
        }
        case 'open':
            askSaveIfNeed();
            const files = remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
                defaultPath: gxpage.getDataDirPath(),
                filters: [
                    { name: "Xml Files", extensions: ['xml'] },
                    { name: 'All Files', extensions: ['*'] }],
                properties: ['openFile']
            });
            if (files) {
                gxpage.curProjectConfig.set('curFilePath', files[0]);
                gxpage.isCurFileSaved = true;

                fileOnLoad();
                document.title = gxpage.genAppTitle();                
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
        case 'genCppCode':
        {
            const currentFilePath = gxpage.curProjectConfig.get('curFilePath');
            const templatePath = gxpage.getTemplatePath(currentFilePath);
            const generator = new CodeGenerator(templatePath);
            generator.gen();
            break;
        }
    }
});

//保存当前文档
function saveCurrentDoc() {
    let curFilePath = gxpage.curProjectConfig.get('curFilePath');
    if (curFilePath) {
        const txtSave = Xonomy.harvest();
        gxeditor.writeXMLToFile(curFilePath, txtSave);
        gxpage.isCurFileSaved = true;
        document.title = gxpage.genAppTitle();
    }
}

function askSaveIfNeed() {
    if (gxpage.isCurFileSaved) return;
    const response = remote.dialog.showMessageBox(remote.getCurrentWindow(), {
        message: 'Do you want to save the current document?',
        type: 'question',
        buttons: ['Yes', 'No']
    });
    if (response == 0) saveCurrentDoc();
}

function fileOnLoad() {
    const currentFile = gxpage.curProjectConfig.get('curFilePath');
    if (typeof currentFile !== 'string') {
        let editor = document.getElementById("editor");
        editor.innerHTML = "";
        return;
    }
    const xmlText = gxeditor.readXMLFromFile(currentFile);

    const templatePath = gxpage.getTemplatePath(currentFile);
    const templateConfig = new GXTemplate(templatePath);
   
    const spec = gxeditor.genDocSpec(templateConfig.data);
    spec.onchange = function () {
        if (gxpage.isCurFileSaved) {
            gxpage.isCurFileSaved = false;
            document.title = gxpage.genAppTitle();
        }
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

    let editor = document.getElementById("editor");
    gxeditor.setViewModeEasy();
    Xonomy.render(xmlText, editor, spec);
}
