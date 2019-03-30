'use strict';

const gxpage = require("../gxpage");
const EventEmitter = require("events");
const format = require("js-beautify").html;
const gxeditor = require("../gxeditor");
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

function getXonomyOptions(text) {
    const indentStatus = detectIndent(text);
    const firstLine = text.split("\n", 1)[0];
    console.assert(firstLine.length);

    let xonomyOptions = {};
    xonomyOptions.eol = "\n";  //默认换行结束符
    if (firstLine[firstLine.length - 1] === "\r") {
        xonomyOptions.eol = "\r\n";
    }

    if (indentStatus.type === "space") {
        xonomyOptions.indentSize = indentStatus.amount;
        xonomyOptions.indentChar = " ";        
    }
    else if (indentStatus.type === "tab") {
        xonomyOptions.indentSize = indentStatus.amount;
        xonomyOptions.indentChar = "\t";        
    } else {
        xonomyOptions.indentSize = 4;     //默认1个缩进占4个字符
        xonomyOptions.indentChar = " ";   //默认缩进字符
    }

    const indentCharNum = getHeadCharNum(firstLine, xonomyOptions.indentChar);

    xonomyOptions.indentLevel = Math.trunc(indentCharNum / xonomyOptions.indentSize);

    return xonomyOptions;
}

class GXCoreEditor extends EventEmitter {
    constructor() {
        super();
        this.coreEditorType = "none";
        this.coreEditor = null;  
        this.tmpl = null;
        this.xonomyOptions = null;
    }

    render(text, editor, tmpl) {
        if (gxpage.isLargeText(text.length)) {
            if (!$(editor).hasClass("ace_editor")) {
                $(editor).addClass("ace_editor");
            }
            this.coreEditorType = "ace";
            this.coreEditor = ace.edit(editor);
            this.coreEditor.setOptions({
                theme: "ace/theme/textmate",
                mode: "ace/mode/xml",
                vScrollBarAlwaysVisible: true
            });
            this.coreEditor.session.setValue(text);
            this.coreEditor.on("change", this.emit.bind(this, "change"));
        } else {
            let spec = gxeditor.genDocSpec(tmpl);
            Xonomy.render(text, editor, spec);
            spec.onchange = this.emit.bind(this, "change");
            this.coreEditorType = "Xonomy";
            this.coreEditor = Xonomy;
            this.xonomyOptions = getXonomyOptions(text);
        }
        this.tmpl = tmpl;
    }

    destroy() {
        if (this.coreEditorType === "ace") {
            this.coreEditor.destroy();
            this.coreEditor = null;
        }
    
        this.coreEditorType = "none";
    
        $("#editor").remove();
        $("body").append('<div id="editor"></div>');        
    }

    harvest() {
        if (this.coreEditorType === "ace") {
            return this.coreEditor.getValue();
        } else if (this.coreEditorType === "Xonomy") {
            const content = this.coreEditor.harvest();
            const beautifulText = format(content, {
                indent_size: this.xonomyOptions.indentSize,
                indent_char: this.xonomyOptions.indentChar,
                indent_level: this.xonomyOptions.indentLevel,
                eol: this.xonomyOptions.eol
            });
            return beautifulText;
        } else {
            return "";
        }
    }
    
    undo() {
        if (this.coreEditorType === "ace") {
            return this.coreEditor.undo();
        } else if (this.coreEditorType === "Xonomy") {
            if (this.coreEditor.hasBubble()) {
                remote.getCurrentWindow().webContents.undo();
            } else {
                this.coreEditor.undo();
            }
        }
    }
    
    redo() {
        if (this.coreEditorType === "ace") {
            return this.coreEditor.redo();
        } else if (this.coreEditorType === "Xonomy") {
            if (this.coreEditor.hasBubble()) {
                remote.getCurrentWindow().webContents.redo();
            } else {
                this.coreEditor.redo();
            }
        }
    }

    getAceEditor() {
        if (this.coreEditorType === "ace") {
            return this.coreEditor;
        } else {
            return null;
        }
    }
    
    getTmpl() {
        return this.tmpl;
    }
}

let gxCoreEditor = new GXCoreEditor();

module.exports = gxCoreEditor;
