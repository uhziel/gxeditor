'use strict';

const fs = require('fs');
const path = require('path');
const GXTinyXml = require('./gx_tinyxml');
const {shell} = require('electron');
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
    this.cppCodePath = path.resolve(this.templateDirPath, '../cppcode');
    if (!fs.existsSync(this.cppCodePath)) {
        fs.mkdirSync(this.cppCodePath);
    }
    this.childTmplFilePaths = {};
}

GXCodeGenerator.prototype.gen = function () {
    this.genFromTemplate(this.path);

    for (const child in this.childTmplFilePaths) {
        const codeGenerator = new GXCodeGenerator(child, true);
        codeGenerator.gen();
    }

    if (!this.sharedTemplate) {
        shell.showItemInFolder(this.cppCodePath);
    }
}

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
    const headerContent = GXTinyXml.genHeaderFile(tmplNamespace, structContent, includeDirectives);

    const elemContent = this.genSourceElem(template.data, fileBaseName, isRoot);
    const sourceContent = GXTinyXml.genSourceFile(fileBaseName, tmplNamespace, elemContent);

    const headerFilePath = path.resolve(this.cppCodePath, `${fileBaseName}.h`);
    const sourceFilePath = path.resolve(this.cppCodePath, `${fileBaseName}.cpp`);

    fs.writeFileSync(headerFilePath, headerContent);
    fs.writeFileSync(sourceFilePath, sourceContent);
}

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
        content += GXTinyXml.genHeaderFileStructRoot(varContent);
    } else {
        content += GXTinyXml.genHeaderFileStruct(toPascal(elemName), varContent);
    }
    
    return content;
}

GXCodeGenerator.prototype.genHeaderStructVarElem = function (template, elemName) {
    let type = toPascal(elemName);
    const elem = template[elemName];
    if (elem.sourceFilePath) {
        type = `GXShare::${type}`;
    }
    if (elem.multi) {
        type = `std::vector<${type}>`;
    }

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
}

module.exports = GXCodeGenerator;
