// useSWR allows the use of SWR inside function components
import useSWR from "swr";

import { saveAs } from "file-saver";

// A fetcher function to wrap the native fetch function and return the result of a call to url in json format
const fetcher = (url) => fetch(url).then((res) => res.json());

export default function Download({ name, fileAddress }) {
  const { data, error } = useSWR(`/api/templates/${name}/file`, fetcher);

  const download = () => {
    const blob = new Blob([data], {
      type: "text/json",
    });
    saveAs(blob, `${name}.json`);
  };

  return (
    <p>
      <a onClick={download}>Download</a>
    </p>
  );
}
