import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std/testing/asserts.ts";

import { TagRuleInstance, CustomPropertyObject } from "./dtEvent.d.ts";

import {
  parseTagRules,
  TagRuleParsingError,
  parseCustomProps,
  CustomPropParsingError,
} from "./main.ts";

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

Deno.test("CustomProp Parser - expected behaviour", () => {
  const input1 = "TESTProp=Value";
  const expectedOutput1: CustomPropertyObject = {
    TESTProp: "Value",
  };
  assertEquals(parseCustomProps(input1), expectedOutput1);

  const input2 = "foo=bar,value2=othervalue";
  const expectedOutput2: CustomPropertyObject = {
    foo: "bar",
    value2: "othervalue",
  };
  assertEquals(parseCustomProps(input2), expectedOutput2);

  const input3 = "";
  assertEquals(parseCustomProps(input3), {});
});
Deno.test("CustomProp Parser - expected behaviour - complex", () => {
  const input2 = "foo=";
  const expectedOutput2: CustomPropertyObject = {
    foo: undefined,
  };
  assertEquals(parseCustomProps(input2), expectedOutput2);

  const input2a = "foo=,foo2=bar";
  const input2b = "foo2=bar,foo=";
  const expectedOutput2a: CustomPropertyObject = {
    foo: undefined,
    foo2: "bar",
  };
  assertEquals(parseCustomProps(input2a), expectedOutput2a);
  assertEquals(parseCustomProps(input2b), expectedOutput2a);

  const input3 = "val1=part1=part2ofval,value2=othervalue";
  const expectedOutput3: CustomPropertyObject = {
    val1: "part1=part2ofval",
    value2: "othervalue",
  };
  assertEquals(parseCustomProps(input3), expectedOutput3);
});
Deno.test("CustomProp Parser - poor input", () => {
  const input1 = "ow=1,ow=2,ow=3,ow=4";
  const expectedOutput1: CustomPropertyObject = {
    ow: "4",
  };
  assertEquals(parseCustomProps(input1), expectedOutput1);

  const input2 = "v=1,,c=2";
  const input2a = ",v=1,c=2";
  const input2b = "v=1,c=2,";
  const expectedOutput2: CustomPropertyObject = {
    v: "1",
    c: "2",
  };
  assertEquals(parseCustomProps(input2), expectedOutput2);
  assertEquals(parseCustomProps(input2a), expectedOutput2);
  assertEquals(parseCustomProps(input2b), expectedOutput2);

  const input3 = "=2,v=1";
  const input4 = "v=1,=2";
  assertThrows(() => parseCustomProps(input3), CustomPropParsingError);
  assertThrows(() => parseCustomProps(input4), CustomPropParsingError);

  const input5 = "==";
  assertThrows(() => parseCustomProps(input5), CustomPropParsingError);

  const input6 = ",,";
  assertEquals(parseCustomProps(input6), {});
});
