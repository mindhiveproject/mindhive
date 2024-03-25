import useSWR from "swr";
import PartManager from "./PartManager";

// A fetcher function to wrap the native fetch function and return the result of a call to url in json format
const fetcher = (url) => fetch(url).then((res) => res.json());

export default function UploadedDataWrapper({
  user,
  studyId,
  pyodide,
  journal,
  part,
  setPart,
}) {
  const { year, month, day, token } = part?.content?.uploaded?.address;
  const { variables } = part?.content?.uploaded?.metadata;
  // Set up SWR to run the fetcher function when calling "/api/staticdata"
  // There are 3 possible states: (1) loading when data is null (2) ready when the data is returned (3) error when there was an error fetching the data
  const { data, error } = useSWR(
    `/api/data/${year}/${month}/${day}/${token}?type=upload`,
    fetcher
  );
  // Handle the error state
  if (error) return <div></div>;
  // Handle the loading state
  if (!data) return <div>Loading...</div>;
  // Handle the ready state and display the result contained in the data object mapped to the structure of the json file

  // trim the data
  const trimmedData = "[" + data.trim().slice(0, -1) + "]";

  let results = [];
  let uploadedData = [];
  if (trimmedData) {
    results = JSON.parse(trimmedData);
    uploadedData = results[0].data;
  }

  return (
    <PartManager
      user={user}
      studyId={studyId}
      pyodide={pyodide}
      journal={journal}
      part={part}
      setPart={setPart}
      initData={uploadedData}
      initVariables={variables}
      components={[]}
    />
  );
}
