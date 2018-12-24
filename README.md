# Fractive

Fractive is built on [Node.js](https://nodejs.org), so you'll need to install that if you don't already have it. (Fractive currently targets version 8.9.0 LTS.)

Once Node.js is installed, open a command line and install Fractive:

	npm install -g fractive

Fractive is now globally available on the command line. Type:

	fractive help

...to launch the user guide and start learning how to use Fractive!

## Contributing

Please be sure to read the [contribution guidelines](https://github.com/invicticide/fractive/blob/dev/.github/contributing.md), the [style guide](https://github.com/invicticide/fractive/blob/dev/.github/code_style.md), and the [code of conduct](https://github.com/invicticide/fractive/blob/dev/.github/code_of_conduct.md) before submitting any pull requests. Also, check the [roadmap](https://github.com/invicticide/fractive/blob/dev/.github/roadmap.md) to see what's currently planned.

Fork the Fractive repo on GitHub, then clone your fork:

	mkdir fractive
	git clone git@github.com:path/to/your/fork.git fractive

Install dependencies (this will also build Fractive for the first time):

	cd fractive
	npm install

Fractive requires TypeScript 2.6, which is installed as a default dependency when you do `npm install` and invoked when you do `npm run build`. If you have a separate global install of TypeScript (e.g. at one point you did `npm install -g typescript`) you could also compile your changes by just doing `tsc` provided your global install is at least version 2.6. On Mac and *nix, you can use `which tsc` to find your global install, or on Windows, open the Node.js command prompt and do `where tsc`. That said, it's strongly recommended to just use `npm run build` instead.

To get Fractive onto your PATH, update your global install from your local repository like so:

	cd fractive
	npm install -g .

Create a story project you can use for testing your changes:

	fractive create path/to/test/story

Whenever you make a change to Fractive, rebuild it (and redeploy your global install) and then rebuild your test project:

	cd fractive
	npm run build
	npm run deploy
	fractive compile path/to/test/story

Note that everything in the `fractive/examples` folder is automatically built by `npm run build`, so an easier way to set up tests is to just create new story projects in there, e.g. `fractive/examples/my-test` and then just do `npm run build` to update everything. Using this method, you don't need to do `npm run deploy` after each change. (That said, you may not want to submit your new example(s) in any pull request.)

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
