var Core = (function () {
    function Core() {
    }
    Core.ExpandMacro = function (macro) {
        switch (macro[0]) {
            case '@':
                {
                    return Core.ExpandSection(macro.substring(1));
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
        history.innerHTML += currentSection.innerHTML;
        currentSection.innerHTML = Core.ExpandSection(id);
    };
    return Core;
}());
