Core.AddEventListener("OnGotoSection", function(id, element, tags, reason)
{
	var currentSection = document.getElementById('__currentSection');
	if (tags.indexOf("Tutorial") !== -1)
	{
		currentSection.innerHTML += `<p>Click on links to read through the story.</p>`;
	}
	if (tags.indexOf("Person1") !== -1)
	{
		currentSection.innerHTML = "<img src='assets/person1.png'></img>" + currentSection.innerHTML;
	}
	if (tags.indexOf("Person2") !== -1)
	{
		currentSection.innerHTML = "<img src='assets/person2.png'></img>" + currentSection.innerHTML;
	}

});
