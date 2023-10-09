import Papa from 'papaparse';

// helper function to get all column names of the given dataset
const getColumnNames = (data) => {
    const allKeys = data
      .map((line) => Object.keys(line))
      .reduce((a, b) => a.concat(b), []);
    const keys = Array.from(new Set(allKeys)).sort();
    return keys;
  };

export default function DataUpload ({ setData, setVariables, studyData }) {

    async function handleDataUpload(e) {
        const form = e.currentTarget;
        const [file] = await form.files;
      
        if (file.type === 'application/json') {
            const text = await file.text();
            const uploadedData = JSON.parse(text);
            console.log(uploadedData);
            setData(uploadedData);
            setVariables(getColumnNames(uploadedData));
        } else {
            Papa.parse(file, {
                header: true,
                complete: (results) => {
                    console.log(results.data)
                    setData(results.data);
                    setVariables(getColumnNames(results.data));
                },
                error: (error) => {
                    console.log(error)
                }
            })
        }
      }

    return (
        <div className='buttons'>
            <label htmlFor="fileUpload">
                <input type="file" id="fileUpload" style={{display: 'none'}} onChange={handleDataUpload}/>
                Choose the data file
            </label>
            
            <button onClick={ () => {
                setData([...studyData]) 
                setVariables(getColumnNames(studyData));
            }}>
                Use study data
            </button>
        </div>
    )

}