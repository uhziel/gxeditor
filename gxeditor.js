// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const iconv = require('iconv-lite');
const fs = require('fs');
const format = require('xml-formatter');

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

gxeditor.getNewElementParam = function (spec, element_name) {
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
            param += gxeditor.getNewElementParam(spec, child_name);
        }
    }
    param += `</${element_name}>`
    return param;
}

gxeditor.genElementMenu = function (spec, element_name, element) {
    //action: 添加子元素
    if (typeof element.child_elements === "object") {
        for (const key in element.child_elements) {
            let child_name = element.child_elements[key];
            const child_element = spec.elements[child_name];
            const param = gxeditor.getNewElementParam(spec, child_name);
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

gxeditor.genMenu = function (spec) {
    for (const key in spec.elements) {
        const element = spec.elements[key];
        gxeditor.genElementMenu(spec, key, element);

        if (typeof element.attributes !== 'object') {
            continue;
        }

        for (const key in element.attributes) {
            const attribute = element.attributes[key];
            gxeditor.genAttrMenu(attribute);
        }
    }
}

module.exports = gxeditor;