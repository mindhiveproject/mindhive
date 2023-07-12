import { GET_ALL_CLASSES } from "../../../Queries/Classes";
import { Dropdown } from "semantic-ui-react";
import { useQuery } from "@apollo/client";

export default function NetworkForm({ inputs, handleChange }) {
  const { data, loading, error } = useQuery(GET_ALL_CLASSES);
  const classes = data?.classes || [];

  const options = classes.map((cl) => ({
    key: cl.id,
    text: cl.title,
    value: cl.id,
  }));

  const value = inputs?.classes?.map((cl) => cl?.id);

  const onChange = (event, data) => {
    handleChange({
      target: {
        name: "classes",
        value: data.value.map((id) => ({ id: id })),
      },
    });
  };

  return (
    <div>
      <h2>Edit the class network</h2>
      <div>
        <label htmlFor="title">
          <p>Title</p>
          <input
            type="text"
            id="title"
            name="title"
            value={inputs.title}
            onChange={handleChange}
            required
          />
        </label>

        <label htmlFor="description">
          <p>Description</p>
          <input
            type="text"
            id="description"
            name="description"
            value={inputs.description}
            onChange={handleChange}
            required
          />
        </label>

        <label htmlFor="classes">
          <p>Classes</p>
          <div>
            <Dropdown
              placeholder="Type class name"
              fluid
              multiple
              search
              selection
              options={options}
              value={value}
              onChange={onChange}
            />
          </div>
        </label>
      </div>
    </div>
  );
}
