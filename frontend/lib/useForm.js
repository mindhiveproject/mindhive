import { useState, useEffect } from "react";
import Resizer from "react-image-file-resizer";

export function dataURItoBlob(dataURI) {
  const binary = atob(dataURI.split(",")[1]);
  const array = [];
  for (let i = 0; i < binary.length; i++) {
    array.push(binary.charCodeAt(i));
  }
  return new Blob([new Uint8Array(array)], { type: "image/jpeg" });
}

export default function useForm(initial = {}) {
  // create a state object for our inputs
  const [inputs, setInputs] = useState(initial);
  const initialValues = Object.values(initial).join();

  // use effect to update the data (when they are coming)
  useEffect(() => {
    // this function runs when the things we are watching change
    setInputs(initial);
  }, [initialValues]);

  function handleChange(e) {
    let { value, name, type } = e.target;
    // console.log(value, name, type);

    if (type === "number") {
      value = parseFloat(value);
    }
    // if (name === "isPublic") {
    //   value = value === "on";
    // }
    if (type === "file") {
      [value] = e.target.files;
    }
    if (type === "checkbox") {
      value = e.target.checked;
    }
    if (type === "data") {
      value = dataURItoBlob(value);
    }

    setInputs({
      ...inputs,
      [name]: value,
    });
  }

  // update several key-values at once, obj is an object
  function handleMultipleUpdate(obj) {
    setInputs({
      ...inputs,
      ...obj,
    });
  }

  function toggleBoolean(e) {
    let { name } = e.target;
    setInputs({
      ...inputs,
      [name]: !inputs[name],
    });
  }

  function toggleSettingsBoolean(e) {
    let { name } = e.target;
    setInputs({
      ...inputs,
      settings: {
        ...inputs.settings,
        [name]: !inputs[name],
      },
    });
  }

  // function handleObjectChange(e, obj) {
  //   const { value, name, type } = e.target;
  //   setInputs({
  //     ...inputs,
  //     [obj]: {
  //       ...inputs[obj],
  //       [name]: value,
  //     },
  //   });
  // }

  const resizeFile = (file, format) =>
    new Promise((resolve) => {
      Resizer.imageFileResizer(
        file,
        1000,
        1000,
        "WEBP",
        90,
        0,
        (uri) => {
          resolve(uri);
        },
        format
      );
    });

  // async function captureThumbnail(e) {
  //   let { value, name } = e.target;
  //   [value] = e.target.files;

  //   // check the format of file
  //   const supportedFormats = [
  //     "image/apng",
  //     "image/avif",
  //     "image/svg+xml",
  //     "image/webp",
  //     "image/jpeg",
  //     "image/jpg",
  //     "image/png",
  //     "image/gif",
  //   ];
  //   if (!supportedFormats.includes(value?.type)) {
  //     alert("Unknown format of the file");
  //     return;
  //   }
  //   // check the size of file
  //   if (value?.size > 10 * 1000000) {
  //     alert("The file is too big. Please choose a file smaller than 10 Mb.");
  //     return;
  //   }
  //   const thumbnailUri = await resizeFile(value, "base64");
  //   setInputs({
  //     ...inputs,
  //     thumbnailUri,
  //     file: value,
  //   });
  // }

  async function captureFile(e, saveAs = "file") {
    const { name } = e.target;
    const [value] = e.target.files;

    // check the format of file
    const supportedFormats = [
      "image/apng",
      "image/avif",
      "image/svg+xml",
      "image/webp",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
    ];

    if (!supportedFormats.includes(value?.type)) {
      alert("Unknown format of the file");
      return;
    }

    // check the size of file
    if (value?.size > 100 * 1000000) {
      alert("The file is too big. Please choose a file smaller than 100 Mb.");
      return;
    }

    const file = await resizeFile(value, "file");

    setInputs({
      ...inputs,
      [saveAs]: file,
      image: {
        image: {
          publicUrlTransformed: URL.createObjectURL(file),
        },
      },
    });
  }

  function resetForm() {
    setInputs(initial);
  }

  function clearForm() {
    const blankState = Object.fromEntries(
      Object.entries(inputs).map(([key, value]) => [key, ""])
    );
    setInputs(blankState);
  }

  return {
    inputs,
    handleChange,
    handleMultipleUpdate,
    toggleBoolean,
    toggleSettingsBoolean,
    // handleObjectChange,
    // captureThumbnail,
    captureFile,
    resetForm,
    clearForm,
  };
}
