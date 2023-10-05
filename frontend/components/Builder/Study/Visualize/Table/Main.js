import DataTable from 'react-data-table-component';

// helper function to get all column names of the given dataset
const getColumnNames = (data) => {
    const allKeys = data
      .map((line) => Object.keys(line))
      .reduce((a, b) => a.concat(b), []);
    const keys = Array.from(new Set(allKeys)).sort();
    return keys;
  };

export default function Table({ data }) {

    const columns = getColumnNames(data).map(variable => ({ 
        name: variable,  
        selector: row => row[variable]
    }))

    return (
        <div className='dataTable'>
            <DataTable
                columns={columns}
                data={data}
            />
        </div>
       
    );
};