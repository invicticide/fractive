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

import * as fs from "fs";
import * as path from "path";
import * as clc from "cli-color";

import { Compiler, CompilerOptions } from "./Compiler";

/**
 * Invoke 'node lib/CLI.js <command> <args>' to execute command-line tools
 */

for(let i = 0; i < process.argv.length; i++)
{
	switch(process.argv[i])
	{
        // compile [storyDirectory|configFilePath]
		case "compile":
		{
			if(process.argv.length <= i + 1)
			{
				Compiler.ShowUsage();
				process.exit(1);
			}
			else
			{
				let buildPath = process.argv[i + 1];

				// If we got a directory, assume we're looking for a fractive.json in its root
				if(fs.lstatSync(buildPath).isDirectory()) { buildPath = path.join(buildPath, "fractive.json"); }

				if(fs.existsSync(buildPath))
				{
					let options : CompilerOptions = {};
					for(let j = i + 2; j < process.argv.length; j++)
					{
						switch(process.argv[j])
						{
							case "--dry-run":	{ options.dryRun = true; break; }
							case "--verbose":	{ options.verbose = true; break; }
							case "--debug":		{ options.debug = true; break; }
						}
					}
					Compiler.Compile(buildPath, options);
				}
				else
				{
					console.error(clc.red(`Couldn't find project config "${buildPath}"`));
					process.exit(1);
				}
			}
			break;
		}
	}
}
