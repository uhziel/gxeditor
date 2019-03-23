'use strict';

const fs = require('fs');
const iconv = require("iconv-lite");
const format = require("js-beautify").html;

function GXXmlFile(filePath) {
    this.path = filePath;
    this.encoding = "utf-8";
    let firstLine = fs.readFileSync(this.path, "utf-8").split("\n")[0];
    let match = firstLine.match('encoding="(.+)"');
    if (match) {
        let encoding = match[1];
        if (typeof encoding === "string" && encoding.length > 0) {
            this.encoding = encoding;
        }
    }
}

GXXmlFile.prototype.readContent = function () {
    let buffer = fs.readFileSync(this.path);
    let content = iconv.decode(buffer, this.encoding);
    return content;
}

GXXmlFile.prototype.writeContent = function (content) {
    let buffer = iconv.encode(content, this.encoding);

    let head = "";
    if (content.slice(0, 5) !== "<?xml") {
        head = `<?xml version="1.0" encoding="${this.encoding}"?>\n`;
    }
    try {
        fs.writeFileSync(this.path, head, { flag: 'w' });
        fs.writeFileSync(this.path, buffer, { flag: 'a' });
        return true;
    } catch(err) {
        return false;
    }
}

module.exports = GXXmlFile;
