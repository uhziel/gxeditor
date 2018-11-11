// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const iconv = require('iconv-lite');
const fs = require('fs');
const format = require('xml-formatter');

let gxeditor = {};

gxeditor.readXMLFromFile = function (filename) {    
    let buffer = fs.readFileSync(filename);
    let content = iconv.decode(buffer, 'gbk');
    return content;
}

gxeditor.writeXMLToFile = function (filename, content) {
    let beautifulText = format(content);
    let buffer = iconv.encode(beautifulText, 'gbk');
    fs.writeFileSync(filename, buffer);
}

module.exports = gxeditor;