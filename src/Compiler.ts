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

// File system stuff
import * as fs from "fs";
import * as path from "path";
import * as util from "util";

// Set up the Markdown parser and renderer
import * as commonmark from "commonmark";
const markdownReader = new commonmark.Parser({smart: false});
const markdownWriter = new commonmark.HtmlRenderer({softbreak: "<br/>"});

// Beautification
import * as beautifier from "js-beautify";
// Minification
import * as minifier from "html-minifier";

// Project file validation and overlay support
import * as ajv from "ajv";
import * as overrideJSON from "json-override";
import { FractiveProject } from "./ProjectSchema";
export let ProjectDefaults : FractiveProject = {
	title: "Untitled",
	author: "Anonymous",
	description: "An interactive story written in Fractive",
	website: "fractive.io",
	markdown: [ "source/**/*.md" ],
	javascript: [ "source/**/*.js" ],
	assets: [ "assets/**" ],
	ignore: [],
	aliases: [],
	template: "template.html",
	output: "build",
	outputFormat: "prettify",
	linkTooltips: false,
	externalLinkHTML: "",
	backButtonHTML: ""
};
import * as globby from "globby";

// CLI colors
import * as clc from "cli-color";

export interface CompilerOptions
{
	/**
	 * If true, log what would've been done but don't actually modify any files on disk
	 */
	dryRun? : boolean;
	/**
	 * If true, log extra execution details
	 */
	verbose? : boolean;
	/**
	 * If true, log additional debug info during build
	 */
	debug? : boolean;
}

export namespace Compiler
{
	let project : FractiveProject = null;
	let nextInlineID : number = 0;
	let sectionCount : number = 0;

	/**
	 * Inserts the given story text (html) and scripts (javascript) into an html template, and returns the complete resulting html file contents
	 * @param html The html-formatted story text to insert into the template
	 * @param javascript The javascript story scripts to insert into the template
	 * @return The complete resulting html file contents
	 */
	function ApplyTemplate(basePath : string, html : string, javascript : string) : string
	{
		let templatePath : string = path.resolve(basePath, project.template);
		if(!fs.existsSync(templatePath))
		{
			console.log(`Template file not found: "${templatePath}"`);
			process.exit(1);
		}
		if(!fs.lstatSync(templatePath).isFile())
		{
			console.log(`Template "${templatePath}" is not a file`);
			process.exit(1);
		}

		// Base template
		let template : string = fs.readFileSync(templatePath, "utf8");

		// Imported scripts
		let scriptSection : string = "<script>";
		scriptSection += "var exports = {};";	// This object holds all the TypeScript exports which are callable by story scripts

    // Prettify the JavaScript if configured to do so
		if (project.outputFormat === 'prettify') {
			javascript = beautifier.js_beautify(javascript);
		}

		scriptSection += `${javascript}`;		// Insert all bundled scripts, including Core.js
		scriptSection += "</script>";
		template = template.split("<!--{script}-->").join(scriptSection);

		// Story text
		template = template.split("<!--{story}-->").join(html); // Insert html-formatted story text
		template += "<script>Core.GotoSection(\"Start\");</script>"; // Auto-start at the "Start" section

		if(project.outputFormat === 'minify')
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
    else if (project.outputFormat === 'prettify') {
			return beautifier.html(template);
    }
		else
		{
			return template;
		}
	}

	/**
	 * Deletes the given directory and all files and subdirectories within it
	 * @param targetPath The directory to delete
	 * @param options Compiler options blob
	 */
	function CleanDirectoryRecursive(targetPath: string, options : CompilerOptions)
	{
		if(fs.lstatSync(targetPath).isDirectory())
		{
			let files : Array<string> = fs.readdirSync(targetPath, "utf8");
			for(let i = 0; i < files.length; i++)
			{
				CleanDirectoryRecursive(path.resolve(targetPath, files[i]), options);
			}
			if(!options.dryRun) { fs.rmdirSync(targetPath); }
		}
		else
		{
			if(!options.dryRun) { fs.unlinkSync(targetPath); }
		}
	}

	/**
	 * Compile all source files described by the given project file into a single playable html file
	 * @param buildPath Path to the fractive.json to build from
	 * @param options Compiler options blob
	 */
	export function Compile(buildPath : string, options : CompilerOptions) : void
	{
		let basePath = path.dirname(buildPath);

		// Load the target project file and overlay it onto the ProjectDefaults. This allows user-made project
		// files to only specify those properties which they want to override.
		let targetProject : FractiveProject = JSON.parse(fs.readFileSync(buildPath, "utf8"));
		let validator = new ajv();
		let valid = validator.validate(JSON.parse(fs.readFileSync("src/ProjectSchema.json", "utf8")), targetProject);
		if(!valid)
		{
			LogError(`  ${buildPath}: Failed validating JSON`);
			for(let i = 0; i < validator.errors.length; i++)
			{
				LogError(`  ${validator.errors[i].dataPath} ${validator.errors[i].message} ${util.inspect(validator.errors[i].params)}`);
			}
			process.exit(1);
		}
		project = overrideJSON(ProjectDefaults, targetProject, true); // createNew

		// Validate inputs and outputs
		if(project.markdown.length < 1)
		{
			LogError("No Markdown input patterns were given (check the 'markdown' property in your fractive.json)");
			process.exit(1);
		}
		if(project.output.length < 1)
		{
			LogError("No output directory was given (check the 'output' property in your fractive.json)");
			process.exit(1);
		}
		if(options.dryRun) { console.log(clc.red("\n(This is a dry run. No output files will be written.)\n")); }

		// Create or clean output directory
		let cleanDir = path.resolve(basePath, project.output);
		if(!fs.existsSync(cleanDir)) { fs.mkdirSync(cleanDir); }
		else { CleanDirectoryRecursive(cleanDir, options); }

		// Gather all our target files to build
		let globOptions = {
			cwd: basePath,
			expandDirectories: true,
			ignore: project.ignore.concat(`${project.output}/**`),
			matchBase: true,
			nodir: true,
			nomount: true
		};
		let targets = {
			markdownFiles: globby.sync(project.markdown, globOptions),
			javascriptFiles: globby.sync(project.javascript, globOptions),
			assetFiles: globby.sync(project.assets, globOptions)
		};

		// Compile all the Markdown files
		let errorCount : number = 0;
		let html : string = "";
		for(let i = 0; i < targets.markdownFiles.length; i++)
		{
			if(options.verbose || options.dryRun) { LogAction(targets.markdownFiles[i], "render"); }
			var rendered = RenderFile(path.resolve(basePath, targets.markdownFiles[i]), options);
			if(rendered === null) { errorCount++; }
			else { html += `<!-- ${targets.markdownFiles[i]} -->\n${rendered}\n`; }
		}
		if(errorCount > 0) { process.exit(1); }

		// Import all the Javascript files
		let javascript = ImportFile(path.resolve(__dirname, "Core.js"));
		for(let i = 0; i < targets.javascriptFiles.length; i++)
		{
			if(options.verbose || options.dryRun) { LogAction(targets.javascriptFiles[i], "import"); }
			javascript += `// ${targets.javascriptFiles[i]}\n${ImportFile(path.resolve(basePath, targets.javascriptFiles[i]))}\n`;
		}

		// Wrap our compiled html with a page template
		html = ApplyTemplate(basePath, html, javascript);

		// Create output directory
		let outputDir = path.resolve(basePath, project.output);
		if(!fs.existsSync(outputDir)) { fs.mkdirSync(outputDir); }

		// Copy all our assets
		for(let i = 0; i < targets.assetFiles.length; i++)
		{
			if(options.verbose || options.dryRun) { LogAction(targets.assetFiles[i], "copy"); }
			if(!options.dryRun)
			{
				let sourcePath = path.resolve(basePath, targets.assetFiles[i]);
				let destPath = path.resolve(outputDir, targets.assetFiles[i]);
				let destDir = path.dirname(destPath);
				if(!fs.existsSync(destDir)) { fs.mkdirSync(destDir); }
				fs.copyFileSync(sourcePath, destPath);
			}
		}

		// Write the final index.html. We report this after copying assets, even though we actually prepared it before,
		// because it feels more natural to have the last reported output file be the file that actually runs our game.
		let indexPath : string = path.resolve(outputDir, "index.html");
		if(options.verbose || options.dryRun) { LogAction(indexPath.split(path.resolve(basePath)).join(""), "output"); }
		if(!options.dryRun) { fs.writeFileSync(indexPath, html, "utf8"); }
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
	// @ts-ignore unused function warning
	function LogAST(ast)
	{
		if(ast === null) { return; }

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
				console.log(clc.blue(`${getIndent(indent)}${event.node.type}: ${event.node.literal ? event.node.literal.split('\n').join('\\n') : ''}`));
			}
			if(event.node.isContainer && event.entering) { indent++; }
		}
	}

	/**
	 * Logs a consistently formatted file action to stdout
	 * @param filePath The path of the file an action was performed on
	 * @param action The action that was performed
	 */
	function LogAction(filePath : string, action: string)
	{
		console.log(`  ${clc.green(action)} ${filePath}`);
	}

	/**
	 * Logs a consistently formatted error message to stderr
	 * @param text The text to display
	 */
	function LogError(text : string)
	{
		console.error(clc.red(text));
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
			LogError(`${filePath} (${line},${column}): ${text}`);
		}
		else
		{
			LogError(`${filePath}: ${text}`);
		}
	}

	/**
	 * Renders the given Markdown file to HTML
	 * @param filepath The path and filename of the Markdown file to render
	 * @param options Compiler options blob
	 * @return The rendered HTML, or null on error
	 */
	function RenderFile(filepath : string, options : CompilerOptions) : string
	{
		if(!fs.existsSync(filepath))
		{
			console.log("File not found: " + filepath);
			process.exit(1);
		}

		// Read the Markdown source and apply alias replacements
		let markdown = ReplaceAliases(fs.readFileSync(filepath, "utf8"));

		// Parse the Markdown source into an Abstract Syntax Tree
		let ast = markdownReader.parse(markdown);
		if(options.debug)
		{
			console.log("\nRAW AST\n");
			LogAST(ast);
		}

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

		if(options.debug)
		{
			console.log("\nCONSOLIDATED AST\n");
			LogAST(ast);
		}

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
				case "html_inline":
				case "html_block":
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

		if(options.debug)
		{
			console.log("\nFINAL AST\n");
			LogAST(ast);
		}

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
			LogError("RenderImage received an invalid state");
			return false;
		}
		if(event.node.type !== "image")
		{
			LogError(`RenderImage was passed a ${event.node.type} node, which is illegal`);
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
	* Check if a URL is considered external and its link should be marked
	* with the external link mark defined in fractive.json
	* @param url
	*/
	function IsExternalLink(url: string)
	{
		// TODO I imagine if the user wants to link to pages on their own site,
		// the external link icon will be unwanted. To account for this in the
		// future, we could define a glob expression for urls that are internal
		// to the game, and filter those out. For now, everything is considered
		// external.
		return (url.length > 0) ? true : false;
		// Can't just return true without compile error for unused parameter url
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
			LogError("RenderLink received an invalid state");
			return false;
		}
		if(event.node.type !== "link")
		{
			LogError(`RenderLink received a ${event.node.type} node, which is illegal`);
			return false;
		}

		// Links are containers; we can't rewrite them until we're finished rendering the whole
		// container, because we need to preserve their children.
		if(event.entering) { return true; }

		let url : string = event.node.destination;
		url = url.replace("%7B", "{").replace("%7D", "}");

		// This link doesn't have a macro as its destination,
		// but it may still be an external link.
		if(url[0] !== "{") {
			if (IsExternalLink(url)) {
				return RewriteExternalLinkNode(event.node);
			}
			else {
				return true;
			}
		}

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
				if(!RewriteLinkNode(event.node, [{ attr: "data-replace-with", value: url }], GetLinkText(event.node), false, `_inline-${nextInlineID++}`)) { return false; }
				break;
			}
			default:
			{
				switch(url[0])
				{
					case "@": // Section link: navigate to the section
					{
						if(!RewriteLinkNode(event.node, [ { attr: "data-goto-section", value: url.substring(1) } ], GetLinkText(event.node), false, null)) { return false; }
						break;
					}
					case "#": // Function link: call the function
					{
						if(!RewriteLinkNode(event.node, [{ attr: "data-call-function", value: url.substring(1) }], GetLinkText(event.node), false, null)) { return false; }
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
			LogError("RenderText received an invalid state");
			return false;
		}

		let node = event.node;
		let lineOffset : number = 0;
		let columnOffset : number = 0;
		for(let i = 0; i < node.literal.length; i++)
		{
			if(node.literal[i] === '\\')
			{
				i = SkipEscapedSubstring(node.literal, i);
				continue;
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
	 * Replaces aliases in the given Markdown source according to the "aliases" entry in the project config, and returns the new Markdown source.
	 * @param source The Markdown source text to parse
	 * @returns New Markdown source text with all aliases replaced
	 */
	function ReplaceAliases(source : string) : string
	{
		// Don't parse anything if there aren't any aliases defined
		if(project.aliases.length < 1) { return source; }

		let markdown : string = source;
		for(let i = 0; i < markdown.length; i++)
		{
			if(markdown[i] === '\\')
			{
				i = SkipEscapedSubstring(markdown, i);
				continue;
			}
			else if(markdown[i] === '{')
			{
				let bIsEnd : boolean = (markdown[i + 1] === '/');
				for(let j = i + 1; j < markdown.length; j++)
				{
					if(markdown[j] === '{')
					{
						// If there's another opening brace inside the macro, then this isn't an alias, so just ignore it
						i = j;
						break;
					}
					else if(markdown[j] === '}')
					{
						// This is the end of the macro; see if it's an alias, or something else
						let macro : string = markdown.substring(i, j + 1);
						let macroName : string = macro.substring(bIsEnd ? 2 : 1, macro.length - 1);
						let replacement: string = null;
						for(let k = 0; k < project.aliases.length; k++)
						{
							if(macroName === project.aliases[k].alias)
							{
								replacement = (bIsEnd ? project.aliases[k].end : project.aliases[k].replaceWith);
								break;
							}
						}
						if(replacement)
						{
							// Replace all occurrences of this macro and jump the scan index to the end of this instance
							markdown = markdown.split(macro).join(replacement);
							i += replacement.length - 1;
						}
						break;
					}
				}
			}
		}
		return markdown;
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
	function RewriteLinkNode(node, dataAttrs : [{ attr : string, value : string }], linkText : string, hasExternalUrl : boolean, id : string) : boolean
	{
		if(node.type != "link")
		{
			console.log(`RewriteLinkNode received a node of type ${node.type}, which is illegal and will be skipped`);
			return false;
		}

		// Replace the link node with a new html_inline node to hold the rewritten <a> tag
		let newNode = new commonmark.Node("html_inline", node.sourcepos);
		let title = `title="${(project.linkTooltips ? node.destination.replace("%7B", "{").replace("%7D", "}") : "")}"`;
		let attrs : string = "";

		for(let i = 0; i < dataAttrs.length; i++)
		{
			attrs += ` ${dataAttrs[i].attr}="${dataAttrs[i].value}"`;
		}

		newNode.literal = '<a ';
		// Macro links override href
		if (!hasExternalUrl) {
			newNode.literal += 'href="#" ';
		}
		newNode.literal += `${title}${attrs}`;
		// If an ID is provided, add it
		if(id !== null) {
			newNode.literal += `id="${id}"`;
		}

		// All links have link text
		newNode.literal += `>${linkText}</a>`;

		// Remove the accidental newlines
		newNode.literal = newNode.literal.split('\n').join('');
		// console.log(newNode.literal);

		node.insertBefore(newNode);
		node.unlink();

		return true;
	}

	/**
	* Rewrites an external link node so it opens in a new tab and
	* its text is followed by the external link marker defined in externalLinkHTML.
	*/
	function RewriteExternalLinkNode(node)
	{
		let linkText : string = GetLinkText(node);
		linkText += project.externalLinkHTML; // TODO get this from fractive.json

		return RewriteLinkNode(node, [
			{ "attr": "target", "value": "_blank"}, // Open links in a new window
			{ "attr": "href", "value": node.destination }
		], linkText, true, null);
	}

	/**
	 * Output the command-line usage and options of the compiler
	 */
	export function ShowUsage()
	{
		console.log(``);
		console.log(`Usage:`);
		console.log(`${clc.green("node lib/CLI.js compile")} ${clc.blue("<storyDirectory|configFilePath>")} ${clc.yellow("[options]")}`);
		console.log(``);
		console.log(`${clc.blue("storyDirectory:")} The folder path where the story source files are located. Looks for fractive.json in the root.`);
		console.log(`${clc.blue("configFilePath:")} If you want to build with a different config, specify the config.json path directly.`);
		console.log(``);
		console.log(`${clc.yellow("--dry-run:")} Log what would've been done, but don't actually touch any files.`);
		console.log(`${clc.yellow("--verbose:")} Log more detailed build information`);
		console.log(`${clc.yellow("--debug:")} Log debugging information during the build`);
		console.log(``);
		console.log(`${clc.green("node lib/CLI.js compile /Users/Desktop/MyStory")} ${clc.yellow("--verbose")}`);
		console.log(``);
	}

	/**
	 * Helper function for character-wise string scanning. Given a string and the index of a \ character, skips to the
	 * end of the escape sequence and returns the index of the last character of the escape sequence. Most useful for
	 * skipping past escaped Fractive macros, but can also skip regular escape sequences as well.
	 * @param s The string to scan
	 * @param startIndex The index of the \ character which begins the escape sequence to be skipped
	 * @returns The index of the last character of the escape sequence, or -1 on error (e.g. an unterminated Fractive macro). If the starting character isn't a \ then this just returns startIndex.
	 */
	function SkipEscapedSubstring(s : string, startIndex : number)
	{
		// This isn't an escape at all
		if(s[startIndex] !== '\\') { return startIndex; }

		// This is a regular escape sequence, so just skip the escaped character
		if(s[startIndex + 1] !== '{') { return startIndex + 1; }

		// This is an escaped macro, so skip to the end of the macro
		let braceCount : number = 0;
		for(let i = startIndex + 1; i < s.length; i++)
		{
			if(s[i] === '{') { ++braceCount; }
			else if(s[i] === '}' && --braceCount === 0) { return i; }
		}

		return -1;
	}
}
