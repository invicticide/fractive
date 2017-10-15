#!/bin/bash
if [[ $1 == "" ]] || [[ $2 == "" ]] ; then
	echo Usage: ./publish.sh path/to/story/directory/ path/to/template.html
	exit 1
fi
node lib/Compiler.js $1 $2 && http-server $1
exit $?
