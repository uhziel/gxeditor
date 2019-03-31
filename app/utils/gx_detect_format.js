'use strict';

const detectIndent = require("detect-indent");

function getHeadCharNum(text, char) {
    if (!text) {
        return 0;
    }

    let num = 0;
    while (text[num] === char) {
        num++;
    }
    return num;
}

function gxDetectFormat(text) {
    const indentStatus = detectIndent(text);
    const firstLine = text.split("\n", 1)[0];
    console.assert(firstLine.length);

    let format = {};
    format.eol = "\n";  //默认换行结束符
    if (firstLine[firstLine.length - 1] === "\r") {
        format.eol = "\r\n";
    }

    if (indentStatus.type === "space") {
        format.indentSize = indentStatus.amount;
        format.indentChar = " ";        
    }
    else if (indentStatus.type === "tab") {
        format.indentSize = indentStatus.amount;
        format.indentChar = "\t";        
    } else {
        format.indentSize = 4;     //默认1个缩进占4个字符
        format.indentChar = " ";   //默认缩进字符
    }

    const indentCharNum = getHeadCharNum(firstLine, format.indentChar);

    format.indentLevel = Math.trunc(indentCharNum / format.indentSize);

    return format;
}

module.exports = gxDetectFormat;
