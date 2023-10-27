"use client";

import { useState } from "react";

async function UploadFile({ name, script, file }) {
  const data = {
    name,
    script,
    file,
  };

  const res = await fetch("/api/templates/upload", {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      Accept: "application/json", // eslint-disable-line quote-props
      "Content-Type": "application/json",
    },
  });

  const dat = await res.json();

  return {
    scriptAddress: dat?.message?.scriptAddress,
    fileAddress: dat?.message?.fileAddress,
  };
}

export default UploadFile;
