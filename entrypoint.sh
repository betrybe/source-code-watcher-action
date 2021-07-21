#!/bin/sh -l
echo ${GITHUB_WORKSPACE}
cp /analyzer.js ${GITHUB_WORKSPACE}
cp /package-lock.json ${GITHUB_WORKSPACE}
cp /package.json ${GITHUB_WORKSPACE}

npm install

node analyzer.js $@

if [ $? != 0 ]; then
  echo "Execution error"
  exit 1
fi

echo ::set-output name=result::`cat result.json | base64 -w 0`
