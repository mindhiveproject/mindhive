import React, { Component, useState } from "react";
import Board from "./Board";

export default function Reviews({ user, reviews, view }) {
  const byReviewers = reviews.map((review, num) => ({
    content: review.content.map((content) => ({
      ...content,
      title: content.question,
    })),
    title: `Reviewer ${num + 1}`,
    hiddenTitle: review?.author?.username,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  }));

  // rearrange array
  const sections = reviews.map((review) =>
    review.content.map((question) => ({
      ...question,
      author: review.author.id,
      authorUsername: review.author?.username,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    }))
  );

  const byQuestions = [1, 2, 3, 4, 5, 6, 7].map((name) => {
    const content = sections
      .map((section, num) =>
        section
          .filter((section) => section.name == name)
          .map((section) => ({
            answer: section.answer,
            title: `Reviewer ${num + 1}`,
            hiddenTitle: section.authorUsername,
            rating: section.rating,
            question: section.question,
            createdAt: section.createdAt,
            updatedAt: section.updatedAt,
          }))
      )
      .flat();
    return {
      name,
      title:
        content && content.length ? content[0].question : `Question ${name}`,
      content,
    };
  });

  return (
    <Board
      sections={view === "byQuestion" ? byQuestions : byReviewers}
      user={user}
    />
  );
}
