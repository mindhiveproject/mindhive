import { Icon } from "semantic-ui-react";
import { useLazyQuery } from "@apollo/client";

import { saveAs } from "file-saver";
import { jsonToCSV } from "react-papaparse";

import { GET_USERS_DATA } from "../../../Queries/User";

export default function DownloadUsersData({ fileName, ids }) {
  const [getData, { loading, error, data }] = useLazyQuery(GET_USERS_DATA);

  const downloadUserData = async ({ ids }) => {
    if (!loading) {
      const res = await getData({ variables: { ids } });
      const { data } = res;
      const { profiles } = data;
      const modifiedProfiles = profiles.map((profile) => ({
        ...profile,
        info: JSON.stringify(profile?.info),
        consentsInfo: JSON.stringify(profile?.consentsInfo),
        generalInfo: JSON.stringify(profile?.generalInfo),
        studiesInfo: JSON.stringify(profile?.studiesInfo),
        tasksInfo: JSON.stringify(profile?.tasksInfo),
        studentIn: JSON.stringify(profile?.studentIn),
        authorOfHomework: JSON.stringify(profile?.authorOfHomework),
        participantIn: JSON.stringify(profile?.participantIn),
        memberOfTalk: JSON.stringify(profile?.memberOfTalk),
        journals: JSON.stringify(profile?.journals),
        researcherIn: JSON.stringify(profile?.researcherIn),
        collaboratorInStudy: JSON.stringify(profile?.collaboratorInStudy),
        reviews: JSON.stringify(profile?.reviews),
      }));

      const name = fileName || `users`;
      const csv = jsonToCSV(modifiedProfiles);
      const blob = new Blob([csv], {
        type: "text/csv",
      });
      saveAs(blob, `${name}.csv`);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div onClick={() => downloadUserData({ ids })}>
      <a>
        Download users data <Icon name="download" />
      </a>
    </div>
  );
}
