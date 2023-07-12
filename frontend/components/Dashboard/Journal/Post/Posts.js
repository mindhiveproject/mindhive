import { Tab } from "semantic-ui-react";
import Post from "./SinglePost";
import { useRouter } from "next/router";

export default function JournalNotes({ code, journalId, posts, index }) {
  const router = useRouter();

  const handleChange = (e, data) => {
    router.push({
      pathname: `/dashboard/journals/${code}`,
      query: {
        index: data?.activeIndex,
      },
    });
  };

  return (
    <Tab
      menu={{ fluid: true, vertical: true, tabular: true }}
      panes={[...posts]
        .sort(
          (a, b) =>
            new Date(a?.createdAt).getTime() - new Date(b?.createdAt).getTime()
        )
        .map((post, i) => ({
          menuItem: post?.title,
          render: () => (
            <Tab.Pane>
              <Post
                key={i}
                post={post}
                code={code}
                journalId={journalId}
                index={index}
              />
            </Tab.Pane>
          ),
        }))}
      defaultActiveIndex={index}
      onTabChange={handleChange}
    />
  );
}
