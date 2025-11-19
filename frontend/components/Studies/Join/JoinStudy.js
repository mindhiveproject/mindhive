import { useState } from "react";
import { useMutation } from "@apollo/client";
import { useRouter } from "next/dist/client/router";
import useTranslation from "next-translate/useTranslation";

import { JOIN_STUDY_MUTATION } from "../../Mutations/User";
import { GET_USER_STUDIES } from "../../Queries/User";
import { CREATE_GUEST } from "../../Mutations/Guest";

// to check whether a participant is under 18 based on age
const isUnder18 = (age) => {
    if (!age && age !== 0) return false; // treat missing age as not under 18 for safety
    const ageNum = typeof age === 'string' ? parseInt(age, 10) : Number(age);
    return !isNaN(ageNum) && ageNum < 18;
  };

// function to join the study from any place
export default function JoinStudy({ user, study, userInfo, btnName }) {
    const { t } = useTranslation('common');
    const router = useRouter();
    const { settings } = study;

    const [joinStudy, { data, loading, error }] = useMutation(
        JOIN_STUDY_MUTATION,
        {
          variables: {
            id: user?.id,
            studyId: study?.id,
          },
          refetchQueries: [{ query: GET_USER_STUDIES }],
        }
      );
    
      const [createGuest, { 
        data: guestData, 
        loading: guestLoading, 
        error: guestError 
      }] = useMutation(
        CREATE_GUEST,
        {
          variables: {
            input: {
                generalInfo: userInfo, 
                participantIn: { 
                    connect: { id: study?.id }
                }
            }
          },
        }
      ); 

    async function joinAsUser() {
        await joinStudy();
    
        // if there is a redirect to the first task
        if (study?.settings?.proceedToFirstTask) {
          router.push({
            pathname: `/participate/run`,
            query: { name: study?.slug },
          });
        } else {
          router.push({
            pathname: `/dashboard/discover/studies`,
            query: { name: study?.slug },
          });
        }
      }
    
    async function joinAsGuest() {
        const guest = await createGuest();
        const publicId = guest?.data?.createGuest?.publicId;
    
        if (study?.settings?.proceedToFirstTask) {
          router.push({
            pathname: `/participate/run`,
            query: { name: study?.slug, guest: publicId },
          });
        } else {
          router.push({
            pathname: `/studies/${study?.slug}`,
            query: { guest: publicId },
          });
        }
    }
    
    function handleJoin() {
         // check the age and block the minor
        if(settings?.minorsBlocked) {
            if(!userInfo?.age) {
                return alert(t('join.details.error.enterAge'));
            } else if (isUnder18(userInfo?.age)) {
                return alert(t('join.details.error.minorBlocked'));
            }
        }
        if(userInfo?.guest === "true") {
            joinAsGuest();
        } else {
            joinAsUser();
        }
    }

    return (
        <div>
            <button onClick={handleJoin}>
              {btnName}
            </button>
        </div>
    )
}