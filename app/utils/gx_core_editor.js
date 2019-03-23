'use strict';

const gxpage = require("../gxpage");
const EventEmitter = require("events");
const format = require("js-beautify").html;

class GXCoreEditor extends EventEmitter {
    constructor() {
        super();
        this.coreEditorType = "none";
        this.coreEditor = null;   
    }

    render(text, editor, spec) {
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
            Xonomy.render(text, editor, spec);
            spec.onchange = this.emit.bind(this, "change");
            this.coreEditorType = "Xonomy";
            this.coreEditor = Xonomy;
        } 
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
            const beautifulText = format(content, { eol: "\r\n" });
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
}

let gxCoreEditor = new GXCoreEditor();

module.exports = gxCoreEditor;
