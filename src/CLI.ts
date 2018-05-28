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
 * Invoke 'fractive <command> <args>' to execute command-line tools
 */

require("source-map-support").install();

import * as cp from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as clc from "cli-color";
import * as commandLineArgs from "command-line-args";
import * as commandLineUsage from "command-line-usage";

import { Compiler, CompilerOptions, ProjectDefaults } from "./Compiler";

// True on Windows, false on Mac/Linux, for platform-specific calls
var isWindows = /^win/.test(process.platform);

/**
 * Invoke the compiler
 * @param args Target directory and options
 */
function Compile(args : Array<string>)
{
    let optionDefinitions = [
        { name: 'buildPath', type: String, defaultOption: true, defaultValue: '.' },
        { name: 'dry-run', type: Boolean },
        { name: 'verbose', alias: 'v', type: Boolean },
        { name: 'debug', type: Boolean }
    ];

    let options : CompilerOptions = commandLineArgs(optionDefinitions, { argv: args });
    Compiler.Compile(options);
}

/*function CompileUsage()*/
/*{*/
/*}*/

/**
 * Scaffold a new Fractive project
 * @param args Target directory and options
 */
function Create(args : Array<string>)
{
    let optionDefinitions = [
        { name: "storyDirectory", type: String, defaultOption: true }
    ];

    let options = commandLineArgs(optionDefinitions, { argv: args});

    // Validate the project directory, or create it if it doesn't already exist
	let projectDir : string = options.storyDirectory;
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

function Docs() {
    let docPath : string = path.join(__dirname, "../doc/build/index.html");
    if(isWindows) { cp.execSync(`start "" "${docPath}"`); }
    else { cp.execSync(`open ${docPath}`); }
    return;
}

function Examples() {
    let examplesPath : string = path.join(__dirname, "../examples");
    if(isWindows) { cp.execSync(`start "" "${examplesPath}"`); }
    else { cp.execSync(`open ${examplesPath}`); }
    return;
}

function ShowUsage()
{
    // Generate a command-line usage guide using this module: https://github.com/75lb/command-line-usage
    let sections = [
        {
            header: 'Fractive',
            content: 'Fractive is a hypertext authoring tool, primarily intended for the creation of interactive fiction.'
        },
        {
            header: 'Commands',
            content: [
                { name: 'help', summary: 'Show this command-line usage guide'},
                { name: 'docs', summary: 'Launch the Fractive user guide (Web browser required)' },
                { name: 'examples', summary: 'Browse Fractive example projects (Web browser required)' },
                { name: 'create', summary: 'Create a new Fractive project' },
                { name: 'compile', summary: 'Compile an existing Fractive project' }

            ]
        }
    ];
    let usage = commandLineUsage(sections);
    console.log(usage);
}


let commands = {
    'create': Create,
    'compile': Compile,
    'docs': Docs,
    'help': ShowUsage,
    'examples': Examples
};

if(process.argv.length < 3)
{
	ShowUsage();
	process.exit(1);
}
else
{
    // The first argument following 'fractive' should be a valid command
    if (process.argv[2] in commands)
    {
        commands[process.argv[2]](process.argv.slice(3));
    }
    else
    {
        let message : string = `'${process.argv[2]}' is not a valid fractive command.`;
        console.log(`\n${clc.red(message)}`);
        ShowUsage();
        process.exit(1);
    }
}
