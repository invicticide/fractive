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
 * Core functionality including section navigation and macro expansion.
 */
class Core
{
	/**
	 * Expand a macro (e.g. "{@someSection}", "{#someFunction}", "{$someVariable}") into human-readable text.
	 * {@section} macros expand the entire referenced section, including its own macros.
	 * {#function} macros execute the function and replace the macro with the return value.
	 * {$variable} macros replace the macro with the value of the variable.
	 * @param macro The macro string, omitting the enclosing {}. Should start with a metacharacter (e.g. '$' for variables).
	 * @return The resulting human-readable text.
	 */
	static ExpandMacro(macro : string) : string
	{
		switch(macro[0])
		{
			case '@':
			{
				// Return the contents of the named section, with its macros expanded
				return Core.ExpandSection(macro.substring(1));
			}
			case '#':
			{
				// Return the result of the named function call
				let functionName = macro.substring(1);
				let fn = window[functionName];
				if(typeof fn === "function") { return fn(); }
				else { console.log(functionName + " is not a function"); break; }
			}
			case '$':
			{
				// Return the value of the named variable
				return window[macro.substring(1)];
			}
		}
		
		console.log("Unknown metacharacter in macro: " + macro);
		return "";
	}

	/**
	 * Expand all macros within the given section, and return the resulting human-readable text.
	 * @param id The string identifier of the section to expand.
	 * @return The entire section text with all macros expanded.
	 */
	static ExpandSection(id : string) : string
	{
		let section = document.getElementById(id);
		if(section)
		{
			let finalHTML = '';
			let macro = '';
			let bParsingMacro = false;
			for(let i = 0; i < section.innerHTML.length; i++)
			{
				if(section.innerHTML[i] === '{')
				{
					if(!bParsingMacro) { bParsingMacro = true; macro = ''; }
					else { console.log("Error: Nested { in " + id + " at character " + i.toString()); break; }
				}
				else if(section.innerHTML[i] === '}')
				{
					if(bParsingMacro) { bParsingMacro = false; finalHTML += Core.ExpandMacro(macro); }
					else { console.log("Error: Got } without a corresponding { in " + id + " at character " + i.toString()); break; }
				}
				else if(bParsingMacro)
				{
					macro += section.innerHTML[i];
				}
				else
				{
					finalHTML += section.innerHTML[i];
				}
			}
			return finalHTML;
		}
		else
		{
			console.log("Section " + id + " doesn't exist");
			return '';
		}
	}

	/**
	 * Navigate to the given section.
	 * @param id The string identifier of the section to navigate to.
	 */
	static GotoSection(id : string) : void
	{
		// Move the current section into the history
		// TODO: Disable hyperlinks, so we can't click stuff in the history and screw up our flow!
		let history = document.getElementById("__history");
		let currentSection = document.getElementById("__currentSection");
		history.innerHTML += currentSection.innerHTML;

		// Expand the destination section
		currentSection.innerHTML = Core.ExpandSection(id);
	}

	/**
	 * Show or hide the history section
	 * @param tf If true, show history. If false, hide history.
	 */
	static ShowHistory(tf : boolean)
	{
		let history = document.getElementById("__history");
		history.hidden = !tf;
	}
}
