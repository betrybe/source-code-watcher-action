#!/bin/sh -l
echo ${GITHUB_WORKSPACE}
cp /analyzer.js ${GITHUB_WORKSPACE}
cp /package.json ${GITHUB_WORKSPACE}
echo $@
npm install

node analyzer.js ${GITHUB_WORKSPACE} $@

if [ $? != 0 ]; then
  echo "Execution error"
  exit 1
fi

echo ::set-output name=result::`cat result.json | base64 -w 0`
