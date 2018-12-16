'use strict';

const path = require('path');
const fs = require('fs');
const Config = require('./utils/gx_config');

function GXPage() {
    const configPath = path.join(__dirname, `config.json`);
    this.config = new Config(configPath);
    const curProjectPath = this.config.get('projectPath');

    if (typeof curProjectPath === 'string') {
        const curProjectConfigPath = path.join(curProjectPath, 'gxproject.json');
        this.curProjectConfig = new Config(curProjectConfigPath);
    } else {
        this.curProjectConfig = null;
    }

    this.isCurFileSaved = true;
}

GXPage.prototype.switchProject = function (projectPath) {
    const curProjectConfigPath = path.join(projectPath, 'gxproject.json');
    if (!fs.existsSync(curProjectConfigPath)) {
        return false;
    }
    this.curProjectConfig = new Config(curProjectConfigPath);
    this.config.set('projectPath', projectPath);
    this.isCurFileSaved = true;
    return true;
}

GXPage.prototype.switchFile = function (filePath) {

}

GXPage.prototype.genAppTitle = function () {
    let projectName = '无项目';
    let fileName = 'Untitled';

    const curProjectPath = this.config.get('projectPath');
    if (typeof curProjectPath === 'string') {
        projectName = path.basename(curProjectPath);

        const curFilePath = this.curProjectConfig.get('curFilePath');
        if (typeof curFilePath === 'string') {
            fileName = curFilePath;
        }
    }

    let appTitle = `${projectName} - ${fileName}`;
    if (!this.isCurFileSaved) {
        appTitle += ' *';
    }

    return appTitle;
}

GXPage.prototype.getTemplatePath = function (dataPath) {
    const basename = path.basename(dataPath, ".xml");
    const curProjectPath = this.config.get('projectPath');
    if (typeof curProjectPath !== 'string') {
        return null;
    }

    const templatePath = path.join(curProjectPath, `template/${basename}.json`);
    return templatePath;
}

GXPage.prototype.getDataDirPath = function () {
    const curProjectPath = this.config.get('projectPath');
    if (typeof curProjectPath !== 'string') {
        return null;
    }

    const dataDirPath = path.join(curProjectPath, this.curProjectConfig.get('dataPath'));
    return dataDirPath;
}

module.exports = GXPage;
