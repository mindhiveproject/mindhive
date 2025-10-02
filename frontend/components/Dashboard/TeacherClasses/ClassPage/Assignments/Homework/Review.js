import { useMutation, useQuery } from "@apollo/client";
import moment from "moment";
import Link from "next/link";
import { useRouter } from "next/dist/client/router";
import useTranslation from "next-translate/useTranslation";

import TipTapEditor from "../../../../../TipTap/Main";  
import { StyledTipTap } from "../../../../../TipTap/StyledTipTap";

import { GET_HOMEWORK } from "../../../../../Queries/Homework";
import { EDIT_HOMEWORK } from "../../../../../Mutations/Homework";
import useForm from "../../../../../../lib/useForm";

import Status from "./Status";

export default function ReviewHomework({
  code,
  myclass,
  user,
  query,
  homeworkCode,
}) {
  const { t } = useTranslation("classes");
  const router = useRouter();

  const { data, loading, error } = useQuery(GET_HOMEWORK, {
    variables: { code: homeworkCode },
  });
  const homework = data?.homework || {};

  const { inputs, handleChange, clearForm } = useForm({
    ...homework,
  });

  const [editHomework, { loading: editLoading }] = useMutation(EDIT_HOMEWORK, {
    variables: {
      ...inputs,
    },
    refetchQueries: [
      { query: GET_HOMEWORK, variables: { code: homeworkCode } },
    ],
  });

  return (
    <div className="review">
      <div className="proposalCardBoard">
        <div className="textBoard">
          <StyledTipTap>
            <TipTapEditor
              content={inputs?.content}
              onUpdate={(newContent) => {
                handleChange({ target: { name: "content", value: newContent } });
              }}
            />
          </StyledTipTap>
        </div>

        <div className="infoBoard">
          <div>
            <h4>{t("teacherClass.author")}</h4>
            <p>{inputs?.author?.username}</p>
          </div>

          {inputs?.updatedAt && (
            <div>
              <h4>{t("teacherClass.lastUpdated")}</h4>
              <p>{moment(inputs?.updatedAt).format("MMM D, YYYY, h:mm a")}</p>
            </div>
          )}

          <div>
            <h4>{t("teacherClass.status")}</h4>
            <Status settings={inputs?.settings} handleChange={handleChange} />
          </div>

          <div className="proposalCardComments">
            <h4>{t("teacherClass.comments")}</h4>
            <textarea
              rows="13"
              type="text"
              id="comment"
              name="comment"
              value={inputs?.settings?.comment}
              onChange={(e) => {
                handleChange({
                  target: {
                    name: "settings",
                    value: { ...inputs?.settings, comment: e.target.value },
                  },
                });
              }}
            />
          </div>
        </div>
      </div>

      <div className="saveButtons">
        {!loading && (
          <Link
            href={{
              pathname: `/dashboard/myclasses/${myclass?.code}`,
              query: {
                page: "assignments",
                action: "view",
                assignment: code,
              },
            }}
          >
            <div className="secondary saveButton">{t("teacherClass.closeWithoutSaving")}</div>
          </Link>
        )}

        <div
          className="primary saveButton"
          onClick={async () => {
            await editHomework({
              variables: {
                updatedAt: new Date(),
              },
            });
            router.push({
              pathname: `/dashboard/myclasses/${myclass?.code}`,
              query: {
                page: "assignments",
                action: "view",
                assignment: code,
              },
            });
          }}
          disabled={loading}
        >
          {loading ? t("teacherClass.saving") : t("teacherClass.saveAndClose")}
        </div>
      </div>
    </div>
  );
}
