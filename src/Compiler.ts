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

const fs = require("fs");
const path = require("path");

// Set up the Markdown parser and renderer
const commonmark = require("commonmark.js");
let markdownReader = new commonmark.Parser({smart: false});
let markdownWriter = new commonmark.HtmlRenderer({softbreak: "<br/>"});

/**
 * Compiles fractive source projects into a playable distribution.
 */
class Compiler
{
	/**
	 * Compile all source files in the given path into a single playable html file
	 * @param directory The path to search for source files to compile
	 */
	static Compile(directory : string) : void
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

		// Find all the files that are eligible for compilation
		let markdownFiles : Array<string> = [];
		let javascriptFiles : Array<string> = [];
		let files : Array<string> = fs.readdirSync(directory, "utf8");
		for(let i = 0; i < files.length; i++)
		{
			if(!fs.lstatSync(`${directory}/${files[i]}`).isFile()) { continue; }
			switch(path.extname(files[i]))
			{
				case ".md": { markdownFiles.push(files[i]); break; }
				case ".js": { javascriptFiles.push(files[i]); break; }
			}
		}

		// Compile all the Markdown files
		console.log("\nProcessing story text...");
		let html : string = "";
		for(let i = 0; i < markdownFiles.length; i++)
		{
			console.log("\t" + markdownFiles[i]);
			let filepath : string = `${directory}/${markdownFiles[i]}`;
			html += `<!-- ${markdownFiles[i]} -->\n${Compiler.RenderFile(filepath)}\n`;
		}

		// Import all the Javascript files
		console.log("\nProcessing scripts...");
		let javascript = Compiler.ImportFile("lib/Core.js");
		for(let i = 0; i < javascriptFiles.length; i++)
		{
			console.log("\t" + javascriptFiles[i]);
			let filepath : string = `${directory}/${javascriptFiles[i]}`;
			javascript += `// ${javascriptFiles[i]}\n${Compiler.ImportFile(filepath)}\n`;
		}

		// Wrap our compiled html with a page template
		// TODO: Grab an external page template, possibly something provided on the command line?
		html = `<html>\n<head>\n<script>\n${javascript}\n</script>\n</head>\n<body>\n${html}\n<div id="__history"></div><hr/><div id="__currentSection"></div></body><script>Core.GotoSection("Start");</script>\n</html>\n`;

		// Write the final compiled file to disk
		console.log("\nWriting output file...");
		fs.writeFileSync(`${directory}/index.html`, html, "utf8");
		
		console.log(`\nBuild complete! Your story was published to ${directory}/index.html!\n`);
	}

	/**
	 * Retrieves the text in between <a></a> tags for a CommonMark AST link node
	 * @param node The AST link node whose label you want to retrieve
	 * @return The link label (as rendered html), or null on error. If no error but the <a></a> tags are empty, returns an empty string instead of null.
	 */
	static GetLinkLabel(node) : string
	{
		if(node.type !== "link")
		{
			console.log(`GetLinkLabel received a node of type ${node.type}, which is illegal and will be skipped`);
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
	static ImportFile(filepath : string) : string
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
	static LogParseError(text : string, lineNumber : number, characterNumber : number)
	{
		console.log(`(${lineNumber},${characterNumber}): ${text}`);
	}

	/**
	 * Renders the given Markdown file to HTML
	 * @param filepath The path and filename of the Markdown file to render
	 * @return The rendered HTML, or null on error
	 */
	static RenderFile(filepath : string) : string
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
						html += Compiler.RenderSection(sectionName, sectionBody);
					}

					// Start the new section
					sectionName = "";
					sectionBody = "";
				}
				else if(braceCount > 0)
				{
					Compiler.LogParseError("Unexpected { in macro declaration", lineNumber, characterNumber);
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
					Compiler.LogParseError("Unmatched }", lineNumber, characterNumber);
					return null;
				}
			}
			else if(text[i] === "\n" || text[i] === "\t" || text[i] === " ")
			{
				if(braceCount > 0)
				{
					Compiler.LogParseError("Illegal whitespace in macro declaration", lineNumber, characterNumber);
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
			html += Compiler.RenderSection(sectionName, sectionBody);
		}

		return html;
	}

	/**
	 * Renders the given Markdown text section into HTML
	 * @param name The section name as defined by a {{SectionName}} macro
	 * @param body The Markdown-formatted section body
	 * @return The rendered HTML, or null on error
	 */
	static RenderSection(name : string, body : string) : string
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

			switch(url[1])
			{
				case "@": // Section link: navigate to the section
				{
					let sectionName : string = url.substring(2, url.length - 1);
					let onClick = `Core.GotoSection('${sectionName}')`;
					Compiler.RewriteLinkNode(node, onClick, Compiler.GetLinkLabel(node));
					break;
				}
				case "#": // Function link: call the function
				{
					let functionName : string = url.substring(2, url.length - 1);
					let onClick = `${functionName}()`;
					Compiler.RewriteLinkNode(node, onClick, Compiler.GetLinkLabel(node));
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
		}

		// Render the final section html and wrap it in a section <div>
		let result = markdownWriter.render(ast);
		return `<div id="${name}" class="section" hidden="true">${result}</div>\n`;
	}

	/**
	 * Rewrites a link node (from a CommonMark AST) to be <a onclick="${onClick}">${linkLabel}</a>
	 * This function modifies the AST in-place by replacing the link node with an html_inline node
	 * that explicitly formats the rewritten <a> tag.
	 * @param node The AST link node to replace
	 * @param onClick The desired contents of the onclick attribute, e.g. "MyFunction(myParams)"
	 * @param linkLabel The text to place inside the <a></a> tags
	 */
	static RewriteLinkNode(node, onClick : string, linkLabel : string) : void
	{
		if(node.type != "link")
		{
			console.log(`RewriteLinkNode received a node of type ${node.type}, which is illegal and will be skipped`);
			return;
		}

		// Replace the link node with a new text node to hold the rewritten <a> tag
		var newNode = new commonmark.Node("html_inline", node.sourcepos);
		newNode.literal = `<a href="#" onclick="${onClick}">${linkLabel}</a>`;
		node.insertBefore(newNode);
		node.unlink();
	}
}

// Run the compiler automatically when invoked from the command line, e.g. "node lib/Compiler.js <filename>"
if(process.argv.length < 3)
{
	console.log("Missing input file argument");
	process.exit(1);
}
Compiler.Compile(process.argv[2]);
