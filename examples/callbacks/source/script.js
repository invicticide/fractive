Core.AddEventListener("OnGotoSection", function(id, element, tags, goingBack)
{
	alert(`Transitioned to section "${id}" with tags "${tags}"`);
});
