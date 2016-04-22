#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const pwd = process.cwd();
const hookPath = path.join(pwd, '.git', 'hooks');

const serverAddress = 'http://178.62.83.202:8000';

const hooks = [{
  name: 'post-commit',
  hook: `
    #!/bin/bash

    gitloggerUrl="${serverAddress}"

    branchName="$(git symbolic-ref --quiet --short HEAD 2> /dev/null || \
      git rev-parse --short HEAD 2> /dev/null || \
      echo unknown)"

    repoName="$(basename $(git rev-parse --show-toplevel))"

    commitMsg="$(printf "$(git log -1 --pretty=%B)")"

    user="$(git config user.email)"

    curl -s --data "repo=$repoName&branch=$branchName&user=$user&msg=$commitMsg" "$gitloggerUrl/commit" &
  `
},{
  name: 'post-checkout',
  hook: `
    #!/bin/bash

    gitloggerUrl="${serverAddress}"

    branchName="$(git symbolic-ref --quiet --short HEAD 2> /dev/null || \
      git rev-parse --short HEAD 2> /dev/null || \
      echo unknown)"

    repoName="$(basename $(git rev-parse --show-toplevel))"

    user="$(git config user.email)"

    curl -s --data "repo=$repoName&branch=$branchName&user=$user" "$gitloggerUrl/checkout" &
  `
}];



// Check if hooks already exist.
hooks
  .map(h => {
    h.path = path.join(hookPath, h.name);
    return h;
  })
  .forEach(h => {
    try {
      fs.lstatSync(hookPath);
    } catch (e) {
      console.log(e);
      process.exit(1);
    }

    try {
      fs.lstatSync(h.path);
      console.log(`${h.name} already exists. I will overwrite it.`);
    } catch (e) {
      console.log(`Installing ${h.name} for the first time.`);
    }
    fs.writeFile(h.path, h.hook, () => {
      fs.chmod(h.path, '755');
    });
  });

