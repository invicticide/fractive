#!/bin/bash
if [[ $1 == "" ]] || [[ $2 == "" ]]  || [[ $3 == "" ]]; then
	echo "Usage: ./publish.sh path/to/story/directory/ path/to/template.html [bundleScripts: true or false]"
	exit 1
fi
node lib/Compiler.js $1 $2 $3
exit $?
