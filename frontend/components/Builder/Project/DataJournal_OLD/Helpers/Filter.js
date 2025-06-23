// filter the array of data according to the settings

// an example structure of the filter object inside the settings
// {
//     "filter": {
//         "anxiety": {
//             "filterType": "text",
//             "type": "contains",
//             "filter": "100"
//         }
//     }
// }

// Types of filter
////// TEXT ("filterType": "text")
// contains
// does not contain
// equals
// does not equal
// begins with
// ends with
// blank
// not blank

// NUMBER ("filterType": "number")
// greaterThan
// greaterThanOrEqual
// lessThan
// lessThanOrEqual
// inRange

const checkFilter = ({ row, filter, key }) => {
  const { type } = filter[key];

  if (type === "contains") {
    return row[key].includes(filter[key]?.filter);
  }
  if (type === "notContains") {
    return !row[key].includes(filter[key]?.filter);
  }
  if (type === "equals") {
    return row[key] == filter[key]?.filter;
  }
  if (type === "notEqual") {
    return row[key] != filter[key]?.filter;
  }
  if (type === "startsWith") {
    return row[key].startsWith(filter[key]?.filter);
  }
  if (type === "endsWith") {
    return row[key].endsWith(filter[key]?.filter);
  }
  if (type === "blank") {
    return !row[key];
  }
  if (type === "notBlank") {
    return !!row[key];
  }
  // specifically for numbers
  if (type === "greaterThan") {
    return row[key] > filter[key]?.filter;
  }
  if (type === "greaterThan") {
    return row[key] > filter[key]?.filter;
  }
  if (type === "greaterThanOrEqual") {
    return row[key] >= filter[key]?.filter;
  }
  if (type === "lessThan") {
    return row[key] < filter[key]?.filter;
  }
  if (type === "lessThanOrEqual") {
    return row[key] <= filter[key]?.filter;
  }
  if (type === "inRange") {
    return row[key] > filter[key]?.filter && row[key] < filter[key]?.filterTo;
  }
};

export default function filterData({ data, settings }) {
  let filteredData;
  if (settings && settings?.filter && Object.keys(settings?.filter).length) {
    const { filter } = settings;
    const filterKeys = Object.keys(filter);
    filteredData = data.filter((row) => {
      return filterKeys.every((key) => checkFilter({ row, filter, key }));
    });
  } else {
    filteredData = data;
  }
  return filteredData;
}

export function renameData({ data, variables }) {
  return data.map((obj) => {
    const newObj = {};
    Object.keys(obj).forEach((key) => {
      const mapping = variables.find((m) => m.field === key);
      const newKey = mapping && mapping.displayName ? mapping.displayName : key;
      newObj[newKey] = obj[key];
    });
    return newObj;
  });
}
