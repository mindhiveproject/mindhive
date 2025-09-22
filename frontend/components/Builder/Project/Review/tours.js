export const reviewTours = {
    overview: {
      title: "Review Tab",
      description: "Learn where to find your reviews.",
      steps: [
        {
          title: "Proposal Feedback",
          intro: "Here you can find the feedback that was left by mentors on your proposal (the first columns of your board).",
          element: "#proposalFeedback",
          position: "auto",
          disableInteraction: false
        },
        {
          title: "Peer Feedback",
          element: "#peerFeedback",
          intro: "Here you can find the feedback that was left by other students and mentors on your proposal board. Note that reviewers have also been given access to your study.",
          position: "auto",
          disableInteraction: false
        },
        {
          title: "Project Report Feedback",
          element: "#projectReportFeedback",
          intro: "Here you can find the feedback that was left by other students and mentors.",
          position: "auto",
          disableInteraction: false
        },
        {
          title: "Feedback Area",
          element: "#feedbackArea",
          intro: "Here you can find the feedback that was left by other students and mentors for each of the tab above.",
          position: "auto",
          disableInteraction: false
        },
      ]
    },
  }; 