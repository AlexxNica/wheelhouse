#!/usr/bin/env node
/* eslint-disable no-console */

// This is the wrapper around the `wh-dev` script we use for development. It
// auto-restarts wheelhouse commands if the code changes. This file doesn't get
// transpiled, so it should be executable by vanilla node 4.

/** Commands that we want to auto-reboot-on-changes */
const STAY_RUNNING = ["start", "run", "dev"];
const stayRunning = process.argv[2].includes(STAY_RUNNING);

const axios = require("axios");
const resolve = require("path").resolve;
const nodemon = require("nodemon");
const debug = require("debug");

const log = debug("wheelhouse:wh-dev");

const fail = () => {
  console.error(
    `couldn't find wheelhouse dev server at localhost:3942. Is
     \`npm run dev\` running?`
  );
  process.exit(1);
};

// There's no circumstances where localhost takes a second, right?
const handle = setTimeout(fail, 1000);

axios.get("http://localhost:3942").catch(fail).then(() => {
  clearTimeout(handle);
  const whRoot = resolve(__dirname, "..");
  const whExec = resolve(
    whRoot,
    "packages",
    "wheelhouse",
    "dist",
    "wheelhouse.js"
  );

  nodemon({
    script: whExec,
    args: process.argv.slice(2),
    watch: [
      resolve(whRoot, "packages", "wheelhouse", "dist"),
      resolve(whRoot, "packages", "wheelhouse-core", "dist")
    ],
    env: {
      WH_LOCAL_DEV: "true"
    }
  })
    .on("start", function() {
      log("start");
    })
    .on("quit", function(code) {
      console.error("wheelhouse crashed");
      if (!stayRunning) {
        process.exit(1);
      } else {
        console.error("Waiting for changes");
      }
    })
    .on("exit", function() {
      console.error("wheelhouse exited cleanly");
      if (!stayRunning) {
        process.exit(0);
      } else {
        console.error("Waiting for changes");
      }
    })
    .on("restart", function(files) {
      console.error("App restarted due to: ", files);
    });
});
