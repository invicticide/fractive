Core.AddEventListener("OnGotoSection", function(id, element, tags)
{
	alert(`Transitioned to section "${id}" with tags "${tags}"`);
});
