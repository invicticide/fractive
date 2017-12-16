{{Start}}

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

[Go elsewhere]({@Elsewhere})
[Test ToC]({@TableOfContents})

{{Elsewhere}}

You made it! [Go back]({@Start})

{{WhatIsFractive}}

This is Fractive!
