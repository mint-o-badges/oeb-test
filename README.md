# Open Educational Badges Test

This is a playwright project implementing end-to-end tests for [Open Educational Badges](https://openbadges.education).

There are two ways to run this application:

## Docker

### Prerequisites

- `docker` with `docker compose`

### Run the tests

```bash
docker compose run node
```

## No docker

### Prerequisites

- `nvm` (recommended) or `node` with the version specified in [`.nvmrc`](.nvmrc)
  - Run `nvm use && nvm install` to install and use the correct version of node automatically
- `ghostscript` and `graphicsmagick` for converting QR codes in pdfs to images
  - e.g. via your systems package manager: `sudo apt install ghostscript graphicsmagick`

### Run the tests

First set up some credentials to be able to login into the platform.
For this, clone the example and adjust the values as needed:

```bash
cp example.secret.js secret.js
```

You may want to modify the URL of the platform in `config.js` (e.g. your local environment).

Before running the tests for the first time, make sure to install playwrights dependencies as well:

```bash
npx playwright install
```

Finally, run the tests with

```bash
npx playwright test
```

To run a specific test, use

```bash
npx playwright <test>.spec.js
# E.g.:
npx playwright title.spec.js
```

## Debugging the tests

All tests create a screenshot of the last state before clean up.
In addition, failed tests produce small video files that show the entire flow.
You may access these from the playwright report, that is generated after a test run.

Open the report as follows:

```bash
npx playwright show-report
```

Playwright also comes with a handy debugging interface, the [Playwright Insepctor](https://playwright.dev/docs/debug#playwright-inspector).
Start it by running `npx playwright test --debug`.
