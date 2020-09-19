import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std/testing/asserts.ts";

import { TagRuleInstance } from "./dtEvent.d.ts";

import { parseTagRules, TagRuleParsingError } from "./main.ts";

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

  const input2 = "HOST=tag1";
  assertEquals(parseTagRules(input2), expectedOutput);

  const input3 = "PROCESS_GROUP_INSTANCE=ENVIRONMENT:tag2";
  const expectedOutput3: Array<TagRuleInstance> = [
    {
      meTypes: ["PROCESS_GROUP_INSTANCE"],
      tags: [
        {
          context: "ENVIRONMENT",
          key: "tag2",
        },
      ],
    },
  ];
  assertEquals(parseTagRules(input3), expectedOutput3);
});

Deno.test("TagRule Parser - expected behaviour - multiple rules", () => {
  const input1 = "HOST=CONTEXTLESS:tag1,PROCESS_GROUP=tag1";
  const input2 = "HOST=CONTEXTLESS:tag1,PROCESS_GROUP=CONTEXTLESS:tag1";
  const input3 = "HOST=tag1,PROCESS_GROUP=tag1";

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

  assertEquals(parseTagRules(input1), expectedOutput);
  assertEquals(parseTagRules(input2), expectedOutput);
  assertEquals(parseTagRules(input3), expectedOutput);

  const input4 = "PROCESS_GROUP=tag1,HOST=tag1";
  const expectedOutput2: Array<TagRuleInstance> = [
    {
      meTypes: ["PROCESS_GROUP"],
      tags: [
        {
          context: "CONTEXTLESS",
          key: "tag1",
        },
      ],
    },
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
  assertEquals(parseTagRules(input4), expectedOutput2);
});

Deno.test(
  "TagRule Parser - expected behaviour - multiple tags in one rule",
  () => {
    const input1 = "HOST=CONTEXTLESS:tag1&&tag2&&tag3";
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

    assertEquals(parseTagRules(input1), expectedOutput);

    const input2 =
      "HOST=AZURE:tag1&&tag2&&tag3,SERVICE_METHOD=ENVIRONMENT:nexttag&&tag with space&&KUBERNETES:othertag,SERVICE=tag1";
    const expectedOutput2: Array<TagRuleInstance> = [
      {
        meTypes: ["HOST"],
        tags: [
          {
            context: "AZURE",
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
      {
        meTypes: ["SERVICE_METHOD"],
        tags: [
          {
            context: "ENVIRONMENT",
            key: "nexttag",
          },
          {
            context: "CONTEXTLESS",
            key: "tag with space",
          },
          {
            context: "KUBERNETES",
            key: "othertag",
          },
        ],
      },
      {
        meTypes: ["SERVICE"],
        tags: [
          {
            context: "CONTEXTLESS",
            key: "tag1",
          },
        ],
      },
    ];

    assertEquals(parseTagRules(input2), expectedOutput2);
  }
);

Deno.test("TagRule Parser - poor input", () => {
  const badinput1 = "HOST=CONTEXTLESS:tag1&&,PROCESS_GROUP=tag1";
  const badinput2 = "HOST=CONTEXTLESS:tag1,";
  const badinput3 = "HOST=CONTEXTLESS:tag1,test";
  const badinput4 = "HOST=CONTEXTLESS:tag1,PROCESS_GROUP_INSTANCE=";
  const badinput5 = "=CONTEXTLESS:tag1";

  assertThrows(() => parseTagRules(badinput1), TagRuleParsingError);
  assertThrows(() => parseTagRules(badinput2), TagRuleParsingError);
  assertThrows(() => parseTagRules(badinput3), TagRuleParsingError);
  assertThrows(() => parseTagRules(badinput4), TagRuleParsingError);
  assertThrows(() => parseTagRules(badinput5), TagRuleParsingError);
});

Deno.test("TagRule Parser - bad input", () => {
  const badinput1 = "TEST=haha:ahahaha";
  const badinput2 = "HOST=haha:ahahaha";
  const badinput3 = "HOST=AZURE:ahahaha";
  // const badinput3 = "HOST=CONTEXTLESS:tag1,test";
  // const badinput4 = "HOST=CONTEXTLESS:tag1,PROCESS_GROUP_INSTANCE";

  // const generatedOutput = parseTagRules(badinput1);
  assertThrows(() => parseTagRules(badinput1), TypeError);
  assertThrows(() => parseTagRules(badinput2), TypeError);
  parseTagRules(badinput3);
});

Deno.test("CustomProp Parser - expected behaviour", () => {});
Deno.test("CustomProp Parser - expected behaviour - complex", () => {});
Deno.test("CustomProp Parser - poor input", () => {});
Deno.test("CustomProp Parser - bad input behaviour", () => {});
