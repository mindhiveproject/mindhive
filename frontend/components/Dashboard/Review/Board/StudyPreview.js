import { useQuery } from "@apollo/client";
import Head from "next/head";
import Link from "next/link";
import ReactHtmlParser from "react-html-parser";

import { STUDY_TO_DISCOVER } from "../../../Queries/Study";

import { StyledStudyPage } from "../../../styles/StyledStudyPage";

export default function StudyPreview({ user, proposal }) {
  const { data, error, loading } = useQuery(STUDY_TO_DISCOVER, {
    variables: { slug: proposal?.study?.slug },
  });

  const study = data?.study || {};
  const imageURL = study?.image?.image?.publicUrlTransformed;

  return (
    <StyledStudyPage>
      <Head>
        <title>MindHive | {study?.title}</title>
      </Head>

      <div>
        {imageURL && (
          <div className="studyImage">
            <img src={imageURL} alt={study?.title} />
          </div>
        )}

        <div className="studyTitleDescriptionBtns">
          <h1>{study?.title}</h1>
          <div className="studyDescription">
            <h3>{ReactHtmlParser(study?.description)}</h3>
          </div>
        </div>
      </div>
    </StyledStudyPage>
  );
}
