// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const gxeditor = require('./gxeditor');
const { ipcRenderer, remote } = require('electron');
const { Menu } = remote;
const iconv = require('iconv-lite');

let currentFile = null; //当前文档保存的路径
let isSaved = true;     //当前文档是否已保存
let editor = document.getElementById('editor'); //获得TextArea文本框的引用

document.title = "gxeditor - Untitled"; //设置文档标题，影响窗口标题栏名称

//给文本框增加右键菜单
const contextMenuTemplate = [
    { role: 'undo' },       //Undo菜单项
    { role: 'redo' },       //Redo菜单项
    { type: 'separator' },  //分隔线
    { role: 'cut' },        //Cut菜单项
    { role: 'copy' },       //Copy菜单项
    { role: 'paste' },      //Paste菜单项
    { role: 'delete' },     //Delete菜单项
    { type: 'separator' },  //分隔线
    { role: 'selectall' }   //Select All菜单项
];
const contextMenu = Menu.buildFromTemplate(contextMenuTemplate);
editor.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    contextMenu.popup(remote.getCurrentWindow());
});

//监控文本框内容是否改变
editor.oninput = (e) => {
    if (isSaved) document.title += " *";
    isSaved = false;
};

//监听与主进程的通信
ipcRenderer.on('action', (event, arg) => {
    switch (arg) {
        case 'new':
            askSaveIfNeed();
            currentFile = null;
            fileOnLoad("");
            document.title = "gxeditor - Untitled";
            isSaved = true;
            break;
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
                const txtRead = gxeditor.readXMLFromFile(currentFile);
                fileOnLoad(txtRead);
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

function fileOnLoad(xmlText) {
    function genNumAttrSpec(rule) {
        var numAttrSpec = {
            asker: gxeditor.askNum,
            askerParameter: rule,
            menu: [],
            validate: function (jsAttribute) {
                var _rule = this.askerParameter;
                if (_rule.min !== undefined && jsAttribute.value < _rule.min) {
                    Xonomy.warnings.push({
                        htmlID: jsAttribute.htmlID,
                        text: `值必须大于或等于 ${_rule.min}。`
                    })
                }
                if (_rule.max !== undefined && jsAttribute.value > _rule.max) {
                    Xonomy.warnings.push({
                        htmlID: jsAttribute.htmlID,
                        text: `值必须小于或等于 ${_rule.max}。`
                    })
                }
            }
        };
        if (typeof rule.tips === 'string') {
            numAttrSpec.title = rule.tips
        }
        return numAttrSpec;
    }

    var dateAttrSpec = {
        asker: gxeditor.askDate,
        askerParameter: {},
        menu: [],
    };

    ///////////////////////////////////////
    /// spec
    var spec = {
        onchange: function () {
            console.log("Ah been chaaanged!");
        },
        validate: function (jsElement) {
            if (typeof (jsElement) == "string") jsElement = Xonomy.xml2js(jsElement);
            var valid = true;
            var elementSpec = this.elements[jsElement.name];
            if (elementSpec.validate) {
                elementSpec.validate(jsElement); //validate the element
            }
            for (var iAttribute = 0; iAttribute < jsElement.attributes.length; iAttribute++) {
                var jsAttribute = jsElement.attributes[iAttribute];
                var attributeSpec = elementSpec.attributes[jsAttribute.name];
                if (attributeSpec.validate) {
                    if (!attributeSpec.validate(jsAttribute)) valid = false; //validate the attribute
                }
            }
            for (var iChild = 0; iChild < jsElement.children.length; iChild++) {
                if (jsElement.children[iChild].type == "element") {
                    var jsChild = jsElement.children[iChild];
                    if (!this.validate(jsChild)) valid = false; //recurse to the child element
                }
            }
            return valid;
        },
        elements: {
            "list": {
                menu: [],
                child_elements: ["person"],
            },
            "person": {
                ...genNumAttrSpec({ min: 1, max: 10 }),
                backgroundColour: "#d6d6ff",
                multi: true,
                menu: [],
                child_elements: ["skill", "school"],
                attributes: {
                    "age": genNumAttrSpec({ default: 20, min: 0, max: 100, precision: 1, tips: "年龄", desc: "范围(0,100)" }),
                    "height": genNumAttrSpec({ default: 170, min: 0, max: 200, precision: 0.01, optional: true }),
                    "brith_time": dateAttrSpec
                },
            },
            "skill": {
                menu: [],
                attributes: {
                    "id": genNumAttrSpec({ default: 1, precision: 1 }),
                    "level": genNumAttrSpec({ default: 1, precision: 1 }),
                }
            },
            "school": {
                optional: true,
                multi: true,
                menu: [],
                attributes: {
                    "id": genNumAttrSpec({ default: 1, precision: 1 }),
                }
            }
        }
    };
    gxeditor.genMenu(spec);
    var editor = document.getElementById("editor");
    Xonomy.render(xmlText, editor, spec);
}
