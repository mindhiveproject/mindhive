import moment from "moment";
import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import ReactHtmlParser from "react-html-parser";
import { Tab } from "semantic-ui-react";

import { GET_JOURNAL } from "../../../Queries/Journal";

export default function JournalPage({ code, user, query }) {
  const { t } = useTranslation("classes");
  const { action, area, post, selector, index } = query;

  const { data, loading, error } = useQuery(GET_JOURNAL, {
    variables: { code },
  });

  const journal = data?.journal || { title: "", description: "" };
  const posts = journal?.posts || [];

  return (
    <div>
      <h2>{t("journal.notes")}</h2>
      <Tab
        menu={{ fluid: true, vertical: true, tabular: true }}
        panes={[...posts]
          .sort(
            (a, b) =>
              new Date(a?.createdAt).getTime() -
              new Date(b?.createdAt).getTime()
          )
          .map((post, i) => ({
            menuItem: post?.title,
            render: () => (
              <Tab.Pane>
                <div key={i} className="singlePost">
                  <div className="header">
                    <div>
                      <h2>{post.title}</h2>
                    </div>
                    <div className="headerInfo">
                      <div>
                        <div className="date">
                          {moment(post.createdAt).format(
                            "MMMM Do YYYY, h:mm a"
                          )}
                        </div>
                        {post?.updatedAt &&
                          post?.updatedAt !== post?.createdAt && (
                            <div className="date">
                              {t("journal.editedOn")} {moment(post?.updatedAt).format(
                                "MMMM Do YYYY, h:mm a"
                              )}
                            </div>
                          )}
                      </div>
                    </div>
                  </div>

                  <div className="content">{ReactHtmlParser(post.content)}</div>
                </div>
              </Tab.Pane>
            ),
          }))}
      />
    </div>
  );
}
