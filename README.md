# Fractive

> NOTE: Fractive is in **very early** development and is not even remotely ready for prime-time. You probably shouldn't use it yet!

Fractive is a hypertext authoring tool, primarily intended for the creation of interactive fiction.

Stories are written in Markdown, and (optional) game logic is added with Javascript.

Fractive has three core goals:

- Keep story text readable, unencumbered by the details of scripted game logic and with minimal additional syntax
- Use complete, standard Javascript for game logic, instead of a limited subset of proprietary macros
- Compile finished stories to a single, self-contained, portable HTML file which can be played on any (reasonable) browser, platform, and/or device

Fractive is licensed under [AGPL-3.0+](https://github.com/invicticide/fractive/blob/dev/license.md).

## Installation

Install [node.js](https://nodejs.org) by downloading it and running the installer. (Fractive is currently developed on version 8.9.0 LTS.)

Verify node and npm:

	node -v
	npm -v

Clone the Fractive repository:

	mkdir fractive
	git clone git@github.com:invicticide/fractive.git fractive

(If you plan on contributing to Fractive, create a GitHub fork and clone that instead.)

## Story basics

Story text is written in Markdown (.md) files, and game logic is written in Javascript (.js) files. You'll need to create a folder somewhere to put these files in; this will be your **project folder**. (Keep it separate from your Fractive repository!)

	mkdir my_story
	touch text.md
	touch script.js

In Markdown, you'll write your story text in **sections**, each preceded by a special macro that looks like this: `{{SectionName}}`. Each section name (the part inside the double curly braces) must be unique within the story, and section names may not contain whitespace or punctuation: only letters and numbers. A simple section would look like this:

	{{Start}}

	You are in a maze of twisty little passages, all alike.

Your story must contain one section called `{{Start}}` which is where the story begins.

You can create a link that takes the player to another section by creating a regular Markdown link and setting the URL to a macro that looks like this: `{@DestinationName}`:

	{{Start}}

	You are in a maze of twisty little passages, all alike.

	[Look around]({@LookAround})
	[Proceed into the maze]({@MazeInterior})

Macros are always enclosed in `{}`. There are three types available, each denoted by a leading **metacharacter**, and each doing different things depending on whether they're specified as a link URL or just placed directly into the story text:

| Macro | As link URL | In story text |
| ----- | ----------- | ------------- |
| `{@SectionName}` | When clicked, takes the player to the named section. | Replaces the macro with the contents of the named section when this story text is shown. |
| `{#FunctionName}` | When clicked, calls the named Javascript function. | Replaces the macro with the return value of the function (which should be a string) when this story text is shown. |
| `{$VariableName}` | Invalid | Replaces the macro with the value of the variable (which should be a string) when this story text is shown. |

(Javascript functions and variables are defined in .js files in your project folder.)

In addition to the link types above, you can also create links that expand to some other text in-place when clicked, which can be used to great artistic effect. To do that, make a link with a macro URL and add `:inline` to the end of the macro:

	{{Start}}

	You are in [a maze]({$ExamineMaze:inline}) of twisty little passages, all alike.

Then define the variable in a .js file:

	var ExamineMaze = "the Maze of Doom, where few adventurers dare tread. It consists";

Now when the player clicks on the `a maze` link, the link will be replaced with the value of the `ExamineMaze` variable, so they'll see instead:

	You are in the Maze of Doom, where few adventurers dare tread. It consist of twisty little passages, all alike.

You can inline any of the three macro types:

| Macro | Result |
| ----- | ------ |
| `{@SectionName:inline}` | Replace the link with the contents of the named section. Macros within the section are expanded automatically. Sections are block-level elements and will include paragraph breaks. |
| `{#FunctionName:inline}` | Call the function and replace the link with its return value (which should be a string). |
| `{$VariableName:inline}` | Replace the link with the contents of the variable (which should be a string). |

## Templates

You can control the visual layout and style of your story by providing a custom HTML template. A simple default can be found in `templates/basic.html`.

A template is a regular HTML file with a couple of special macros.

`<!--{script}-->` indicates where story scripts should be inserted. Generally you should put this inside your `<head>`. You don't need to include `<script>` tags; they'll be added automatically by the compiler.

`<!--{story}-->` indicates where story text should be inserted. Generally you should put this inside your `<body>`. It doesn't really matter where, because this will all be hidden at startup anyway.

You also need to define:

	<div id="__currentSection"></div>
	
...which should be empty. This is where the active section's story text will be displayed on the page.

Optionally, you can also include:

	<div id="__history"></div>

...which should also be empty. This is where past sections will be displayed when history is enabled.

You can also style your game with custom CSS; just embed it in `<style></style>` tags at the top of your HTML template.

| CSS selector | Where it appears |
| ------------ | ---------------- |
| `#__currentSection` | The entire current section div, where active gameplay takes place. |
| `#__history` | The entire history div, where previous sections are displayed for reference. |
| `.__inlineMacro` | When the player clicks an `:inline` macro, the resulting expanded text is wrapped in a span with this class. |
| `.__disabledLink` | When a section is moved to the history, its `<a>` tags are replaced with `<span>` with this class assigned. |

## Story API

Fractive exposes a few functions to your story scripts:

`Core.GotoSection("SectionName")`

Advances the story to the named section. This is exactly the same thing that happens when the player clicks a link to a section macro. The advantage to calling this in Javascript is you could retrieve the target section name from a variable, or build it dynamically (use with care!)

`Core.ReplaceActiveElement("ElementID", "HTML")`

This is the same thing that happens when a player clicks a link to an inline macro. Pass the element ID of something on the page, and some HTML to replace that element with.

`Core.ShowHistory(true/false)`

This call enables or disables the history display. This might be useful if e.g. you created a custom template with a title bar that includes some kind of "toggle history" button.

## Publishing

When you're ready to share or test your story, you need to publish it.

On Windows:

	cd fractive
	publish.bat path/to/story templates/basic.html true

On Mac/*nix:

	cd fractive
	./publish.sh path/to/story templates/basic.html true

The publish script will compile all Markdown and Javascript files in the given story folder and spit out an `index.html` in that same location. Simply open that `index.html` in a browser to test, or upload it to your web server to publish it to the world.

## Examples

There's an example story in `examples/basic` which demonstrates some very basic concepts. Open the `index.html` to play the example, then check out the `text.md` and `script.js` to see how it was implemented.

## Extending Fractive

Since Fractive games allow unrestricted Javascript, you have the ability to extend your game beyond the "normal" hypertext fiction structure in potentially surprising ways. For example, you might choose to integrate your own or third-party libraries to add things like interactive graphical gameplay sequences or network multiplayer.

These kinds of extensions may add lots of additional Javascript -- much more than you'd be using for your "normal" game logic -- and that Javascript may need to be deployed in certain directory structures, utilize lazy loading, etc. These are all things that would likely break if all those scripts were embedded directly into your story's output html.

In these situations you may benefit from bypassing the script embed and instead deploying all your scripts "loose" alongside your final html. To do that, just pass `false` as the final argument to the publish script:

On Windows:

	cd fractive
	publish.bat path/to/story templates/basic.html false

On Mac/*nix:

	cd fractive
	./publish.sh path/to/story templates/basic.html false

## Importing Fractive

You can also import Fractive as an npm dependency into another project, e.g. if you wanted to embed Fractive into a larger game or application. To do that, simply add `fractive` to the `dependencies` in your `package.json`, then import it in your script file(s):

```import * as fractive from "fractive";```

And invoke exported API functions like this:

```fractive.Core.GotoSection("SomeSectionName");```

## Alternative setup

The simplest way to get set up with Fractive is to simply clone the repo, then create separate story folders outside of it. However, you might also choose to set up each story project as an npm package and install Fractive as a dependency. This might be useful if you're working on several different stories that need to target different versions of Fractive, or if different stories need to manage additional Javascript dependencies and custom extensions. 

Create a folder for your story project:

	mkdir my_story
	cd my_story

Generate a default npm `package.json` for your new story package:

	npm init

Install Fractive as a dependency:

	npm install fractive --save-dev

Create a subfolder for your actual story files, and init some:

	mkdir src
	cd src
	touch story.md
	touch script.js

You should now have a directory structure that looks like this:

	my_story
	|
	|- package.json
	|
	|- node_modules
	|	|
	|	|- fractive
	|
	|- story
		|
		|- story.md
		|- script.js

Edit your story files. Write something amazing!

Once you're ready to publish, you need to build it so others can play it (or so you can test it). Open your `package.json` and edit the `scripts` section to add a `build` command like this:

	"scripts": {
	  "build": "node node_modules/fractive/lib/CLI.js compile ./src node_modules/fractive/templates/basic.html true",
	  "test": "echo \"Error: no test specified\" && exit 1"
	},

From now on, all you need to do to build your story is:

	npm run build

The compiler will spit out an `index.html` alongside your story files in `src` which is a self-contained distribution of your story. Simply open that `index.html` in a browser to test, or upload it to your web server to publish it to the world.

## Contributing

Please be sure to read the [contribution guidelines](https://github.com/invicticide/fractive/blob/dev/.github/contributing.md) and the [code of conduct](https://github.com/invicticide/fractive/blob/dev/.github/code_of_conduct.md) before submitting any pull requests.

Fork the Fractive repo on GitHub, then clone your fork:

	mkdir fractive
	git clone git@github.com:path/to/your/fork.git fractive

Install dependencies:

	cd fractive
	npm install

Build changes:

	npm run build

Fractive requires TypeScript 2.6, which is installed as a default dependency when you do `npm install` and invoked when you do `npm run build`. If you have a separate global install of TypeScript (e.g. at one point you did `npm install -g typescript`) you could also compile your changes by just doing `tsc` provided your global install is at least version 2.6. On Mac and *nix, you can use `which tsc` to find your global install, or on Windows, open the Node.js command prompt and do `where tsc`. That said, it's strongly recommended to just use `npm run build` instead. ;)

To test changes against a story project, first build the Fractive source into a local package:

	cd fractive
	npm pack

Then install it locally into your story project:

	cd path/to/story
	npm install path/to/fractive/fractive-x.x.x.tgz

Then rebuild your story project.

On Windows:

	cd fractive
	publish.bat path/to/story templates/basic.html false

On Mac/*nix:

	cd fractive
	./publish.sh path/to/story templates/basic.html false

And finally, launch the resulting `index.html` and perform your tests.
