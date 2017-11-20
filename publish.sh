#!/bin/bash
if [[ $1 == "" ]]; then
	echo "Usage: ./publish.sh path/to/story/directory/"
	exit 1
fi
node lib/CLI.js compile $1
exit $?
