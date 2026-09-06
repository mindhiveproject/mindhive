import { useMutation } from "@apollo/client";
import { useRouter } from "next/dist/client/router";
import useTranslation from "next-translate/useTranslation";

import { JOIN_STUDY_MUTATION } from "../../Mutations/User";
import { GET_USER_STUDIES } from "../../Queries/User";
import { CREATE_GUEST } from "../../Mutations/Guest";
import Button from "../../DesignSystem/Button";

const isUnder18 = (age) => {
  if (!age && age !== 0) return false;
  const ageNum = typeof age === "string" ? parseInt(age, 10) : Number(age);
  return !isNaN(ageNum) && ageNum < 18;
};

export default function JoinStudy({
  user,
  study,
  userInfo,
  btnName,
  variant = "filled",
}) {
  const { t } = useTranslation("common");
  const router = useRouter();
  const { settings } = study;

  const [joinStudy, { loading }] = useMutation(JOIN_STUDY_MUTATION, {
    variables: {
      id: user?.id,
      studyId: study?.id,
    },
    refetchQueries: [{ query: GET_USER_STUDIES }],
  });

  const [createGuest, { loading: guestLoading }] = useMutation(CREATE_GUEST, {
    variables: {
      input: {
        generalInfo: userInfo,
        participantIn: {
          connect: { id: study?.id },
        },
      },
    },
  });

  async function joinAsUser() {
    await joinStudy();

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
    if (settings?.minorsBlocked) {
      if (!userInfo?.age) {
        return alert(
          t("join.details.error.enterAge", {}, {
            default: "Please enter your age",
          }),
        );
      } else if (isUnder18(userInfo?.age)) {
        return alert(
          t("join.details.error.minorBlocked", {}, {
            default:
              "We are very sorry but only participants who are 18 or older can take part in this study at this time.",
          }),
        );
      }
    }
    if (userInfo?.guest === "true") {
      joinAsGuest();
    } else {
      joinAsUser();
    }
  }

  return (
    <Button
      variant={variant}
      onClick={handleJoin}
      disabled={loading || guestLoading}
    >
      {btnName}
    </Button>
  );
}
