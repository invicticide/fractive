Core.AddEventListener("OnGotoSection", function(id, element, tags, reason)
{
	alert(`Transitioned to section "${id}" with tags "${tags}" for reason "${reason}"`);
});
