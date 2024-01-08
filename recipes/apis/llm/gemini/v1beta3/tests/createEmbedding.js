import { base, recipe, code } from "@google-labs/breadboard";

import { starter } from "@google-labs/llm-starter";
import { core } from "@google-labs/core-kit";

/*
To run this: npx breadboard run createEmbedding.js --kit @google-labs/core-kit --kit @google-labs/llm-starter -i "{ \"api_inputs\": {
      \"key\": \"${GEMINI_API_KEY}\",
      \"modelsId\": \"embedding-001\",
      \"application/json\": {
        \"text\":
          \"Hello, my name is Paul and I'm not a large language model. I'm a real boy.\",
        \"model\": \"embedding-001\"
      }
    }
}"
*/

const metaData = {
  title: "Create Embedding",
  description: "Creates an embedding from Gemini (Generated by OpenAPI recipe)",
  version: "0.0.3",
};

/*
 Note currently the tool to generate the OpenAPI spec does not support the security Scheme, therefore secrets will not work, you have to use an input called key.
*/
export default await recipe(() => {
  const input = base.input({ $id: "input" });

  return core.invoke({
    path: "../generativelanguage.models.embedText.json",
    input: input.api_inputs,
    ...input,
    // ...starter.secrets({ keys: ["GEMINI_API_KEY"] }),
  });
}).serialize(metaData);
