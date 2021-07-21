#!/bin/sh -l

cp /analyzer.js /
cp /package-lock.json /
cp /package.json /

npm install

node analyzer.js $@

if [ $? != 0 ]; then
  echo "Execution error"
  exit 1
fi

echo ::set-output name=result::`cat result.json | base64 -w 0`
