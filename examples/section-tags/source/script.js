Core.AddEventListener("OnGotoSection", function(id, element, tags, reason)
{
	var currentSection = document.getElementById('__currentSection');
	if (tags.indexOf("Tutorial") !== -1)
	{
		var p = document.createElement("p");
		p.innerHTML = "Click on links to read through the story.";
		currentSection.appendChild(p);
	}
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
