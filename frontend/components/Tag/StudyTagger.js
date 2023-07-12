import React, { Component } from 'react';
import { Query } from '@apollo/client/react/components';

import { TAGS_QUERY } from '../Queries/Tag';

import Drop from './Drop';

export default class StudyTagger extends Component {
  handleTagsUpdate = value => {
    this.props.updateStudyState('tags', value);
  };

  render() {
    return (
      <Query query={TAGS_QUERY}>
        {({ data, error, loading }) => {
          if (loading) return <p>Loading ...</p>;
          if (error) return <p>Error: {error.message}</p>;
          const tags = data?.tags || [];
          const tagValues = tags.map(tag => ({
            key: tag.id,
            text: tag.title,
            value: tag.id,
          }));

          return (
            <div>
              <h2>Study tags</h2>
              <p>Choose keywords for your study.</p>
              <Drop
                study={this.props.study}
                engine={this.props.engine}
                tags={tagValues}
                handleTagsUpdate={this.handleTagsUpdate}
              />
            </div>
          );
        }}
      </Query>
    );
  }
}
