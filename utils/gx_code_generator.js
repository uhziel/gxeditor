'use strict';

const fs = require('fs');
const path = require('path');
const GXTinyXml = require('./gx_tinyxml');
const {shell} = require('electron');

//gx_editor -> GxEditor
function toPascal(underscore) {
    underscore = "_" + underscore;
    return underscore.replace(/_([a-z])/g, (x, y) => {
        return y.toUpperCase();
    });
}

const templateDirName = 'template';

function GXCodeGenerator(templatePath) {
    this.path = templatePath;
    this.templateDirPath = getTemplateDirPath(templatePath);
}

GXCodeGenerator.prototype.gen = function () {
    const text = fs.readFileSync(this.path, 'utf8');
    const template = JSON.parse(text);

    const fileBaseName = path.basename(this.path, '.json');
    const tmplNamespace = 'GX' + toPascal(fileBaseName);

    const structContent = this.genHeaderStruct(template, fileBaseName, true);
    const headerContent = GXTinyXml.genHeaderFile(tmplNamespace, structContent);

    const elemContent = this.genSourceElem(template, fileBaseName, true);
    const sourceContent = GXTinyXml.genSourceFile(fileBaseName, tmplNamespace, elemContent);

    const cppCodePath = path.resolve(this.templateDirPath, '../cppcode');
    if (!fs.existsSync(cppCodePath)) {
        fs.mkdirSync(cppCodePath);
    }

    const headerFilePath = path.resolve(cppCodePath, `${fileBaseName}.h`);
    const sourceFilePath = path.resolve(cppCodePath, `${fileBaseName}.cpp`);

    fs.writeFileSync(headerFilePath, headerContent);
    fs.writeFileSync(sourceFilePath, sourceContent);

    shell.showItemInFolder(headerFilePath); 
}

GXCodeGenerator.prototype.genHeaderStruct = function (template, elemName, isRoot)
{
    const elem = template[elemName];
    if (typeof elem !== 'object') {
        return;
    }

    let content = "";
    if (elem.children) {
        elem.children.forEach(childElemName => {
            content += this.genHeaderStruct(template, childElemName, false);
        });
    }

    let varContent = "";
    if (elem.children) {
        elem.children.forEach(childElemName => {
            varContent += this.genHeaderStructVarElem(childElemName);
        });
    }

    if (elem.attributes) {
        for (const attrName in elem.attributes) {
            const attr = elem.attributes[attrName];
            varContent += this.genHeaderStructVarAttr(attrName, attr);
        }
    }

    if (isRoot) {
        content += GXTinyXml.genHeaderFileStructRoot(varContent);
    } else {
        content += GXTinyXml.genHeaderFileStruct(toPascal(elemName), varContent);
    }
    
    return content;
}

GXCodeGenerator.prototype.genHeaderStructVarElem = function (elemName) {
    let type = toPascal(elemName);

    return GXTinyXml.genHeaderFileStructVar(type, elemName);
}

GXCodeGenerator.prototype.genHeaderStructVarAttr = function (attrName, attr) {
    let type = '';
    if (attr.type == 'INT') {
        type = 'int';
    }
    else if (attr.type == 'STRING') {
        type = 'std::string';
    }
    else if (attr.type == 'DOUBLE') {
        type = 'double';
    }
    else {
        type = attr.type;
    }
    return GXTinyXml.genHeaderFileStructVar(type, attrName);
}

GXCodeGenerator.prototype.genSourceElem = function (template, elemName, isRoot) {
    let content = '';

    const elem = template[elemName];
    if (typeof elem !== 'object') {
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
            loadContent += GXTinyXml.genSourceFileLoadVar(childName);
        });
    }

    let isFirst = true;
    if (elem.attributes) {
        for (const attrName in elem.attributes) {
            const attr = elem.attributes[attrName];

            constructorContent += GXTinyXml.genSourceFileCtorVar(attrName, attr.default, isFirst);
            isFirst = false;

            loadContent += GXTinyXml.genSourceFileLoadVar(attrName);
        }
    }

    if (isRoot) {
        content += GXTinyXml.genSourceFileCtor('Config', constructorContent);
        content += GXTinyXml.genSourceFileLoad('Config', loadContent);
        content += GXTinyXml.genSourceFileParse(elemName);
        content += GXTinyXml.genSourceFileLoadFile(elemName);
    } else {
        content += GXTinyXml.genSourceFileCtor(elemStructName, constructorContent);
        content += GXTinyXml.genSourceFileLoad(elemStructName, loadContent);
    }
    return content;
}

function getTemplateDirPath(templatePath) {
    const index = templatePath.indexOf(templateDirName);
    return templatePath.slice(0, index + templateDirName.length);
}

module.exports = GXCodeGenerator;
