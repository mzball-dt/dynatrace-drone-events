import { parse } from "https://deno.land/std/flags/mod.ts";

import {
  meType,
  EventPostBody,
  TagRuleInstance,
  tagDescription,
  tagContext,
} from "./dtEvent.d.ts";

function validatedtenv(env: string, token: string): boolean {
  return true;
}

function usage(): string {
  return "Usage: \n\tdeno run --allow-env --allow-net ./main.ts [--tagrule <Tag Filter>][--entityID <Monitored Entity>]";
}

function parseTagRules(input: string): Array<TagRuleInstance> | any {
  const tagRules = input.split(",");

  let output: Array<TagRuleInstance> = [];

  for (const iterator of tagRules) {
    const mtype: meType = <meType>iterator.split("=")[0];
    const listedTags: Array<tagDescription> = iterator
      .split("=")[1]
      .split("&&")
      .map((_) => {
        const contextortag: Array<string> = _.split(":");
        return {
          context:
            contextortag.length > 1
              ? <tagContext>contextortag[0]
              : <tagContext>"CONTEXTLESS",
          key: contextortag[contextortag.length - 1],
        };
      });

    const ruleinst: TagRuleInstance = {
      meTypes: [mtype],
      tags: listedTags,
    };

    output.push(ruleinst);
  }

  return output;
}

async function main() {
  const { entityID, entityType, tagrule, help } = parse(Deno.args);
  if (help) {
    return console.log(usage());
  }

  // Consume Plugin settings

  const dtenv = Deno.env.get("PLUGIN_DYNATRACE_ENVIRONMENT");
  const dttoken = Deno.env.get("PLUGIN_DYNATRACE_API_TOKEN");
  if (!dtenv || !dttoken)
    throw Error("Dynatrace Environment AND Token are required");

  const dtTagRules = tagrule || Deno.env.get("PLUGIN_TAGRULES");
  if (!dtTagRules)
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
  const tagRules = parseTagRules(dtTagRules);

  let body: EventPostBody = {
    eventType: "CUSTOM_DEPLOYMENT",
    source: "Drone CI",
    deploymentProject: droneProject,
    attachRules: {
      tagRule: tagRules,
    },
    deploymentName: `${droneBuildEvent} event - Build #${droneBuildNumber}`,
    deploymentVersion: `${commitSha} - Build ${droneBuildNumber}`,
  };

  if (droneBuildLink) body.ciBackLink = droneBuildLink;

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
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: stringBody,
  };

  // Send API request

  const req = new Request(`${dtenv}/api/v1/events`, requestOptions);

  const res = await fetch(req);
  const data = await res.json();
  console.log(data);
}

if (import.meta.main) {
  await main();
}

export { parseTagRules };
