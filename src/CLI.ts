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

import { Compiler } from "./Compiler";

/**
 * Invoke 'node lib/CLI.js <command> <args>' to execute command-line tools
 */

for(let i = 0; i < process.argv.length; i++)
{
	switch(process.argv[i])
	{
        // compile [storyDirectory] [template HTML file] [outputDirectory (default: dist)] [bundleJavascript (default: true)] [minify (default: true)]
		case "compile":
		{
			if(process.argv.length < i + 3)
			{
				Compiler.ShowUsage();
				process.exit(1);
			}
			else
			{
                let storyDirectory = process.argv[i + 1];
                let templateFile = process.argv[i + 2];
                let outputDirectory = (process.argv.length > i + 3 ? process.argv[i + 3] : "dist");
				let bundleJavascript = (process.argv.length > i + 4 ? JSON.parse(process.argv[i + 4]) : true);
				let minify = (process.argv.length > i + 5 ? JSON.parse(process.argv[i + 5]) : true );
				Compiler.Compile(storyDirectory, outputDirectory, templateFile, bundleJavascript, minify);
			}
			break;
		}
	}
}
