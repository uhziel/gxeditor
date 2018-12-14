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
    this._data[key] = vaule;
}

Config.prototype.all = function () {
    return this._data;
}

Config.prototype.save = function () {
    const text = JSON.stringify(this._data);
    fs.writeFileSync(this._path, text);
}

module.exports = Config;
