{{Scripting-Intro}}

# Intro to scripting

You can add logic to your Fractive stories using [Javascript](https://www.javascript.com/).

By default, new projects contain a `source/script.js` which you can put your custom scripting in, but you can also add new .js files and link them into your story using the `scripts` property in `fractive.json` (see [Configuration]({@Projects-Configuration}) for details).

Typically, you'll create Javascript variables to remember the game state, and Javascript functions to change the game state. In your story text you can use [Macros]({@Stories-Macros}) to retrieve those variables and call those functions.

[{icon-forward} Next: Function macros]({@Scripting-FunctionMacros})

{{Scripting-FunctionMacros}}

# Function macros

Function macros are denoted by the `#` metacharacter and they refer to Javascript functions. For example, the macro `\{#Foo}` refers to the Javascript function `Foo()`. Function macros never pass any arguments, but in some circumstances can accept a `string` return value (see below).

## In story text

If you put a function macro directly in the story text, the function will be called on entry into the section, and any text it returns will be inserted into the section in place of the macro.

First, create a Javascript function in any .js file that's included in your project:

	function MyFunction()
	\{
		return "Hello, world!";
	}

In your Markdown story text, include a function macro referencing this function:

	\{{Start}}

	Here is a message from Javascript: \{#MyFunction}

When the player starts this story they'll see:

	Here is a message from Javascript: Hello, world!

The text that gets displayed is the return value of `MyFunction()` converted to a string by `MyFunction().toString()`.

## As link destinations

If you put a function macro as a link destination, the function will be called when the player clicks the link.

First, create a Javascript function in any .js file that's included in your project:

	function MyFunction()
	\{
		alert("Hello, world!");
	}

In your Markdown story text, link to this function using a function macro:

	\{{Start}}

	[Say hello](\{#MyFunction})

When the player clicks the "Say hello" link, a window will pop up with the text "Hello, world!"

# Inline macros

If you put a function macro as a link destination and add the `:inline` specifier, the function will be called when the player clicks the link, and the link will be replaced with any text the function returns.

First, create a Javascript function in any .js file that's included in your project:

	function MyFunction()
	\{
		return "Hello, world!";
	}

In your Markdown story text, link to this function using a function macro with the `:inline` specifier:

	\{{Start}}

	Javascript says: [???](\{#MyFunction:inline})

When the player starts the story, they'll see:

	Javascript says: ???

...and when they click the link "???" it'll be replaced inline, so they'll now see:

	Javascript says: Hello, World!

The text that gets displayed is the return value of `MyFunction()` converted to a string by `MyFunction().toString()`.

[{icon-forward} Next: Variable macros]({@Scripting-VariableMacros})

{{Scripting-VariableMacros}}

# Variable macros

Variable macros are denoted by the `$` metacharacter and refer to Javascript variables. For example, the macro `\{$Foo}` refers to the Javascript variable `Foo`.

## In story text

Variable macros placed directly into story text are expanded to their string value when the section is entered. For example, if a .js file declares a variable like this:

	var Foo = "Hello, world!";

...and the story text contains a variable macro like this:

	\{{Start}}

	Javascript says: \{$Foo}

...then when the player starts the story, they'll see:

	Javascript says: Hello, world!

The text that gets displayed is the value of `Foo` converted to a string by `Foo.toString()`.

## As link destinations

Variable macros cannot currently be used as link destinations, and the compiler will spit out an error at build time if you attempt to do so.

## Inline macros

Variable macros can be set as link destinations with the `:inline` specifier, in which case the link will be replaced with the value of the variable when clicked. For example, if a .js file declares a variable like this:

	var Foo = "Hello, world!";

...and the story text contains a variable macro like this:

	\{{Start}}

	[Javascript says...](\{$Foo:inline})

...then when the player starts the story, they'll see:

	Javascript says...

...and when they click the "Javascript says..." link, it'll be replaced with:

	Hello, world!

The text that gets displayed is the value of `Foo` converted to a string by `Foo.toString()`.

[{icon-forward} Next: Core API]({@Scripting-CoreAPI})

{{Scripting-CoreAPI}}

# Core API

Fractive exposes some useful Javascript functions to your story scripts.

## Core.BeginStory

	Core.BeginStory()

Begins (or restarts) the story. You don't need to call this to start the story initially; that happens automatically. But you might call this if you wanted to implement your own "Restart Story" link.

The difference between calling this vs. calling `Core.GotoSection("Start")` is that this function also calls any registered `OnBeginStory` [event handlers]({@Scripting-EventHandlers}).

## Core.GetSection

	Core.GetSection("SectionName")

Gets a copy of the given section, expands its macros, registers its links, and returns an `Element` instance which is fully activated and ready to be displayed to the user, without actually navigating to that section. This function is for advanced/unusual circumstances; for example, this documentation uses it to populate the table of contents in the sidebar. Normally you should just use `Core.GotoSection("SectionName")` instead.

## Core.GotoPreviousSection()

	Core.GotoPrevousSection()

Travel to the section we just came from. You can hook this up to a "Back" link if you want players to be able to undo their choices.

## Core.GotoSection

	Core.GotoSection("SectionName")

Advances the story to the named section. This is exactly the same thing that happens when the player clicks a link to a section macro. The advantage to calling this in Javascript is you could retrieve the target section name from a variable, or build it dynamically (use with care!)

[{icon-forward} Next: Event handlers]({@Scripting-EventHandlers})

{{Scripting-EventHandlers}}

# Event handlers

Fractive exposes events you can subscribe to, for when you want some code to be notified that something happened. To assign an event, declare a Javascript function in your story script and pass it to `Core.AddEventListener`.

## OnBeginStory

	Core.AddEventListener("OnBeginStory", function()
	\{
		// Handle the event here
	});

Subscribe to this event and it'll be called immediately before the story begins. This is a good place to do any script initialization you might need.

## OnGotoSection

	Core.AddEventListener("OnGotoSection", function(id, element, tags, isGoingBack)
	\{
		// Handle the event here
	});

Subscribe to this event and it'll be called whenever the current section changes. You'll receive the ID (section name) of the target section, the HTML `Element` representing it (this will be the new state of the `__currentSection` div), an array of tags (strings), and an `isGoingBack` flag.

Tags are not currently used, but in the future you'll be able to assign them to sections and then do whatever you want with them.

The `isGoingBack` flag is normally false, but will be true if we're transitioning back to a previous section (e.g. because the player clicked the "back" link). That gives your script a chance to revert any custom game state.

[{icon-forward} Next: Script extensions]({@Scripting-Extensions})

{{Scripting-Extensions}}

# Script extensions

Since Fractive games allow unrestricted Javascript, you have the ability to extend your game beyond the "normal" hypertext fiction structure in potentially surprising ways. For example, you might choose to integrate your own or third-party libraries to add things like interactive graphical gameplay sequences or network multiplayer.

These kinds of extensions may add lots of additional Javascript -- much more than you'd be using for your "normal" game logic -- and that Javascript may need to be deployed in certain directory structures, utilize lazy loading, etc. These are all things that would likely break if all those scripts were embedded directly into your story's `index.html`.

In these situations you may benefit from placing those scripts in your `assets` list instead of your `source` list (see [Project configuration]({@Projects-Configuration})). That way, they'll simply be copied to your final build location instead of being embedded in the `index.html`. You can then edit your template with `<script>` tags to source those scripts however you need.

[{icon-forward} Next: Embedding Fractive]({@Scripting-EmbeddingFractive})

{{Scripting-EmbeddingFractive}}

# Embedding Fractive

You can also import Fractive as an npm dependency into another project, e.g. if you wanted to embed Fractive into a larger game or application. If your host project is an NPM project (which is strongly recommended) then you can add Fractive as a local dependency like this:

	npm install --save-dev fractive

 Then import it in your script file(s):

```import * as fractive from "fractive";```

And invoke exported API functions like this:

```fractive.Core.GotoSection("SomeSectionName");```

This installs Fractive as a local dependency to your project. If this is your only Fractive install (i.e. you never do `npm install -g fractive`) then you won't have `fractive` on your PATH, which means commands like `fractive compile path/to/my/story` won't work. Local installs place the `fractive` executable in your project's `node_modules/.bin` directory, so you'll need to invoke it like this:

	cd path/to/my/story
	./node_modules/.bin/fractive compile .

Since this is a little awkward, it's recommended to wrap this with an npm build script in your `package.json`:

	"scripts": \{
		"build": "./node_modules/.bin/fractive compile .",
	}

Then you can just do `npm run build` to compile your story. In this use case, though, you'll probably have some kind of build script already set up for all the rest of your non-Fractive code, so you may just want to integrate this command into that script however is most appropriate for your dev environment.
