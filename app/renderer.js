// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

'use strict';

const { ipcRenderer, remote, clipboard, shell } = require("electron");
const { Menu, BrowserWindow } = remote;
const GXTemplate = require("./utils/gx_template");
const gxpage = require("./gxpage.js");
const CodeGenerator = require("./utils/gx_code_generator");
const fs = require("fs");
const path = require("path");
const gxStrings = require("./utils/gx_strings");
const GXXmlFile = require("./utils/gx_xml_file");
const gxCoreEditor = require("./utils/gx_core_editor");

gxCoreEditor.on("change", function() {
    if (gxpage.isCurFileSaved) {
        gxpage.isCurFileSaved = false;
        document.title = gxpage.genAppTitle();
    }
});

let curXmlFile = null;
let popupWindow = null;

fileOnLoad();
document.title = gxpage.genAppTitle();

function _selectLines(aceEditor) {
    let selectionRange = aceEditor.getSelectionRange();
    selectionRange.start.column = 0;
    selectionRange.end.row++;
    selectionRange.end.column = 0;
    aceEditor.session.getSelection().setSelectionRange(selectionRange);

    return selectionRange;
}

const contextMenuTemplate = [
    {
        id: "render",
        label: gxStrings.render,
        click() {
            let aceEditor = gxCoreEditor.getAceEditor();
            let selectionRange = _selectLines(aceEditor);
            aceEditor.session.getSelection().setSelectionRange(selectionRange);
            localStorage.setItem("xmlText", aceEditor.session.getTextRange(selectionRange));
            localStorage.setItem("tmpl", JSON.stringify(gxCoreEditor.getTmpl()));
            popupWindow = new BrowserWindow({
                width: 800,
                height: 400,
                parent: remote.getCurrentWindow(),
                modal: false
            });
            popupWindow.loadFile("app/xonomy_pop_up.html");
            popupWindow.on("closed", () => {
                let isChanged = JSON.parse(localStorage.getItem("isChanged"));
                if (isChanged) {
                    aceEditor.session.replace(selectionRange, localStorage.getItem("xmlText"));
                }
                popupWindow = null;
            });
        }
    },
    {
        label: gxStrings.revealInExplorer,
        click() {
            const curFilePath = gxpage.getCurFilePath();
            ipcRenderer.send('reqaction', 'showItemInFolder', curFilePath);
        }
    },
    {
        id: "openInWiki",
        label: gxStrings.openInWiki,
        click() {
            const curFilePath = gxpage.getCurFilePath();
            const basename = path.basename(curFilePath);
            const wikiPage = gxpage.getWikiPage(basename);
            if (wikiPage) {
                shell.openExternal(wikiPage);
            }
        }
    },
    {
        id: "genDefaultTemplate",
        label: gxStrings.genDefaultTemplate,
        click() {
            saveCurDocDefaultTmpl();
        }
    },
    {
        id: "tmplRevealInExplorer",
        label: gxStrings.tmplRevealInExplorer,
        click() {
            const curTemplatePath = gxpage.getCurTemplatePath();
            if (curTemplatePath) {
                ipcRenderer.send('reqaction', 'showItemInFolder', curTemplatePath);
            }
        }
    },
    {
        id: "genCppCode",
        label: gxStrings.genCppCode,
        click() {
            const curTemplatePath = gxpage.getCurTemplatePath();
            if (curTemplatePath) {
                const generator = new CodeGenerator(curTemplatePath);
                generator.gen();
            }
        }
    }, 
];

const contextMenu = Menu.buildFromTemplate(contextMenuTemplate);

function bindContextMenu(editor) {
    editor.addEventListener('contextmenu', (e) => {
        e.preventDefault();

        {
            let menuItem = contextMenu.getMenuItemById("render");
            if (gxCoreEditor.getAceEditor()) {
                menuItem.visible = true;
            } else {
                menuItem.visible = false;
            }
        }

        {
            let menuItem = contextMenu.getMenuItemById("openInWiki");
            if (gxpage.getWikiPage()) {
                menuItem.visible = true;
            } else {
                menuItem.visible = false;
            }
        }
    
        {
            let genMenuItem = contextMenu.getMenuItemById("genDefaultTemplate");
            let tmplMenuItem = contextMenu.getMenuItemById("tmplRevealInExplorer");
            let genCppCodeMenuItem = contextMenu.getMenuItemById("genCppCode");
            if (gxpage.getCurTemplatePath()) {
                genMenuItem.visible = false;
                tmplMenuItem.visible = true;
                genCppCodeMenuItem.visible = true;
            } else {
                genMenuItem.visible = true;
                tmplMenuItem.visible = false;
                genCppCodeMenuItem.visible = false;
            }
        }
    
        contextMenu.popup(remote.getCurrentWindow());
    });
}

//监听与主进程的通信
ipcRenderer.on('action', (event, arg, arg1) => {
    switch (arg) {
        case "openProject":
            {
                askSaveIfNeed();
                let path = null;
                if (arg1) {
                    path = arg1;
                } else {
                    path = remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
                        properties: ['openDirectory']
                    })[0];
                }
                if (path) {
                    if (gxpage.switchProject(path)) {
                        fileOnLoad();
                        document.title = gxpage.genAppTitle();
                        ipcRenderer.send('reqaction', 'refreshAppMenu');
                    }
                }
                break;
            }
        case "open":
            {
                onActionOpen(arg1);
                break;
            }
        case "save":
            {
                saveCurDoc();
                break;
            }
        case "exiting":
            {
                askSaveIfNeed();
                ipcRenderer.sendSync('reqaction', 'exit');
                break;
            }
        case "setViewModeRaw":
            {
                gxeditor.setViewModeRaw();
                break;
            }
        case "setViewModeEasy":
            {
                gxeditor.setViewModeEasy();
                break;
            }
        case "undo":
            {
                gxCoreEditor.undo();
                break;
            }
        case "redo":
            {
                gxCoreEditor.redo();
                break;
            }
    }
});

//保存当前文档
function saveCurDoc() {
    if (gxpage.isCurFileSaved) {
        return;
    }
    let curFilePath = gxpage.getCurFilePath();
    if (curFilePath && curXmlFile) {
        const xmlAsString = gxCoreEditor.harvest();
        const writeResult = curXmlFile.writeContent(xmlAsString);
        if (!writeResult) {
            remote.dialog.showErrorBox(gxStrings.saveDataFileFail, gxStrings.saveDataFileFailDetail);
            clipboard.writeText(curFilePath);
            return;
        }
        gxpage.isCurFileSaved = true;
        document.title = gxpage.genAppTitle();
    }
}

//保存当前文档的缺省模版
function saveCurDocDefaultTmpl() {
    const templatePath = gxpage.getTemplatePath();
    if (templatePath) {
        const xmlAsString = gxCoreEditor.harvest();
        const defaultTemplte = gxeditor.genDefaultTemplate(xmlAsString);
        const tmplAsString = JSON.stringify(defaultTemplte, null, 4);
        const writeResult = gxeditor.writeTmplToFile(templatePath, tmplAsString);
        if (!writeResult) {
            remote.dialog.showErrorBox(gxStrings.saveTmplFileFail, gxStrings.saveTmplFileFailDetail);
            return;
        }
        ipcRenderer.send('reqaction', 'showItemInFolder', templatePath);
    }
}

function askSaveIfNeed() {
    if (gxpage.isCurFileSaved) return;
    const response = remote.dialog.showMessageBox(remote.getCurrentWindow(), {
        message: '你想要保存当前文档吗？',
        type: 'question',
        buttons: ['是', '否']
    });
    if (response == 0) saveCurDoc();
}

function clearData() {
    curXmlFile = null;
    gxCoreEditor.destroy(); 
}

function fileOnLoad() {
    clearData();
    const curFilePath = gxpage.getCurFilePath();
    if (!curFilePath) {
        return;
    }
    if (!fs.existsSync(curFilePath)) {
        gxpage.deleteFilePath(curFilePath);
        ipcRenderer.send('reqaction', 'refreshAppMenu');
        return;
    }

    curXmlFile = new GXXmlFile(curFilePath);
    const xmlText = curXmlFile.readContent();
    const tmplFilePath = gxpage.getCurTemplatePath();

    let tmpl = null;
    if (tmplFilePath) {
        let templateConfig = null;
        try {
            templateConfig = new GXTemplate(tmplFilePath);
        } catch (error) {
            remote.dialog.showErrorBox(gxStrings.parseTmplFail, gxStrings.parseTmplFailDetail);
            clipboard.writeText(tmplFilePath);
            console.error(error);
            return;
        }
        tmpl = templateConfig.data;
    } else {
        tmpl = gxeditor.genDefaultTemplate(xmlText);
    }

    gxeditor.setViewModeEasy();
    try {
        let editor = document.getElementById("editor");
        bindContextMenu(editor);
        gxCoreEditor.render(xmlText, editor, tmpl);
    } catch (error) {
        remote.dialog.showErrorBox('xml文件解析错误', '请在浏览器中打开当前文件检查具体问题。文件路径已拷贝到剪切板。');
        clipboard.writeText(curFilePath);
        console.error(error);
        return;
    }
}

function onActionOpen(arg) {
    askSaveIfNeed();
    if (!gxpage.curProjectConfig) {
        remote.dialog.showErrorBox('打开文件错误', '请先打开项目(项目文件夹下需带gxproject.json)。');
        return;
    }
    let path = null;
    if (arg) {
        path = arg;
    } else {
        path = remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
            defaultPath: gxpage.getDataDirPath(),
            filters: [
                { name: "Xml Files", extensions: ['xml'] },
                { name: 'All Files', extensions: ['*'] }],
            properties: ['openFile']
        })[0];
    }
    if (path) {
        if (gxpage.switchFile(path)) {
            fileOnLoad();
            document.title = gxpage.genAppTitle();
        }
        ipcRenderer.send('reqaction', 'refreshAppMenu');
    }
}

document.addEventListener('dragover', function (event) {
    event.preventDefault();
}, false);

document.addEventListener('drop', function (event) {
    event.preventDefault();
    if (event.dataTransfer.files.length === 0) {
        return;
    }
    const path = event.dataTransfer.files[0].path;
    if (!path.match("xml")) {
        return;
    }
    onActionOpen(path);
}, false);
