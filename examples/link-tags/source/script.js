window.HideHistory = function()
{
	Core.ShowHistory(false);
}

window.FunctionLink = function()
{
	alert("This link does something without changing the text.");
}

window.InlineExpansionFunction = function()
{
	return "Inline functions get the inline tag, too. Because the inline tag is meant to tell the player nothing major will change when the link is clicked, you should be careful not to do anything crazy in an inline function.";
}

window.InlineExpansionVariable = "variable (a string which will replace the link)";
window.TagVariable = "!";
