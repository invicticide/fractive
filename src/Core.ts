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

export namespace Core
{
	export enum EGotoSectionReason
	{
		Goto,		// Going directly to the section
		Back,		// Going back to this section in history
		Refresh,	// Refreshing this section in place
	}
	
	/**
	* Event listener to call just before the story begins, for user init code to run
	*/
	let OnBeginStory : Array<() => void> = [];
	
	/**
	* Event listener to call whenever the current section changes
	* @param id The id attribute of the new section
	* @param element The raw DOM element for the new section
	* @param tags Array of tags associated with the new section
	* @param reason Provides context for why we're navigating to this section now
	*/
	let OnGotoSection : Array<(id : string, element : Element, tags : string[], reason : EGotoSectionReason) => void> = [];

	// Listen for DOM mutations on the __currentSection div, so we can reactivate links and such. This handles
	// internal changes (e.g. GotoSection calls) as well as user code messing around with the DOM directly.
	let currentSectionObserver : MutationObserver = new MutationObserver(OnCurrentSectionModified);
	let currentSectionObserverConfig = {
		childList: true,
		attributes: true,
		characterData: true,
		subtree: true
	}
	
	/**
	* Recursively activates all links in the DOM subtree rooted at this element. This registers appropriate
	* click handlers for each link based on the presence and type of data attributes on <a> tags.
	* @param element The current root element to process
	*/
	export function ActivateElement(element : Element)
	{
		// Register click handlers for links
		if(element.tagName && element.tagName.toLowerCase() == "a")
		{
			for(let i = 0; i < element.attributes.length; i++)
			{
				switch(element.attributes[i].name)
				{
					case "data-goto-section":
					{
						element.addEventListener("click", function() {
							Core.GotoSection(element.attributes[i].value);
						});
						break;
					}
					case "data-call-function":
					{
						element.addEventListener("click", RetrieveFromWindow(element.attributes[i].value, 'function'));
						break;
					}
					case "data-replace-with":
					{
						element.addEventListener("click", function() {
							Core.ReplaceActiveElement(element.id, ExpandMacro(element.attributes[i].value));
						});
						break;
					}
				}
			}
		}

		// Activate IDs by prepending '!' so they're unique from their source instances
		if(element.id && element.id !== "__currentSection")
		{
			if(element.id[0] !== '!') { element.id = `!${element.id}`; }
		}

		// Recursively activate child elements
		if(element.children)
		{
			for(let i = 0; i < element.children.length; i++)
			{
				ActivateElement(element.children[i]);
			}
		}
	}
	
	/**
	* Subscribe to an event with a custom handler function. The handler will be called whenever the event occurs.
	* @param eventName The name of the event to subscribe to
	* @param handler The function that will be called when the event occurs
	*/
	export function AddEventListener(eventName : string, handler : () => void)
	{
		switch(eventName)
		{
			case "OnBeginStory":
			{
				OnBeginStory = OnBeginStory.concat(handler);
				break;
			}
			case "OnGotoSection":
			case "OnGoToSection":
			{
				OnGotoSection = OnGotoSection.concat(handler);
				break;
			}
			default:
			{
				console.error(`Core.AddEventListener: "${eventName}" is not a valid event`);
				break;
			}
		}
	}
	
	/**
	* Begins the story. Notifies user code and navigates to the "Start" section.
	*/
	// @ts-ignore This is never called code but a call to it is written into target HTML by the compiler
	export function BeginStory()
	{
		for(let i = 0; i < OnBeginStory.length; i++) { OnBeginStory[i](); }

        // Starting section is defined with the "Start" tag.
        let startSections = GetSectionsWithTag("Start");
        if (startSections.length == 0)
        {
            console.error(`BeginStory(): no section is defined with the Start tag.`);
        }
        else if (startSections.length > 1)
        {
            console.error(`BeginStory(): multiple sections defined with the Start tag.`);
        }
        else
        {
            GotoSection(startSections[0]);
        }
	}
	
	/**
	* Returns true if the given element is and contains only inline elements, or false if it is or contains any block-level elements
	* @param html The html blob to check
	* @param context Parent element to use for styling context, since the enclosing styling could potentially modify the block/inline status of the root or any of its children. If null, the document root is used.
	*/
	function CanBeInline(html : string, context : Element) : boolean
	{
		// Create a temporary element to render the given html with styling
		let root : Element = document.createElement("span");
		if(context) { context.appendChild(root); }
		else { document.appendChild(root); }
		root.innerHTML = html;
		
		let scan = function(e : Element)
		{
			if(getComputedStyle(e, "").display === "block")
			{
				return false;
			}
			for(let i = 0; i < e.children.length; i++)
			{
				if(scan(e.children[i]) === false) { return false; }
			}
			return true;
		};
		let result = scan(root);
		
		// Remove the temporary element
		if(context) { context.removeChild(root); }
		else { document.removeChild(root); }
		
		return result;
	}
	
	/**
	* Disable any hyperlinks in the given section, while preserving their original link tag in case they need to be re-enabled
	*/
	function DisableLinks(section : Element)
	{
		let links = section.getElementsByTagName("a");
		
		// We need to i++ because we don't actually remove the link tag,
		// just leave it empty.
		for(let i = 0; i < links.length; i++)
		{
			// Preserve the link tag, but keep it EMPTY, and leave it next to the content, so the
			// disabling process can be reversed by the back button.
			let linkTag : string = links[i].outerHTML.substring(0, links[i].outerHTML.indexOf(">") + 1);
			
			// The content from inside the link will be moved outside the link tag
			let contents : string = links[i].outerHTML.substring(
				links[i].outerHTML.indexOf(">") + 1,
				links[i].outerHTML.indexOf("</a>")
			);
			links[i].outerHTML = `<span class="__disabledLink" data-link-tag='${linkTag}'>${contents}</span>`;
		}
	}
	
	/**
	* Re-enable disabled hyperlinks in the given section
	*/
	function EnableLinks(section : Element)
	{
		let links = section.getElementsByClassName("__disabledLink");
		
		// Stripping each link modifies the collection as we iterate, so we don't need i++
		for(let i = 0; i < links.length; /*NOP*/)
		{
			// Retrieve the link's original tag
			let linkTag : string = links[i].getAttribute('data-link-tag');
			
			// The content from inside the link will be moved back inside the link tag
			let contents : string = links[i].innerHTML;
			
			links[i].outerHTML = linkTag + contents + '</a>';
		}
	}
	
	/**
	* Expand a macro (e.g. "{@someSection}", "{#someFunction}", "{$someVariable}") into human-readable text.
	* {@section} macros expand the entire referenced section, including its own macros.
	* {#function} macros execute the function and replace the macro with the return value.
	* {$variable} macros replace the macro with the value of the variable.
	* @param macro The macro string, omitting the enclosing {}. Should start with a metacharacter (e.g. '$' for variables).
	* @return The resulting html.
	*/
	export function ExpandMacro(macro : string) : string
	{
		switch(macro[0])
		{
			case '@':
			{
				let sectionName = macro.substring(1);
				if(!document.getElementById(sectionName))
				{
					return `{section "${sectionName}" is not declared}`;
				}
				else
				{
					return ExpandSection(macro.substring(1)).innerHTML;
				}
			}
			case '#':
			{
				// Return the result of the named function call
				let functionName : string = macro.substring(1);
				let targetFunction = RetrieveFromWindow(functionName, 'function');
				if(targetFunction !== null && targetFunction !== undefined)
				{
					let result = targetFunction();
					return (result ? result.toString() : "");
				}
				else
				{
					return `{function "${functionName}" is not defined}`;
				}
			}
			case '$':
			{
				// Return the value of the named variable
				let variableName : string = macro.substring(1);
				let targetVariable = RetrieveFromWindow(variableName, 'variable');
				if(targetVariable !== null && targetVariable !== undefined)
				{
					return targetVariable.toString();
				}
				else
				{
					return `{variable "${variableName}" is not defined}`;
				}
			}
			default:
			{
				return `{unknown metacharacter in macro "${macro}"`;
			}
		}
	}
	
	/**
	* Expand all macros within the given section, and return the resulting human-readable text.
	* @param id The string identifier of the section to expand.
	* @return A new section element with all inner macros expanded.
	*/
	function ExpandSection(id : string) : Element
	{
		let source = document.getElementById(id);
		if(source === null)
		{
			console.log("Section " + id + " doesn't exist");
			return null;
		}
		
		let sectionInstance = source.cloneNode(true) as Element; // deep
		sectionInstance.removeAttribute("hidden");
		
		let scan = function(element : Element)
		{
			for(let i = 0; i < element.attributes.length; i++)
			{
				let expanded : boolean = false;
				switch(element.attributes[i].name)
				{
					case "data-expand-macro":
					{
						if(element.parentElement)
						{
							let newElement = document.createElement("span");
							newElement.innerHTML = ExpandMacro(element.attributes[i].value);
							element.parentElement.replaceChild(newElement, element);
							expanded = true;
						}
						break;
					}
					case "data-image-source-macro":
					{
						element.setAttribute("src", ExpandMacro(element.attributes[i].value));
						expanded = true;
					}
				}
				
				// If we replaced the element with an expansion, the attributes list we're iterating over will
				// no longer be valid. But that's fine, because we're done here anyway.
				if(expanded) { break; }
			}
			if(element.hasChildNodes)
			{
				for(let i = 0; i < element.children.length; i++)
				{
					scan(element.children[i]);
				}
			}
		};
		scan(sectionInstance);
		
		return sectionInstance;
	}
	
	/**
	* Get a list of the tags the current section was declared with.
	*/
	export function GetCurrentSectionTags() : Array<string>
	{
		return GetSectionTags("__currentSection");
	}

	/**
	* Gets a copy of the given section, expands its macros, registers its links, and returns an Element
	* which is fully activated and ready to be displayed to the user.
	* @param id The name of the section to retrieve.
	*/
	export function GetSection(id : string) : Element
	{
		let clone = ExpandSection(id);
		clone.setAttribute('data-id', id);
		return clone;
	}
	
	/*
	* Get a list of the id's of sections which were declared with the given tag
	*/
	export function GetSectionsWithTag(tag : string) : Array<string>
	{
		let matchingSections : Array<string> = [];
		let sections = document.getElementsByClassName("section");
		
		// Check every section. If this ever needs better performance than O(N),
		// we'll have to create a data structure at initialization, but that
		// seems like overkill for now.
		for (var i = 0; i < sections.length; ++i)
		{
			let sectionId = sections[i].getAttribute('id');
			let sectionTags = GetSectionTags(sectionId);
			if (sectionTags.indexOf(tag) !== -1)
			{
				matchingSections.push(sectionId);
			}
		}
		
		return matchingSections;
	}
	
	/**
	* Get a list of the tags a section was declared with.
	*/
	export function GetSectionTags(id : string) : Array<string>
	{
		let sectionDiv = document.getElementById(id);
		let tagDeclarations = sectionDiv.getAttribute("data-tags");
		return tagDeclarations.split(',');
	}
	
	/**
	* Navigate to the previous section as it was before transitioning to the current one.
	*/
	export function GotoPreviousSection()
	{
		// Don't listen for changes while we're deactivating the current section
		currentSectionObserver.disconnect();

		let history = document.getElementById("__history");
		if(history === null)
		{
			console.error("History is not supported in this template (the __history element is missing)");
			return;
		}
				
		// Retrieve the most recent section
		let previousSections = history.getElementsByClassName('__previousSection');
		let previousSection = previousSections[previousSections.length - 1];
		if(!previousSection) { return; }
		
		// Replace the current section with the previous section
		let id = previousSection.getAttribute('data-id');
		let clone = previousSection.cloneNode(true) as Element;
		EnableLinks(clone);
		SetElementAsCurrentSection(clone);
		
		// Notify user script
		for(let i = 0; i < OnGotoSection.length; i++) { OnGotoSection[i](id, clone, GetSectionTags(id), EGotoSectionReason.Back); }

		// Remove the most recent section from history, now that we're going back to it
		history.removeChild(previousSection);
	}
	export function GoToPreviousSection() { GotoPreviousSection(); } // Convenience alias
	
	/**
	* Navigate to the given section.
	* @param id The string identifier of the section to navigate to.
	*/
	export function GotoSection(id : string) : void
	{
		// Don't listen for changes while we're deactivating the current section
		currentSectionObserver.disconnect();
		
		// Disable hyperlinks in the current section before moving it to history
		let currentSection : Element = document.getElementById("__currentSection");
		DisableLinks(currentSection);
		
		// Move the current section into the history section, keeping it in a div with its id as a data attribute
		let history : Element = document.getElementById("__history");
		let previousSectionId = currentSection.getAttribute('data-id');
		if(previousSectionId !== null && history !== null)
		{
			history.innerHTML += `<div class="__previousSection" data-id="${previousSectionId}">${currentSection.innerHTML}</div>`;
			history.scrollTop = history.scrollHeight;
		}
		
		// Get a copy of the new section that's ready to display
		let clone : Element = GetSection(id);
		SetElementAsCurrentSection(clone);
		
		// Notify user script
		for(let i = 0; i < OnGotoSection.length; i++) { OnGotoSection[i](id, clone, GetSectionTags(id), EGotoSectionReason.Goto); }
	}
	export function GoToSection(id : string) { GotoSection(id); } // Convenience alias

	/**
	 * MutationObserver callback for when __currentSection has been modified in the DOM
	 * @param mutations Array of MutationRecords
	 */
	function OnCurrentSectionModified(mutations)
	{
		for(let i = 0; i < mutations.length; i++)
		{
			// We only touch newly-added nodes, to prevent registering duplicate event listeners on existing nodes
			for(let j = 0; j < mutations[i].addedNodes.length; j++)
			{
				let e : Element = mutations[i].addedNodes[j] as Element;
				ActivateElement(e);
			}
		}
	}

	/**
	* Reloads the current section without creating a new history entry.
	*/
	export function RefreshCurrentSection()
	{
		// Don't listen for changes while we're deactivating the current section
		currentSectionObserver.disconnect();

		let currentSection : Element = document.getElementById("__currentSection");
		let id : string = currentSection.getAttribute("data-id");

		// Make a fresh copy of the source section and set that as the new current section, without updating history
		let clone : Element = GetSection(id);
		SetElementAsCurrentSection(clone);

		// Notify user script
		for(let i = 0; i < OnGotoSection.length; i++) { OnGotoSection[i](id, clone, GetSectionTags(id), EGotoSectionReason.Refresh); }
	}
	
	/**
	* Access a global variable dynamically from the window by splitting its name at any .'s in order to keep indexing recursively.
	* This is like what you'd expect window["foo.bar.baz"] would do... if that syntax were legal.
	*/
	function RetrieveFromWindow(name : string, type)
	{
		let targetObject = null;
		let tokens = name.split('.');
		
		for(let i = 0; i < tokens.length; i++)
		{
			if(i === 0) { targetObject = window[tokens[0]]; }
			else { targetObject = targetObject[tokens[i]]; }
		}
		if(targetObject === undefined)
		{
            console.log(`{${type} "${name}" is not declared}`);
            return undefined;
		}
		
		return targetObject;
	}
	
	/**
	* Replaces the element having the given id, with the given html.
	* Only replaces the element that's in the __currentSection div; doesn't affect the hidden story text.
	* @param id The id of the element to be replaced
	* @param html The html to replace the element with
	*/
	export function ReplaceActiveElement(id : string, html : string)
	{
		// Force the '!' prefix indicating an active element (i.e. one in the __currentSection div).
		// Normal inline links will pass in an id that already has it, but user code might not, and
		// we don't want them accidentally munging hidden source divs without realizing it.
		let element = document.getElementById(id[0] === '!' ? id : `!${id}`);
		if(!element) { return; }
			
		let replacement = document.createElement(CanBeInline(html, element.parentElement) ? "span" : "div");
		replacement.className = "__inlineMacro";
		replacement.innerHTML = html;
		ActivateElement(replacement);
		element.parentNode.replaceChild(replacement, element);
	}

	/**
	 * Replaces the __currentSection div with the given element, which becomes the new __currentSection div.
	 * This does NOT update history, and should only be used internally.
	 * @param e The element to set as the new current section
	 */
	function SetElementAsCurrentSection(e : Element) // Do not export
	{
		let currentSection : Element = document.getElementById("__currentSection");

		e.scrollTop = 0;
		e.id = "__currentSection";
		ActivateElement(e);
		
		// Replace the div so as to restart CSS animations
		currentSection.parentElement.replaceChild(e, currentSection);

		// Activate DOM mutation observer for the new section
		currentSectionObserver.observe(e, currentSectionObserverConfig);
	}

    /**
     * Export Core and everything from the 'Fractive' namespace generated by browserify
     * into the browser's global namespace
     */
    export function ExportToGlobal() {
        window['Core'] = Core;

        let fractiveDefinitions = window['Fractive'];
        for (var property in fractiveDefinitions) {
            if (fractiveDefinitions.hasOwnProperty(property)) {
                window[property] = fractiveDefinitions[property];
            }
        }
    }
}
