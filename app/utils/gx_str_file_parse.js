'use strict';

const fs = require("fs");
const iconv = require("iconv-lite");
const csvParse = require("csv-parse/lib/sync");
const logger = require("electron-log");

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
    try {
        const csvAarry = csvParse(content, {
            relax: true,
            skip_empty_lines: true
        });
        csvAarry.forEach(element => {
            strings[element[0]] = element[1];
        });
    }
    catch (error) {
        logger.error(error);
        return strings;
    }

    return strings;
}

module.exports = parse;
