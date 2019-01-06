'use strict';

const Xonomy = require('../third_party/xonomy-3.5.0/xonomy.js');
const UndoManager = require('undo-manager');
let undoManager = new UndoManager();

Xonomy.reset = function() {
	Xonomy.namespaces={};

	Xonomy.lastIDNum=0;

	Xonomy.harvestCache={};

	Xonomy.lastClickWhat="";
	Xonomy.notclick=false;
	Xonomy.clearChars=false;

	Xonomy.lastAskerParam=null;

	Xonomy.wycLastID=0;
	Xonomy.wycCache={};

	Xonomy.draggingID=null;

	Xonomy.warnings=[];

	Xonomy.currentHtmlId=null;
	Xonomy.currentFocus=null;
    Xonomy.keyNav=false;
    
    undoManager.clear();
};

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
};

Xonomy.newElementChildAtTopPlus = function(htmlID, parameter) {
    const firstChildHtmlID = Xonomy.getFirstChildHtmlID(htmlID);
    const restoreInfo = Xonomy.newElementChild(htmlID, parameter, firstChildHtmlID);

    undoManager.add({
        undo: function() {
            Xonomy.deleteElement(restoreInfo.childHtmlID);
        },
        redo: function() {
            Xonomy.newElementChild(htmlID, restoreInfo.html, firstChildHtmlID);
        }
    });
};

Xonomy.deleteElementPlus = function(htmlID) {
    const restoreInfo = Xonomy.deleteElement(htmlID);

    undoManager.add({
        undo: function() {
            Xonomy.newElementChild(restoreInfo.parentHtmlID, restoreInfo.html,
                restoreInfo.anchorHtmlID);
        },
        redo: function() {
            Xonomy.deleteElement(htmlID);
        }
    });
};

Xonomy.duplicateElementPlus = function(htmlID) {
    const restoreInfo = Xonomy.duplicateElement(htmlID);

    undoManager.add({
        undo: function() {
            Xonomy.deleteElement(restoreInfo.newHtmlID);
        },
        redo: function() {
            Xonomy.duplicateElement(htmlID);
        }
    });
};

Xonomy.newAttributePlus = function(htmlID, parameter) {
    const restoreInfo = Xonomy.newAttribute(htmlID, parameter);

    undoManager.add({
        undo: function() {
            Xonomy.deleteAttribute(restoreInfo.childHtmlID);
        },
        redo: function() {
            Xonomy.newAttribute(htmlID, restoreInfo.html);
        }
    });
};

Xonomy.deleteAttributePlus = function(htmlID) {
    const restoreInfo = Xonomy.deleteAttribute(htmlID);

    undoManager.add({
        undo: function() {
            Xonomy.newAttribute(restoreInfo.parentHtmlID, restoreInfo.html);
        },
        redo: function() {
            Xonomy.deleteAttribute(htmlID);
        }
    });
};

Xonomy.modifyAttributeValue = function(htmlID, val) {
    const obj=document.getElementById(htmlID);
    obj.setAttribute('data-value', val);
    const oldVal = obj.getElementsByClassName('value')[0].textContent;
    obj.getElementsByClassName('value')[0].textContent = val;
    Xonomy.changed();
    window.setTimeout(function(){Xonomy.clickoff(); Xonomy.setFocus(htmlID, 'attributeValue')}, 100);
    
    const restoreInfo = {
        oldVal: oldVal
    };
    return restoreInfo;
};

Xonomy.modifyAttributeValuePlus = function(htmlID, val) {
    const restoreInfo = Xonomy.modifyAttributeValue(htmlID, val);

    undoManager.add({
        undo: function() {
            Xonomy.modifyAttributeValue(htmlID, restoreInfo.oldVal);
        },
        redo: function() {
            Xonomy.modifyAttributeValue(htmlID, val);
        }
    });
};

Xonomy.modifyText = function(htmlID, val) {
    const obj=document.getElementById(htmlID);
    const parentElem=obj.parentNode.parentNode;
    const oldVal = obj.getAttribute('data-value');
    obj.setAttribute('data-value', val);
    $(obj.getElementsByClassName('word')[0]).replaceWith(Xonomy.chewText(val));

    Xonomy.changed(Xonomy.harvestText(obj,Xonomy.harvestElement(parentElem)));
    window.setTimeout(function(){Xonomy.clickoff(); Xonomy.setFocus(htmlID, 'text')}, 100);

    const restoreInfo = {
        oldVal: oldVal
    };
    return restoreInfo;
};

Xonomy.modifyTextPlus = function(htmlID, val) {
    const restoreInfo = Xonomy.modifyText(htmlID, val);

    undoManager.add({
        undo: function() {
            Xonomy.modifyText(htmlID, restoreInfo.oldVal);
        },
        redo: function() {
            Xonomy.modifyText(htmlID, val);
        }
    });
};

Xonomy.insertBefore = function(node, referenceNode, referenceParentNode) {
    $(node).hide();
    referenceParentNode.insertBefore(node, referenceNode);
    $(node).fadeIn(function(){ Xonomy.changed(); });
};

Xonomy.insertBeforePlus = function(node, referenceNode, referenceParentNode) {
    let nextSibling = node.nextSibling;
    let parentNode = node.parentNode;
    Xonomy.insertBefore(node, referenceNode, referenceParentNode);

    undoManager.add({
        undo: function() {
            Xonomy.insertBefore(node, nextSibling, parentNode);
        },
        redo: function() {
            Xonomy.insertBefore(node, referenceNode, referenceParentNode);
        }
    });   
};

Xonomy.undo = function() {
    undoManager.undo();
};

Xonomy.redo = function() {
    undoManager.redo();
};

Xonomy.getNextSiblingHtmlID = function(htmlID) {
	const obj=document.getElementById(htmlID);
	const jsElement = Xonomy.harvestElement(obj);
    const jsNextSibling = jsElement.getFollowingSibling();
    if (jsNextSibling) {
        return jsNextSibling.htmlID;
    } else {
        return null;
    }
};

Xonomy.getFirstChildHtmlID = function(htmlID) {
	const obj=document.getElementById(htmlID);
    const jsElement = Xonomy.harvestElement(obj);
    if (!jsElement) {
        return null;
    }
    if (!jsElement.children) {
        return null;
    }
    if (jsElement.children.length <= 0) {
        return null;
    }
    return jsElement.children[0].htmlID;
}

module.exports = Xonomy;
