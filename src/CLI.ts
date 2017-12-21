#!/usr/bin/env node

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

/**
 * Invoke 'node lib/CLI.js <command> <args>' to execute command-line tools
 */

require("source-map-support").install();

import * as cp from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as clc from "cli-color";

import { Compiler, CompilerOptions, ProjectDefaults } from "./Compiler";

// True on Windows, false on Mac/Linux, for platform-specific calls
var isWindows = /^win/.test(process.platform);

/**
 * Invoke the compiler
 * @param args Target directory and options
 */
function Compile(args : Array<string>)
{
	if(!args || args.length < 1)
	{
		Compiler.ShowUsage();
		process.exit(1);
	}
	else
	{
		let buildPath = args[0];

		// If we got a directory, assume we're looking for a fractive.json in its root
		if(fs.lstatSync(buildPath).isDirectory()) { buildPath = path.join(buildPath, "fractive.json"); }

		if(fs.existsSync(buildPath))
		{
			let options : CompilerOptions = {};
			for(let i = 1; i < args.length; i++)
			{
				switch(args[i])
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
}

/**
 * Scaffold a new Fractive project
 * @param args Target directory and options
 */
function Create(args : Array<string>)
{
	if(!args || args.length < 1)
	{
		console.log(``);
		console.log(`Usage:`);
		console.log(`${clc.green("node lib/CLI.js create")} ${clc.blue("<storyDirectory>")}`);
		console.log(``);
		console.log(`${clc.blue("storyDirectory:")} The folder path where the new story project should be created.`);
		console.log(``);
		console.log(`${clc.green("node lib/CLI.js create /Users/Desktop/MyStory")}`);
		console.log(``);
		process.exit(1);
	}

	// Validate the project directory, or create it if it doesn't already exist
	let projectDir : string = args[0];
	if(fs.existsSync(projectDir))
	{
		let files : Array<string> = fs.readdirSync(projectDir, "utf8");
		if(files.length > 0)
		{
			console.error(clc.red(`Target directory "${projectDir}" already exists and is not empty`));
			process.exit(1);
		}
	}
	else
	{
		fs.mkdirSync(projectDir);
	}

	// Write the project file
	let projectFilePath = path.resolve(projectDir, "fractive.json");
	fs.writeFileSync(projectFilePath, JSON.stringify(ProjectDefaults, null, 4), "utf8");

	// Create default subdirectories and files
	let sourceDir = path.resolve(projectDir, "source");
	fs.mkdirSync(sourceDir);
	fs.writeFileSync(path.resolve(sourceDir, "text.md"), "{{Start}}\n\nYour story begins here.", "utf8");
	fs.writeFileSync(path.resolve(sourceDir, "script.js"), "// Your Javascript goes here", "utf8");
	fs.mkdirSync(path.resolve(projectDir, "assets"));

	// Copy over the basic template
	fs.copyFileSync(path.resolve(__dirname, "../templates/basic.html"), path.resolve(projectDir, "template.html"));

	console.log(clc.green(`Project created at ${projectDir}`));
}

function HandleArgs()
{
	for(let i = 2; i < process.argv.length; i++)
	{
		switch(process.argv[i])
		{
			// compile <storyDirectory|configFilePath> [options]
			case "compile": { Compile(process.argv.slice(i + 1)); return; }
	
			// create <storyDirectory>
			case "create": { Create(process.argv.slice(i + 1)); return; }

			// doc [no options]
			case "help":
			{
				let docPath : string = path.join(__dirname, "../doc/build/index.html");
				if(isWindows) { cp.execSync(`start "" "${docPath}"`); }
				else { cp.execSync(`open ${docPath}`); }
				return;
			}

			// examples [no options]
			case "examples":
			{
				let examplesPath : string = path.join(__dirname, "../examples");
				if(isWindows) { cp.execSync(`start "" "${examplesPath}"`); }
				else { cp.execSync(`open ${examplesPath}`); }
				return;
			}
		}
	}
}

if(process.argv.length < 3)
{
	console.log(``);
	console.log(`Usage:`);
	console.log(`${clc.green("fractive")} ${clc.blue("<command>")} ${clc.yellow("[options]")}`);
	console.log(``);
	console.log(`${clc.blue("help:")} Launch the Fractive user guide`);
	console.log(`${clc.blue("compile:")} Compile an existing Fractive project`);
	console.log(`${clc.blue("create:")} Create a new Fractive project`);
	console.log(`${clc.blue("examples:")} Browse Fractive example projects`);
	console.log(``);
	console.log(`Enter a command without ${clc.yellow("options")} to see usage instructions for that command`);
	console.log(``);
	process.exit(1);
}
else
{
	HandleArgs();
}
