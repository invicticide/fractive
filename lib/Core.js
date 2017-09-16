var Core = (function () {
    function Core() {
    }
    Core.EnableInlineMacros = function (root, tf) {
        if (tf === void 0) { tf = true; }
        if (tf && root.id.search("_inline\-") > -1) {
            root.id = root.id.substring(1);
        }
        else if (!tf && root.id.search("inline\-") > -1) {
            root.id = "_" + root.id;
        }
        for (var i = 0; i < root.children.length; i++) {
            Core.EnableInlineMacros(root.children[i], tf);
        }
    };
    Core.ExpandMacro = function (macro) {
        var result = "";
        switch (macro[0]) {
            case '@':
                {
                    result = Core.ExpandSection(macro.substring(1));
                    break;
                }
            case '#':
                {
                    var functionName = macro.substring(1);
                    var fn = window[functionName];
                    if (typeof fn === "function") {
                        result = fn();
                    }
                    else {
                        console.log(functionName + " is not a function");
                    }
                    break;
                }
            case '$':
                {
                    result = window[macro.substring(1)];
                    break;
                }
            default:
                {
                    console.log("Unknown metacharacter in macro: " + macro);
                    return "";
                }
        }
        return result;
    };
    Core.ExpandSection = function (id) {
        var section = document.getElementById(id);
        if (section) {
            var finalHTML = '';
            var macro = '';
            var bParsingMacro = false;
            for (var i = 0; i < section.innerHTML.length; i++) {
                if (section.innerHTML[i] === '{') {
                    if (!bParsingMacro) {
                        bParsingMacro = true;
                        macro = '';
                    }
                    else {
                        console.log("Error: Nested { in " + id + " at character " + i.toString());
                        break;
                    }
                }
                else if (section.innerHTML[i] === '}') {
                    if (bParsingMacro) {
                        bParsingMacro = false;
                        finalHTML += Core.ExpandMacro(macro);
                    }
                    else {
                        console.log("Error: Got } without a corresponding { in " + id + " at character " + i.toString());
                        break;
                    }
                }
                else if (bParsingMacro) {
                    macro += section.innerHTML[i];
                }
                else {
                    finalHTML += section.innerHTML[i];
                }
            }
            return finalHTML;
        }
        else {
            console.log("Section " + id + " doesn't exist");
            return '';
        }
    };
    Core.GotoSection = function (id) {
        var history = document.getElementById("__history");
        var currentSection = document.getElementById("__currentSection");
        var links = currentSection.getElementsByTagName("a");
        for (var i = 0; i < links.length;) {
            var contents = links[i].outerHTML.substring(links[i].outerHTML.indexOf(">") + 1, links[i].outerHTML.indexOf("</a>"));
            links[i].outerHTML = "<span class=\"__disabledLink\">" + contents + "</span>";
        }
        history.innerHTML += currentSection.innerHTML;
        history.scrollTop = history.scrollHeight;
        var clone = document.createElement("div");
        clone.id = "__currentSection";
        clone.innerHTML = Core.ExpandSection(id);
        Core.EnableInlineMacros(clone, true);
        clone.scrollTop = 0;
        currentSection.parentElement.replaceChild(clone, currentSection);
    };
    Core.ReplaceActiveElement = function (id, html) {
        for (var element = document.getElementById(id); element; element = document.getElementById(id)) {
            if (!element) {
                continue;
            }
            var bIsActive = false;
            for (var parent_1 = element.parentElement; parent_1; parent_1 = parent_1.parentElement) {
                if (parent_1.id === "__currentSection") {
                    bIsActive = true;
                    break;
                }
            }
            if (bIsActive) {
                var replacement = document.createElement("span");
                replacement.className = "__inlineMacro";
                replacement.innerHTML = html;
                element.parentNode.replaceChild(replacement, element);
                break;
            }
        }
    };
    Core.ShowHistory = function (tf) {
        var history = document.getElementById("__history");
        history.hidden = !tf;
    };
    return Core;
}());
