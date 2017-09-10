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
	 * Compile a given .md file to a playable .html story.
	 * @param filepath The path/filename of the .md to compile.
	 */
	static Compile(filepath : string) : void
	{
		// Read the file contents
		if(!fs.existsSync(filepath))
		{
			console.log("File not found: " + filepath);
			return;
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
			if(text[i] == "{")
			{
				if(braceCount == 0 && text[i + 1] == "{")
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
					break;
				}
				else
				{
					if(sectionName.length > 0) { sectionBody += text[i]; }
					braceCount++;					
				}
			}
			else if(text[i] == "}")
			{
				if(braceCount == 2 && text[i + 1] == "}")
				{
					i++;
					braceCount -= 2;
				}
				else if(braceCount == 1)
				{
					if(sectionName.length > 0) { sectionBody += text[i]; }
					braceCount--;
				}
				else if(braceCount == 0)
				{
					Compiler.LogParseError("Unmatched }", lineNumber, characterNumber);
					break;
				}
			}
			else if(text[i] == "\n" || text[i] == "\t" || text[i] == " ")
			{
				if(braceCount > 0)
				{
					Compiler.LogParseError("Illegal whitespace in macro declaration", lineNumber, characterNumber);
					break;
				}
				else if(sectionName.length > 0) { sectionBody += text[i]; }
			}
			else if(braceCount == 2) { sectionName += text[i]; }
			else if(sectionName.length > 0) { sectionBody += text[i]; }

			// Handle line breaks
			if(text[i] == "\n")
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
		
		// Wrap our compiled html with a page template
		// TODO: Grab an external page template, possibly something provided on the command line?
		html = `<html><body>\n${html}</body></html>\n`;

		// Write the final compiled file to disk
		let folder = path.dirname(filepath);
		fs.writeFileSync(`${folder}/index.html`, html, "utf8");
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
	 * Renders the given Markdown text into HTML
	 * @param name The section name as defined by a {{SectionName}} macro
	 * @param body The Markdown-formatted section body
	 * @return The rendered HTML
	 */
	static RenderSection(name : string, body : string) : string
	{
		let ast = markdownReader.parse(body); // Returns an Abstract Syntax Tree (AST)

		// TODO: Custom AST manipulation before rendering. Rewrite <a> tags to call into js onclick to
		// transition to a new passage for {@Passage} macros, or call a function for {#Function} macros.

		let result = markdownWriter.render(ast);
		return `<div id="${name}" class="passage">${result}</div>\n`;
	}
}

// Run the compiler automatically when invoked from the command line, e.g. "node lib/Compiler.js <filename>"
if(process.argv.length < 3)
{
	console.log("Missing input file argument");
	process.exit(1);
}
Compiler.Compile(process.argv[2]);
