var Core = (function () {
    function Core() {
    }
    Core.ExpandMacro = function (macro) {
        switch (macro[0]) {
            case '@':
                {
                    return Core.ExpandPassage(macro.substring(1));
                }
            case '#':
                {
                    var functionName = macro.substring(1);
                    var fn = window[functionName];
                    if (typeof fn === "function") {
                        return fn();
                    }
                    else {
                        console.log(functionName + " is not a function");
                        break;
                    }
                }
            case '$':
                {
                    return window[macro.substring(1)];
                }
        }
        console.log("Unknown metacharacter in macro: " + macro);
        return "";
    };
    Core.ExpandPassage = function (id) {
        var passage = document.getElementById(id);
        if (passage) {
            var finalHTML = '';
            var macro = '';
            var bParsingMacro = false;
            for (var i = 0; i < passage.innerHTML.length; i++) {
                if (passage.innerHTML[i] == '{') {
                    if (!bParsingMacro) {
                        bParsingMacro = true;
                        macro = '';
                    }
                    else {
                        console.log("Error: Nested { in " + id + " at character " + i.toString());
                        break;
                    }
                }
                else if (passage.innerHTML[i] == '}') {
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
                    macro += passage.innerHTML[i];
                }
                else {
                    finalHTML += passage.innerHTML[i];
                }
            }
            return finalHTML;
        }
        else {
            console.log("Passage " + id + " doesn't exist");
            return '';
        }
    };
    Core.GotoPassage = function (id) {
        var history = document.getElementById("__history");
        var currentPassage = document.getElementById("__currentPassage");
        history.innerHTML += currentPassage.innerHTML;
        currentPassage.innerHTML = Core.ExpandPassage(id);
    };
    return Core;
}());
