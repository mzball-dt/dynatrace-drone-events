import { parse } from "https://deno.land/std/flags/mod.ts";

import { meType, EventPostBody } from "./dtEvent.d.ts";

import { inspect } from "https://deno.land/std@0.67.0/node/util.ts";

function validatedtenv(env: string, token: string): boolean {
  return true;
}

async function main() {
  const { entityID, entityType, tagrule, help } = parse(Deno.args);
  if (help) {
    console.log(
      "Usage: \n\tdeno run --allow-env --allow-net ./main.ts [--tagrule <Tag Filter>][--entityID <Monitored Entity>]"
    );
    return;
  }

  // Consume Plugin settings

  const dtenv = Deno.env.get("PLUGIN_DYNATRACE_ENVIRONMENT");
  const dttoken = Deno.env.get("PLUGIN_DYNATRACE_API_TOKEN");
  if (!dtenv || !dttoken)
    throw Error("Dynatrace Environment AND Token are required");

  const dtTagRule = tagrule || Deno.env.get("PLUGIN_DYNATRACE_TAG_RULE");
  const dtEntityType =
    entityType || Deno.env.get("PLUGIN_DYNATRACE_ENTITY_TYPE");
  if (!dtTagRule && !dtEntityType)
    throw Error(
      "This plugin requires a tag and entity type to tie a Drone event to a Dynatrace Entity"
    );

  // Test that we can reach the provided dt env
  if (!validatedtenv(dtenv, dttoken))
    throw new Error(`Unable to reach ${dtenv}`);

  // Consume Drone config

  const commitAuthor = Deno.env.get("DRONE_COMMIT_AUTHOR") ?? "Drone CI";
  const commitSha = Deno.env.get("DRONE_COMMIT_SHA") ?? "No Text In Revision";
  const commitMessage =
    Deno.env.get("DRONE_COMMIT_MESSAGE") ?? "No Text In Changelog";
  const droneProject = Deno.env.get("DRONE_REPO_NAME");
  const droneRepoBranch = Deno.env.get("DRONE_REPO_BRANCH");
  const droneRepoLink = Deno.env.get("DRONE_REPO_LINK");

  const droneBuildLink = Deno.env.get("DRONE_BUILD_LINK");
  const droneBuildEvent = Deno.env.get("DRONE_BUILD_EVENT");
  const droneBuildNumber = Deno.env.get("DRONE_BUILD_NUMBER");

  // Setup API request

  let body: EventPostBody = {
    eventType: "CUSTOM_DEPLOYMENT",
    source: "Drone CI",
    deploymentProject: droneProject,
    attachRules: {
      tagRule: [
        {
          meTypes: [dtEntityType],
          tags: [
            {
              context: "CONTEXTLESS",
              key: tagrule,
            },
          ],
        },
      ],
    },
    ciBackLink: droneBuildLink,
    deploymentName: `${droneBuildEvent} event - build #${droneBuildNumber}`,
    deploymentVersion: `${commitSha} - Build ${droneBuildNumber}`,
  };

  console.log(inspect(body));

  let stringBody: string;
  try {
    stringBody = JSON.stringify(body);
  } catch (e) {
    throw new Error(`Body was invalid JSON: ${e}`);
  }

  const requestOptions: RequestInit = {
    method: "POST",
    headers: {
      Authorization: `Api-Token ${dttoken}`,
    },
    body: stringBody,
  };

  // Send API request

  const req = new Request(`${dtenv}`, requestOptions);

  const res = await fetch(req);
  const data = await res.json();
  console.log(data);
}

if (import.meta.main) {
  try {
    await main();
  } catch (e) {
    console.error(e.toString());
  }
}
