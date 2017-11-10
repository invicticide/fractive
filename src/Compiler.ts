/*
Fractive: A hypertext authoring tool -- https://github.com/invicticide/fractive
Copyright (C) 2017 Josh Sutphin

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/**
 * Compiles fractive source projects into a playable distribution.
 */

import * as fs from "fs";
import * as path from "path";

// Set up the Markdown parser and renderer
import * as commonmark from "commonmark";
const markdownReader = new commonmark.Parser({smart: false});
const markdownWriter = new commonmark.HtmlRenderer({softbreak: "<br/>"});

// Minification
import * as minifier from "html-minifier";

let nextInlineID : number = 0;

export namespace Compiler
{
	/**
	 * Inserts the given story text (html) and scripts (javascript) into an html template, and
	 * returns the complete resulting html file contents
	 * @param templateFile The file path of the template file to use
	 * @param html The html-formatted story text to insert into the template
	 * @param javascript The javascript story scripts to insert into the template
	 * @return The complete resulting html file contents
	 */
	function ApplyTemplate(templateFile : string, html : string, javascript : string, unbundledScripts : Array<string>) : string
	{
		if(!fs.existsSync(templateFile))
		{
			console.log(`Template file not found: "${templateFile}"`);
			process.exit(1);
		}
		if(!fs.lstatSync(templateFile).isFile())
		{
			console.log(`Template "${templateFile}" is not a file`);
			process.exit(1);
		}

		let template : string = fs.readFileSync(templateFile, "utf8"); // Base template

		// String together all the <script> tags we need
		let scriptSection : string = "<script>";
		scriptSection += "var exports = {};";	// This object holds all the TypeScript exports which are callable by story scripts
		scriptSection += `${javascript}`;		// Insert all bundled scripts, including Core.js
		scriptSection += "</script>";

		// Sort unbundled scripts alphabetically to allow managing dependencies
		unbundledScripts.sort();
		for(let i = 0; i < unbundledScripts.length; i++)
		{ 
			scriptSection += `<script src="${path.basename(unbundledScripts[i])}"></script>`;
		}

		template = template.split("<!--{script}-->").join(scriptSection);

		template = template.split("<!--{story}-->").join(html); // Insert html-formatted story text
		template += "<script>Core.GotoSection(\"Start\");</script>"; // Auto-start at the "Start" section

		return minifier.minify(template, {
			collapseWhitespace: true,
			minifyCSS: true,
			minifyJS: true,
			removeAttributeQuotes: true,
			removeComments: true,
			removeEmptyAttributes: true,
			removeEmptyElements: false, // The history and currentSection divs are empty; don't remove them!
			removeRedundantAttributes: true
		});
	}

	/**
	 * Compile all source files in the given path into a single playable html file
	 * @param directory The path to search for source files to compile
     * @param outputDirectory The directory in which to place the output index.html
 	 * @param templateFile The file path of the template file to use
	 * @param bundleJavascript If true, embed story scripts in the output html; otherwise, deploy them separately alongside it
	 */
	export function Compile(directory : string, outputDirectory : string, templateFile : string, bundleJavascript : boolean) : void
	{
		if(!fs.existsSync(directory))
		{
			console.log(`Directory not found: "${directory}"`);
			process.exit(1);
		}
		if(!fs.lstatSync(directory).isDirectory())
		{
			console.log(`${directory} is not a directory`);
			process.exit(1);
		}

		if(!fs.existsSync(outputDirectory))
		{
			fs.mkdirSync(outputDirectory);
		}
		else
		{
			let files : Array<string> = fs.readdirSync(outputDirectory, "utf8");
			for(let i = 0; i < files.length; i++)
			{
				let unlinkPath : string = path.resolve(outputDirectory, files[i]);
				fs.unlinkSync(unlinkPath);
			}
		}

		// Find all the files that are eligible for compilation
		let targets = GatherTargetFiles(directory);

		// Compile all the Markdown files
		console.log("Processing story text...");
		let errorCount : number = 0;
		let html : string = "";
		for(let i = 0; i < targets.markdownFiles.length; i++)
		{
			console.log(`  ${targets.markdownFiles}`);
			var rendered = RenderFile(targets.markdownFiles[i]);
			if(rendered === null) { errorCount++; }
			else { html += `<!-- ${targets.markdownFiles[i]} -->\n${rendered}\n`; }
		}
		if(errorCount > 0) { process.exit(1); }

		// Import all the Javascript files
		console.log("Processing scripts...");
		let javascript = ImportFile(path.resolve(__dirname, "Core.js"));
		let unbundledScripts : Array<string> = [];
		if(bundleJavascript)
		{
			// If bundling the Javascript files, import them
			for(let i = 0; i < targets.javascriptFiles.length; i++)
			{
				console.log(`  [bundle] ${targets.javascriptFiles[i]}`);
				javascript += `// ${targets.javascriptFiles[i]}\n${ImportFile(targets.javascriptFiles[i])}\n`;
			}
		}
		else
		{
			// If NOT bundling the Javascript files, strip them of the directory, and pass their paths onward
			for(let i = 0; i < targets.javascriptFiles.length; i++)
			{
				console.log(`  [copy] ${targets.javascriptFiles[i]}`);
				unbundledScripts.push(targets.javascriptFiles[i]);
			}
		}
		
		// Wrap our compiled html with a page template
		console.log(`Applying template...\n  ${templateFile}`);
		html = ApplyTemplate(templateFile, html, javascript, unbundledScripts);

		// Write the final compiled file(s) to disk
		console.log("Writing output files...");
		{
			let indexPath : string = path.resolve(outputDirectory, "index.html");
			console.log(`  ${indexPath}`);
			fs.writeFileSync(path.resolve(outputDirectory, "index.html"), html, "utf8");
		}
		for(let i = 0; i < unbundledScripts.length; i++)
		{
			console.log(`  ${unbundledScripts[i]}`);
			fs.copyFileSync(targets.javascriptFiles[i], path.resolve(outputDirectory, path.basename(targets.javascriptFiles[i])));
		}
	}

	/**
	 * Returns a list of all target files (md/js) in the given directory and its subdirectories
	 * @param directory The directory to search
	 * @return An object { markdownFiles : Array<string>, javascriptFiles : Array<string> }
	 */
	function GatherTargetFiles(directory : string)
	{
		let markdownFiles : Array<string> = [];
		let javascriptFiles : Array<string> = [];

		let files : Array<string> = fs.readdirSync(directory, "utf8");
		for(let i = 0; i < files.length; i++)
		{
			var filePath : string = path.resolve(directory, files[i]);
			if(!fs.existsSync(filePath)) { continue; }

			var stat = fs.lstatSync(filePath);
			if(stat.isFile())
			{
				switch(path.extname(files[i]))
				{
					case ".md": { markdownFiles.push(filePath); break; }
					case ".js": { javascriptFiles.push(filePath); break; }
				}
			}
			else if(stat.isDirectory())
			{
				// Search recursively for source files
				let childFiles = GatherTargetFiles(filePath);
				markdownFiles = markdownFiles.concat(childFiles.markdownFiles);
				javascriptFiles = javascriptFiles.concat(childFiles.javascriptFiles);
			}
		}
		
		return { markdownFiles : markdownFiles, javascriptFiles : javascriptFiles };
	}

	/**
	 * Retrieves the text in between <a></a> tags for a CommonMark AST link node
	 * @param node The AST link node whose label you want to retrieve
	 * @return The link label (as rendered html), or null on error. If no error but the <a></a> tags are empty, returns an empty string instead of null.
	 */
	function GetLinkText(node) : string
	{
		if(node.type !== "link")
		{
			console.log(`GetLinkText received a node of type ${node.type}, which is illegal and will be skipped`);
			return null;
		}

		// Render the link node and then strip the <a></a> tags from it, leaving just the contents.
		// We do this to ensure that any formatting embedded inside the <a></a> tags is preserved.
		let html : string = markdownWriter.render(node);
		for(let i = 0; i < html.length; i++)
		{
			if(html[i] === ">")
			{
				html = html.substring(i + 1, html.length - 4);
				break;
			}
		}
		return html;
	}

	/**
	 * Reads and returns the raw contents of a file
	 * @param filepath The path and filename of the file to import
	 * @return The text contents of the file, or null on error
	 */
	function ImportFile(filepath : string) : string
	{
		if(!fs.existsSync(filepath))
		{
			console.log(`File not found: "${filepath}"`);
			process.exit(1);
		}
		if(!fs.lstatSync(filepath).isFile())
		{
			console.log(`"${filepath} is not a file`);
			process.exit(1);
		}
		return fs.readFileSync(filepath, "utf8");
	}

	/**
	 * Log a consistently-formatted parse error including the line/character number where the error occurred.
	 * @param text The error message to display.
	 * @param lineNumber The line where the error occurred.
	 * @param characterNumber The character within the line where the error occurred.
	 */
	function LogParseError(text : string, filePath : string, lineNumber : number, characterNumber : number)
	{
		console.error(`${filePath} (${lineNumber},${characterNumber}): ${text}`);
	}

	/**
	 * Renders the given Markdown file to HTML
	 * @param filepath The path and filename of the Markdown file to render
	 * @return The rendered HTML, or null on error
	 */
	function RenderFile(filepath : string) : string
	{
		// Read the file contents
		if(!fs.existsSync(filepath))
		{
			console.log("File not found: " + filepath);
			process.exit(1);
		}
		let text : string = fs.readFileSync(filepath, "utf8");

		// Set up parsing state
		let braceCount : number = 0;
		let sectionName : string = "";
		let sectionBody : string = "";
		let lineNumber : number = 1;
		let characterNumber : number = 1;

		// This will hold our compiled html
		let html = "";

		// Parse the file contents
		for(let i = 0; i < text.length; i++)
		{
			if(text[i] === "{")
			{
				if(braceCount === 0 && text[i + 1] === "{")
				{
					i++;
					braceCount += 2;

					// We're starting a new section, so process the one we've just finished parsing
					if(sectionName.length > 0 && sectionBody.length > 0)
					{
						html += RenderSection(sectionName, sectionBody);
					}

					// Start the new section
					sectionName = "";
					sectionBody = "";
				}
				else if(braceCount > 0)
				{
					LogParseError("Unexpected { in macro declaration", filepath, lineNumber, characterNumber);
					return null;
				}
				else
				{
					if(sectionName.length > 0) { sectionBody += text[i]; }
					braceCount++;					
				}
			}
			else if(text[i] === "}")
			{
				if(braceCount === 2 && text[i + 1] === "}")
				{
					i++;
					braceCount -= 2;
				}
				else if(braceCount === 1)
				{
					if(sectionName.length > 0) { sectionBody += text[i]; }
					braceCount--;
				}
				else if(braceCount === 0)
				{
					LogParseError("Unmatched }", filepath, lineNumber, characterNumber);
					return null;
				}
			}
			else if(text[i] === "\n" || text[i] === "\t" || text[i] === " ")
			{
				if(braceCount > 0)
				{
					LogParseError("Illegal whitespace in macro declaration", filepath, lineNumber, characterNumber);
					return null;
				}
				else if(sectionName.length > 0) { sectionBody += text[i]; }
			}
			else if(braceCount === 2) { sectionName += text[i]; }
			else if(sectionName.length > 0) { sectionBody += text[i]; }

			// Handle line breaks
			if(text[i] === "\n")
			{
				lineNumber++;
				characterNumber = 1;
			}
			else { characterNumber++; }
		}

		// Make sure we render the last section in the source text! It gets skipped because section rendering
		// is triggered by the parser finding the start of a new section.
		if(sectionName.length > 0 && sectionBody.length > 0)
		{
			html += RenderSection(sectionName, sectionBody);
		}

		return html;
	}

	/**
	 * Renders the given Markdown text section into HTML
	 * @param name The section name as defined by a {{SectionName}} macro
	 * @param body The Markdown-formatted section body
	 * @return The rendered HTML, or null on error
	 */
	function RenderSection(name : string, body : string) : string
	{
		let ast = markdownReader.parse(body); // Returns an Abstract Syntax Tree (AST)

		// Custom AST manipulation before rendering. Rewrite <a> tags to call into js onclick to transition
		// to a new passage for {@Passage} macros, or call a function for {#Function} macros.
		let walker = ast.walker();
		var event, node;
		while((event = walker.next()))
		{
			node = event.node;

			if(node.type !== "link") { continue; }
			if(event.entering) { continue; }

			let url : string = node.destination;
			url = url.replace("%7B", "{").replace("%7D", "}");
			
			if(url[0] !== "{") { continue; }

			if(url[url.length - 1] !== "}")
			{
				console.log(`Link destination ${url} is missing its closing brace`);
				return null;
			}

			// Tokenize the url, stripping the braces in the process. Result should look like
			// "{@SectionName:inline}" => [ "@SectionName", "inline" ]
			let tokens : Array<string> = url.substring(1, url.length - 1).split(":");
			url = tokens[0];
			let modifier : string = (tokens.length > 1 ? tokens[1] : "");
			switch(modifier)
			{
				case "inline":
				{
					// Prepending _ to the id makes this :inline macro disabled by default. It gets enabled when it's moved
					// into the __currentSection div.
					RewriteLinkNode(node, [{ attr: "replace-with", value: url }], GetLinkText(node), `_inline-${nextInlineID++}`);					
					break;
				}
				default:
				{
					switch(url[0])
					{
						case "@": // Section link: navigate to the section
						{
							RewriteLinkNode(node, [ { attr: "goto-section", value: url.substring(1) } ], GetLinkText(node), null);
							break;
						}
						case "#": // Function link: call the function
						{
							RewriteLinkNode(node, [{ attr: "call-function", value: url.substring(1) }], GetLinkText(node), null);
							break;
						}
						case "$": // Variable link: behavior undefined
						{
							console.log(`Link destination ${url} is a variable macro, which is not supported`);
							return null;
						}
						default: // Unknown macro
						{
							console.log(`Link destination ${url} is an unrecognized macro`);
							return null;
						}
					}
					break;
				}
			}
		}

		// Render the final section html and wrap it in a section <div>
		let result = markdownWriter.render(ast);
		return `<div id="${name}" class="section" hidden="true">${result}</div>\n`;
	}

	/**
	 * Rewrites a link node (from a CommonMark AST) applying the data attributes in dataAttrs appropriately.
	 * This function modifies the AST in-place by replacing the link node with an html_inline node that
	 * explicitly formats the rewritten <a> tag.
	 * @param node The AST link node to replace
	 * @param dataAttrs Data attributes to append, as {attr, value} where attr is the name of the data attribute sans the data- part. So {"my-attr", "somevalue"} becomes "data-my-attr='somevalue'"
	 * @param linkText The text to place inside the <a></a> tags
	 * @param id The element id to assign
	 */
	function RewriteLinkNode(node, dataAttrs : [{ attr : string, value : string }], linkText : string, id : string) : void
	{
		if(node.type != "link")
		{
			console.log(`RewriteLinkNode received a node of type ${node.type}, which is illegal and will be skipped`);
			return;
		}

		// Replace the link node with a new html_inline node to hold the rewritten <a> tag
		var newNode = new commonmark.Node("html_inline", node.sourcepos);
		let attrs : string = "";
		for(let i = 0; i < dataAttrs.length; i++)
		{
			attrs += ` data-${dataAttrs[i].attr}="${dataAttrs[i].value}"`;
		}
		if(id === null) { newNode.literal = `<a href="#"${attrs}>${linkText}</a>`; }
		else { newNode.literal = `<a href="#" id="${id}"${attrs}>${linkText}</a>`; }

		node.insertBefore(newNode);
		node.unlink();
	}

	/**
	 * Output the command-line usage and options of the compiler
	 */
	export function ShowUsage()
	{
		console.log("Usage:");
		console.log("  node lib/CLI.js compile <storyPath> <templateName> <bundleJavascript>");
		console.log("");
		console.log("  - storyPath: The folder path where the story source files are located");
		console.log("  - templateName: The name of the HTML template to use");
		console.log("  - bundleJavascript: 'true' or 'false', whether to bundle scripts in index.html");
		console.log("");
		console.log("  Templates are looked up in the 'templates' folder. The template name");
		console.log("  is just the name of the file, sans extension. So 'basic.html' has a");
		console.log("  template name of just 'basic'.");
		console.log("");
		console.log("Example:");
		console.log("  node lib/CLI.js compile /Users/Desktop/MyStory templates/basic.html true");
	}
}
