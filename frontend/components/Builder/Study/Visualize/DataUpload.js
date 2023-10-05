import Papa from 'papaparse';

export default function DataUpload ({ setData, studyData }) {

    async function handleDataUpload(e) {
        const form = e.currentTarget;
        const [file] = await form.files;
      
        if (file.type === 'application/json') {
            const text = await file.text();
            const uploadedData = JSON.parse(text);
            console.log(uploadedData);
            setData(uploadedData);
        } else {
            Papa.parse(file, {
                header: true,
                complete: (results) => {
                    console.log(results.data)
                    setData(results.data);
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
            
            <button onClick={ () => setData([...studyData]) }>
                Use study data
            </button>
        </div>
    )

}