// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
window.$ = window.jQuery = require('./third_party/jquery-1.11.0.min.js');
$.getScript('./third_party/xonomy-3.5.0/xonomy.js');
//const Xonomy = require('./third_party/xonomy-3.5.0/xonomy.js');

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
                const txtRead = readText(currentFile);
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

function readText(file) {
    const fs = require('fs');
    let buffer = fs.readFileSync(file);
    let text = iconv.decode(buffer, 'gbk');
    return text;
}

function saveText(text, file) {
    const fs = require('fs');
    let buffer = iconv.encode(text, 'gbk');
    fs.writeFileSync(file, buffer);
}

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
        saveText(txtSave, currentFile);
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
    ///////////////////////////////////////
    // Num
    function askNum(defaultString, rule) {
        if (typeof rule.default !== 'undefined' && defaultString.length <= 0) {
            defaultString = rule.default;
        }
        var minString = "";
        if (typeof rule.min !== 'undefined') {
            minString = "min=\"" + rule.min + "\"";
        }
        var maxString = "";
        if (typeof rule.max !== 'undefined') {
            maxString = `max="${rule.max}"`;
        }
        var stepString = "";
        if (typeof rule.precision !== 'undefined') {
            stepString = `step=${rule.precision}`;
        }
        var descString = "";
        if (typeof rule.desc === 'string') {
            descString = `<label for="val">${rule.desc}</label>`
        }
        return `
            <form onsubmit='Xonomy.answer(this.val.value); return false;'>
            ${descString}
            <input type='num' name='val' class='focusme' value='${defaultString}' ${stepString} ${minString} ${maxString} />
            <input type='submit' value='确定' />
            </form>
        `;
    }
    function genNumAttrSpec(rule) {
        var numAttrSpec = {
            asker: askNum,
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

    ///////////////////////////////////////
    // Datetime
    var dateAttrSpec = {
        asker: askDate,
        askerParameter: {},
        menu: [],
    };
    function askDate(defaultString) {
        return `
            <form onsubmit='Xonomy.answer(this.val.value); return false;'>
            <input type='datetime-local' name='val' class='focusme' value='${defaultString}' step='1'/>
            <input type='submit' value='确定' />
            </form>
        `;
    }

    ///////////////////////////////////////
    /// genMenu
    function genAttrMenu(attribute) {
        var rule = attribute.askerParameter;
        // 给属性添加删除自身的actionelement
        if (typeof rule !== 'undefined' && rule.optional === true) {
            attribute.menu.push({
                caption: "删除",
                action: Xonomy.deleteElement,
                actionParameter: null,
                hideIf: function (jsAttribute) { return false }
            });
        }
    }
    function getNewElementParam(element_name) {
        var param = '<' + element_name;
        const element = spec.elements[element_name];
        for (const key in element.attributes) {
            const attr = element.attributes[key];
            let defaultString = "";
            if (typeof attr.askerParameter.default !== 'undefined') {
                defaultString = attr.askerParameter.default;
            }
            if (attr.askerParameter.optional !== true) {
                param += ` ${key}="${defaultString}"`;
            }
        }
        param += ' >';
        for (const key in element.child_elements) {
            const child_name = element.child_elements[key];
            const child_element = spec.elements[child_name];
            if (child_element.optional !== true) {
                param += getNewElementParam(child_name);
            }
        }
        param += `</${element_name}>`
        return param;
    }
    function genElementMenu(element_name, element) {
        //action: 添加子元素
        if (typeof element.child_elements === "object") {
            for (const key in element.child_elements) {
                let child_name = element.child_elements[key];
                const child_element = spec.elements[child_name];
                const param = getNewElementParam(child_name);
                let menu_action = {
                    caption: `添加 <${child_name}/>`,
                    action: Xonomy.newElementChild,
                    actionParameter: param,
                    hideIf: function (jsElement) {
                        if (child_element.multi === true) {
                            return false;
                        }

                        return jsElement.hasChildElement(child_name);
                    }
                }
                element.menu.push(menu_action);
            }
        }

        //action: 添加属性
        if (typeof element.attributes === 'object') {
            for (const key in element.attributes) {
                let attribute = element.attributes[key];
                let defaultString = "";
                if (typeof attribute.askerParameter.default !== 'undefined') {
                    defaultString = attribute.askerParameter.default;
                }
                let menu_action = {
                    caption: `添加 @${key}`,
                    action: Xonomy.newAttribute,
                    actionParameter: { name: key, value: defaultString },
                    hideIf: function (jsElement) { return jsElement.hasAttribute(key); }
                };
                element.menu.push(menu_action);

            }
        }

        //action: 删除自身
        element.menu.push({
            caption: "删除",
            action: Xonomy.deleteElement,
            actionParameter: null,
            hideIf: function (jsElement) {
                if (element.optional === true) {
                    return false;
                }
                const parentElement = jsElement.parent();
                if (parentElement === null) {
                    return true;
                }
                const children_num = parentElement.getChildElements(element_name).length;
                if (children_num <= 1) {
                    return true;
                }
                return false;
            }
        });
    }
    function genMenu(spec) {
        for (const key in spec.elements) {
            const element = spec.elements[key];
            genElementMenu(key, element);

            if (typeof element.attributes !== 'object') {
                continue;
            }

            for (const key in element.attributes) {
                const attribute = element.attributes[key];
                genAttrMenu(attribute);
            }
        }
    }
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
    genMenu(spec);
    var editor = document.getElementById("editor");
    Xonomy.render(xmlText, editor, spec);
}
