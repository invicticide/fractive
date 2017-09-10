# Fractive

> NOTE: Fractive is in **very early** development and is not even remotely ready for prime-time. You probably shouldn't use it yet!

Fractive is a hypertext authoring tool, primarily intended for the creation of interactive fiction.

Stories are written in Markdown, and (optional) game logic is added with Javascript.

Fractive has three core goals:

- Keep story text readable, unencumbered by the details of scripted game logic and with minimal additional syntax
- Use complete, standard Javascript for game logic, instead of a limited subset of proprietary macros
- Compile finished stories to a single, self-contained, portable HTML file which can be played on any (reasonable) browser, platform, and/or device

## Dependencies

Install [node.js](https://nodejs.org) by downloading it and running the installer.

Verify node and npm:

	node -v
	npm -v

Install TypeScript:

	npm install typescript

Verify TypeScript:

	tsc -v

## Story basics

Create a folder somewhere (*outside* of the fractive repository) to hold your story files. Let's say you called it `MyStory`.

Within `MyStory`, create a new Markdown (.md) file for story text. Let's say it's `text.md`. In that file, do:

	{{Section1}}

	This is the first section. It's just regular Markdown, so you can do things like *add emphasis* or [create a link](https://google.com).

	[Link to another section]({@Section2})

	{{Section2}}

	This is the second section. We can link back to the first section [this way]({@Section1}).

	We can also make a link to [call a Javascript function]({#MyFunction}), and we can display the value of a Javascript variable like this: {$MyVariable}

Create a new Javascript (.js) file for story scripting. Let's say it's `script.js`. In that file, do:

	var MyVariable = 0;

	function MyFunction()
	{
		alert("You called a Javascript function!");
		MyVariable++;
	}

Now that you have a basic story and a basic script, you need to build it so others can play it. Open a command line to the `MyStory` folder and do:

	node lib/Compiler.js path/to/MyStory/

The compiler will spit out an `index.html` which is a self-contained distribution of your story. Just open it in a browser and start clicking!

## Examples

There's an example story in the `examples/basic` folder which demonstrates some very basic concepts. Open the `index.html` to play the example, then check out the `text.md` and `script.js` to see how it was implemented.

If you want to try out some changes to it, open a command line to the `fractive` repository root and do:

	node lib/Compiler.js examples/basic/

This will build all the source files (.md and .js) in that folder and spit out a new `index.html` with the changes.

## Modifying fractive

Fractive is written in TypeScript. If you make modifications in `src`, open a command line into the repository root and do:

	tsc

to compile your changes.
