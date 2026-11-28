import { scriptedStep } from "./scripted-steps.mjs";
let input = "";
for await (const chunk of process.stdin) input += chunk;
const request = JSON.parse(input);
process.stdout.write(
  JSON.stringify({
    delegation_id: request.delegation_id,
    input_digest: request.input_digest,
    step: scriptedStep(request.messages),
  }),
);
