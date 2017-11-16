# Code style

If you plan to contribute to Fractive, you should be aware that I use a slightly different coding style than what you traditionally see in Javascript/web-type projects. My background is in traditional games programming with a lot of C++ and C#, and that is reflected here.

## Naming conventions

Class and function names are `PascalCase`; variable names are `camelCase`. Occasionally I'll declare a local function-within-a-function, and that's also `camelCase`:

	// This kind of pattern is useful for local recursion, among other things
	function OuterFunction()
	{
		let innerFunction = function()
		{
			// Do stuff
		};
		innerFunction();
	}

Casing this way gives a hint as to the scope of a thing.

Note: Classes that consist only of statics are declared as namespaces instead. Only use `class` to declare object types that will be instantiated.

## Type declarations and exports

Fractive is written in Typescript. Types should be declared in all cases, except where the type is not known/defined (e.g. comes from a raw Javascript library, is a JSON object with dynamic layout, etc.)

	let someNumber : number = 69;
	let someString : string = "nice";

Exports are applied selectively, and only to those objects which need to be made available outside the module.

## Formatting and spacing

Everyone's favorite holy war. My conventions are:

Braces on their own line, and tabs to indent:

	function SomeFunction()
	{
		// Deal with it
	}

No space after flow control keywords, nor inside parens:

	if(someCondition) { ... }

DO space inside inline brackets (e.g. arrays) and braces (e.g. JSON objects, lambda functions):

	let someArray = [ 1, 2, 3, 4 ];
	let someObject = { a: "someValue", b: "someOtherValue" };

Flow control blocks (if, for, etc.) always have braces, even if they only contain a single line. Short single-line blocks may be declared on the same line as the condition, but still have the braces:

	if(someCondition) { DoTheThing(); }
	
	if(someOtherCondition)
	{
		DoFirstThing();
		DoSecondThing();
	}

## Comments

Comments are written as sentences, in sentence case. Short single-sentence comments often omit the trailing period.

	// Do something
	// Do a more complicated thing. We need to do this thing because reasons.

Javadoc-style comments precede function declarations, and are always fully filled out:

	/**
	 * Does a bunch of cool work.
	 * @param data Some data to do the work on.
	 * @returns The transformed data.
	 */
	function DoCoolWork(data)
	{
		return transformedData;
	}
