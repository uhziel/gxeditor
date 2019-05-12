'use strict';

const fs = require('fs');
const path = require('path');
const {ipcRenderer} = require('electron');
const GXTemplate = require('./gx_template');

//gx_editor -> GxEditor
function toPascal(underscore) {
    underscore = "_" + underscore;
    return underscore.replace(/_([a-z])/g, (x, y) => {
        return y.toUpperCase();
    });
}

const templateDirName = 'template';

function GXCodeGenerator(templatePath, sharedTemplate) {
    this.sharedTemplate = (sharedTemplate) ? true : false;
    this.path = templatePath;
    this.templateDirPath = getTemplateDirPath(templatePath);
    this.cppCodePath = path.resolve(this.templateDirPath, "../cppcode");

    if (!fs.existsSync(this.cppCodePath)) {
        fs.mkdirSync(this.cppCodePath);
    }

    const cppTmplJsPath = path.resolve(this.templateDirPath, "../cpp_tmpl.js");
    if (fs.existsSync(cppTmplJsPath)) {
        this.cppTmpl = require(cppTmplJsPath);
    } else {
        this.cppTmpl = require("./gx_tinyxml");
    }

    this.childTmplFilePaths = {};
}

GXCodeGenerator.prototype.gen = function () {
    this.genFromTemplate(this.path);

    for (const child in this.childTmplFilePaths) {
        const codeGenerator = new GXCodeGenerator(child, true);
        codeGenerator.gen();
    }
};

GXCodeGenerator.prototype.genFromTemplate = function (tmplFilePath) {
    const template = new GXTemplate(tmplFilePath);

    const fileBaseName = path.basename(tmplFilePath, '.json');
    let tmplNamespace = 'GX' + toPascal(fileBaseName);
    if (this.sharedTemplate) {
        tmplNamespace = "GXShare";
    }

    const isRoot = (this.sharedTemplate) ? false : true;
    const structContent = this.genHeaderStruct(template.data, fileBaseName, isRoot);
    const includeDirectives = getIncludeDirectives(template.data.__include__);
    const headerContent = this.cppTmpl.genHeaderFile(fileBaseName,
        tmplNamespace, structContent, includeDirectives);

    const elemContent = this.genSourceElem(template.data, fileBaseName, isRoot);
    const sourceContent = this.cppTmpl.genSourceFile(fileBaseName,
        tmplNamespace, elemContent);

    const headerFilePath = path.resolve(this.cppCodePath, `${fileBaseName}.h`);
    const sourceFilePath = path.resolve(this.cppCodePath, `${fileBaseName}.cpp`);

    fs.writeFileSync(headerFilePath, headerContent);
    fs.writeFileSync(sourceFilePath, sourceContent);

    if (!this.sharedTemplate) {
        ipcRenderer.send('reqaction', 'showItemInFolder', headerFilePath);
    }
};

GXCodeGenerator.prototype.genHeaderStruct = function (template, elemName, isRoot)
{
    let content = "";

    const elem = template[elemName];
    if (typeof elem !== 'object') {
        return content;
    }

    if (elem.sourceFilePath) {
        this.childTmplFilePaths[elem.sourceFilePath] = true;
        return content;
    }

    if (elem.children) {
        elem.children.forEach(childElemName => {
            content += this.genHeaderStruct(template, childElemName, false);
        });
    }

    let varContent = "";
    if (elem.children) {
        elem.children.forEach(childElemName => {
            varContent += this.genHeaderStructVarElem(template, childElemName);
        });
    }

    if (elem.attributes) {
        for (const attrName in elem.attributes) {
            const attr = elem.attributes[attrName];
            varContent += this.genHeaderStructVarAttr(attrName, attr);
        }
    }

    if (isRoot) {
        content += this.cppTmpl.genHeaderFileStructRoot(varContent);
    } else {
        content += this.cppTmpl.genHeaderFileStruct(toPascal(elemName), varContent);
    }
    
    return content;
};

GXCodeGenerator.prototype.genHeaderStructVarElem = function (template, elemName) {
    let type = toPascal(elemName);
    const elem = template[elemName];
    if (elem.sourceFilePath) {
        type = `GXShare::${type}`;
    }
    if (elem.multi) {
        type = `std::vector<${type}>`;
    }

    return this.cppTmpl.genHeaderFileStructVar(type, elemName);
};

GXCodeGenerator.prototype.genHeaderStructVarAttr = function (attrName, attr) {
    let type = "";
    if (attr.type == "INT" || attr.type == "ENUM" || attr.type == "REF") {
        type = "int";
    }
    else if (attr.type == "STRING" || attr.type == "FILE" || attr.type == "STR_NAME") {
        type = "std::string";
    }
    else if (attr.type == "DOUBLE") {
        type = "double";
    }
    else if (attr.type == "DATETIME") {
        type = "GXDateTime";
    }
    else {
        type = attr.type;
    }
    return this.cppTmpl.genHeaderFileStructVar(type, attrName);
};

GXCodeGenerator.prototype.genSourceElem = function (template, elemName, isRoot) {
    let content = '';

    const elem = template[elemName];
    if (typeof elem !== 'object') {
        return content;
    }

    if (elem.sourceFilePath) {
        return content;
    }

    if (elem.children) {
        elem.children.forEach(childElemName => {
            content += this.genSourceElem(template, childElemName, false);
        });
    }
 
    const elemStructName = toPascal(elemName);
    let constructorContent = "";
    let loadContent = "";

    if (elem.children) {
        elem.children.forEach(childName => {
            loadContent += this.cppTmpl.genSourceFileLoadVar(childName);
        });
    }

    let isFirst = true;
    if (elem.attributes) {
        for (const attrName in elem.attributes) {
            const attr = elem.attributes[attrName];

            constructorContent += this.cppTmpl.genSourceFileCtorVar(attrName, attr.default, isFirst);
            isFirst = false;

            loadContent += this.cppTmpl.genSourceFileLoadVar(attrName);
        }
    }

    if (isRoot) {
        content += this.cppTmpl.genSourceFileCtor('Config', constructorContent);
        content += this.cppTmpl.genSourceFileLoad('Config', loadContent);
        content += this.cppTmpl.genSourceFileParse(elemName);
        content += this.cppTmpl.genSourceFileLoadFile(elemName);
    } else {
        content += this.cppTmpl.genSourceFileCtor(elemStructName, constructorContent);
        content += this.cppTmpl.genSourceFileLoad(elemStructName, loadContent);
    }
    return content;
};

function getTemplateDirPath(templatePath) {
    const index = templatePath.indexOf(templateDirName);
    return templatePath.slice(0, index + templateDirName.length);
};

function getIncludeDirectives(__include__) {
    let includeDirectives = '';

    if (!__include__) {
        return includeDirectives;
    }

    __include__.forEach(includePath => {
        const basename = path.basename(includePath, '.json');
        includeDirectives += `#include "${basename}.h"\n`
    });
    return includeDirectives;
};

module.exports = GXCodeGenerator;
