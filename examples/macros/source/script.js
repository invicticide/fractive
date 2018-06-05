window.TestVariable = "Expanded variable!";

window.TestFunction = function()
{
	return "Expanded function!";
}

window.LinkedFunction = function()
{
	alert("Linked function!");
}

window.ImageVariable = "assets/avatar.png";

window.ImageFunction = function()
{
	return ImageVariable;
}

window.Nestor = {
	NestedFunction : function() { return "Nested function!"; },
	NestedVariable : "Nested variable!"
};
