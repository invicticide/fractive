var fs = require("fs");
var path = require("path");
var commonmark = require("commonmark/dist/commonmark.js");
var markdownReader = new commonmark.Parser({ smart: false });
var markdownWriter = new commonmark.HtmlRenderer({ softbreak: "<br/>" });
var minifier = require("html-minifier");
var Compiler = (function () {
    function Compiler() {
    }
    Compiler.ApplyTemplate = function (templateFile, html, javascript, unbundledScripts) {
        if (!fs.existsSync(templateFile)) {
            console.log("Template file not found: \"" + templateFile + "\"");
            process.exit(1);
        }
        if (!fs.lstatSync(templateFile).isFile()) {
            console.log("Template \"" + templateFile + "\" is not a file");
            process.exit(1);
        }
        var template = fs.readFileSync(templateFile, "utf8");
        var scriptSection = "";
        scriptSection += "<script>" + javascript + "</script>";
        unbundledScripts.sort();
        for (var i = 0; i < unbundledScripts.length; i++) {
            scriptSection += "<script src=\"" + unbundledScripts[i] + "\"></script>";
        }
        template = template.split("<!--{script}-->").join(scriptSection);
        template = template.split("<!--{story}-->").join(html);
        template += "<script>Core.GotoSection(\"Start\");</script>";
        return minifier.minify(template, {
            collapseWhitespace: true,
            minifyCSS: true,
            minifyJS: true,
            removeAttributeQuotes: true,
            removeComments: true,
            removeEmptyAttributes: true,
            removeEmptyElements: false,
            removeRedundantAttributes: true
        });
    };
    Compiler.Compile = function (directory, templateFile, bundleJavascript) {
        if (!fs.existsSync(directory)) {
            console.log("Directory not found: \"" + directory + "\"");
            process.exit(1);
        }
        if (!fs.lstatSync(directory).isDirectory()) {
            console.log(directory + " is not a directory");
            process.exit(1);
        }
        var targets = Compiler.GatherTargetFiles(directory);
        console.log("Processing story text...");
        var html = "";
        for (var i = 0; i < targets.markdownFiles.length; i++) {
            console.log("  " + targets.markdownFiles[i].replace(directory, ""));
            html += "<!-- " + targets.markdownFiles[i] + " -->\n" + Compiler.RenderFile(targets.markdownFiles[i]) + "\n";
        }
        console.log("Processing scripts...");
        var javascript = Compiler.ImportFile("lib/Core.js");
        var unbundledScripts = [];
        if (bundleJavascript) {
            for (var i = 0; i < targets.javascriptFiles.length; i++) {
                console.log("  " + targets.javascriptFiles[i].replace(directory, ""));
                javascript += "// " + targets.javascriptFiles[i] + "\n" + Compiler.ImportFile(targets.javascriptFiles[i]) + "\n";
            }
        }
        else {
            unbundledScripts = targets.javascriptFiles;
            for (var i = 0; i < unbundledScripts.length; i++) {
                unbundledScripts[i] = targets.javascriptFiles[i].replace(directory + "/", "");
            }
        }
        console.log("Applying " + templateFile + " template...");
        html = Compiler.ApplyTemplate(templateFile, html, javascript, unbundledScripts);
        console.log("Writing output file...");
        fs.writeFileSync(directory + "/index.html", html, "utf8");
        console.log("Build complete! Your story was published to " + directory + "/index.html!\n");
    };
    Compiler.GatherTargetFiles = function (directory) {
        console.log("Scanning " + directory);
        var markdownFiles = [];
        var javascriptFiles = [];
        var files = fs.readdirSync(directory, "utf8");
        for (var i = 0; i < files.length; i++) {
            var filePath = directory + "/" + files[i];
            var stat = fs.lstatSync(filePath);
            if (stat.isFile()) {
                switch (path.extname(files[i])) {
                    case ".md": {
                        markdownFiles.push(filePath);
                        break;
                    }
                    case ".js": {
                        javascriptFiles.push(filePath);
                        break;
                    }
                }
            }
            else if (stat.isDirectory()) {
                var childFiles = Compiler.GatherTargetFiles(filePath);
                markdownFiles = markdownFiles.concat(childFiles.markdownFiles);
                javascriptFiles = javascriptFiles.concat(childFiles.javascriptFiles);
            }
        }
        return { markdownFiles: markdownFiles, javascriptFiles: javascriptFiles };
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
            process.exit(1);
        }
        if (!fs.lstatSync(filepath).isFile()) {
            console.log("\"" + filepath + " is not a file");
            process.exit(1);
        }
        return fs.readFileSync(filepath, "utf8");
    };
    Compiler.LogParseError = function (text, lineNumber, characterNumber) {
        console.log("(" + lineNumber + "," + characterNumber + "): " + text);
    };
    Compiler.RenderFile = function (filepath) {
        if (!fs.existsSync(filepath)) {
            console.log("File not found: " + filepath);
            process.exit(1);
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
            var tokens = url.substring(1, url.length - 1).split(":");
            url = tokens[0];
            var modifier = (tokens.length > 1 ? tokens[1] : "");
            switch (modifier) {
                case "inline":
                    {
                        var onClick = "Core.ReplaceActiveElement('inline-" + Compiler.nextInlineID + "', Core.ExpandMacro('" + url + "'));";
                        Compiler.RewriteLinkNode(node, onClick, Compiler.GetLinkLabel(node), "_inline-" + Compiler.nextInlineID++);
                        break;
                    }
                default:
                    {
                        switch (url[0]) {
                            case "@":
                                {
                                    var onClick = "Core.GotoSection('" + url.substring(1) + "')";
                                    Compiler.RewriteLinkNode(node, onClick, Compiler.GetLinkLabel(node));
                                    break;
                                }
                            case "#":
                                {
                                    var onClick = url.substring(1) + "()";
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
                        break;
                    }
            }
        }
        var result = markdownWriter.render(ast);
        return "<div id=\"" + name + "\" class=\"section\" hidden=\"true\">" + result + "</div>\n";
    };
    Compiler.RewriteLinkNode = function (node, onClick, linkLabel, id) {
        if (id === void 0) { id = undefined; }
        if (node.type != "link") {
            console.log("RewriteLinkNode received a node of type " + node.type + ", which is illegal and will be skipped");
            return;
        }
        var newNode = new commonmark.Node("html_inline", node.sourcepos);
        if (id !== undefined) {
            newNode.literal = "<a href=\"#\" id=\"" + id + "\" onclick=\"" + onClick + "\">" + linkLabel + "</a>";
        }
        else {
            newNode.literal = "<a href=\"#\" onclick=\"" + onClick + "\">" + linkLabel + "</a>";
        }
        node.insertBefore(newNode);
        node.unlink();
    };
    Compiler.ShowUsage = function () {
        console.log("Usage:");
        console.log("  node lib/Compiler.js storyPath templateName bundleJavascript");
        console.log("");
        console.log("  - storyPath: The folder path where the story source files are located");
        console.log("  - templateName: The name of the HTML template to use");
        console.log("  - bundleJavascript: whether to bundle scripts in index.html");
        console.log("");
        console.log("  Templates are looked up in the 'templates' folder. The template name");
        console.log("  is just the name of the file, sans extension. So 'basic.html' has a");
        console.log("  template name of just 'basic'.");
        console.log("");
        console.log("Example:");
        console.log("  node lib/Compiler.js /Users/Desktop/MyStory templates/basic.html true");
        process.exit(0);
    };
    Compiler.nextInlineID = 0;
    return Compiler;
}());
if (process.argv.length < 5) {
    Compiler.ShowUsage();
}
Compiler.Compile(process.argv[2], process.argv[3], JSON.parse(process.argv[4]));
