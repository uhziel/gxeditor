// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const { ipcRenderer, remote, clipboard } = require('electron');
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
    if (gxpage.isCurFileSaved) {
        return;
    }
    let curFilePath = gxpage.curProjectConfig.get('curFilePath');
    if (curFilePath) {
        const txtSave = Xonomy.harvest();
        const writeResult = gxeditor.writeXMLToFile(curFilePath, txtSave);
        if (!writeResult) {
            remote.dialog.showErrorBox('保存文件失败', '请先将当前文件改为可写或版本工具解锁。文件路径已拷贝到剪切板。');
            clipboard.writeText(curFilePath);
            return;
        }
        gxpage.isCurFileSaved = true;
        document.title = gxpage.genAppTitle();
    }
}

function askSaveIfNeed() {
    if (gxpage.isCurFileSaved) return;
    const response = remote.dialog.showMessageBox(remote.getCurrentWindow(), {
        message: '你想要保存当前文档吗？',
        type: 'question',
        buttons: ['是', '否']
    });
    if (response == 0) saveCurrentDoc();
}

function fileOnLoad() {
    let editor = document.getElementById("editor");
    const currentFilePath = gxpage.curProjectConfig.get('curFilePath');
    if (typeof currentFilePath !== 'string') {
        editor.innerHTML = "";
        return;
    }
    const xmlText = gxeditor.readXMLFromFile(currentFilePath);

    const tmplFilePath = gxpage.getTemplatePath(currentFilePath);

    let templateConfig = null;
    try {
        templateConfig = new GXTemplate(tmplFilePath);
    } catch(error) {
        editor.innerHTML = "";
        remote.dialog.showErrorBox('模版文件解析失败', `请在编辑器中打开模版文件检查具体问题。文件路径已拷贝到剪切板。`);
        clipboard.writeText(tmplFilePath);
        console.error(error);
        return;
    }

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

    gxeditor.setViewModeEasy();
    try {
        Xonomy.render(xmlText, editor, spec);
    } catch(error) {
        editor.innerHTML = "";
        remote.dialog.showErrorBox('xml文件解析错误', '请在浏览器中打开当前文件检查具体问题。文件路径已拷贝到剪切板。');
        clipboard.writeText(currentFilePath);
        console.error(error);
        return;
    }
}
