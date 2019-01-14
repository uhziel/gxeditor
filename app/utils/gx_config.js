'use strict';

const fs = require('fs');

/*
 * GXConfig 构造函数
 * 允许配置文件路径指向的文件不存在。后续保存配置时，会创建该文件。
 */
function GXConfig(path) {
    this.path = path;
    this.data = {};

    if (fs.existsSync(path)) {
        const text = fs.readFileSync(path, "utf8");
        this.data = JSON.parse(text);
    }
}

GXConfig.prototype.get = function (key) {
    return this.data[key];
}

GXConfig.prototype.set = function (key, value) {
    this.data[key] = value;

    const text = JSON.stringify(this.data, null, 4);
    fs.writeFileSync(this.path, text);
}

module.exports = GXConfig;
