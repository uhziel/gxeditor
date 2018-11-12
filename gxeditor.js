// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

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
    fs.writeFileSync(filename, buffer);
}

///////////////////////////////////////
// Num
gxeditor.askNum = function (defaultString, rule) {
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
            <input type='number' name='val' class='focusme' value='${defaultString}' ${stepString} ${minString} ${maxString} />
            <input type='submit' value='确定' />
            </form>
        `;
}

///////////////////////////////////////
// Datetime
gxeditor.askDate = function (defaultString) {
    return `
        <form onsubmit='Xonomy.answer(this.val.value); return false;'>
        <input type='datetime-local' name='val' class='focusme' value='${defaultString}' step='1'/>
        <input type='submit' value='确定' />
        </form>
    `;
}

///////////////////////////////////////
/// genMenu
gxeditor.genAttrMenu = function (attribute) {
    attribute.menu = [];
    const tmpl = attribute.tmpl;
    // 给属性添加删除自身的actionelement
    if (typeof tmpl !== 'undefined' && tmpl.optional === true) {
        attribute.menu.push({
            caption: "删除",
            action: Xonomy.deleteElement,
            actionParameter: null,
            hideIf: function (jsAttribute) { return false }
        });
    }

    // 添加修改属性的ask方法
    if (tmpl.type === "INT") {
        attribute.asker = gxeditor.askNum;
    }
    else if (tmpl.type === "DOUBLE") {
        attribute.asker = gxeditor.askNum;
    }
    else if (tmpl.type == "DATETIME") {
        attribute.asker = gxeditor.askDate;
    }
    attribute.askerParameter = tmpl;
}

gxeditor.getNewElementParam = function (spec, element_name) {
    var param = '<' + element_name;
    const element = spec.elements[element_name];
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
        const child_name = element.tmpl.children[key];
        const child_element = spec.elements[child_name];
        if (child_element.tmpl.optional !== true) {
            param += gxeditor.getNewElementParam(spec, child_name);
        }
    }
    param += `</${element_name}>`
    return param;
}

gxeditor.genElementMenu = function (spec, element_name, element) {
    element.menu = [];
    const tmpl = element.tmpl;

    //action: 添加子元素
    if (typeof tmpl.children === "object") {
        for (const key in tmpl.children) {
            let child_name = tmpl.children[key];
            const child_element = spec.elements[child_name];
            const param = gxeditor.getNewElementParam(spec, child_name);
            let menu_action = {
                caption: `添加 <${child_name}/>`,
                action: Xonomy.newElementChild,
                actionParameter: param,
                hideIf: function (jsElement) {
                    if (child_element.tmpl.multi === true) {
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
            if (typeof attribute.tmpl.default !== 'undefined') {
                defaultString = attribute.tmpl.default;
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
            if (tmpl.optional === true) {
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
gxeditor.genDocSpec = function(xmlTmpl) {
    const spec = {
        onchange: function () {
            console.log("You have changed this xml file.");
        },
        validate: function () {
            console.log("You can validate this xml file.");
        },
        allowLayby : false,
        elements : {}
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