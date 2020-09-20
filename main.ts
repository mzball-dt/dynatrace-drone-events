import { parse } from "https://deno.land/std/flags/mod.ts";

import {
  meType,
  EventPostBody,
  TagRuleInstance,
  tagDescription,
  tagContext,
  CustomPropertyObject,
} from "./dtEvent.d.ts";

import {
  meType as meTypeStrings,
  tagContext as tagContextStrings,
} from "./validStrings.ts";

export class TagRuleParsingError extends Error {
  constructor(message?: string) {
    super(message);
    // see: typescriptlang.org/docs/handbook/release-notes/typescript-2-2.html
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
    this.name = TagRuleParsingError.name; // stack traces display correctly now
  }
}

export class CustomPropParsingError extends Error {
  constructor(message?: string) {
    super(message);
    // see: typescriptlang.org/docs/handbook/release-notes/typescript-2-2.html
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
    this.name = CustomPropParsingError.name; // stack traces display correctly now
  }
}

function validatedtenv(env: string, token: string): boolean {
  return true;
}

function usage(): string {
  return "Usage: \n\tdeno run --allow-env --allow-net ./main.ts [--tagrule <Tag Filter>][--entityID <Monitored Entity>]";
}

export function parseTagRules(input: string): Array<TagRuleInstance> {
  // Tags are provided in comma separated arrays
  const tagRules: Array<string> = input.split(",");

  let output: Array<TagRuleInstance> = [];
  for (const iterator of tagRules) {
    // if this element of the input array doesn't have at least an input side error
    if (!iterator.match(/.+=.+/))
      throw new TagRuleParsingError(
        `Tag Rule parsing problem - component was found to be an empty string in '${iterator}'.  Total tagRule string is: '${input}'`
      );

    // pull out the meType of the tagging rule and ensure it's valid
    const entityTypeTagNamePairs = iterator.split("=");
    const mtype: meType = entityTypeTagNamePairs[0] as meType;
    if (!Object.values(meTypeStrings).find((x) => x === mtype)) {
      throw new TypeError(`'${mtype} is not a valid meType'`);
    }

    // pull out the tag and context elements from the rhs of the k/v pair
    const listedTags: Array<tagDescription> = entityTypeTagNamePairs[1]
      .split("&&")
      .map((_) => {
        // If our context:tag value is empty throw an error
        if (_ == "")
          throw new TagRuleParsingError(
            `Tag Rule parsing problem - component was found to be an empty string in '${iterator}'.  Total tagRule string is: '${input}'`
          );

        // Pull apart the context and tag, checking the context for known good values
        const contextortag: Array<string> = _.split(":");
        const intendedContext =
          contextortag.length > 1
            ? (contextortag[0] as tagContext)
            : ("CONTEXTLESS" as tagContext);
        if (
          !Object.values(tagContextStrings).find((x) => x === intendedContext)
        ) {
          throw new TypeError(`'${intendedContext} is not a valid tagContext'`);
        }

        // Return the object that represents this context:tag component
        return {
          context: intendedContext,
          key: contextortag[contextortag.length - 1],
        };
      });

    // Assemble the complete Tagging Rule and add to the output array
    const ruleinst: TagRuleInstance = {
      meTypes: [mtype],
      tags: listedTags,
    };
    output.push(ruleinst);
  }

  return output;
}

export function parseCustomProps(input: string): CustomPropertyObject {
  const customPropPairs = input.split(",");

  let output: CustomPropertyObject = {};
  for (const iterator of customPropPairs) {
    const keypair = iterator.trim();
    if (keypair == "") continue;
    const [k, ...v] = keypair.split("=");

    if (!k)
      throw new CustomPropParsingError(
        `Unable to find key on left hand side of '=' in ${iterator}`
      );

    const v2 = v.join("") == "" ? undefined : v.join("=");

    output[k] = v2 ?? undefined;
  }

  return output;
}

async function main() {
  const { tagrule, help } = parse(Deno.args);
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

  const dtCustomPropString = Deno.env.get("PLUGIN_CUSTOMPROPERTIES") ?? "";

  // Test that we can reach the provided dt env
  if (!validatedtenv(dtenv, dttoken))
    throw new Error(`Unable to reach ${dtenv}`);

  // Consume Drone config

  const commitAuthor = Deno.env.get("DRONE_COMMIT_AUTHOR") ?? "Drone CI";
  const commitSha = Deno.env.get("DRONE_COMMIT_SHA") ?? "No Text In Revision";
  const commitMessage =
    Deno.env.get("DRONE_COMMIT_MESSAGE") ?? "No Text In Changelog";
  const droneRepo = Deno.env.get("DRONE_REPO");
  const droneRepoBranch = Deno.env.get("DRONE_REPO_BRANCH");
  // const droneRepoLink = Deno.env.get("DRONE_REPO_LINK");

  const droneBuildLink = Deno.env.get("DRONE_BUILD_LINK");
  const droneBuildEvent = Deno.env.get("DRONE_BUILD_EVENT");
  const droneBuildNumber = Deno.env.get("DRONE_BUILD_NUMBER");
  const droneBuildStatus = Deno.env.get("DRONE_BUILD_STATUS");

  const droneCustomProps = {
    deploymentBuild: `Build #${droneBuildNumber}`,
    commitAuthor: `${commitAuthor}`,
    commitMessage: `${commitMessage}`,
    buildStatus: `${droneBuildStatus}`,
  };

  // Setup API request
  const tagRules = parseTagRules(dtTagRules);
  const dtcustomProps = parseCustomProps(dtCustomPropString);

  // Combine the extended props we pull from Drone with the custom props provided by the user
  const customProps = Object.assign(droneCustomProps, dtcustomProps);

  let body: EventPostBody = {
    eventType: "CUSTOM_DEPLOYMENT",
    source: "Drone CI",
    deploymentProject: `${droneRepo}`,
    attachRules: {
      tagRule: tagRules,
    },
    deploymentName: `${droneBuildEvent} to ${droneRepo}:${droneRepoBranch} - Build #${droneBuildNumber}`,
    deploymentVersion: `${commitSha}`,
    customProperties: customProps,
  };

  if (droneBuildEvent == "tag")
    body.deploymentVersion = Deno.env.get("DRONE_TAG");
  if (droneBuildEvent == "pull_request")
    body.deploymentVersion = Deno.env.get("DRONE_PULL_REQUEST");

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
