'use strict';

const fs = require("fs");
const iconv = require("iconv-lite");
const csvParse = require("csv-parse/lib/sync");

function parse(filePath, fileEncoding) {
    let strings = {};
    if (filePath.match(/.csv$/) === -1) {
        return strings;
    }

    if (!fs.existsSync(filePath)) {
        return strings;
    }

    if (!fileEncoding) {
        fileEncoding = "utf8";
    }

    const buffer = fs.readFileSync(filePath);
    const content = iconv.decode(buffer, fileEncoding);
    const csvAarry = csvParse(content, {
        relax: true,
        skip_empty_lines: true
    });
    csvAarry.forEach(element => {
        strings[element[0]] = element[1];
    });

    return strings;
}

module.exports = parse;
