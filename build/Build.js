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
			var result = cp.spawnSync("node_modules/.bin/tsc", [], { env : process.env });

			// tsc return codes: https://github.com/Microsoft/TypeScript/blob/master/src/compiler/types.ts (search `enum ExitStatus`)
			// Currently both 0 and 2 produce outputs (0 is clean, 2 has warnings) and only 1 is actually an error result
			if(result.status === 1)
			{
				// tsc doesn't write to stderr; its errors are all on stdout, because reasons
				if(result.stdout !== null) { console.error(`\n${result.stdout.toString()}`); }
        		process.exit(result.status);
			}
		}

		console.log("\nBuilding examples...");
		{
			var examples = fs.readdirSync("examples", "utf8");
			for(let i = 0; i < examples.length; i++)
			{
				// Ignore dotfiles (.git, .DS_Store, etc.)
				if(examples[i][0] === ".") { examples.splice(i--, 1); }
			}
			for(let i = 0; i < examples.length; i++)
			{
				console.log(`\n${examples[i]} (${i + 1}/${examples.length})`);

				var result = cp.spawnSync(`node lib/CLI.js compile examples/${examples[i]} templates/basic.html examples/${examples[i]}/dist true true`, [], { env : process.env, shell : true });
				console.log(`${result.stdout.toString()}`);

				if(result.status !== 0)
				{
					if(result.stderr !== null) { console.error(`\n${result.stderr.toString()}`); }
					process.exit(result.status);
				}
			}
		}

		console.log("Done!\n");
	}
	catch(ex)
	{
		if(ex.message) { console.error(`\n${ex.message}`); }
		if(ex.stack) { console.error(`\n${ex.stack}`); }
		process.exit(ex.code);
	}
}();
