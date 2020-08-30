import * as path from "https://deno.land/std/path/mod.ts";

import { parse } from "https://deno.land/std/flags/mod.ts";

/* 
{
  "eventType": "CUSTOM_DEPLOYMENT",
  "timeoutMinutes": 0,
  "attachRules": {
    "tagRule": [
      {
        "meTypes": [
          "HOST"
        ],
        "tags": [
          {
            "context": "CONTEXTLESS",
            "key": "tagname"
          }
        ]
      }
    ]
  },
  "source": "OpsControl",
"deploymentName": "new thing test",
"deploymentVersion": "1.2.3 alpha"
}
*/

// Sends the event to DT using fetch()
async function sendEvent() {
  const req = new Request("https://lzq49041.live.dynatrace.com/api/v1/events", {
    method: "GET",
    headers: {
      Authorization: "Api-Token tlWSX9m6SZSe1duk0TNxA",
    },
  });

  const res = await fetch(req);
  const data = await res.json();
}

// Fetch the ENVVARS and then use them
async function main() {
  const {
    type,
    name,
    not,
    help,
    _: [dir = "."],
  } = parse(Deno.args);

  console.log({
    type,
    name,
    not,
    help,
  });

  const dtenv = Deno.env.get("PLUGIN_DYNATRACE_ENVIRONMENT");
  const dttoken = Deno.env.get("PLUGIN_DYNATRACE_API_TOKEN");
  if (!dtenv || !dttoken) {
    throw Error("Dynatrace Environment AND Token are required");
  }

  const dtTagRule = Deno.env.get("PLUGIN_DYNATRACE_TAG_RULE");
  const dtEntity = Deno.env.get("PLUGIN_DYNATRACE_ENTITY");
  if (!dtTagRule && !dtEntity) {
    throw Error(
      "This plugin requires some way to tie a Drone event to a Dynatrace Monitoring Entity"
    );
  }

  const commitAuthor = Deno.env.get("DRONE_COMMIT_AUTHOR")
    ? Deno.env.get("DRONE_COMMIT_AUTHOR")
    : "Drone CI";
  const commitSha = Deno.env.get("DRONE_COMMIT_SHA")
    ? Deno.env.get("DRONE_COMMIT_SHA")
    : "No Text In Revision";
  const commitMessage = Deno.env.get("DRONE_COMMIT_MESSAGE")
    ? Deno.env.get("DRONE_COMMIT_MESSAGE")
    : "No Text In Changelog";
}

if (import.meta.main) {
  await main();
}
