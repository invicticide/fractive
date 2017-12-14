Core.AddEventListener("OnGotoSection", function(id, element, tags, isGoingBack)
{
	alert(`Transitioned to section "${id}" with tags "${tags}"`);
});
