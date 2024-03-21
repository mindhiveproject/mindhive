import React, { Component } from "react";
import moment from "moment";
import { Icon } from "semantic-ui-react";
import Link from "next/link";

import ReactHtmlParser from "react-html-parser";
import DeletePost from "./Delete";

export default function Post({ code, journalId, post, editPost, index }) {
  return (
    <div className="singlePost">
      <div className="header">
        <div>
          <h2>{post.title}</h2>
        </div>
        <div className="headerInfo">
          <div>
            <div className="date">
              {moment(post.createdAt).format("MMMM Do YYYY, h:mm a")}
            </div>
            {post?.updatedAt && post?.updatedAt !== post?.createdAt && (
              <div className="date">
                Edited on:{" "}
                {moment(post?.updatedAt).format("MMMM Do YYYY, h:mm a")}
              </div>
            )}
          </div>
          <Link
            href={{
              pathname: `/dashboard/journals/${code}`,
              query: {
                post: post?.id,
                action: "edit",
                index: index || 0,
              },
            }}
          >
            <span>
              <Icon size="large" name="edit" />
            </span>
          </Link>
          <DeletePost postId={post?.id} code={code} index={index} />
        </div>
      </div>

      <div className="content">{ReactHtmlParser(post.content)}</div>
    </div>
  );
}
