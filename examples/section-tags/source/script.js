Core.AddEventListener("OnGotoSection", function(id, element, tags, reason)
{
	if (tags.indexOf("Tutorial") !== -1)
	{
		document.getElementById('tutorialMessage').style.display = "block";
	}
	else
	{
		document.getElementById('tutorialMessage').style.display = "none";
	}

	if (tags.indexOf("Person1") !== -1)
	{
		document.getElementById('person1').style.display = "block";
	}
	else
	{
		document.getElementById('person1').style.display = "none";
	}

	if (tags.indexOf("Person2") !== -1)
	{
		document.getElementById('person2').style.display = "block";
	}
	else
	{
		document.getElementById('person2').style.display = "none";
	}
});

function listCurrentTags() {
	return Core.GetCurrentSectionTags().toString();
}

function listPerson1Sections() {
	return Core.GetSectionsWithTag('Person1').toString();
}

function listPerson2Sections() {
	return Core.GetSectionsWithTag('Person2').toString();
}
