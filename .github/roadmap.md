# Roadmap

Fractive is a hypertext authoring tool, primarily intended for the creation of interactive fiction. It has three core goals:

- Keep story text readable, unencumbered by the details of scripted game logic and with minimal additional syntax
- Use complete, standard Javascript for game logic, instead of a limited subset of proprietary macros
- Compile finished stories to a single, self-contained, portable HTML file which can be played on any (reasonable) browser, platform, and/or device

Opening up Javascript to this extent makes it possible to extend Fractive in all kinds of creative ways. This is good, and it's important to me to NOT make design decisions which would close that off. However, at its core Fractive is still a tool for creating interactive hypertext; I don't plan on adding features to the core engine that go beyond that.

To give an example: it's totally conceivable that you might want to author a Fractive story which embeds some graphical minigames, built with HTML5, in some sections. This is easy to do: just add a `<canvas>` and a function macro to call some Javascript entry point to start the game. The actual Javascript code for the game is on you, the story author: Fractive won't provide a graphical game API or anything like that. But at the same time, Fractive won't prevent you from inserting your own.

I have a bunch of things in mind for Fractive down the road, and this roadmap is here to capture them. It gets fuzzier the further out we go, as roadmaps do. None of these things are hard commitments; at the end of the day, this is a hobby project and will continue for exactly as long as I enjoy working on it. But this should be good fodder for discussion and inspiration.

# MVP

Minimum Viable Product is a command-line-driven story compiler and the initial runtime core. You can write stories in Markdown, add logic in Javascript, link additional assets (images, etc.), customize the HTML template and stylesheet, and compile it all into an easily distributable package. For text-only stories that package is a single `index.html` containing all the necessary HTML, CSS, and Javascript to run the game. For stories with additional assets, you'll just copy/upload those assets alongside the `index.html`.

Most of this exists now. Major outstanding items include:

- Giving a clean and easy way to scaffold a new story project
- Making compiler settings easily configurable via JSON
- Writing an interactive tutorial and more expansive supporting documentation

Once this milestone is complete, I'll start talking about Fractive a bit more publicly.

# Further out...

Most of what's going to make Fractive tick is UX and tools, especially for debugging and testing stories, and visualizing and navigating very long/complex source texts.

**More sophisticated error handling.** I haven't tested many edge cases yet, so there are probably lots of creative ways to break Fractive, and when you do, it'll probably break in a way that makes no sense. Part of the target UX is having clear and comprehensive error reporting at compile-time, so it's really easy to find and fix errors in your story.

**Automated story testing.** I'd like to have some tools for automatically running many possible story paths, to catch things like script exceptions, dead ends, circular story flow, and so on. Some basic version of this isn't too hard to conceptualize, but to really nail it could get, uh... complex.

**VS Code extension.** I like [VS Code](https://code.visualstudio.com) a *lot*. It'd be nice to make a Fractive extension for it which adds syntax highlighting, auto-complete, and jump-to navigation for macros, across the Markdown/Javascript boundary. So for example, you could drop your cursor in a `{#SomeFunction}` in your Markdown, hit F12 (or whatever), and it'd jump you to the declaration of `SomeFunction` in your Javascript. Or you could start typing `{#SomeF` and it would auto-complete (or at least auto-suggest) to `{#SomeFunction}` for you.

**GUI tool.** I'd like to eventually replace (or at least augment) the command-line compiler with a GUI tool. Fractive isn't the most newbie-friendly thing *today* but I'd like to get it there at some point. A GUI tool that lets you create and build projects would be a good start. Maybe this goes so far as having an integrated text editor? (Like with syntax highlighting, auto-complete, navigation, the whole nine yards.) Still kinda figuring out exactly how far this should go.

**Story flow visualization.** One thing [Twine](https://twinery.org/2) has going for it is the visual flowchart UI. Granted, it turns into a tangled hellscape pretty quickly, but it's a super-simple concept to learn and is especially helpful for newbies. Fractive doesn't currently have any visualizations, which means source text feels less like a flowchart and more like code, e.g. more abstract. Visualizing a branching story flow -- especially when that flow becomes complex -- is a real problem in *both* tools. This is a problem domain I'd like to explore deeply; I'd love for Fractive to eventually become a *de facto* standard for writing novel-scale projects with tons of deep branching.

**Cross-device state sync.** For longer projects, it'd be nice to be able to sync your state across devices, so you could e.g. start a game on your laptop at home, then pick it up later on your smartphone on the bus, then finish it on your desktop at work... or whatever. Basically like the Amazon Kindle's "Whispersync" feature, but for interactive fiction.

**Packaging to standalone app.** Some authors, especially for longer projects or multimedia-heavy projects, would benefit from being able to package up a standalone application instead of just deploying an `index.html` to a web host somewhere. You might want to launch your game on Steam, or you might just have a ton of images/videos in your game and want them served locally at runtime instead of interrupting gameplay to wait for assets to download. I'd like to explore designing an easy workflow for this, likely using [Electron](https://electron.atom.io).
