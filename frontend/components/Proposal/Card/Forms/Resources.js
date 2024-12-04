import { useQuery } from "@apollo/client";
import { GET_RESOURCES } from "../../../Queries/Resource";

import { Dropdown } from "semantic-ui-react";

export default function Resources({ handleChange, selectedResources }) {
  const { data, error, loading } = useQuery(GET_RESOURCES);

  const resources = data?.resources || [];

  const resourceOptions = resources.map((resource) => ({
    key: resource.id,
    text: resource.title,
    value: resource.id,
  }));

  const onChange = (event, data) => {
    handleChange({
      target: {
        name: "resources",
        value: data.value.map((resource) => ({
          id: resource,
        })),
      },
    });
  };

  return (
    <Dropdown
      placeholder="Type resource"
      fluid
      multiple
      search
      selection
      lazyLoad
      options={resourceOptions}
      onChange={onChange}
      value={selectedResources}
    />
  );
}