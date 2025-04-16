# Open Educational Badges Test

This is a selenium project that aims to implement end-to-end tests for [Open Educational Badges](https://openbadges.education).

There are two ways to run this application:

## Docker

You need to have `docker compose` installed. Then simply run

```bash
docker compose run node
```

You can observe the automated browser in the VNC under `localhost:7900`.
The password is `secret` by default.

**Note:** If you are on Apple Silicon, uncomment the `platform: linux/amd64` line in the `docker-compose.yml` file.

## No docker

To run, first make sure you are using the correct version of node.
If you use [nvm](https://github.com/nvm-sh/nvm), run:

```bash
nvm use
nvm install
```

Otherwise install the version of node found in the [.nvmrc](.nvmrc) file.

Then install the dependencies via

```bash
npm install
```

You also need to [GraphicsMagick](https://github.com/yakovmeister/pdf2image/blob/HEAD/docs/gm-installation.md) for being able to convert the QR pdf to an image. For this, install `ghostscript` and `graphicsmagick` via your systems package manager, e.g.:

```bash
sudo apt-get update
sudo apt-get install ghostscript
sudo apt-get install graphicsmagick
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

Note that it might be necessary that **the browser window stays focuesed**.

To run a specific test, use

```bash
npx mocha test/<test>.spec.js
# E.g.:
npx mocha test/title.spec.js
```

...according to the files in the `test` directory. Note that the `mocha` test files are called `*.spec.js`.

Note that if you want to **cancel** a test, you should close the browser window instead of hitting `CTRL+C` or something similar.
This has the effect that the cleanup still happens.
