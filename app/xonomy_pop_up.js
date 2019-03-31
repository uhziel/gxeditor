'use strict';

const { ipcRenderer } = require("electron");
const gxCoreEditor = require("./utils/gx_core_editor");
const gxeditor = require("./gxeditor");
const gxIndextFormat = require("./utils/gx_detect_format");

let isChanged = false;
gxCoreEditor.on("change", function() {
    if (!isChanged) {
        isChanged = true;
    }
});

ipcRenderer.on('action', (event, arg, arg1) => {
    switch (arg) {
        case "setViewModeRaw":
            {
                gxeditor.setViewModeRaw();
                break;
            }
        case "setViewModeEasy":
            {
                gxeditor.setViewModeEasy();
                break;
            }
        case "undo":
            {
                gxCoreEditor.undo();
                break;
            }
        case "redo":
            {
                gxCoreEditor.redo();
                break;
            }
    }
});

gxeditor.setViewModeEasy();

let editor = document.getElementById("editor");
const tmpl = JSON.parse(localStorage.getItem("tmpl"));
const text = localStorage.getItem("xmlText");
const format = gxIndextFormat(text);
const textHasRoot = `<__root__>${text}</__root__>`
gxCoreEditor.render(textHasRoot, editor, tmpl);
gxCoreEditor.setXonomyFormat(format);

window.addEventListener("beforeunload", (event) => {
    localStorage.setItem("isChanged", isChanged);
    if (isChanged) {
        localStorage.setItem("xmlText", gxCoreEditor.harvest());
    }
});
