'use strict';

const fs = require('fs');

const templateDirName = 'template';

function GXTemplate(templatePath) {
    this.path = templatePath;
    this.templateDirPath = getTemplateDirPath(templatePath);

    this.data = _parseFile(this, templatePath);
}

function getTemplateDirPath(templatePath) {
    const index = templatePath.indexOf(templateDirName);
    return templatePath.slice(0, index + templateDirName.length);
}

function _parseFile(that, templatePath) {
    const text = fs.readFileSync(templatePath, "utf8");
    let data = JSON.parse(text);

    if (typeof data.__include__ === 'object') {
        data.__include__.forEach(includePath => {
            const absolutePath = includePath.replace('${templateDirPath}', that.templateDirPath);
            const includeData = _parseFile(that, absolutePath);
            for (const key in includeData) { data[key] = includeData[key]; }
        });
    }

    return data;
}

module.exports = GXTemplate;
