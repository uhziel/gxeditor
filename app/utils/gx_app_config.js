'use strict';

const path = require("path");
const { app } = require('electron');
const GXConfig = require("./gx_config");
const fs = require("fs");

let gxAppConfig = {};
gxAppConfig.version = "0.1.2";

function compareVersion(v1, v2) {
    if (typeof v1 !== 'string') return false;
    if (typeof v2 !== 'string') return false;
    v1 = v1.split('.');
    v2 = v2.split('.');
    const k = Math.min(v1.length, v2.length);
    for (let i = 0; i < k; ++ i) {
        v1[i] = parseInt(v1[i], 10);
        v2[i] = parseInt(v2[i], 10);
        if (v1[i] > v2[i]) return 1;
        if (v1[i] < v2[i]) return -1;        
    }
    return v1.length == v2.length ? 0: (v1.length < v2.length ? -1 : 1);
}

(function() {
    const configPath = path.join(app.getPath('userData'), `app_config.json`);
    gxAppConfig.config = new GXConfig(configPath);
    let oldVersion = gxAppConfig.config.get("version");
    if (oldVersion === gxAppConfig.version) {
        return;
    }

    if (!oldVersion) {
        oldVersion = "0.0.0";
    }
    if (compareVersion(oldVersion, "0.1.0") === -1) {
        const defaultRecent = {
            "projectsMaxNum": 3,
            "filesMaxNum": 10,
            "projects": []
        };
        gxAppConfig.config.set("recent", defaultRecent);
    }

    if (compareVersion(oldVersion, "0.1.1") === -1) {
        gxAppConfig.config.set("largeTextLength", 50000);
    }

    if (compareVersion(oldVersion, "0.1.2") === -1) {
        gxAppConfig.config.set("viewMode", "easy");
    } 

    gxAppConfig.config.set("version", gxAppConfig.version);
})();

gxAppConfig.switchProject = function(projectPath) {
    let recent = gxAppConfig.config.get("recent");
    let i = 0;
    for (; i < recent.projects.length; i++) {
        if (recent.projects[i].path === projectPath) {
            break;
        }
    }
    if (i === recent.projects.length) {
        //如果没打开过该项目，在数组头新建
        recent.projects.unshift({
            "path": projectPath,
            "files": []
        });
        const overflow = recent.projects.length - recent.projectsMaxNum;
        if (overflow > 0) {
            recent.projects.splice(-overflow, overflow);
        }
    } else if (i === 0) {
        //如果就是当前打开的项目，不做任何处理
        return false;
    } else {
        //如果是已打开的其他项目，移到数组头
        const project = recent.projects.splice(i, 1)[0];
        recent.projects.unshift(project);
    }
    gxAppConfig.config.set("recent", recent);
    return true;
}

gxAppConfig.switchFile = function(filePath) {
    let recent = gxAppConfig.config.get("recent");
    if (recent.projects.length === 0) {
        return false;
    }
    if (!fs.existsSync(filePath)) {
        gxAppConfig.deleteFilePath(filePath);
        return false;
    }
    const curProject = recent.projects[0];
    let i = 0;
    for (; i < curProject.files.length; i++) {
        if (curProject.files[i] === filePath) {
            break;
        }
    }
    if (i === curProject.files.length) {
        //如果没打开过该文件，在数组头新建
        curProject.files.unshift(filePath);

        const overflow = curProject.files.length - recent.filesMaxNum;
        if (overflow > 0) {
            curProject.files.splice(-overflow, overflow);
        }
    } else if (i === 0) {
        //如果就是当前打开的文件，不做任何处理
        return false;
    } else {
        //如果是已打开的其他文件，移到数组头
        const filePath = curProject.files.splice(i, 1)[0];
        curProject.files.unshift(filePath);
    }
    gxAppConfig.config.set("recent", recent);
    return true;
}

gxAppConfig.deleteFilePath = function(filePath) {
    let recent = gxAppConfig.config.get("recent");
    if (recent.projects.length === 0) {
        return;
    }
    const curProject = recent.projects[0];
    for (let i = 0; i < curProject.files.length; i++) {
        if (curProject.files[i] === filePath) {
            curProject.files.splice(i, 1);
            gxAppConfig.config.set("recent", recent);
            break;
        }
    }
}

gxAppConfig.getCurProjectPath = function() {
    const recent = gxAppConfig.config.get("recent");
    if (recent.projects.length === 0) {
        return null;
    }

    return recent.projects[0].path;
}

gxAppConfig.getCurFilePath = function() {
    const recent = gxAppConfig.config.get("recent");
    if (recent.projects.length === 0) {
        return null;
    }
    const curProject = recent.projects[0];
    if (curProject.files.length === 0) {
        return null;
    }

    return curProject.files[0];
}

gxAppConfig.getRecent = function() {
    return gxAppConfig.config.get("recent");
}

gxAppConfig.getLargeTextLength = function() {
    return gxAppConfig.config.get("largeTextLength");
}

gxAppConfig.getViewMode = function() {
    return gxAppConfig.config.get("viewMode");
}

gxAppConfig.setViewMode = function(mode) {
    gxAppConfig.config.set("viewMode", mode);
}

module.exports = gxAppConfig;
