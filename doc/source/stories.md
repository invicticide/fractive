{{Stories-Sections}}

# Sections

Story text is written in [Markdown](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet), which is pretty close to plain text but with a few special formatting marks. Here's a [cheat sheet](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet) that should get you up to speed in just a few minutes.

You'll write your story text in **sections**, each preceded by a special macro that looks like this: `\{{SectionName}}`. Each section name (the part inside the double curly braces) must be unique within the story, and section names may not contain whitespace or punctuation: only letters and numbers. A simple section would look like this:

	\{{Start}}

	You are in a maze of twisty little passages, all alike.

Your story must contain one section called `\{{Start}}` which is where the story begins.

You can create a link that takes the player to another section by creating a regular Markdown link and setting the URL to a macro that looks like this: `\{@DestinationName}`:

	\{{Start}}

	You are in a maze of twisty little passages, all alike.

	[Look around](\{@LookAround})

In this example, clicking the "Look around" link would transition the player to the section called `LookAround`.

[{icon-forward} Next: Macros]({@Stories-Macros})

{{Stories-Macros}}

 # Macros

Macros are always enclosed in `\{}`. There are several types, each denoted by a leading **metacharacter**:

- `@` denotes a **section** macro
- `#` denotes a **function** macro
- `$` denotes a **variable** macro

In story text, they look like this:

	\{{Start}}

	This is a section macro: \{@SomeSection}
	This is a function macro: \{#SomeFunction}
	This is a variable macro: \{$SomeVariable}

# Macros in story text

When used directly in the story text, macros behave like so:

- `@` section macros are replaced with the contents of the named section
- `#` function macros call the named Javascript function and then replace themselves with the text returned by that function (see [Scripting: Function macros]({@Scripting-FunctionMacros}) for details)
- `$` variable macros are replaced with the value of the named Javascript variable (see [Scripting: Variable macros]({@Scripting-VariableMacros}) for details)

For example, writing this:

	\{{Start}}

	You have \{$NumApples} apples.

...would replace the `\{$NumApples}` macro with the value of the `NumApples` variable, for a result like this:

	You have 42 apples.

Macros are re-evaluated each time a section is entered, which means if you returned to this section again later in the story (after the value of the `NumApples` variable had changed) you would get a different result:

	You have 10 apples.

# Macros as link destinations

When used as a link destination, macros behave like so:

- `@` section macros navigate to the named section
- `#` function macros call the named Javascript function (see [Scripting: Function macros]({@Scripting-FunctionMacros}) for details)
- `$` variable macros are not valid as link destinations and will throw an error if used in this context

For example, writing this:

	\{{Start}}

	Let's go [elsewhere](\{@Elsewhere}).

...would create a link out of the word "elsewhere" which, when clicked, would navigate to the section called `Elsewhere`.

# Inline macros

Link macros can also be extended with the optional keyword `:inline` which creates a link that expands to some other text in-place when clicked (the {icon-inline-link} links in this documentation are an example of `:inline` behavior).

For example, you could write this:

	\{{Start}}

	You are in [a maze](\{$ExamineMaze:inline}) of twisty little passages, all alike.

...then define the variable in a .js file:

	var ExamineMaze = "the Maze of Doom, where few adventurers dare tread. It consists";

Now when the player clicks on the `a maze` link, the link will be replaced with the value of the `ExamineMaze` variable, so they'll see instead:

	You are in the Maze of Doom, where few adventurers dare tread. It consist of twisty little passages, all alike.

Note that sections are block-level elements and will include paragraph breaks, so if you want to do an inline link in the middle of sentence, you'll probably want to use a function or variable macro instead.

[{icon-forward} Next: Multimedia]({@Stories-Multimedia})

{{Stories-Multimedia}}

# Multimedia

You can add multimedia elements, like images or videos, to your Fractive stories. In most cases you'll just put those files in `assets` and then source them in your Markdown file. For example, you can place images like this:

	![Image alt text](assets/image.png)

Anything in `assets` gets copied over to your build output location when you publish your story, and the directory structure is preserved. (When writing asset paths in Markdown or Javascript, they should be relative to the project root, not the Markdown/Javascript file itself.)

Markdown also allows raw HTML, so you could embed e.g. a YouTube video using its normal embed code. A section with a video might look like this:

	\{{VideoSection}}

	Here's a video!

	<iframe width="854" height="480" src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" gesture="media" allowfullscreen></iframe>

[{icon-forward} Next: Templates]({@Stories-Templates})

{{Stories-Aliases}}

# Aliases

Since Markdown also accepts HTML, you could style some text like this:

	In this story, some things are <span style="color:red">displayed in red</span>!

While functional, this looks ugly and makes your story text harder to read. It's also a lot to type out, and if you're going to be styling things consistently, you have to copy the same HTML snippet over and over again, which creates an opportunity for bugs to arise.

To solve this problem (and others like it) you can define custom macros, called **aliases**, which expand to other text or markup at compile-time. In your `fractive.json` simply add some rules to the `aliases` field, like this:

	"aliases": [
		\{ "alias": "red", "replaceWith": "<span style='color:red'>", "end": "</span>" },
		\{ "alias": "blue", "replaceWith": "<span style='color:blue'>", "end": "</span>" }
	],

Then refer to the alias in your story text like this:

	In this story, some things are \{red}displayed in red\{/red}!

When you build your story, all instances of `\{red}` will be replaced with `<span style='color:red'>` and all instances of `\{/red}` will be replaced with `</span>`. If later you wanted to change all your red text to a more specific shade of red (for example) you could simply edit your alias like this, then rebuild your story and all existing usages of the `\{red}` alias would be automatically updated:

	"aliases": [
		\{ "alias": "red", "replaceWith": "<span style='color:#ff8888'>", "end": "</span>" },
		\{ "alias": "blue", "replaceWith": "<span style='color:#8888ff'>", "end": "</span>" }
	],

The `end` property of an alias is optional. Aliases are replaced with the `replaceWith` parameter, unless they contain a leading `/`, in which case they're replaced with their `end` parameter instead.

Alias replacement happens before any other build steps take place, and is a (nearly) pure text replacement. That means you can replace aliases with macro definitions, and those macros will then be expanded normally. In other words, you could do something like this:

	"aliases": [
		\{ "alias": "Home", "replaceWith": "\{{Start}}" }
	],

And then in your story text do this:

	\{Home}
	This is the beginning of my story, but I'm obstinate and don't want to use the normal \\{{Start}} macro as my default section header.

When you build this story, `\{Home}` will get replaced with `\{{Start}}` and then _voila_, you have a valid starting section by a different name! (This is a contrived example, but you get the idea.)

Finally, did you notice the `\\{{Start}}` in the example text above? When a macro is preceded by a `\` character it is **escaped**, which means it's not treated like a macro and is instead just rendered as-is. Escaping applies to aliases as well, so `\{red}` will be replaced, but `\\{red}` will not. You should only need to use this in the rare case that you have text that contains a macro (or just a `\{` character) that needs to actually be shown to the player. (This documentation is one such example!)

[{icon-forward} Next: Intro to scripting]({@Scripting-Intro})

{{Stories-Templates}}

# Templates

You can control the visual layout and style of your story by providing a custom HTML template. When you create a new project, a basic `template.html` is created in your project root. You can edit or replace this at your leisure.

A template is a regular HTML file with a few special macros:

`<!--\{script}-->`
Indicates where story scripts should be inserted. Generally you should put this inside your `<head>`. You don't need to include `<script>` tags; they'll be added automatically by the compiler.

`<!--\{story}-->`
Indicates where story text should be inserted. Generally you should put this inside your `<body>`. It doesn't really matter where, because this will all be hidden at startup anyway.

`<!--\{backButton}-->`
Indicates where the `backButtonHTML` defined in your `fractive.json` should be inserted, if `includeBackButton` is set to `true	`. (See [Configuration]({@Projects-Configuration}) for details.)

You also need to define:

	<div id="__currentSection"></div>
	
...which should be empty. This is where the active section's story text will be displayed on the page.

Optionally, you can also include:

	<div id="__history"></div>

...which should also be empty. This is where past sections will be displayed when history is enabled.

You can also style your game with custom CSS; just embed it in `<style></style>` tags at the top of your HTML template (or link to an external CSS file if you prefer). Fractive uses a few core CSS selectors you'll want to override:

`#__currentSection`
Covers the entire current section div, where active gameplay takes place.

`#__history`
Covers the entire history div, where previous sections are displayed for reference.

`.__inlineMacro`
Covers the expanded text that appears when the player clicks an `:inline` macro. The expanded text is wrapped in a span with this class.

`.__disabledLink`
Covers `<a>` tags in sections that have been moved to the history. Those `<a>` tags are replaced with `<span>` with this class assigned.

[{icon-forward} Next: Aliases]({@Stories-Aliases})
