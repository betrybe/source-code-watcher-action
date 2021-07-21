#!/bin/sh -l

cp /main.js /github/workspace
cp /package-lock.json /github/workspace
cp /package.json /github/workspace

npm install

node main.js $@

if [ $? != 0 ]; then
  echo "Execution error"
  exit 1
fi

echo ::set-output name=result::`cat result.json | base64 -w 0`
