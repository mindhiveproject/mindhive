import { useState } from "react";

import OpenAI from "openai";

import { StyledChatGPTPage } from "../../../../styles/StyledBuilder";
import { openAiKey } from "../../../../../config";

const openai = new OpenAI({
  apiKey: openAiKey,
  dangerouslyAllowBrowser: true,
});

export default function ChatGPT({ spec, setSpec, data }) {
  const [textInput, setTextInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [explanation, setExplanation] = useState("");

  // here we can provide only a sample of data or any additional information that help ChatGPT to figure out the best graph
  const dataForGPT = data.slice(0, 10);

  async function GPTCall(text) {
    setGenerating(true);
    const messages = [
      {
        // You provide no explanations in your responses.
        role: "system",
        content: `
            You are a graphing assistant that uses Vega Lite v5 to create graphs in JavaScript. You always include the formatted JSON code (as JSON) in your response.
            You always provide an explanation for why chose that graph.
            You will make the graphs a width and height of 400 by 400. You must always specify the dimensions.
            You are creating graphs that visualize data obtained from a study.
             `,
      },
      //You do not need to include the data in the code, since you will instead write: "data": { "name": "table" },
      {
        role: "user",
        content:
          text +
          ". The data includes different tags nested within each other. Each key is a different task conducted by a participant of the study. This is the data: " +
          JSON.stringify(dataForGPT),
      },
    ];

    const response = await openai.chat.completions.create({
      messages: messages,
      model: "gpt-3.5-turbo-0613",
      //functions: functions,
      //function_call: 'auto'
    });

    let response_message = response["choices"][0]["message"]["content"];
    response_message = response_message.split("```");
    const vega_JSON = response_message[1].replace("json", "");

    let response_text = response_message[0];
    if (typeof response_message[2] != "undefined") {
      response_text = response_text + response_message[2];
    }
    setGenerating(false);
    //if ("function_call" in response_message) {
    const function_response = JSON.parse(vega_JSON);
    console.log({ function_response });
    function_response.data = { name: "values" };
    setSpec(function_response);
    setExplanation(response_text);
    //}
  }

  function handleSubmit(e) {
    e.preventDefault();
    GPTCall(textInput);
  }

  return (
    <StyledChatGPTPage>
      <div>
        <h1 className="title">What kind of graph are you looking for?</h1>
        <form onSubmit={handleSubmit}>
          <input
            className="promptInput"
            style={{ width: "400px" }}
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            disabled={generating}
          />
        </form>
        <p className="subtitle">
          Type in natural language the graph that you’d like or ask for the best
          graph for your data
        </p>
        {generating ? <p className="subtitle">Generating answer...</p> : null}
        <p className="text">{explanation}</p>
      </div>
    </StyledChatGPTPage>
  );
}
