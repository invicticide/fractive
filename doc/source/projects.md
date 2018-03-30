{{Projects-Intro}}

# About projects

Story text is written in Markdown (.md) files, and game logic is written in Javascript (.js) files. These files, plus any additional assets (images, etc.) are kept together in a Fractive **project**. You can create a new project like this:

	fractive create path/to/my/story

In the new project folder you'll see this default structure:

	story
	|- assets/
	|- source/
	|- fractive.json
	|- template.html

The `source` folder contains all your Markdown (.md) and Javascript (.js) files.

The `assets` folder contains images, video clips, and other miscellaneous assets. Not all projects will require these.

The `template.html` is a formatting template for how your published story will look in the browser. See [Templates]({@Stories-Templates}) for details.

Finally, the `fractive.json` is your **project file**. It contains all your project settings, like rules for where to find source files and where builds should go. If you take a peek inside, you'll see the default rules:

	markdown: [ "source/**/*.md" ],
	javascript: [ "source/**/*.js" ],
	assets: [ "assets/**" ],
	ignore: [],
	template: "template.html",
	output: "build",

[{icon-forward} Next: Project configuration]({@Projects-Configuration})

{{Projects-Configuration}}

# Project configuration

This page lists all the configuration options available in the `fractive.json` project file.

# Project metadata

Aside from the title, none of the project metadata is currently used, but in the future it will be displayed to the player (e.g. on a standardized title page, in an online database of Fractive stories, etc.)

	"title": "My Project Title"

Specifies the name of your story. This will be shown to the player, so it should be your actual story title, not a project code name or internal name. This will also appear as the title in any OpenGraph card when this game is linked to on social media. The page title will also be set to this if the `<!--\{title}-->` mark is present in your template; see [Templates]({@Stories-Templates}) for details.

	"author": "Your Name"

Specifies who wrote the story. This could be your real name, an online nickname, a social media handle, or even a company name.

	"description": "About your story"

Give a brief (one or two sentences) description of your story. This will also appear as the description in any OpenGraph card when this game is linked to on social media.

	"website": "Your website"

Give an online address where players can learn more about you, find more of your stories, etc. This could be your website URL, a social media handle, or even an email address. You can also just leave it blank if you prefer.

## twitter

	"twitter": "@yourname"

If you specify your Twitter handle here, it will be linked in OpenGraph cards when this game is linked to on Twitter.

# File paths

These options specify where in your project folder Fractive should look for different kinds of files, what should be included in a build, and what should be ignored.

These are generally [globs](https://github.com/isaacs/node-glob#glob-primer) or lists of globs.

[How do globs work?]({@Projects-Configuration-Globs:inline})

Paths are relative to the `fractive.json` project file.

	"markdown": [
		"source/**/*.md"
	]

List of globs indicating where story text (Markdown) files should be found. All files sourced by this list will be compiled as story text when you build the project.

	"javascript": [
		"source/**/*.js"
	]

List of globs indicating where Javascript files should be found. All files sourced by this list will be combined and embedded in the output `index.html` when you build the project.

	"assets": [
		"assets/**"
	]

List of globs indicating where asset files should be found. All files sourced by this list will be copied to the output location, preserving their directory structure.

[What are asset files?]({@Projects-Configuration-AssetFiles:inline})

	"ignore": [
		"assets/.DS_Store"
	]

List of globs indicating files to ignore. All files sourced by this list will be ignored; they will NOT be compiled, embedded, copied, or otherwise processed.

[What kinds of files should I ignore?]({@Projects-Configuration-WhatToIgnore:inline})

	"template": "template.html"

Specifies the HTML template file to use for formatting the story. (To use one of Fractive's built-in example templates, you can write the path like `\{examples}/basic.html`.)

	"output": "build"

Specifies a directory name where the final `index.html` and asset files will be placed when the project is built.

# Formatting

These options affect how source text is interpreted and rendered into the final HTML.

	"aliases": [
		\{ "alias": "name", "replaceWith": "text", "end": "text" }
	]

List of alias definitions. See [Aliases]({@Stories-Aliases}) for details. Note that the `end` property is optional and may be omitted for aliases that don't need to use it.

	"outputFormat": "prettify"

Specifies how the final HTML should be written:

- `prettify`: Write human-readable HTML with line breaks and whitespace. This is easier to debug but takes up more disk space and bandwidth. Good for development.
- `minify`: Compact the final HTML by removing all unnecessary whitespace and symbols. This is difficult to read and debug, but is much smaller. Good for final release.

This option doesn't change how your story is displayed to the player at all, it just determines what the HTML source code looks like.

	"linkTooltips": false

Specifies whether links should show a tooltip on mouseover which indicates their target location.

[When is this useful?]({@Projects-Configuration-WhenToUseLinkTooltips:inline})

	"linkTags": \{
		"external": \{ "html": "someCode", "prepend": false },
		"inline": \{ "html": "someCode", "prepend": false },
		"section": \{ "html": "someCode", "prepend": false },
		"function": \{ "html": "someCode", "prepend": false }
	}

Link tags are custom HTML snippets which can be automatically appended (or prepended) to links based on their type. The available link types are:

- `external` links target a web URL outside of the current story
- `inline` links expand in-place without navigating to another section using the `:inline` macro modifier, e.g. `\{$SomeVariable:inline}`
- `section` links navigate to another section within the current story, e.g. `\{@SomeSection}`
- `function` links call a Javascript function when clicked, e.g. `\{\#SomeFunction}`

Whatever HTML you specify for `html` will be added immediately after the end of the link, unless `prepend` is `true`, in which case it'll be added immediately before the beginning of the link.

	"includeBackButton": true

If `true`, the value of `backButtonHTML` will be inserted into the final story HTML. Where it gets inserted is determined by the location of the `<!--\{backButton}-->` macro in the template file. If the macro is not found, the `backButtonHTML` will be ignored.

	"backButtonHTML": "Back"

If `includeBackButton` is `true`, this is the HTML snippet that will be inserted into the final story HTML in place of the `<!--\{backButton}-->` macro in the template file.

	"hardLineBreaks": true

If true, single line breaks in Markdown source will be replaced with `<br/>` in the rendered HTML source. If false, they'll be replaced with `\n`, unless the line is suffixed by two or more spaces (see the [official Markdown spec](https://daringfireball.net/projects/markdown/syntax#p) for details).

	"smartPunctuation": true

If true, replace straight quotes with smart quotes, -- with en-dash, --- with em-dash, and ... with ellipsis.

[{icon-forward} Next: Publishing]({@Projects-Publishing})

{{Projects-Configuration-Globs}}

If you're not familiar with glob syntax, here are the basics:

- `source/text.md` targets just that one file
- `source/*.md` targets all .md files in the directory "source"
- `source/**/*.md` targets all .md files in all subdirectories of "source", including "source" itself
- `source/*` targets all files of any type in "source"
- `source/**` targets all files of any type in all subdirectories of "source", including "source" itself

{{Projects-Configuration-AssetFiles}}

For most stories these will probably be multimedia files like images and video clips, but technically assets can be anything, even Markdown and Javascript files. Markdown files included by `assets` will NOT be compiled as story text, and Javascript files included by `assets` will NOT be embedded in the output `index.html`.

{{Projects-Configuration-WhatToIgnore}}

Ignores are most useful when you have an `assets` wildcard like `assets/**` but then there are a few files or file types within it that you *don't* want, like `.DS_Store` files and similar.

Another use case might be for game art. If you made your art with Photoshop and saved PSDs into an `assets` folder and then exported PNGs alongside them, you might want to include `assets/**` and then ignore `assets/**/*.psd`. That way when you build the project it'll only copy over the PNGs and leave the PSDs behind.

{{Projects-Configuration-WhenToUseLinkTooltips}}

Link tooltips can be useful for debugging, as the tooltip will show the actual macro a link is targeting. For example, if you have a link like this:

	[Go somewhere](\{@SomeSection})

...then setting `linkTooltips` to `true` will allow a tooltip on that link which looks like this:

	\{@SomeSection}

{{Projects-Examples}}

# Example projects

Example projects can be found in the `examples` folder in your Fractive install location.

{{Projects-Publishing}}

# Publishing

When you're ready to share or test your story, you need to build it:

	fractive compile path/to/my/story

Fractive will compile your project and spit out an `index.html` and assets (if any) in the `output` location specified in the project's `fractive.json`. Simply open that `index.html` in a browser to test, or upload the entire output directory to your web server to publish it to the world.

If you specify a story directory, Fractive will look for a `fractive.json` at that location, and use the settings it finds there to build the story. If you specify a path to a .json file, Fractive will use that as the project file instead.

[{icon-forward} Next: Sections]({@Stories-Sections})
