// https://uiwjs.github.io/react-codemirror/#/theme/home

import {
  AccordionTitle,
  AccordionContent,
  Accordion,
  Icon,
} from "semantic-ui-react";

import { useState, useCallback } from "react";

import { python } from "@codemirror/lang-python";
import CodeMirror from "@uiw/react-codemirror";

export default function CodeEditor({ code, handleContentChange, runCode }) {
  const [activeIndex, setActiveIndex] = useState(-1);

  const handleClick = (e, titleProps) => {
    const { index } = titleProps;
    const newIndex = activeIndex === index ? -1 : index;
    setActiveIndex(newIndex);
  };

  const onChange = useCallback((val, viewUpdate) => {
    handleContentChange({
      newContent: {
        code: val,
      },
    });
  }, []);

  return (
    <>
      <div>
        <button onClick={() => runCode({ code })}>Run the code</button>
      </div>
      <Accordion>
        <AccordionTitle
          active={activeIndex === 0}
          index={0}
          onClick={handleClick}
        >
          <Icon name="dropdown" />
          Code editor
        </AccordionTitle>
        <AccordionContent active={activeIndex === 0}>
          <CodeMirror
            value={code}
            extensions={python()}
            onChange={onChange}
            theme="light"
          />
        </AccordionContent>
      </Accordion>
    </>
  );
}
