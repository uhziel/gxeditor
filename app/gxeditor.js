const fs = require("fs");
const Xonomy = require("./third_party/xonomy-3.5.0/xonomy.js");
const path = require("path");
const { remote } = require("electron");
const gxpage = require("./gxpage");
const gxStrFileParse = require("./utils/gx_str_file_parse");

let gxeditor = {};

gxeditor.writeTmplToFile = function (filename, content) {
    try {
        fs.writeFileSync(filename, content, { flag: 'w' });
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
function _getFileTypeRootDirPath(tmpl) {
    if (typeof tmpl.rootDir === "string") {
        return path.join(gxpage.getDataDirPath(), tmpl.rootDir);
    } else {
        return gxpage.getDataDirPath();
    }
}

///////////////////////////////////////
// File
gxeditor.askFile = function (defaultString, tmpl) {
    const fileRootDir = _getFileTypeRootDirPath(tmpl);
    let realRelativePath = defaultString;
    const pathSep = tmpl.pathSep ? tmpl.pathSep : "/";
    if (path.sep !== pathSep) {
        realRelativePath = realRelativePath.replace(new RegExp("\\" + pathSep, "g"), path.sep);
    }
    let fileAbsolutePath = "";
    if (realRelativePath) {
        fileAbsolutePath = path.join(fileRootDir, realRelativePath);
    }
    const fileType = tmpl.fileType ? tmpl.fileType : "";

    let extraHtml = "";
    if (fileType === "SOUND") {
        extraHtml += `<audio id="fileToDisplay" src="file://${fileAbsolutePath}" controls alt="声音内容"></audio>`;
    } else if (fileType === "IMAGE") {
        extraHtml += `<img id="fileToDisplay" src="file://${fileAbsolutePath}" width="200" alt="图片内容">`;
    }

    return `
        <form onsubmit="Xonomy.answer(this.val.value); return false;">
        ${extraHtml}
        <div>
            <input type="hidden" id="fileRootDir" value="${fileRootDir}">
            <input type="hidden" id="fileAbsolutePath" value="${fileAbsolutePath}">
            <input type="hidden" id="fileType" value="${fileType}">
            <input type="hidden" id="pathSep" value="${pathSep}">
            <label for="path">路径：</label>
            <input type="text" id="path" name="val" value="${defaultString}">
            <input type="button" onclick="gxeditor.onclickFile(event);" value="选择" >
            <input type="submit" value="确定" >
        </div>
        </form>
    `;
}
gxeditor.onclickFile = function(event) {
    const fileRootDir = document.getElementById("fileRootDir").value;
    const fileAbsolutePath = document.getElementById("fileAbsolutePath").value;
    const fileType = document.getElementById("fileType").value;
    const pathSep = document.getElementById("pathSep").value;
    let dialogFilters = [
        { name: "所有类型", extensions: ["*"] }
    ];
    if (fileType === "SOUND") {
        dialogFilters.unshift({ name: "声音", extensions: ["mp3", "ogg", "wav"] });
    } else if (fileType === "IMAGE") {
        dialogFilters.unshift({ name: "图片", extensions: ["png", "jpg", "gif", "bmp"] });
    }
    let defaultPath = fileRootDir;
    if (fileAbsolutePath.length > 0) {
        defaultPath = fileAbsolutePath;
    }
    const files = remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
        defaultPath: defaultPath,
        filters: dialogFilters,
        properties: ["openFile"]
    });
    if (files) {
        const currentFile = files[0];
        if (fileType) {
            document.getElementById("fileToDisplay").src = `file://${currentFile}`;
        }
        let pathValue = path.relative(fileRootDir, currentFile);
        if (path.sep !== pathSep) {
            pathValue = pathValue.replace(new RegExp("\\" + path.sep, "g"), pathSep);
        }
        document.getElementById("path").value = pathValue;
    }
}

gxeditor.fillCnNameInfo = function (name, spec, tmpl) {
    if (typeof tmpl.cnName === 'string') {
        spec.displayName = `en: ${name} | cn: ${tmpl.cnName}`;
    }
}

gxeditor.fillDisplayValue = function (spec, tmpl) {
    if (typeof tmpl.enumList === "object") {
        spec.displayValue = function (jsAttribute) {
            for (let i = 0; i < tmpl.enumList.length; i++) {
                if (tmpl.enumList[i].value == jsAttribute.value &&
                    isValidPick(tmpl.enumList[i].displayIf, jsAttribute)) {
                    return tmpl.enumList[i].caption;
                }
            }
            return jsAttribute.value;
        }
    }
}

gxeditor.fillSpecCaption = function (spec, attrSpec, tmpl) {
    if (typeof tmpl.enumList === "object") {
        attrSpec.caption = function (jsAttribute) {
            for (let i = 0; i < tmpl.enumList.length; i++) {
                if (tmpl.enumList[i].value == jsAttribute.value &&
                    isValidPick(tmpl.enumList[i].displayIf, jsAttribute)) {
                    return tmpl.enumList[i].desc;
                }
            }
            return null;
        }
    } else if (tmpl.type === "STR_NAME") {
        attrSpec.caption = function (jsAttribute) {
            return spec.strings[jsAttribute.value];
        }
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
gxeditor.setAsker = function (tmpl, spec) {
    // 添加修改属性的ask方法
    if (tmpl.type === "INT") {
        spec.asker = gxeditor.askNum;
    }
    else if (tmpl.type === "DOUBLE") {
        spec.asker = gxeditor.askNum;
    }
    else if (tmpl.type === "ENUM") {
        spec.asker = gxeditor.askEnum;
    }
    else if (tmpl.type === "STRING") {
        spec.asker = Xonomy.askString;
    }
    else if (tmpl.type === "STR_NAME") {
        spec.asker = Xonomy.askString;
    }
    else if (tmpl.type == "DATETIME") {
        spec.asker = gxeditor.askDateTime;
    }
    else if (tmpl.type == "REF") {
        spec.asker = gxeditor.askRef;
    }
    else if (tmpl.type == "FILE") {
        spec.asker = gxeditor.askFile;
    }
    else {
        spec.asker = Xonomy.askString;
    }
    spec.askerParameter = tmpl;   
}

gxeditor.genTextMenu = function (attrName, attrSpec, elemSpec) {
    const tmpl = attrSpec.tmpl;

    gxeditor.setAsker(tmpl, elemSpec);
    elemSpec.hasText = true;

    gxeditor.fillCnNameInfo(attrName, attrSpec, tmpl);
    gxeditor.fillDisplayValue(attrSpec, tmpl);
}

gxeditor.genAttrMenu = function (spec, attrName, attrSpec) {
    attrSpec.menu = [];
    const tmpl = attrSpec.tmpl;
    // 给属性添加删除自身的actionelement
    if (typeof tmpl !== 'undefined' && tmpl.optional === true) {
        attrSpec.menu.push({
            caption: "删除",
            action: Xonomy.deleteAttributePlus,
            actionParameter: null,
            hideIf: function (jsAttribute) { return false; }
        });
    }

    // 添加修改属性的ask方法
    gxeditor.setAsker(tmpl, attrSpec);
    attrSpec.title = tmpl.desc;

    gxeditor.fillCnNameInfo(attrName, attrSpec, tmpl);
    gxeditor.fillDisplayValue(attrSpec, tmpl);
    gxeditor.fillSpecCaption(spec, attrSpec, tmpl);
}

gxeditor.getNewElementParam = function (spec, elemName) {
    let param = "<" + elemName;
    let textParam = "";
    const element = spec.elements[elemName];
    for (const key in element.attributes) {
        const attr = element.attributes[key];
        let defaultString = "";
        if (typeof attr.tmpl.default !== 'undefined') {
            defaultString = attr.tmpl.default;
        }
        if (key === "__text__") {
            textParam += `${defaultString}`;
        } else {
            if (attr.tmpl.optional !== true) {
                param += ` ${key}="${defaultString}"`;
            }
        }
    }
    param += " >";
    param += textParam;
    for (const key in element.tmpl.children) {
        const childName = element.tmpl.children[key];
        const childElem = spec.elements[childName];
        if (childElem.tmpl.optional !== true) {
            param += gxeditor.getNewElementParam(spec, childName);
        }
    }
    param += `</${elemName}>`;
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
            if (attrName === "__text__") {
                continue;
            }
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
        action: Xonomy.duplicateElementPlus,
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

gxeditor.loadStrFiles = function (spec) {
    for (const filePath in spec.strFiles) {
        if (spec.strFiles.hasOwnProperty(filePath)) {
            const fileEncoding = spec.strFiles[filePath];
            const strings = gxStrFileParse(filePath, fileEncoding);
            spec.strings = Object.assign(spec.strings, strings);
        }
    }
}
gxeditor.genDocSpecFullInfo = function (spec) {
    for (const elemName in spec.elements) {
        if (elemName.search(/^__.*__$/) !== -1) {
            continue;
        }

        const elemSpec = spec.elements[elemName];
        gxeditor.genElementMenu(spec, elemName, elemSpec);

        for (const attrName in elemSpec.attributes) {
            const attrSpec = elemSpec.attributes[attrName];
            if (attrName === "__text__") {
                gxeditor.genTextMenu(attrName, attrSpec, elemSpec);
            } else {
                gxeditor.genAttrMenu(spec, attrName, attrSpec);
            }
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
        elements: {},
        strFiles: {},
        strings: {}
    };

    for (const elemName in xmlTmpl) {
        if (elemName.search(/^__.*__$/) !== -1) {
            continue;
        }

        const elemTmpl = xmlTmpl[elemName];
        spec.elements[elemName] = {};

        const elemSpec = spec.elements[elemName];
        elemSpec.tmpl = elemTmpl;
        elemSpec.attributes = {};

        for (const attrName in elemTmpl.attributes) {
            const attrTmpl = elemTmpl.attributes[attrName];

            elemSpec.attributes[attrName] = {
                "tmpl": attrTmpl
            }
            
            if (attrTmpl.type === "STR_NAME") {
                const strFilePath = path.join(gxpage.getDataDirPath(), attrTmpl.filePath);
                spec.strFiles[strFilePath] = attrTmpl.fileEncoding;
            }
        }
    }

    gxeditor.loadStrFiles(spec);
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
        oneliner: false,
        hasText: true
    };

    return spec;
}

function _genDefautTmplAttr(attrName, attrValue) {
    const attrTmpl = {
        "cnName": attrName,
        "desc": `对于 ${attrName} 的描述`,
        "type": "STRING",
        "optional": false,
        "default": ""
    };

    const num = Number(attrValue);
    if (!Number.isNaN(num)) {
        if (num % 1 === 0) {
            attrTmpl.type = "INT";
            attrTmpl.default = "0";
        } else {
            attrTmpl.type = "DOUBLE";
            attrTmpl.precision = 0.01;
            attrTmpl.default = "0.0";
        }
    }

    return attrTmpl;
}

function _genDefaultTemplate(defaultTemplate, elem) {
    const elemName = elem.tagName;

    if (!defaultTemplate[elemName]) {
        defaultTemplate[elemName] = {
            "cnName": elemName,
            "desc": `对于 ${elemName} 的描述`,
            "multi": true,
            "optional": false,
            "children": [],
            "attributes": {}
        };
    }

    for (let i = 0; i < elem.childNodes.length; i++) {
		const child = elem.childNodes[i];
		if (child.nodeType == Node.ELEMENT_NODE) { //element node
            const childElem = child;
            const childElemName = childElem.tagName;
            if (childElemName == "comment") {
                continue;
            }
    
            if (!defaultTemplate[elemName].children.includes(childElemName)) {
                defaultTemplate[elemName].children.push(childElemName);
            }
    
            _genDefaultTemplate(defaultTemplate, childElem);
        }
        else if (child.nodeType == Node.TEXT_NODE && child.nodeValue.trim().length > 0) { //text node
            const attrName = "__text__";
            const attrValue = child.nodeValue;
            defaultTemplate[elemName].attributes[attrName] =
                _genDefautTmplAttr(attrName, attrValue);    
		}
    }
    
    for (let i = 0; i < elem.attributes.length; i++) {
        const attr = elem.attributes[i];
        if (attr.name === "xml:space") {
            continue;
        }
        defaultTemplate[elemName].attributes[attr.name] =
            _genDefautTmplAttr(attr.name, attr.value);
    }

}

gxeditor.genDefaultTemplate = function (xmlAsString) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlAsString.replace(/<\?xml.*\?>/, ""), "application/xml");

    let defaultTemplate = {
        "__help_node__": {
            "cnName": "该元素的中文名。",
            "desc": "对该元素的描述，如果鼠标移动到该元素上，会以tips的形式展示出来。",
            "multi": "该元素是否多选。如果多选，该元素允许出现多次。",
            "optional": "该元素是否可选。如果可选，该元素默认不会出现，需用户手动创建。",
            "children": "该元素的子元素。",
            "attributes": "描述该元素拥有的所有属性。对于属性字段的描述，请看 __help_attribute__ 。"
        },
        "__help_attribute__": {
            "cnName": "该属性的中文名。",
            "desc": "对该属性的描述，如果鼠标移动到该属性上，会以tips的形式展示出来。",
            "type": "属性的类型。支持INT(整数)、DOUBLE(浮点)、STRING(字符串)、ENUM(枚举)、REF(引用)等",
            "optional": "该属性是否可选。如果可选，该属性默认不会出现，需用户手动创建。",
            "default": "该属性的默认值。",
            "min": "该属性的最小值。",
            "max": "该属性的最大值。",
            "precision": "精度",
            "enumList": "仅type=ENUM时有效。",
            "refPath": "仅type=REF时有效。"
        }
    };
    _genDefaultTemplate(defaultTemplate, xmlDoc.documentElement);
    return defaultTemplate;
}

gxeditor.setViewMode = function (mode) {
    if (mode === "raw") {
        Xonomy.lang = "en";
        Xonomy.setMode("nerd");
        Xonomy.refresh(); 
    } else {
        Xonomy.lang = "cn";
        Xonomy.setMode("laic");
        Xonomy.refresh();
    }
    remote.getGlobal("sharedObject").appConfig.setViewMode(mode);
}

module.exports = gxeditor;