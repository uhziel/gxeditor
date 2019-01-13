'use strict';

const path = require('path');
const fs = require('fs');
const GXConfig = require('./utils/gx_config');
const { remote } = require('electron');

function GXPage() {
    this.config = remote.getGlobal("sharedObject").config;
    const curProjectPath = this.config.get('projectPath');

    if (typeof curProjectPath === 'string') {
        const curProjectConfigPath = path.join(curProjectPath, 'gxproject.json');
        this.curProjectConfig = new GXConfig(curProjectConfigPath);
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
    this.curProjectConfig = new GXConfig(curProjectConfigPath);
    this.config.set('projectPath', projectPath);
    this.config.set('curFilePath', null);
    this.isCurFileSaved = true;
    return true;
}

GXPage.prototype.switchFile = function (filePath) {
    if (!this.config) {
        return false;
    }

    if (!this.config.get('projectPath')) {
        return false;
    }

    this.config.set('curFilePath', filePath);
    this.isCurFileSaved = true;
    return true;
}

GXPage.prototype.genAppTitle = function () {
    let projectName = '无项目';
    let fileName = 'Untitled';

    const curProjectPath = this.config.get('projectPath');
    if (typeof curProjectPath === 'string') {
        projectName = path.basename(curProjectPath);

        const curFilePath = this.config.get('curFilePath');
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

GXPage.prototype.getCurFilePath = function () {
    if (!this.config) {
        return null;
    }

    return this.config.get('curFilePath');
}

module.exports = GXPage;
