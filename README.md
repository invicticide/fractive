# Fractive

> NOTE: Fractive is in **very early** development and is not even remotely ready for prime-time. You probably shouldn't use it yet!

Fractive is a hypertext authoring tool, primarily intended for the creation of interactive fiction.

Stories are written in Markdown, and (optional) game logic is added with Javascript.

Fractive has three core goals:

- Keep story text readable, unencumbered by the details of scripted game logic and with minimal additional syntax
- Use complete, standard Javascript for game logic, instead of a limited subset of proprietary macros
- Compile finished stories to a single, self-contained, portable HTML file which can be played on any (reasonable) browser, platform, and/or device

Fractive is licensed under [AGPL-3.0+](https://github.com/invicticide/fractive/blob/dev/license.md).

## Quick start

Fractive is built on [Node.js](https://nodejs.org), so you'll need to install that if you don't already have it. (Fractive currently targets version 8.9.0 LTS.)

Install Fractive:

	npm install -g fractive

Create a new story project:

	fractive create path/to/my/story

Build the story project:

	fractive compile path/to/my/story

Finally, go to `path/to/my/story/build` and open up the `index.html` in a web browser to run your story!

## Fractive projects

Story text is written in Markdown (.md) files, and game logic is written in Javascript (.js) files. These files, plus any additional assets (images, etc.) are kept together in a Fractive **project**. You can create a new project like this:

	fractive create path/to/my/story

In the new project folder you'll see a structure like this:

	story
	|- assets/
	|- source/
	|- fractive.json
	|- template.html

The `fractive.json` is your **project file**. It contains all your project settings, like rules for where to find source files and where builds should go. If you take a peek inside, you'll see the default rules:

	markdown: [ "source/**/*.md" ],
	javascript: [ "source/**/*.js" ],
	assets: [ "assets/**" ],
	ignore: [],
	template: "template.html",
	output: "build",

These are in [glob syntax](https://github.com/isaacs/node-glob#glob-primer). Note that by default Fractive expects to find all your Markdown and Javascript files in `source`, and anything else in `assets`.

## Story basics

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

## Aliases

Since Markdown also accepts HTML, you could style some text like this:

	In this story, some things are <span style="color:red">displayed in red</span>!

While functional, this looks ugly and makes your story text harder to read. It's also a lot to type out, and if you're going to be styling things consistently, you have to copy the same HTML snippet over and over again, which creates an opportunity for bugs to arise.

To solve this problem (and others like it) you can define custom macros, called **aliases**, which expand to other text or markup at compile-time. In your `fractive.json` simply add some rules to the `aliases` field, like this:

	"aliases": [
		{ "alias": "red", "replaceWith": "<span style='color:red'>", "end": "</span>" },
		{ "alias": "blue", "replaceWith": "<span style='color:blue'>", "end": "</span>" }
	],

Then refer to the alias in your story text like this:

	In this story, some things are {red}displayed in red{/red}!

When you build your story, all instances of `{red}` will be replaced with `<span style='color:red'>` and all instances of `{/red}` will be replaced with `</span>`. If later you wanted to change all your red text to a more specific shade of red (for example) you could simply edit your alias like this, then rebuild your story and all existing usages of the `{red}` alias would be automatically updated:

	"aliases": [
		{ "alias": "red", "replaceWith": "<span style='color:#ff8888'>", "end": "</span>" },
		{ "alias": "blue", "replaceWith": "<span style='color:#8888ff'>", "end": "</span>" }
	],

**Technical note:** Alias replacement happens before any other build steps take place, and is a (nearly) pure text replacement. That means you can replace aliases with macro definitions, and those macros will then be expanded normally. In other words, you could do something like this:

	"aliases": [
		{ "alias": "Home", "replaceWith": "{{Start}}" }
	],

And then in your story text do this:

	{Home}
	This is the beginning of my story, but I'm obstinate and don't want to use the normal \{{Start}} macro as my default section header.

When you build this story, `{Home}` will get replaced with `{{Start}}` and then _voila_, you have a valid starting section by a different name! (This is a contrived example, but you get the idea.)

Notice also that the `end` property of an alias is optional. Aliases are replaced with the `replaceWith` parameter, unless they contain a leading `/`, in which case they're replaced with their `end` parameter instead.

Finally, did you notice the `\{{Start}}` in the example text above? When a macro is preceded by a `\` character it is **escaped**, which means it's not treated like a macro and is instead just rendered as-is. Escaping applies to aliases as well, so `{red}` will be replaced, but `\{red}` will not. You should only need to use this in the rare case that you have text that contains a `{` character that needs to actually be shown to the player.

## Adding multimedia

You can add multimedia elements, like images or videos, to your Fractive stories. In most cases you'll just put those files in `assets` and then source them in your Markdown file. For example, you can place images like this:

	![Image alt text](assets/image.png)

Anything in `assets` gets copied over to your build output location when you publish your story, and the directory structure is preserved. (When writing asset paths in Markdown or Javascript, they should be relative to the project root, not the Markdown/Javascript file itself.)

Markdown also allows raw HTML, so you could embed e.g. a YouTube video using its normal embed code. A section with a video might look like this:

	{{VideoSection}}

	Here's a video!

	<iframe width="854" height="480" src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" gesture="media" allowfullscreen></iframe>

	Pretty sweet, yeah?

## Templates

You can control the visual layout and style of your story by providing a custom HTML template. When you create a new project, a basic `template.html` is created in your project root. You can edit or replace this at your leisure.

A template is a regular HTML file with a couple of special macros.

`<!--{script}-->` indicates where story scripts should be inserted. Generally you should put this inside your `<head>`. You don't need to include `<script>` tags; they'll be added automatically by the compiler.

`<!--{story}-->` indicates where story text should be inserted. Generally you should put this inside your `<body>`. It doesn't really matter where, because this will all be hidden at startup anyway.

You also need to define:

	<div id="__currentSection"></div>

...which should be empty. This is where the active section's story text will be displayed on the page.

Optionally, you can also include:

	<div id="__history"></div>

...which should also be empty. This is where past sections will be displayed when history is enabled.

You can also style your game with custom CSS; just embed it in `<style></style>` tags at the top of your HTML template (or link to an external CSS file if you prefer).

| CSS selector | Where it appears |
| ------------ | ---------------- |
| `#__currentSection` | The entire current section div, where active gameplay takes place. |
| `#__history` | The entire history div, where previous sections are displayed for reference. |
| `.__inlineMacro` | When the player clicks an `:inline` macro, the resulting expanded text is wrapped in a span with this class. |
| `.__disabledLink` | When a section is moved to the history, its `<a>` tags are replaced with `<span>` with this class assigned. |

## Story API

Fractive exposes a few Javascript functions to your story scripts:

`Core.GotoSection("SectionName")`

Advances the story to the named section. This is exactly the same thing that happens when the player clicks a link to a section macro. The advantage to calling this in Javascript is you could retrieve the target section name from a variable, or build it dynamically (use with care!)

`Core.ReplaceActiveElement("ElementID", "HTML")`

This is the same thing that happens when a player clicks a link to an inline macro. Pass the element ID of something on the page, and some HTML to replace that element with.

`Core.ShowHistory(true/false)`

This call enables or disables the history display. This might be useful if e.g. you created a custom template with a title bar that includes some kind of "toggle history" button.

## Story events

Fractive also exposes events you can subscribe to, for when you want some code to be notified that something happened. To assign an event, declare a Javascript function in your story script and pass it to `Core.AddEventListener` like this:

	// MyScript.js
	Core.AddEventListener("OnGotoSection", function(id, element, tags)
	{
		// Handle the event here
	});

`OnGotoSection(id, element, tags)`

Assign a function to this event and it'll be called whenever the current section changes. You'll receive the ID (section name) of the target section, the HTML Element representing it (this will be the new state of the `__currentSection` div), and an array of tags (strings). Tags are not currently used, but in the future you'll be able to assign them to sections and then do whatever you want with them.

## Publishing

When you're ready to share or test your story, you need to publish it.

	fractive compile path/to/my/story

Fractive will compile all Markdown and Javascript files in the given project folder and spit out an `index.html` in the `output` location specified in the project's `fractive.json`. Simply open that `index.html` in a browser to test, or upload it to your web server to publish it to the world.

If you specify a story directory, Fractive will look for a `fractive.json` at that location, and use the settings it finds there to build the story. If you specify a path to a .json file, Fractive will use that as the project file instead.

## Examples

There's an example story in `examples/basic` which demonstrates some very basic concepts. Open the `index.html` to play the example, then check out the `text.md` and `script.js` to see how it was implemented.

There's also `examples/macros` which serves as a simple test suite for and demonstration of a bunch of different kinds of story macros.

See `examples/tags` to see how custom link tags work (i.e. placing an icon next to external or inline links, etc.)

See `examples/callbacks` to see how story scripts subscribe to Fractive events.

## Extending Fractive

Since Fractive games allow unrestricted Javascript, you have the ability to extend your game beyond the "normal" hypertext fiction structure in potentially surprising ways. For example, you might choose to integrate your own or third-party libraries to add things like interactive graphical gameplay sequences or network multiplayer.

These kinds of extensions may add lots of additional Javascript -- much more than you'd be using for your "normal" game logic -- and that Javascript may need to be deployed in certain directory structures, utilize lazy loading, etc. These are all things that would likely break if all those scripts were embedded directly into your story's output html.

In these situations you may benefit from placing those scripts in your `assets` folder instead of your `source` folder. That way, they'll simply be copied to your final build location instead of being embedded in the `index.html`. You can then edit your template with `<script>` tags to source those scripts however you need.

## Importing Fractive

You can also import Fractive as an npm dependency into another project, e.g. if you wanted to embed Fractive into a larger game or application. If your host project is an `npm` project (which is strongly recommended) then you can add Fractive as a local dependency like this:

	npm install --save-dev fractive

 Then import it in your script file(s):

```import * as fractive from "fractive";```

And invoke exported API functions like this:

```fractive.Core.GotoSection("SomeSectionName");```

If you only install Fractive as a local dependency (i.e. you never do `npm install -g fractive`) then you won't have `fractive` on your PATH, which means commands like `fractive compile path/to/my/story` won't work. Local installs place the `fractive` executable in your project's `node_modules/.bin` directory, so you'll need to invoke it like this:

	cd path/to/my/story
	./node_modules/.bin/fractive compile .

Since this is a little awkward, it's recommended to wrap this with an npm build script in your `package.json`, like this:

	"scripts": {
		"build": "./node_modules/.bin/fractive compile .",
	}

Then you can just do `npm run build` to compile your story. (In this use case, though, you'll probably have some kind of build script already set up for all the rest of your non-Fractive code, so you may just want to integrate this command into that script however is most appropriate for your dev environment.)

## Contributing

Please be sure to read the [contribution guidelines](https://github.com/invicticide/fractive/blob/dev/.github/contributing.md), the [style guide](https://github.com/invicticide/fractive/blob/dev/.github/code_style.md), and the [code of conduct](https://github.com/invicticide/fractive/blob/dev/.github/code_of_conduct.md) before submitting any pull requests. Also, check the [roadmap](https://github.com/invicticide/fractive/blob/dev/.github/roadmap.md) to see what's currently planned.

Fork the Fractive repo on GitHub, then clone your fork:

	mkdir fractive
	git clone git@github.com:path/to/your/fork.git fractive

Install dependencies (this will also build Fractive for the first time):

	cd fractive
	npm install

Fractive requires TypeScript 2.6, which is installed as a default dependency when you do `npm install` and invoked when you do `npm run build`. If you have a separate global install of TypeScript (e.g. at one point you did `npm install -g typescript`) you could also compile your changes by just doing `tsc` provided your global install is at least version 2.6. On Mac and *nix, you can use `which tsc` to find your global install, or on Windows, open the Node.js command prompt and do `where tsc`. That said, it's strongly recommended to just use `npm run build` instead.

To test changes to Fractive locally, you'll want to create a story project that exercises those changes (see [Fractive projects](#fractive-projects) for details). Whenever you make a change to Fractive itself, rebuild Fractive and then rebuild the story project:

	cd fractive
	npm run build
	./node_modules/.bin/fractive compile path/to/test/story

Note that everything in the `fractive/examples` folder is automatically built by `npm run build`, so one easy way to set up tests is to just create new story projects in there, e.g. `fractive/examples/my-test` and then just do `npm run build` to update everything.

To test changes in a global install, first update your global install from your local repository like so:

	cd fractive
	npm install -g .

Then build your test story normally:

	fractive compile path/to/test/story

# Who's making this?

**Josh Sutphin**<br>
Creator and primary developer

- GitHub: [@invicticide](https://github.com/invicticide)
- Twitter: [@invicticide](https://twitter.com/invicticide)
- Mastodon: [invicticide@mastodon.gamedev.place](https://mastodon.gamedev.place/@invicticide)

**Nat Quayle Nelson**<br>
Major contributor

- Website: [natquaylenelson.com](https://natquaylenelson.com)
- Fractive Projects:
	- [SpaceFractive](https://github.com/NQNStudios/SpaceFractive): Fractive integrated with [Phaser](https://phaser.io) for multimedia-enhanced stories.
	- [Bring Me a Reuben](https://nqn.itch.io/bring-me-a-reuben) (Ongoing)
	- [Ballad of the Space Bard](https://balladofthespacebard.com) (In Development)
