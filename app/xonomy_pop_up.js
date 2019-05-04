'use strict';

const { ipcRenderer, remote } = require("electron");
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
        case "setViewMode":
            {
                gxeditor.setViewMode(arg1);
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

gxeditor.setViewMode(remote.getGlobal("sharedObject").appConfig.getViewMode());
let editor = document.getElementById("editor");
const tmpl = JSON.parse(localStorage.getItem("tmpl"));
const text = localStorage.getItem("xmlText");
const format = gxIndextFormat(text);
const textHasRoot = `<__root__>${text}</__root__>`;
try {
    gxCoreEditor.render("Xonomy", textHasRoot, editor, tmpl);
} catch (error) {
    $(editor).append("<p>渲染失败。请查看内容的语法是否出错：</p>");
    $(editor).append("<pre></pre>");
    $("#editor > pre").text(text);
}
gxCoreEditor.setXonomyFormat(format);

window.addEventListener("beforeunload", (event) => {
    localStorage.setItem("isChanged", isChanged);
    if (isChanged) {
        localStorage.setItem("xmlText", gxCoreEditor.harvest());
    }
});
