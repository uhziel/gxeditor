'use strict';

const path = require("path");
const fs = require("fs");
const GXConfig = require("./utils/gx_config");
const { remote } = require("electron");
const gxStrings = require("./utils/gx_strings");

function GXPage() {
    this.appConfig = remote.getGlobal("sharedObject").appConfig;
    const curProjectPath = this.appConfig.getCurProjectPath();

    if (curProjectPath) {
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
        remote.dialog.showErrorBox(gxStrings.openProjectFail, gxStrings.openProjectFailDetail);
        return false;
    }
    if (!this.appConfig.switchProject(projectPath)) {
        return false;
    }
    this.curProjectConfig = new GXConfig(curProjectConfigPath);
    this.isCurFileSaved = true;
    return true;
}

GXPage.prototype.switchFile = function (filePath) {
    if (!this.appConfig.switchFile(filePath)) {
        return false;
    }
    this.isCurFileSaved = true;
    return true;
}

GXPage.prototype.genAppTitle = function () {
    let projectName = '无项目';
    let fileName = 'Untitled';

    const curProjectPath = this.appConfig.getCurProjectPath();
    if (curProjectPath) {
        projectName = path.basename(curProjectPath);

        const curFilePath = this.appConfig.getCurFilePath();
        if (curFilePath) {
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
    const curProjectPath = this.appConfig.getCurProjectPath();
    if (!curProjectPath) {
        return null;
    }

    const templatePath = path.join(curProjectPath, `template/${basename}.json`);
    return templatePath;
}

GXPage.prototype.getDataDirPath = function () {
    const curProjectPath = this.appConfig.getCurProjectPath();
    if (!curProjectPath) {
        return null;
    }

    const dataDirPath = path.join(curProjectPath, this.curProjectConfig.get('dataPath'));
    return dataDirPath;
}

GXPage.prototype.getCurFilePath = function () {
    return this.appConfig.getCurFilePath();
}

module.exports = GXPage;
