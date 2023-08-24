/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Board } from "@google-labs/breadboard";
import { Starter } from "@google-labs/llm-starter";

import { PromptMaker } from "./template.js";

const BASE = "v2-multi-agent";

const maker = new PromptMaker(BASE);

const board = new Board();
const kit = board.addKit(Starter);

// Inputs
const prologue = board.passthrough({ $id: "prologue" });
const epilogue = board.passthrough({ $id: "epilogue" });
const schema = board.passthrough({ $id: "schema" });

// Outputs
const $error = board.passthrough({ $id: "error" });
const $completion = board.passthrough({ $id: "completion" });

// Template
const template = await maker.prompt("schemish-generator", "schemishGenerator");

// Wire all useful parts of the input.
board
  .input()
  .wire("prologue->", prologue)
  .wire("epilogue->", epilogue)
  .wire("schema->", schema);

// Wire outputs.
board.output().wire("<-error", $error).wire("<-completion", $completion);

// TODO: Construct schemish converter.
// For now, this will be a passthrough.
const convertToSchemish = board.passthrough({ $id: "schemish" });
schema.wire("schema->", convertToSchemish);

// TODO: Construst JSON Schema validator.
const validateJSON = board.passthrough({ $id: "validateJSON" });
validateJSON.wire("json->", $completion).wire("error->", $error);

const generator = kit
  .generateText({
    stopSequences: ["Tool:", "Customer:", "\n\n"],
    safetySettings: [
      {
        category: "HARM_CATEGORY_DEROGATORY",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
    ],
  })
  .wire("<-PALM_KEY.", kit.secrets(["PALM_KEY"]))
  .wire("completion->", validateJSON)
  .wire("filters->error", $error);

const prompt = kit
  .promptTemplate(...template)
  .wire("<-prologue", prologue)
  .wire("<-epilogue", epilogue)
  .wire("<-schemish", convertToSchemish);

export const schemishGenerator = board;
