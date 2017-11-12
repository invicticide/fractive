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

require("source-map-support").install();

import * as fs from "fs";
import * as path from "path";

// Set up the Markdown parser and renderer
import * as commonmark from "commonmark";
const markdownReader = new commonmark.Parser({smart: false});
const markdownWriter = new commonmark.HtmlRenderer({softbreak: "<br/>"});

// Minification
import * as minifier from "html-minifier";

export namespace Compiler
{
	let nextInlineID : number = 0;
	let sectionCount : number = 0;

	/**
	 * Inserts the given story text (html) and scripts (javascript) into an html template, and
	 * returns the complete resulting html file contents
	 * @param templateFile The file path of the template file to use
	 * @param html The html-formatted story text to insert into the template
	 * @param javascript The javascript story scripts to insert into the template
	 * @param minify True if we should minify the output
	 * @return The complete resulting html file contents
	 */
	function ApplyTemplate(templateFile : string, html : string, javascript : string, unbundledScripts : Array<string>, minify : boolean) : string
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

		if(minify)
		{
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
		else
		{
			return template;
		}
	}

	/**
	 * Compile all source files in the given path into a single playable html file
	 * @param directory The path to search for source files to compile
     * @param outputDirectory The directory in which to place the output index.html
 	 * @param templateFile The file path of the template file to use
	 * @param bundleJavascript If true, embed story scripts in the output html; otherwise, deploy them separately alongside it
	 * @param minify True if we should minify the output html
	 */
	export function Compile(directory : string, outputDirectory : string, templateFile : string, bundleJavascript : boolean, minify : boolean) : void
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
		html = ApplyTemplate(templateFile, html, javascript, unbundledScripts, minify);

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
		for(let i = 0; i < targets.miscFiles.length; i++)
		{
			console.log(`  ${targets.miscFiles[i]}`);
			fs.copyFileSync(targets.miscFiles[i], path.resolve(outputDirectory, path.basename(targets.miscFiles[i])));
		}
	}

	/**
	 * Returns a list of all target files (md/js) in the given directory and its subdirectories
	 * @param directory The directory to search
	 * @return An object { markdownFiles : Array<string>, javascriptFiles : Array<string>, miscFiles : Array<string> }
	 */
	function GatherTargetFiles(directory : string)
	{
		let markdownFiles : Array<string> = [];
		let javascriptFiles : Array<string> = [];
		let miscFiles : Array<string> = [];

		let files : Array<string> = fs.readdirSync(directory, "utf8");
		for(let i = 0; i < files.length; i++)
		{
			var filePath : string = path.resolve(directory, files[i]);
			if(!fs.existsSync(filePath)) { continue; }

			var stat = fs.lstatSync(filePath);
			if(stat.isFile())
			{
				// TODO: Apply ignore filter
				switch(path.extname(files[i]))
				{
					case ".md":	{ markdownFiles.push(filePath); break; }
					case ".js":	{ javascriptFiles.push(filePath); break; }
					default:	{ miscFiles.push(filePath); break; }
				}
			}
			else if(stat.isDirectory())
			{
				// Search recursively for source files
				let childFiles = GatherTargetFiles(filePath);
				markdownFiles = markdownFiles.concat(childFiles.markdownFiles);
				javascriptFiles = javascriptFiles.concat(childFiles.javascriptFiles);
				miscFiles = miscFiles.concat(childFiles.miscFiles);
			}
		}
		
		return { markdownFiles : markdownFiles, javascriptFiles : javascriptFiles, miscFiles : miscFiles };
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
	 * Replace a substring of a node's content with a <span> having the given data attributes.
	 * @param rootNode The root node to modify. Should contain text content.
	 * @param startIndex Start of the substring to replace.
	 * @param endIndex End (exclusive) of the substring to replace.
	 * @param dataAttrs Data attributes to set, as {attr, value} where attr is the name of the data attribute sans the data- part. So {"my-attr", "somevalue"} becomes "data-my-attr='somevalue'"
	 * @returns The new html_inline node that was inserted.
	 */
	function InsertHtmlIntoNode(rootNode, startIndex : number, endIndex : number, dataAttrs : [{ attr : string, value : string }])
	{
		let preContent : string = rootNode.literal.substring(0, startIndex);
		let postContent : string = rootNode.literal.substring(endIndex);

		rootNode.literal = preContent; // TODO: update sourcepos end

		var htmlNode = new commonmark.Node("html_inline", rootNode.sourcepos); // TODO: real sourcepos
		let attrs : string = "";
		for(let i = 0; i < dataAttrs.length; i++)
		{
			attrs += ` data-${dataAttrs[i].attr}="${dataAttrs[i].value}"`;
		}
		switch(rootNode.type)
		{
			case "code":
			{
				htmlNode.literal = `<code><span${attrs}></span></code>`;
				break;
			}

			case "code_block":
			{
				htmlNode.literal = `<pre><code><span${attrs}></span></code></pre>`;
				break;
			}

			default:
			{
				htmlNode.literal = `<span${attrs}></span>`;
				break;
			}
		}
		rootNode.insertAfter(htmlNode);
		
		// Clean up empty pre node now that we've attached the insert to the tree
		if(rootNode.literal === "") { rootNode.unlink(); }

		if(postContent && postContent.length > 0)
		{
			var postNode = new commonmark.Node(rootNode.type, rootNode.sourcepos); // TODO: real sourcepos
			postNode.literal = postContent;
			htmlNode.insertAfter(postNode);
		}

		return htmlNode;
	}

	/**
	 * Dumps the given AST to the console in a tree-like format.
	 * This doesn't render the AST; it's just a debug visualization of its current structure.
	 * @param ast The AST to display
	 */
	function LogAST(ast)
	{
		let indent : number = 0;
		let getIndent = function(indent)
		{
			let result : string = '';
			for(let i = 0; i < indent; i++) { result += '  '; }
			return result;
		};
		let walker = ast.walker();
		var event;
		while((event = walker.next()))
		{
			if(event.node.isContainer && !event.entering) { indent--; }
			if(!event.node.isContainer || event.entering)
			{
				console.log(`${getIndent(indent)}${event.node.type}: ${event.node.literal ? event.node.literal.split('\n').join('\\n') : ''}`);
			}
			if(event.node.isContainer && event.entering) { indent++; }
		}
	}

	/**
	 * Log a consistently-formatted parse error including the line/character number where the error occurred.
	 * @param text The error message to display.
	 * @param lineNumber The line where the error occurred.
	 * @param characterNumber The character within the line where the error occurred.
	 */
	function LogParseError(text : string, filePath : string, node, lineOffset? : number, columnOffset? : number)
	{
		if(node && node.sourcepos)
		{
			let line : number = node.sourcepos[0][0] + (lineOffset !== undefined ? lineOffset : 0);
			let column : number = node.sourcepos[0][1] + (columnOffset !== undefined ? columnOffset : 0);
			console.error(`${filePath} (${line},${column}): ${text}`);
		}
		else
		{
			console.error(`${filePath}: ${text}`);
		}
	}

	/**
	 * Renders the given Markdown file to HTML
	 * @param filepath The path and filename of the Markdown file to render
	 * @return The rendered HTML, or null on error
	 */
	function RenderFile(filepath : string) : string
	{
		if(!fs.existsSync(filepath))
		{
			console.log("File not found: " + filepath);
			process.exit(1);
		}
		let ast = markdownReader.parse(fs.readFileSync(filepath, "utf8")); // Returns an Abstract Syntax Tree (AST)

		// TODO: Build config option for displaying AST debug
		// console.log("\nRAW AST\n");
		// LogAST(ast);

		// Consolidate contiguous `text` nodes in the AST. I'm not sure why these get arbitrarily split up -- it does
		// seem to be triggered by punctuation -- but it's a huge pita to process macros that way.
		let walker = ast.walker();
		var event, node, prevNode;
		while((event = walker.next()))
		{
			node = event.node;
			if(node.type === "text" && prevNode && prevNode.type === "text")
			{
				if(node.literal) { prevNode.literal += node.literal; }
				node.unlink();
			}
			else
			{
				prevNode = node;
			}
		}

		// TODO: Build config option for displaying AST debug
		// console.log("\nCONSOLIDATED AST\n");
		// LogAST(ast);
		
		// Custom AST manipulation before rendering. When we're done, there should be no functional {macros} left in
		// the tree; they should all be rewritten to html tags with data-attributes describing their function.
		sectionCount = 0;
		walker = ast.walker();
		while((event = walker.next()))
		{
			node = event.node;
			switch(node.type)
			{
				case "link":
				{
					if(!RenderLink(walker, event, filepath)) { return null; }
					break;
				}
				case "text":
				case "code":
				case "code_block":
				{
					if(!RenderText(walker, event, filepath)) { return null; }
					break;
				}
				case "image":
				{
					if(!RenderImage(walker, event, filepath)) { return null; }
					break;
				}
			}
		}

		// Close the final section div
		walker = ast.walker();
		let firstEvent = walker.next();
		let closingNode = new commonmark.Node("html_inline");
		closingNode.literal = "</div>";
		firstEvent.node.appendChild(closingNode);

		// TODO: Build config option for displaying AST debug
		// console.log("\nFINAL AST\n");
		// LogAST(ast);

		// Render the final section html and wrap it in a section <div>
		return markdownWriter.render(ast);
	}

	/**
	 * Rewrite an image node with a macro "src" attribute
	 * @param walker The current AST iterator state
	 * @param event The AST event to process (this should be a link node)
	 * @param filepath The path of the file we're currently processing (for error reporting)
	 * @returns True on success, false on error
	 */
	function RenderImage(walker, event, filepath : string) : boolean
	{
		if(!walker || !event)
		{
			console.error("RenderImage received an invalid state");
			return false;
		}
		if(event.node.type !== "image")
		{
			console.error(`RenderImage was passed a ${event.node.type} node, which is illegal`);
			return false;
		}

		let node = event.node;

		let alt : string = "";
		if(node.firstChild && node.firstChild.type == "text")
		{
			alt = node.firstChild.literal;
			node.firstChild.unlink();
		}

		let url : string = node.destination;
		url = url.replace("%7B", "{").replace("%7D", "}");
		if(url[0] !== "{")
		{
			// Even though this isn't a macro url, we still need to rewrite the image tag to echo the alt text into
			// the title attribute, so it appears on mouseover.
			let newNode = new commonmark.Node("html_inline");
			newNode.literal = `<img src="${url}" alt="${alt}" title="${alt}">`;
			node.insertBefore(newNode);
			node.unlink();
			walker.resumeAt(newNode);
		}
		else
		{
			if(url[url.length - 1] !== "}")
			{
				LogParseError(`Unterminated macro ${url} in image URL`, filepath, node);
				return false;
			}
			switch(url[1])
			{
				case "@":
				{
					LogParseError(`Invalid macro ${url} in image URL (section macros cannot be used as image sources)`, filepath, node);
					return false;
				}
				case "#":
				case "$":
				{
					let newNode = new commonmark.Node("html_inline");
					newNode.literal = `<img data-image-source-macro="${url.substring(1, url.length - 1)}" src="#" alt="${alt}" title="${alt}">`;
					node.insertBefore(newNode);
					node.unlink();
					walker.resumeAt(newNode);
					break;
				}
				default:
				{
					LogParseError(`Unknown macro ${url} in image URL`, filepath, node);
					return false;
				}
			}
		}

		return true;
	}

	/**
	 * Rewrite a link node with data-attributes that indicate the link type and macro destination
	 * @param walker The current AST iterator state
	 * @param event The AST event to process (this should be a link node)
	 * @param filepath The path of the file we're currently processing (for error reporting)
	 * @returns True on success, false on error
	 */
	function RenderLink(walker, event, filepath : string) : boolean
	{
		if(!walker || !event)
		{
			console.error("RenderLink received an invalid state");
			return false;
		}
		if(event.node.type !== "link")
		{
			console.error(`RenderLink received a ${event.node.type} node, which is illegal`);
			return false;
		}
		
		// Links are containers; we can't rewrite them until we're finished rendering the whole
		// container, because we need to preserve their children.
		if(event.entering) { return true; }
		
		let url : string = event.node.destination;
		url = url.replace("%7B", "{").replace("%7D", "}");
		
		// This link doesn't have a macro as its destination, so we don't need to rewrite it
		if(url[0] !== "{") { return true; }

		if(url[url.length - 1] !== "}")
		{
			LogParseError("Unterminated macro in link destination", filepath, event.node);
			return false;
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
				if(!RewriteLinkNode(event.node, [{ attr: "replace-with", value: url }], GetLinkText(event.node), `_inline-${nextInlineID++}`)) { return false; }
				break;
			}
			default:
			{
				switch(url[0])
				{
					case "@": // Section link: navigate to the section
					{
						if(!RewriteLinkNode(event.node, [ { attr: "goto-section", value: url.substring(1) } ], GetLinkText(event.node), null)) { return false; }
						break;
					}
					case "#": // Function link: call the function
					{
						if(!RewriteLinkNode(event.node, [{ attr: "call-function", value: url.substring(1) }], GetLinkText(event.node), null)) { return false; }
						break;
					}
					case "$": // Variable link: behavior undefined
					{
						LogParseError("Variable macros can't be used as link destinations", filepath, event.node);
						return false;
					}
					default: // Unknown macro
					{
						LogParseError("Unrecognized macro in link destination", filepath, event.node);
						return false;
					}
				}
				break;
			}
		}

		return true;
	}

	/**
	 * Replace macros in text with <span> with a data-attribute indicating the macro type and target
	 * @param walker The current AST iterator state
	 * @param event The AST event to process
	 * @param filepath The path of the file we're currently processing (for error reporting)
	 * @returns True on success, false on error
	 */
	function RenderText(walker, event, filepath : string) : boolean
	{
		if(!walker || !event)
		{
			console.error("RenderText received an invalid state");
			return false;
		}

		let node = event.node;
		let lineOffset : number = 0;
		let columnOffset : number = 0;
		for(let i = 0; i < node.literal.length; i++)
		{
			if(node.literal[i] === '\\')
			{
				i++; // Skip over the next character
			}
			else if(node.literal[i] === '{')
			{
				let macro : string = null;
				let braceCount : number = 1;
				for(let j = i + 1; j < node.literal.length; j++)
				{
					if(node.literal[j] === '{')
					{
						braceCount++;
					}
					else if(node.literal[j] === '}')
					{
						if(--braceCount == 0)
						{
							macro = node.literal.substring(i, j + 1);
							break;
						}
					}
				}
				if(macro === null)
				{
					LogParseError(`Unterminated macro near "${node.literal.substring(i, i + 10)}" in text`, filepath, node, lineOffset, columnOffset);
					return false;
				}
				var insertedNode;
				switch(macro[1])
				{
					case "{":
					{
						// Begin a new section
						if(node.parent)
						{
							var insertedNode = new commonmark.Node("html_inline", node.sourcepos); // TODO: Real sourcepos
							insertedNode.literal = `${sectionCount > 0 ? "</div>\n" : ""}<div id="${macro.substring(2, macro.length - 2)}" class="section" hidden="true">`;
							if(node.prev)
							{
								LogParseError(`Section macro "${macro}" must be defined in its own paragraph/on its own line`, filepath, node, lineOffset, columnOffset);
								return false;
							}
							else if(node.parent.type === "paragraph")
							{
								// This is the most common case for correctly-formatted section declarations
								node.parent.insertAfter(insertedNode);
								node.parent.unlink();
							}
							else
							{
								LogParseError(`Section macro "${macro}" cannot be defined inside another block element`, filepath, node, lineOffset, columnOffset);
								return false;
							}
							sectionCount++;
						}
						else
						{
							LogParseError(`Node for "${macro}" has no parent`, filepath, node, lineOffset, columnOffset);
							return false;
						}
						break;
					}
					case "@":
					case "#":
					case "$":
					{
						insertedNode = InsertHtmlIntoNode(node, i, i + macro.length, [{ attr: "expand-macro", value: macro.substring(1, macro.length - 1) }]);
						break;
					}
					default:
					{
						LogParseError(`Unrecognized macro "${macro}" in text`, filepath, node.parent, lineOffset, columnOffset);
						return false;
					}
				}
				walker.resumeAt(insertedNode);
				break;
			}
			else if(node.literal[i] === '\n')
			{
				lineOffset++;
				columnOffset = -1;
			}
			
			columnOffset++;
		}
		
		// We skipped over escape sequences while parsing, but now we need to strip the backslashes entirely
		// so they don't get rendered out to the html as `\\`
		node.literal = node.literal.split('\\').join('');

		return true;
	}

	/**
	 * Rewrites a link node (from a CommonMark AST) applying the data attributes in dataAttrs appropriately.
	 * This function modifies the AST in-place by replacing the link node with an html_inline node that
	 * explicitly formats the rewritten <a> tag.
	 * @param node The AST link node to replace
	 * @param dataAttrs Data attributes to append, as {attr, value} where attr is the name of the data attribute sans the data- part. So {"my-attr", "somevalue"} becomes "data-my-attr='somevalue'"
	 * @param linkText The text to place inside the <a></a> tags
	 * @param id The element id to assign
	 * @returns True on success, false on error
	 */
	function RewriteLinkNode(node, dataAttrs : [{ attr : string, value : string }], linkText : string, id : string) : boolean
	{
		if(node.type != "link")
		{
			console.log(`RewriteLinkNode received a node of type ${node.type}, which is illegal and will be skipped`);
			return false;
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

		return true;
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
