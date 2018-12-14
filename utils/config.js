'use strict';

const fs = require('fs');

function Config(path) {
    this._path = path;

    const text = fs.readFileSync(path, "utf8");
    this._data = JSON.parse(text);
}

Config.prototype.get = function (key) {
    return this._data[key];
}

Config.prototype.set = function (key, value) {
    this._data[key] = value;

    const text = JSON.stringify(this._data, null, 4);
    fs.writeFileSync(this._path, text);
}

Config.prototype.all = function () {
    return this._data;
}

module.exports = Config;
