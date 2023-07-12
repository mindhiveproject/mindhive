import React, { Component } from 'react';
import { Dropdown } from 'semantic-ui-react';

export default class Drop extends Component {
  render() {
    const { tags, study, engine } = this.props;
    const values = study?.tags || [];
    return (
      <DropdownExampleMultipleSelection
        tags={tags}
        values={values}
        handleTagsUpdate={this.props.handleTagsUpdate}
        engine={engine}
      />
    );
  }
}

const DropdownExampleMultipleSelection = ({
  tags,
  values,
  handleTagsUpdate,
  engine,
}) => {
  const onChange = (event, data) => {
    handleTagsUpdate(data.value);
  };

  return (
    <Dropdown
      placeholder="Search for tags"
      fluid
      multiple
      search
      selection
      options={tags}
      onChange={onChange}
      value={values}
      onFocus={() => {
        if (engine) {
          engine.getModel().setLocked(true);
        }
      }}
      onBlur={() => {
        if (engine) {
          engine.getModel().setLocked(false);
        }
      }}
    />
  );
};
