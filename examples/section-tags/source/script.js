Core.AddEventListener("OnGotoSection", function(id, element, tags, reason)
{
	if(reason !== Core.EGotoSectionReason.Goto) { return; }

	var currentSection = document.getElementById('__currentSection');
	
	// One method of replacement is just to edit the innerHTML/outerHTML property directly.
	// This regenerates DOM elements which means we lose subscribed event handlers. Core
	// deals with this using a MutationObserver which detects the change to __currentSection
	// and reregisters these handlers. User code would be another story...
	if (tags.indexOf("Tutorial") !== -1)
	{
		currentSection.innerHTML += "<p>Click on links to read through the story.";
	}
	
	// A safer method of replacement is to work with elements instead of html, and only
	// touch what you need to touch. This way we don't regenerate *everything* in the
	// __currentSection so we'll preserve subscribed event handlers, at least on elements
	// we don't delete or replace here. Core detects these changes as well.
	if (tags.indexOf("Person1") !== -1)
	{
		var i = document.createElement("img");
		i.src = "assets/person1.png";
		currentSection.insertBefore(i, currentSection.firstChild);
	}
	if (tags.indexOf("Person2") !== -1)
	{
		var i = document.createElement("img");
		i.src = "assets/person2.png";
		currentSection.insertBefore(i, currentSection.firstChild);
	}
});
