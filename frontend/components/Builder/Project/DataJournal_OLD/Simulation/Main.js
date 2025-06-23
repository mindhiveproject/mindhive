import OpenAI from "openai";

import { openAiKey } from "../../../../../config";

const openai = new OpenAI({
  apiKey: openAiKey,
  dangerouslyAllowBrowser: true,
});

export default async function simulateDataWithAI({
  exampleDataset,
  exampleVariables,
  hypothesisPrompt,
  sampleSize,
}) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      {
        role: "user",
        content: `
          I need you to return simulated data of exactly ${sampleSize} subjects. 
          The data structure should be similar to the following example of a dataset.

          ${JSON.stringify(exampleDataset)}

          The variables are the following ones

           ${JSON.stringify(exampleVariables)}

          The data should be matching the following hypothesis

          ${hypothesisPrompt}

          Return only the data in the json format.
        `,
      },
    ],
  });

  const content = completion.choices[0].message?.content;
  const response_message = content.split("```");
  const jsonContent = response_message[1].replace("json", "");
  const data = JSON.parse(jsonContent);

  return data;
}
