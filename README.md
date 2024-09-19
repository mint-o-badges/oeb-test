# Open Educational Badges Test
This is a selenium project that aims to implement end-to-end tests for [Open Educational Badges](https://openbadges.education).

To run, first set up an up-to-date npm (at the time of writing v22.8.0), e.g. by running:
```bash
echo "node" > .nvmrc
nvm install
nvm use
```

Then install the dependencies via
```bash
npm install
```

Then you need to set up some credentials to be able to log in in the staging environment. For this, clone the example and adjust the values as needed:
```bash
cp example.secret.js secret.js
```

Alternatively you can modify the URL in `config.js` to something you have credentials to (e.g. your local environment).

Finally, run the tests with
```bash
npx mocha test
```

To run a specific test, use
```bash
npx mocha test/<test>.spec.js
# E.g.:
npx mocha test/title.spec.js
```

...according to the files in the `test` directory. Note that the `mocha` test files are called `*.spec.js`.
