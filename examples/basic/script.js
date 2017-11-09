"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var User0;
(function (User0) {
	function HideHistory()
	{
		Core.Core.ShowHistory(false); // TODO: Why is the double dereference necessary?
	}
	User0.HideHistory = HideHistory;
	
	function FunctionLink()
	{
		alert("It might look like this, if your function was programmed to raise a browser alert (as this one was). Other functions could do complex logic to choose different sections to go to based on things like player state (do you have a certain item in your inventory?) or even a random roll of the dice!");
	}
	User0.FunctionLink = FunctionLink;
	
	function VariableLink()
	{
		alert("You'll actually get a compiler error, because it doesn't make sense to link to a variable. In this case, I've linked to a function instead; specifically, one that shows you this alert.");
	}
	User0.VariableLink = VariableLink;
	
	function InlineFunction()
	{
		return "This paragraph is some inline text that comes from a function call! In this case, I put a \
function macro in my story text, then had the function return the text I wanted to display. In a real \
game, you could have the function do some kind of game logic that decides what to display; for instance, \
you could have it check if the player has a particular inventory item, and say one thing if they do \
and something different if they don't.";
	}
	User0.InlineFunction = InlineFunction;
	
	var InlineVariable = "\"Hello, world!\"";
	User0.InlineVariable = InlineVariable;
	
	function RaiseAlert()
	{
		alert("fractive is super cool!");
	}
	User0.RaiseAlert = RaiseAlert;
	
	function InlineExpansionFunction()
	{
		return "function (functions should return the string that will replace the link)";
	}
	User0.InlineExpansionFunction = InlineExpansionFunction;
	
	var InlineExpansionVariable = "variable (a string which will replace the link)";
	User0.InlineExpansionVariable = InlineExpansionVariable;	
})(User0 = exports.User0 || (exports.User0 = {}));
