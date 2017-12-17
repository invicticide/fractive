{{WhatIsFractive}}

Fractive is a hypertext authoring tool, primarily intended for the creation of interactive fiction.

Stories are written in Markdown, and (optional) game logic is added with Javascript.

Fractive has three core goals:

- Keep story text readable, unencumbered by the details of scripted game logic and with minimal additional syntax
- Use complete, standard Javascript for game logic, instead of a limited subset of proprietary macros
- Compile finished stories to a single, self-contained, portable HTML file which can be played on any (reasonable) browser, platform, and/or device

Fractive is licensed under [AGPL-3.0+](https://github.com/invicticide/fractive/blob/dev/license.md).

{{QuickStart}}

[**If you haven't installed Fractive yet, click here**]({@QuickStart-Installation:inline})

Create a new story project:

	fractive create path/to/my/story

Launch your favorite code editor (I recommend [VS Code](https://code.visualstudio.com)) and open the default story text file, `source/text.md`. You'll see the following:

	\{{Start}}

	Your story begins here.

`\{{Start}}` marks the beginning of a new **section**, called "Start". Your story will contain many sections, each of which must be named uniquely. The "Start" section is the one your story will start on when it's first launched.

Add a second section:

	\{{Elsewhere}}

	This is a different section.

Now add a link to the second section from the first section. Story text is written in Markdown, so you can use Markdown link syntax:

	\{{Start}}

	Your story begins here.

	[Go elsewhere](\{@Elsewhere})

The link URL is a **macro** pointing to the section called "Elsewhere". Macros are enclosed in `\{}` and have a leading **metacharacter** indicating the macro's type. In this case we used `@` which indicates a section macro; clicking this link will take the player to the named section.

Build the story project:

	fractive compile path/to/my/story

Navigate to `path/to/my/story/build` and open up the `index.html` in a web browser to run your story!

You now know enough to create interactive fiction stories both simple and complex. However, Fractive is capable of much more than this. For a guided tour of all Fractive's feature, check out the `Tutorial` section in the sidebar. Or if you'd like to explore on your own, scroll down to the `User Manual` section.

{{QuickStart-Installation}}

Fractive is built on [Node.js](https://nodejs.org), so you'll need to install that if you don't already have it. (Fractive currently targets version 8.9.0 LTS.)

Once Node.js is installed, open a command line and install Fractive:

	npm install -g fractive

Fractive is now globally available on the command line. Type `fractive` to see usage instructions.
