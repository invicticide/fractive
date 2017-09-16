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
	 * Enable or disable :inline macros within the document subtree starting at the given root element.
	 * Nothing is returned, as the elements are modified in place. Disabled :inline macros simply have
	 * a _ prepended to their id attribute.
	 * @param root The root of the subtree to scan
	 * @param tf True to enable, false to disable
	 */
	static EnableInlineMacros(root : Element, tf : boolean = true)
	{
		// Disabled ids have a _ in front of them. We want the active instance in the __currentSection div to be the
		// only one that doesn't have that prefix.
		if(tf && root.id.search("_inline\-") > -1) { root.id = root.id.substring(1); }
		else if(!tf && root.id.search("inline\-") > -1) { root.id = `_${root.id}`; }

		// Recursively check all children
		for(let i = 0; i < root.children.length; i++)
		{
			Core.EnableInlineMacros(root.children[i], tf);
		}
	}

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
		let result : string = "";
		switch(macro[0])
		{
			case '@':
			{
				// Return the contents of the named section, with its macros expanded
				result = Core.ExpandSection(macro.substring(1));
				break;
			}
			case '#':
			{
				// Return the result of the named function call
				let functionName = macro.substring(1);
				let fn = window[functionName];
				if(typeof fn === "function") { result = fn(); }
				else { console.log(functionName + " is not a function"); }
				break;
			}
			case '$':
			{
				// Return the value of the named variable
				result = window[macro.substring(1)];
				break;
			}
			default:
			{
				console.log("Unknown metacharacter in macro: " + macro);
				return "";
			}
		}
		return result;
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
		let history = document.getElementById("__history");
		let currentSection = document.getElementById("__currentSection");

		// Disable hyperlinks in the current section before moving it to history
		// Stripping each link modifies the collection as we iterate, so we don't need i++
		let links = currentSection.getElementsByTagName("a");
		for(let i = 0; i < links.length; /*NOP*/)
		{
			let contents : string = links[i].outerHTML.substring(
				links[i].outerHTML.indexOf(">") + 1,
				links[i].outerHTML.indexOf("</a>")
			);
			links[i].outerHTML = `<span class="__disabledLink">${contents}</span>`;
		}

		// Move the current section into the history
		history.innerHTML += currentSection.innerHTML;

		// Expand the destination section
		currentSection.innerHTML = Core.ExpandSection(id);
		Core.EnableInlineMacros(currentSection, true);
	}

	/**
	 * Replaces the element having the given id, with the given html (used mainly for :inline macros).
	 * Only replaces the element that's in the __currentSection div; doesn't affect the hidden story text.
	 * @param id The id of the element to be replaced
	 * @param html The html to replace the element with
	 */
	static ReplaceActiveElement(id : string, html : string)
	{
		for(let element = document.getElementById(id); element; element = document.getElementById(id))
		{
			if(!element) { continue; }

			// Nodes with this id will exist in both the hidden story text and in the current section,
			// but we only want to do the replacement in the current section
			let bIsActive : boolean = false;
			for(let parent = element.parentElement; parent; parent = parent.parentElement)
			{
				if(parent.id === "__currentSection")
				{
					bIsActive = true;
					break;
				}
			}
			if(bIsActive)
			{
				let replacement = document.createElement("span");
				replacement.innerHTML = html;
				element.parentNode.replaceChild(replacement, element);
				break;
			}
		}
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
