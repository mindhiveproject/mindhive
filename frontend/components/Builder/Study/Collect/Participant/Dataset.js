// useSWR allows the use of SWR inside function components
import useSWR from 'swr';

import { saveAs } from "file-saver";
import { jsonToCSV } from "react-papaparse";

// Write a fetcher function to wrap the native fetch function and return the result of a call to url in json format
const fetcher = (url) => fetch(url).then((res) => res.json());

export default function Dataset({ dataToken }) {

    // Set up SWR to run the fetcher function when calling "/api/staticdata"
    // There are 3 possible states: (1) loading when data is null (2) ready when the data is returned (3) error when there was an error fetching the data
    const { data, error } = useSWR(`/api/data/${dataToken}`, fetcher);

    // Handle the error state
    if (error) return <div>Failed to load</div>;
    // Handle the loading state
    if (!data) return <div>Loading...</div>;
    // Handle the ready state and display the result contained in the data object mapped to the structure of the json file
    
    // trim the data
    const trimmedData = "[" + data.trim().slice(0, -1) + "]";
    
    let results = [];
    if(data) {
        results = JSON.parse(trimmedData);
    }
    // aggregate all data together
    const rows = results
        .map(result => result?.data)
        .reduce((a, b) => a.concat(b), []);

    const download = () => {
        const allKeys = rows
            .map((line) => Object.keys(line))
            .reduce((a, b) => a.concat(b), []);
        const keys = Array.from(new Set(allKeys));
        const csv = jsonToCSV({ fields: keys, data: rows });
        const blob = new Blob([csv], {
          type: "text/csv",
        });
        saveAs(blob, `${dataToken}.csv`);
    }

    return (
        <div>
            <h1>data</h1>
            <button onClick={download}>Download</button>
            <div>
                {JSON.stringify(data)}
            </div>
        </div>
    );
}