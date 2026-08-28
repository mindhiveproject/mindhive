import Link from "next/link";
import { useRouter } from "next/dist/client/router";
import JoditEditor from "../../../Jodit/Editor";
import moment from "moment";
import { useRef } from "react";
import useTranslation from "next-translate/useTranslation";

import { StyledInput } from "../../../styles/StyledForm";
import TipTapEditor from "../../../TipTap/Main";
import { StyledTipTap } from "../../../TipTap/StyledTipTap";
import Button from "../../../DesignSystem/Button";


import Status from "../../TeacherClasses/ClassPage/Assignments/Homework/Status";

export default function Editor({
  user,
  assignmentCode,
  homeworkCode,
  btnName,
  inputs,
  initialContent,
  handleChange,
  editHomework,
}) {
  const { t } = useTranslation("classes");
  const router = useRouter();

  const content = useRef(initialContent);

  return (
    <StyledInput>
      <div className="assignments">
        <div className="backButton">
          <Link
            href={{
              pathname: `/dashboard/assignments/${assignmentCode}`,
            }}
          >
            <p>← Go back</p>
          </Link>
        </div>
        <div className="assignmentPage">
          <div className="homework">
            <div className="review">
              <div className="proposalCardBoard">
                <div className="textBoard">
                  <label htmlFor="title">
                    <p>Title</p>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={inputs?.title}
                      onChange={handleChange}
                      required
                    />
                  </label>
                  <StyledTipTap>
                    <TipTapEditor
                      content={content?.current}
                      onUpdate={(newContent) => {
                        content.current = newContent;
                      }}
                    />
                  </StyledTipTap>
                </div>
                <div className="infoBoard">
                  <div>
                    <h4>Author</h4>
                    <p>{inputs?.author?.username}</p>
                  </div>

                  {inputs?.updatedAt && (
                    <div>
                      <h4>Last updated</h4>
                      <p>
                        {moment(inputs?.updatedAt).format(
                          "MMM D, YYYY, h:mm a"
                        )}
                      </p>
                    </div>
                  )}

                  <div>
                    <h4>Status</h4>
                    <Status
                      settings={inputs?.settings}
                      handleChange={handleChange}
                    />
                  </div>

                  <div className="proposalCardComments">
                    <h4>Comments</h4>
                    <textarea
                      rows="13"
                      type="text"
                      id="comment"
                      name="comment"
                      value={inputs?.settings?.comment}
                      disabled
                    />
                  </div>
                </div>
              </div>
            </div>

            <Button
              variant="filled"
              style={{ width: "100%" }}
              onClick={() => {
                editHomework({
                  variables: {
                    updatedAt: new Date(),
                    content: content?.current,
                  },
                });
                router.push({
                  pathname: `/dashboard/assignments/${assignmentCode}`,
                });
              }}
            >
              {btnName || t("board.save", {}, { default: "Save" })}
            </Button>
          </div>
        </div>
      </div>
    </StyledInput>
  );
}
