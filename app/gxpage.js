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

GXPage.prototype.deleteFilePath = function (filePath) {
    this.appConfig.deleteFilePath(filePath);
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

//只是根据getCurFilePath计算，并不会判断template文件本身是否存在
GXPage.prototype.getTemplatePath = function () {
    const curFilePath = this.getCurFilePath();
    if (!curFilePath) {
        return null;
    }
    const basename = path.basename(curFilePath, ".xml");
    const curProjectPath = this.appConfig.getCurProjectPath();
    if (!curProjectPath) {
        return null;
    }

    const templatePath = path.join(curProjectPath, `template/${basename}.json`);
    return templatePath;
}

GXPage.prototype.getCurTemplatePath = function () {
    const templatePath = this.getTemplatePath();
    if (!fs.existsSync(templatePath)) {
        return null;
    }
    return templatePath;
}

GXPage.prototype.getDataDirPath = function () {
    if (!this.curProjectConfig) {
        return null;
    }

    const curProjectPath = this.appConfig.getCurProjectPath();
    if (!curProjectPath) {
        return null;
    }

    const dataDirPath = path.join(curProjectPath, this.curProjectConfig.get("dataDirPath"));
    return dataDirPath;
}

GXPage.prototype.getWikiPage = function (dataBasename) {
    if (!this.curProjectConfig) {
        return null;
    }

    const wikiPage = this.curProjectConfig.get("wikiPage");
    if (!wikiPage) {
        return null;
    }

    return wikiPage.replace("${dataBasename}", dataBasename);
}

GXPage.prototype.getCurFilePath = function () {
    return this.appConfig.getCurFilePath();
}

let gxpage = new GXPage();

module.exports = gxpage;
