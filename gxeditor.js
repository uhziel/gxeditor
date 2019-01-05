const iconv = require('iconv-lite');
const fs = require('fs');
const format = require('js-beautify').html;
const Xonomy = require('./third_party/xonomy-3.5.0/xonomy.js');
const path = require('path');
const { remote } = require('electron');

let gxeditor = {};

gxeditor.readXMLFromFile = function (filename) {
    let buffer = fs.readFileSync(filename);
    let content = iconv.decode(buffer, 'gbk');
    return content;
}

gxeditor.writeXMLToFile = function (filename, content) {
    let beautifulText = format(content, { eol: "\r\n" });
    let buffer = iconv.encode(beautifulText, 'gbk');
    let head = '<?xml version="1.0" encoding="GB2312"?>\n';
    try {
        fs.writeFileSync(filename, head, { flag: 'w' });
        fs.writeFileSync(filename, buffer, { flag: 'a' });
        return true;
    } catch(err) {
        return false;
    }
}

///////////////////////////////////////
// Num
gxeditor.askNum = function (defaultString, tmpl) {
    if (typeof tmpl.default !== 'undefined' && defaultString.length <= 0) {
        defaultString = tmpl.default;
    }
    var minString = "";
    if (typeof tmpl.min !== 'undefined') {
        minString = "min=\"" + tmpl.min + "\"";
    }
    var maxString = "";
    if (typeof tmpl.max !== 'undefined') {
        maxString = `max="${tmpl.max}"`;
    }
    var stepString = "";
    if (typeof tmpl.precision !== 'undefined') {
        stepString = `step=${tmpl.precision}`;
    }
    var descString = "";
    if (typeof tmpl.desc === 'string') {
        descString = `<label for="val">${tmpl.desc}</label>`
    }
    return `
            <form onsubmit='Xonomy.answer(this.val.value); return false;'>
            ${descString}
            <input type='number' name='val' class='focusme' value='${defaultString}' ${stepString} ${minString} ${maxString} />
            <input type='submit' value='确定' />
            </form>
        `;
}

///////////////////////////////////////
// Enum
function isValidPick(displayIf, jsAttribute) {
    if (typeof displayIf === 'undefined') {
        return true;
    }

    const jsElement = jsAttribute.parent();
    for (const attrName in displayIf) {
        const expectedValue = displayIf[attrName];
        if (jsElement.getAttributeValue(attrName, null) != expectedValue) {
            return false;
        }
    }

    return true;
}

function getValidPicklist(enumList, jsAttribute) {
    const pickList = [];
    enumList.forEach(element => {
        if (isValidPick(element.displayIf, jsAttribute)) {
            pickList.push(element);
        }
    });

    return pickList;
}
gxeditor.askEnum = function (defaultString, tmpl, jsAttribute) {
    if (typeof tmpl.default !== 'undefined' && defaultString.length <= 0) {
        defaultString = tmpl.default;
    }
    const picklist = getValidPicklist(tmpl.enumList, jsAttribute);
    return Xonomy.askOpenPicklist(defaultString, picklist);
}

///////////////////////////////////////
// Datetime
gxeditor.askDateTime = function (defaultString) {
    const dateString = defaultString.replace(" ", "T");
    return `
        <form onsubmit='Xonomy.answer(this.val.value.replace("T", " ")); return false;'>
        <input type='datetime-local' name='val' class='focusme' value='${dateString}' step='1'/>
        <input type='submit' value='确定' />
        </form>
    `;
}

///////////////////////////////////////
// Ref
gxeditor.askRef = function (defaultString, tmpl) {
    let picklist = [];
    const refJsElemments = Xonomy.getDescendantElements(tmpl.refPath);
    refJsElemments.forEach(jsElement => {
        picklist.push({ value: jsElement.getAttributeValue("id"), caption: jsElement.getAttributeValue("name")});
    });
    return Xonomy.askPicklist(defaultString, picklist);
}

///////////////////////////////////////
// Image
let curDataPath = '/Users/zhulei/workspace/gxeditor/example/data';
gxeditor.askImage = function (defaultString, tmpl) {
    const pathString = path.join(curDataPath, defaultString);
    return `
        <form onsubmit='Xonomy.answer(this.val.value); return false;'>
        <img id='pathimg' src='file://${pathString}' width='200' alt='图片内容'>
        <div>
            <label for='path'>路径：</label>
            <input type='text' id='path' name='val' value='${defaultString}' onclick='gxeditor.onclickImage(event);' readonly>
            <input type='submit' value='确定' >
        </div>
        </form>
    `;
}
gxeditor.onclickImage = function(event) {
    const files = remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
        defaultPath: curDataPath,
        filters: [
            { name: "图片", extensions: ['png', 'jpg', 'gif', 'bmp'] },
            { name: '所有类型', extensions: ['*'] }],
        properties: ['openFile']
    });
    if (files) {
        const currentFile = files[0];
        document.getElementById('pathimg').src = `file://${currentFile}`;
        document.getElementById('path').value = path.relative(curDataPath, currentFile);
    }
}

///////////////////////////////////////
// File
gxeditor.askFile = function (defaultString, tmpl) {
    return `
        <form onsubmit='Xonomy.answer(this.val.value); return false;'>
        <div>
            <label for='path'>路径：</label>
            <input type='text' id='path' name='val' value='${defaultString}' onclick='gxeditor.onclickFile(event);' readonly>
            <input type='submit' value='确定' >
        </div>
        </form>
    `;
}
gxeditor.onclickFile = function(event) {
    const files = remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
        defaultPath: curDataPath,
        filters: [
            { name: '所有类型', extensions: ['*'] }],
        properties: ['openFile']
    });
    if (files) {
        const currentFile = files[0];
        document.getElementById('path').value = path.relative(curDataPath, currentFile);
    }
}

///////////////////////////////////////
// Sound
gxeditor.askSound = function (defaultString, tmpl) {
    const pathString = path.join(curDataPath, defaultString);
    return `
        <form onsubmit='Xonomy.answer(this.val.value); return false;'>
        <audio id='pathsound' src='file://${pathString}' controls alt='声音内容'>
        </audio>
        <div>
            <label for='path'>路径：</label>
            <input type='text' id='path' name='val' value='${defaultString}' onclick='gxeditor.onclickSound(event);' readonly>
            <input type='submit' value='确定' >
        </div>
        </form>
    `;
}
gxeditor.onclickSound = function(event) {
    const files = remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
        defaultPath: curDataPath,
        filters: [
            { name: "声音", extensions: ['mp3', 'ogg', 'wav'] },
            { name: '所有类型', extensions: ['*'] }],
        properties: ['openFile']
    });
    if (files) {
        const currentFile = files[0];
        document.getElementById('pathsound').src = `file://${currentFile}`;
        document.getElementById('path').value = path.relative(curDataPath, currentFile);
    }
}

gxeditor.fillCnNameInfo = function (name, spec, tmpl) {
    if (typeof tmpl.cnName === 'string') {
        spec.displayName = `en: ${name} | cn: ${tmpl.cnName}`;
    }
}

gxeditor.getCnName = function (name, tmpl) {
    if (typeof tmpl.cnName === 'string') {
        return tmpl.cnName;
    }
    else {
        return name;
    }
}
///////////////////////////////////////
/// genMenu
gxeditor.genAttrMenu = function (attrName, attrSpec) {
    attrSpec.menu = [];
    const tmpl = attrSpec.tmpl;
    // 给属性添加删除自身的actionelement
    if (typeof tmpl !== 'undefined' && tmpl.optional === true) {
        attrSpec.menu.push({
            caption: "删除",
            action: Xonomy.deleteAttributePlus,
            actionParameter: null,
            hideIf: function (jsAttribute) { return false }
        });
    }

    // 添加修改属性的ask方法
    if (tmpl.type === "INT") {
        attrSpec.asker = gxeditor.askNum;
    }
    else if (tmpl.type === "DOUBLE") {
        attrSpec.asker = gxeditor.askNum;
    }
    else if (tmpl.type === "ENUM") {
        attrSpec.asker = gxeditor.askEnum;
    }
    else if (tmpl.type === "STRING") {
        attrSpec.asker = Xonomy.askString;
    }
    else if (tmpl.type == "DATETIME") {
        attrSpec.asker = gxeditor.askDateTime;
    }
    else if (tmpl.type == "REF") {
        attrSpec.asker = gxeditor.askRef;
    }
    else if (tmpl.type == "IMAGE") {
        attrSpec.asker = gxeditor.askImage;
    }
    else if (tmpl.type == "FILE") {
        attrSpec.asker = gxeditor.askFile;
    }
    else if (tmpl.type == "SOUND") {
        attrSpec.asker = gxeditor.askSound;
    }
    else {
        attrSpec.asker = Xonomy.askString;
    }
    attrSpec.askerParameter = tmpl;
    attrSpec.title = tmpl.desc;

    gxeditor.fillCnNameInfo(attrName, attrSpec, tmpl);
}

gxeditor.getNewElementParam = function (spec, elemName) {
    var param = '<' + elemName;
    const element = spec.elements[elemName];
    for (const key in element.attributes) {
        const attr = element.attributes[key];
        let defaultString = "";
        if (typeof attr.tmpl.default !== 'undefined') {
            defaultString = attr.tmpl.default;
        }
        if (attr.tmpl.optional !== true) {
            param += ` ${key}="${defaultString}"`;
        }
    }
    param += ' >';
    for (const key in element.tmpl.children) {
        const childName = element.tmpl.children[key];
        const childElem = spec.elements[childName];
        if (childElem.tmpl.optional !== true) {
            param += gxeditor.getNewElementParam(spec, childName);
        }
    }
    param += `</${elemName}>`
    return param;
}

gxeditor.genElementMenu = function (spec, elemName, elemSpec) {
    elemSpec.menu = [];
    const tmpl = elemSpec.tmpl;

    //action: 添加子元素
    if (typeof tmpl.children === "object") {
        for (const key in tmpl.children) {
            let childName = tmpl.children[key];
            const childElement = spec.elements[childName];
            const param = gxeditor.getNewElementParam(spec, childName);
            const childCnName = gxeditor.getCnName(childName, childElement.tmpl);
            let menuAction = {
                caption: `en: 添加 ${childName}|cn: 添加 ${childCnName}`,
                action: Xonomy.newElementChildPlus,
                actionParameter: param,
                hideIf: function (jsElement) {
                    if (childElement.tmpl.multi === true) {
                        return false;
                    }

                    return jsElement.hasChildElement(childName);
                }
            }
            childElement.canDropTo = [elemName];
            elemSpec.menu.push(menuAction);
        }
    }

    //action: 添加属性
    if (typeof elemSpec.attributes === 'object') {
        for (const attrName in elemSpec.attributes) {
            let attrSpec = elemSpec.attributes[attrName];
            let defaultString = "";
            if (typeof attrSpec.tmpl.default !== 'undefined') {
                defaultString = attrSpec.tmpl.default;
            }
            const attrCnName = gxeditor.getCnName(attrName, attrSpec.tmpl);
            let menuAction = {
                caption: `en: 添加属性 ${attrName}|cn: 添加属性 ${attrCnName}`,
                action: Xonomy.newAttributePlus,
                actionParameter: { name: attrName, value: defaultString },
                hideIf: function (jsElement) { return jsElement.hasAttribute(attrName); }
            };
            elemSpec.menu.push(menuAction);

        }
    }

    //action: 克隆
    elemSpec.menu.push({
        caption: "克隆",
        action: Xonomy.duplicateElement,
        actionParameter: null,
        hideIf: function (jsElement) {
            return tmpl.multi !== true;
        }
    });

    //action: 
    elemSpec.menu.push({
        caption: "注释",
        action: Xonomy.newElementChildAtTopPlus,
        actionParameter: `<comment>你的注释</comment>`,
        hideIf: function (jsElement) {
            return jsElement.hasChildElement("comment");
        }
    });

    //action: 删除自身
    elemSpec.menu.push({
        caption: "删除",
        action: Xonomy.deleteElementPlus,
        actionParameter: null,
        hideIf: function (jsElement) {
            if (tmpl.optional === true) {
                return false;
            }
            const parentElement = jsElement.parent();
            if (parentElement === null) {
                return true;
            }
            const childrenNum = parentElement.getChildElements(elemName).length;
            if (childrenNum <= 1) {
                return true;
            }
            return false;
        }
    });

    elemSpec.title = tmpl.desc;
    gxeditor.fillCnNameInfo(elemName, elemSpec, tmpl);
}

gxeditor.genDocSpecFullInfo = function (spec) {
    for (const elemName in spec.elements) {
        const elemSpec = spec.elements[elemName];
        gxeditor.genElementMenu(spec, elemName, elemSpec);

        for (const attrName in elemSpec.attributes) {
            const attrSpec = elemSpec.attributes[attrName];
            gxeditor.genAttrMenu(attrName, attrSpec);
        }
    }
}

// xmlTmpl xml文件的模版
gxeditor.genDocSpec = function (xmlTmpl) {
    const spec = {
        onchange: function () {
            console.log("You have changed this xml file.");
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
        allowLayby: true,
        laybyMessage: "您可以将节点拖过来临时存放再放回其他地方。",
        elements: {}
    };

    for (const elemName in xmlTmpl) {
        const elemTmpl = xmlTmpl[elemName];
        spec.elements[elemName] = {};

        const elemSpec = spec.elements[elemName];
        elemSpec.tmpl = elemTmpl;
        elemSpec.attributes = {};

        for (const attrName in elemTmpl.attributes) {
            const attrTmpl = elemTmpl.attributes[attrName];
            elemSpec.attributes[attrName] = {};

            const attrSpec = elemSpec.attributes[attrName];
            attrSpec.tmpl = attrTmpl;
        }
    }

    gxeditor.genDocSpecFullInfo(spec);
    spec.elements.comment = {
        displayName: "注释",
        backgroundColour: "#D3D3D3",
        menu: [
            {
                caption: "删除",
                action: Xonomy.deleteElementPlus,
                actionParameter: null
            }
        ],
        oneliner: true,
        hasText: true
    };

    return spec;
}

gxeditor.setViewModeRaw = function () {
    Xonomy.lang = "en";
    Xonomy.setMode("nerd");
    Xonomy.refresh();
}

gxeditor.setViewModeEasy = function () {
    Xonomy.lang = "cn";
    Xonomy.setMode("laic");
    Xonomy.refresh();
}

module.exports = gxeditor;