import { useQuery } from "@apollo/client";
import Head from "next/head";
import Link from "next/link";
import ReactHtmlParser from "react-html-parser";

import { StyledStudyPage } from "../../styles/StyledStudyPage";

import StudyInfo from "./StudyInfo";

import { GET_USER_STUDIES } from "../../Queries/User";

export default function StudyPage({ query, user, study }) {
  console.log({ user, study });

  const { data: userData } = useQuery(GET_USER_STUDIES);
  console.log({ userData });

  const imageURL = study?.image?.image?.publicUrlTransformed;
  // pathname for participants
  const pathname = "/participate/select";
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

          <StudyInfo query={query} user={user} study={study} />

          <Link
            href={{
              pathname,
              query: { id: study.id },
            }}
          >
            <div className="controlBtns">
              <button>Participate</button>
            </div>
          </Link>
        </div>
      </div>
    </StyledStudyPage>
  );
}
