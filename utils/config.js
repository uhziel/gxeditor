'use strict';

const fs = require('fs');

function Config(path) {
    this.path = path;

    const text = fs.readFileSync(path, "utf8");
    this.data = JSON.parse(text);
}

Config.prototype.get = function (key) {
    return this.data[key];
}

Config.prototype.set = function (key, value) {
    this.data[key] = value;

    const text = JSON.stringify(this.data, null, 4);
    fs.writeFileSync(this.path, text);
}

module.exports = Config;
