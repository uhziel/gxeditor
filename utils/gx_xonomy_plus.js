'use strict';

const Xonomy = require('../third_party/xonomy-3.5.0/xonomy.js');
const UndoManager = require('undo-manager');

let undoManager = new UndoManager();

Xonomy.newElementChildPlus = function(htmlID, parameter) {
    const restoreInfo = Xonomy.newElementChild(htmlID, parameter);

    undoManager.add({
        undo: function() {
            Xonomy.deleteElement(restoreInfo.childHtmlID);
        },
        redo: function() {
            Xonomy.newElementChild(htmlID, restoreInfo.html);
        }
    });
}

Xonomy.deleteElementPlus = function(htmlID) {
    const restoreInfo = Xonomy.deleteElement(htmlID);

    undoManager.add({
        undo: function() {
            Xonomy.newElementChild(restoreInfo.parentHtmlID, restoreInfo.html);
        },
        redo: function() {
            Xonomy.deleteElement(htmlID);
        }
    });
}

Xonomy.undo = function() {
    undoManager.undo();
}

Xonomy.redo = function() {
    undoManager.redo();
}

module.exports = Xonomy;
