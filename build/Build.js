/*
Fractive: A hypertext authoring tool -- https://github.com/invicticide/fractive
Copyright (C) 2017 Josh Sutphin

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

require("source-map-support").install();

var cp = require("child_process");
var fs = require("fs");
var path = require("path");
var jsonSchemaToTypescript = require("json-schema-to-typescript");
var clc = require("cli-color");

/**
 * Compiles the engine files. Typings files should've been built before this.
 */
function BuildEngine()
{
	console.log("Building engine...");
	
	// tsc return codes: https://github.com/Microsoft/TypeScript/blob/master/src/compiler/types.ts (search `enum ExitStatus`)
	// Currently both 0 and 2 produce outputs (0 is clean, 2 has warnings) and only 1 is actually an error result
	let result = cp.spawnSync("node_modules/.bin/tsc", [], { env : process.env });
	if(result.status === 1)
	{
		// tsc doesn't write to stderr; its errors are all on stdout, because reasons
		if(result.stdout !== null)
		{
			let s = result.stdout.toString();
			if(s.length > 0) { console.error(clc.red(`\n${s}`)); }
		}
		process.exit(result.status);
	}
	else
	{
		// tsc may emit error messages but still succeed if those error types are disabled in the tsconfig.
		// We'll rewrite those as warnings here, for clarity.
		if(result.stdout !== null)
		{
			let s = result.stdout.toString();
			if(s.length > 0) { console.log(clc.yellow(`\n${s.split(": error TS").join(": warning TS")}`)); }
		}
	}
}

/**
 * Builds all the Fractive examples. The engine should've been built before this.
 */
function BuildExamples()
{
	console.log("Building examples...\n");

	let examples = fs.readdirSync("examples", "utf8");
	for(let i = 0; i < examples.length; i++)
	{
		// Ignore dotfiles (.git, .DS_Store, etc.)
		if(examples[i][0] === ".") { examples.splice(i--, 1); }
	}
	for(let i = 0; i < examples.length; i++)
	{
		console.log(`${examples[i]} (${i + 1}/${examples.length})`);

		let cmd = `node lib/CLI.js compile examples/${examples[i]} ${process.argv.join(" ")}`;
		let result = cp.spawnSync(cmd, [], { env : process.env, shell : true });
		console.log(`${result.stdout.toString()}`);

		if(result.status !== 0)
		{
			if(result.stderr !== null) { console.error(`\n${result.stderr.toString()}`); }
			process.exit(result.status);
		}
	}
}

const schemaInput = "src/ProjectSchema.json";
const schemaOutput = "src/ProjectSchema.d.ts";

console.log("Generating type declarations...");

jsonSchemaToTypescript.compileFromFile(schemaInput).then(ts =>
{
	fs.writeFileSync(schemaOutput, ts, "utf8");
	BuildEngine();
	BuildExamples();
});
