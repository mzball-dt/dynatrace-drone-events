import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std/testing/asserts.ts";

import { TagRuleInstance } from "./dtEvent.d.ts";

import { parseTagRules } from "./main.ts";

Deno.test("TagRule Parser - expected behaviour - one rule", () => {
  const input1 = "HOST=CONTEXTLESS:tag1";
  const expectedOutput: Array<TagRuleInstance> = [
    {
      meTypes: ["HOST"],
      tags: [
        {
          context: "CONTEXTLESS",
          key: "tag1",
        },
      ],
    },
  ];

  const generatedOutput = parseTagRules(input1);
  assertEquals(generatedOutput, expectedOutput);
});

Deno.test("TagRule Parser - expected behaviour - multiple rules", () => {
  const input2 = "HOST=CONTEXTLESS:tag1,PROCESS_GROUP=tag1";
  const expectedOutput: Array<TagRuleInstance> = [
    {
      meTypes: ["HOST"],
      tags: [
        {
          context: "CONTEXTLESS",
          key: "tag1",
        },
      ],
    },
    {
      meTypes: ["PROCESS_GROUP"],
      tags: [
        {
          context: "CONTEXTLESS",
          key: "tag1",
        },
      ],
    },
  ];

  const generatedOutput = parseTagRules(input2);
  assertEquals(generatedOutput, expectedOutput);
});

Deno.test(
  "TagRule Parser - expected behaviour - multiple tags in one rule",
  () => {
    const input3 = "HOST=CONTEXTLESS:tag1&&tag2&&tag3";
    const expectedOutput: Array<TagRuleInstance> = [
      {
        meTypes: ["HOST"],
        tags: [
          {
            context: "CONTEXTLESS",
            key: "tag1",
          },
          {
            context: "CONTEXTLESS",
            key: "tag2",
          },
          {
            context: "CONTEXTLESS",
            key: "tag3",
          },
        ],
      },
    ];

    const generatedOutput = parseTagRules(input3);
    assertEquals(generatedOutput, expectedOutput);
  }
);

Deno.test("TagRule Parser - bad input", () => {
  const input4 = "HOST=CONTEXTLESS:tag1,PROCESS_GROUP=tag1";
  const expectedOutput: Array<TagRuleInstance> = [
    {
      meTypes: ["HOST"],
      tags: [
        {
          context: "CONTEXTLESS",
          key: "tag1",
        },
      ],
    },
    {
      meTypes: ["PROCESS_GROUP"],
      tags: [
        {
          context: "CONTEXTLESS",
          key: "tag1",
        },
      ],
    },
  ];

  const generatedOutput = parseTagRules(input4);
  assertEquals(generatedOutput, expectedOutput);
});
