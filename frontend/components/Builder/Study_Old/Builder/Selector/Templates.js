import React, { Component } from 'react';
import { Query } from '@apollo/client/react/components';

import StudyCard from './studyCard';

import { STUDY_TEMPLATES_QUERY } from '../../../Queries/Study';

class StudyTemplates extends Component {
  render() {
    const { createdBy, search, user } = this.props;

    return (
      <Query query={STUDY_TEMPLATES_QUERY}>
        {({ data, error, loading }) => {
          if (loading) return <p>Loading ...</p>;
          if (error) return <p>Error: {error.message}</p>;
          const { myAndPublicStudies } = data;

          const filteredStudies = myAndPublicStudies
            .filter(study => !!study.diagram)
            .filter(
              study =>
                (study?.slug?.includes(search) ||
                  study?.title?.includes(search)) &&
                ((createdBy === 'anyone' && study?.public) ||
                  (createdBy === 'me' &&
                    (study?.author?.id === user?.id ||
                      study?.collaborators
                        ?.map(collaborator => collaborator?.id)
                        .includes(user?.id))))
            );

          return (
            <div className="blocksMenuContent">
              {filteredStudies.map(study => (
                <StudyCard
                  {...this.props}
                  key={study.id}
                  study={study}
                  redirect="d"
                />
              ))}
            </div>
          );
        }}
      </Query>
    );
  }
}

export default StudyTemplates;
