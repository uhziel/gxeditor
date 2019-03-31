'use strict';

const gxpage = require("../gxpage");
const EventEmitter = require("events");
const format = require("js-beautify").html;
const gxeditor = require("../gxeditor");
const gxDetectFormat = require("./gx_detect_format");

class GXCoreEditor extends EventEmitter {
    constructor() {
        super();
        this.coreEditorType = "none";
        this.coreEditor = null;  
        this.tmpl = null;
        this.xonomyFormat = null;
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
            this.xonomyFormat = gxDetectFormat(text);
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
            const contentRemoveRoot = content.replace(/^<__root__>|<\/__root__>$/g, "");
            const beautifulText = format(contentRemoveRoot, {
                indent_size: this.xonomyFormat.indentSize,
                indent_char: this.xonomyFormat.indentChar,
                indent_level: this.xonomyFormat.indentLevel,
                eol: this.xonomyFormat.eol
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

    setXonomyFormat(format) {
        this.xonomyFormat = format;
    }
}

let gxCoreEditor = new GXCoreEditor();

module.exports = gxCoreEditor;
