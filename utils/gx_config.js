'use strict';

const fs = require('fs');

function GXConfig(path) {
    this.path = path;

    const text = fs.readFileSync(path, "utf8");
    this.data = JSON.parse(text);
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
