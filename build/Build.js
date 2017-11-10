var cp = require("child_process");
var fs = require("fs");
var path = require("path");

/**
 * Runs the build process
 * Builds Fractive and all examples
 */
var Build = function()
{
	try
	{
		console.log("Building Fractive...");
		{
      if (fs.existsSync('node_modules/.bin/tsc')) {
        console.log('it\'s there');
      }

			var result = cp.spawnSync("node_modules/.bin/tsc", [], { env : process.env });
			if(result.status !== 0)
			{
				// tsc doesn't write to stderr; its errors are all on stdout, because reasons
				if(result.stdout !== null) {
          console.error(`\n${result.stdout.toString()}`);
          process.exit(result.status);
        }

        // On Windows, result.status can be nonzero without a real error,
        // so don't call process.exit without error output
        // :shrug:
			}
		}

		console.log("\nBuilding examples...");
		{
			var examples = fs.readdirSync("examples", "utf8");
			for(var i = 0; i < examples.length; i++)
			{
				// Ignore dotfiles (.git, .DS_Store, etc.)
				if(examples[i][0] === ".") { continue; }
	
				console.log(`  ${examples[i]}`);
				var result = cp.spawnSync(`node lib/CLI.js compile examples/${examples[i]} templates/basic.html true`, [], { env : process.env, shell : true });
				if(result.status !== 0)
				{
					// The compiler writes its errors to stderr and general status to stdout. In this context
					// we don't care about stdout (it just pollutes the terminal) so we'll just echo stderr.
					if(result.stderr !== null) { console.error(`\n${result.stderr.toString()}`); }
					process.exit(result.status);
				}
			}
		}

		console.log("\nDone!\n");
	}
	catch(ex)
	{
		if(ex.message) { console.error(`\n${ex.message}`); }
		if(ex.stack) { console.error(`\n${ex.stack}`); }
		process.exit(ex.code);
	}
}();
