var fs = require("fs");
var path = require("path");
var commonmark = require("commonmark.js");
var markdownReader = new commonmark.Parser({ smart: false });
var markdownWriter = new commonmark.HtmlRenderer({ softbreak: "<br/>" });
var Compiler = (function () {
    function Compiler() {
    }
    Compiler.Compile = function (directory) {
        if (!fs.existsSync(directory)) {
            console.log("Directory not found: \"" + directory + "\"");
            return;
        }
        if (!fs.lstatSync(directory).isDirectory()) {
            console.log(directory + " is not a directory");
            return;
        }
        var markdownFiles = [];
        var javascriptFiles = [];
        var files = fs.readdirSync(directory, "utf8");
        for (var i = 0; i < files.length; i++) {
            if (!fs.lstatSync(directory + "/" + files[i]).isFile()) {
                continue;
            }
            switch (path.extname(files[i])) {
                case ".md": {
                    markdownFiles.push(files[i]);
                    break;
                }
                case ".js": {
                    javascriptFiles.push(files[i]);
                    break;
                }
            }
        }
        console.log("\nProcessing story text...");
        var html = "";
        for (var i = 0; i < markdownFiles.length; i++) {
            console.log("\t" + markdownFiles[i]);
            var filepath = directory + "/" + markdownFiles[i];
            html += "<!-- " + markdownFiles[i] + " -->\n" + Compiler.RenderFile(filepath) + "\n";
        }
        console.log("\nProcessing scripts...");
        var javascript = Compiler.ImportFile("lib/Core.js");
        for (var i = 0; i < javascriptFiles.length; i++) {
            console.log("\t" + javascriptFiles[i]);
            var filepath = directory + "/" + javascriptFiles[i];
            javascript += "// " + javascriptFiles[i] + "\n" + Compiler.ImportFile(filepath) + "\n";
        }
        html = "<html>\n<head>\n<script>\n" + javascript + "\n</script>\n</head>\n<body>\n" + html + "\n<div id=\"__history\"></div><hr/><div id=\"__currentSection\"></div></body><script>Core.GotoSection(\"Start\");</script>\n</html>\n";
        console.log("\nWriting output file...");
        fs.writeFileSync(directory + "/index.html", html, "utf8");
        console.log("\nBuild complete! Your story was published to " + directory + "/index.html!\n");
    };
    Compiler.GetLinkLabel = function (node) {
        if (node.type !== "link") {
            console.log("GetLinkLabel received a node of type " + node.type + ", which is illegal and will be skipped");
            return null;
        }
        var html = markdownWriter.render(node);
        for (var i = 0; i < html.length; i++) {
            if (html[i] === ">") {
                html = html.substring(i + 1, html.length - 4);
                break;
            }
        }
        return html;
    };
    Compiler.ImportFile = function (filepath) {
        if (!fs.existsSync(filepath)) {
            console.log("File not found: \"" + filepath + "\"");
            return null;
        }
        if (!fs.lstatSync(filepath).isFile()) {
            console.log("\"" + filepath + " is not a file");
            return null;
        }
        return fs.readFileSync(filepath, "utf8");
    };
    Compiler.LogParseError = function (text, lineNumber, characterNumber) {
        console.log("(" + lineNumber + "," + characterNumber + "): " + text);
    };
    Compiler.RenderFile = function (filepath) {
        if (!fs.existsSync(filepath)) {
            console.log("File not found: " + filepath);
            return null;
        }
        var text = fs.readFileSync(filepath, "utf8");
        var braceCount = 0;
        var sectionName = "";
        var sectionBody = "";
        var lineNumber = 1;
        var characterNumber = 1;
        var html = "";
        for (var i = 0; i < text.length; i++) {
            if (text[i] === "{") {
                if (braceCount === 0 && text[i + 1] === "{") {
                    i++;
                    braceCount += 2;
                    if (sectionName.length > 0 && sectionBody.length > 0) {
                        html += Compiler.RenderSection(sectionName, sectionBody);
                    }
                    sectionName = "";
                    sectionBody = "";
                }
                else if (braceCount > 0) {
                    Compiler.LogParseError("Unexpected { in macro declaration", lineNumber, characterNumber);
                    return null;
                }
                else {
                    if (sectionName.length > 0) {
                        sectionBody += text[i];
                    }
                    braceCount++;
                }
            }
            else if (text[i] === "}") {
                if (braceCount === 2 && text[i + 1] === "}") {
                    i++;
                    braceCount -= 2;
                }
                else if (braceCount === 1) {
                    if (sectionName.length > 0) {
                        sectionBody += text[i];
                    }
                    braceCount--;
                }
                else if (braceCount === 0) {
                    Compiler.LogParseError("Unmatched }", lineNumber, characterNumber);
                    return null;
                }
            }
            else if (text[i] === "\n" || text[i] === "\t" || text[i] === " ") {
                if (braceCount > 0) {
                    Compiler.LogParseError("Illegal whitespace in macro declaration", lineNumber, characterNumber);
                    return null;
                }
                else if (sectionName.length > 0) {
                    sectionBody += text[i];
                }
            }
            else if (braceCount === 2) {
                sectionName += text[i];
            }
            else if (sectionName.length > 0) {
                sectionBody += text[i];
            }
            if (text[i] === "\n") {
                lineNumber++;
                characterNumber = 1;
            }
            else {
                characterNumber++;
            }
        }
        if (sectionName.length > 0 && sectionBody.length > 0) {
            html += Compiler.RenderSection(sectionName, sectionBody);
        }
        return html;
    };
    Compiler.RenderSection = function (name, body) {
        var ast = markdownReader.parse(body);
        var walker = ast.walker();
        var event, node;
        while ((event = walker.next())) {
            node = event.node;
            if (node.type !== "link") {
                continue;
            }
            if (event.entering) {
                continue;
            }
            var url = node.destination;
            url = url.replace("%7B", "{").replace("%7D", "}");
            if (url[0] !== "{") {
                continue;
            }
            if (url[url.length - 1] !== "}") {
                console.log("Link destination " + url + " is missing its closing brace");
                return null;
            }
            switch (url[1]) {
                case "@":
                    {
                        var sectionName = url.substring(2, url.length - 1);
                        var onClick = "Core.GotoSection('" + sectionName + "')";
                        Compiler.RewriteLinkNode(node, onClick, Compiler.GetLinkLabel(node));
                        break;
                    }
                case "#":
                    {
                        var functionName = url.substring(2, url.length - 1);
                        var onClick = functionName + "()";
                        Compiler.RewriteLinkNode(node, onClick, Compiler.GetLinkLabel(node));
                        break;
                    }
                case "$":
                    {
                        console.log("Link destination " + url + " is a variable macro, which is not supported");
                        return null;
                    }
                default:
                    {
                        console.log("Link destination " + url + " is an unrecognized macro");
                        return null;
                    }
            }
        }
        var result = markdownWriter.render(ast);
        return "<div id=\"" + name + "\" class=\"section\" hidden=\"true\">" + result + "</div>\n";
    };
    Compiler.RewriteLinkNode = function (node, onClick, linkLabel) {
        if (node.type != "link") {
            console.log("RewriteLinkNode received a node of type " + node.type + ", which is illegal and will be skipped");
            return;
        }
        var newNode = new commonmark.Node("html_inline", node.sourcepos);
        newNode.literal = "<a href=\"#\" onclick=\"" + onClick + "\">" + linkLabel + "</a>";
        node.insertBefore(newNode);
        node.unlink();
    };
    return Compiler;
}());
if (process.argv.length < 3) {
    console.log("Missing input file argument");
    process.exit(1);
}
Compiler.Compile(process.argv[2]);
