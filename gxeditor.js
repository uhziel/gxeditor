const iconv = require('iconv-lite');
const fs = require('fs');
const format = require('xml-formatter');
const Xonomy = require('./third_party/xonomy-3.5.0/xonomy.js');

let gxeditor = {};

gxeditor.readXMLFromFile = function (filename) {
    let buffer = fs.readFileSync(filename);
    let content = iconv.decode(buffer, 'gbk');
    return content;
}

gxeditor.writeXMLToFile = function (filename, content) {
    let beautifulText = format(content);
    let buffer = iconv.encode(beautifulText, 'gbk');
    let head = '<?xml version="1.0" encoding="GB2312"?>\n';
    fs.writeFileSync(filename, head, { flag: 'w' });
    fs.writeFileSync(filename, buffer, { flag: 'a' });
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
gxeditor.askEnum = function (defaultString, tmpl) {
    if (typeof tmpl.default !== 'undefined' && defaultString.length <= 0) {
        defaultString = tmpl.default;
    }

    return Xonomy.askPicklist(defaultString, tmpl.enumlist);
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
/// genMenu
gxeditor.genAttrMenu = function (attrSpec) {
    attrSpec.menu = [];
    const tmpl = attrSpec.tmpl;
    // 给属性添加删除自身的actionelement
    if (typeof tmpl !== 'undefined' && tmpl.optional === true) {
        attrSpec.menu.push({
            caption: "删除",
            action: Xonomy.deleteElement,
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
    attrSpec.askerParameter = tmpl;
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
            let menuAction = {
                caption: `添加 <${childName}/>`,
                action: Xonomy.newElementChild,
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
        for (const key in elemSpec.attributes) {
            let attribute = elemSpec.attributes[key];
            let defaultString = "";
            if (typeof attribute.tmpl.default !== 'undefined') {
                defaultString = attribute.tmpl.default;
            }
            let menuAction = {
                caption: `添加 @${key}`,
                action: Xonomy.newAttribute,
                actionParameter: { name: key, value: defaultString },
                hideIf: function (jsElement) { return jsElement.hasAttribute(key); }
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

    //action: 删除自身
    elemSpec.menu.push({
        caption: "删除",
        action: Xonomy.deleteElement,
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
}

gxeditor.genDocSpecFullInfo = function (spec) {
    for (const elemName in spec.elements) {
        const elemSpec = spec.elements[elemName];
        gxeditor.genElementMenu(spec, elemName, elemSpec);

        for (const attrName in elemSpec.attributes) {
            const attrSpec = elemSpec.attributes[attrName];
            gxeditor.genAttrMenu(attrSpec);
        }
    }
}

// xmlTmpl xml文件的模版
gxeditor.genDocSpec = function (xmlTmpl) {
    const spec = {
        onchange: function () {
            console.log("You have changed this xml file.");
        },
        validate: function () {
            console.log("You can validate this xml file.");
        },
        allowLayby: true,
        laybyMessage: "您可以将节点拖过来临时存放再放回其他地方。",
        allowModeSwitching: true,
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

    return spec;
}

module.exports = gxeditor;