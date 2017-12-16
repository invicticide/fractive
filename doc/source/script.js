Core.AddEventListener("OnBeginStory", () =>
{
	// Populate the sidebar from the @TableOfContents section so it's easy to maintain
	var sidebar = document.getElementById("__sidebar");
	sidebar.appendChild(Core.GetSection("TableOfContents"));
});

Core.AddEventListener("OnGotoSection", function(id, element, tags)
{
	// Scroll to top of new content
	var contentDiv = document.getElementById("__content");
	if(contentDiv) { contentDiv.scrollTop = 0; }
});
