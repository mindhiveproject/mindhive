export const reviewTours = {
    overview: {
      title: "Pestaña de Revisión",
      description: "Aprende dónde encontrar tus revisiones.",
      steps: [
        {
          title: "Comentarios sobre la Propuesta",
          intro: "Aquí puedes encontrar los comentarios que dejaron los mentores sobre tu propuesta (las primeras columnas de tu tablero).",
          element: "#proposalFeedback",
          position: "auto",
          disableInteraction: false
        },
        {
          title: "Comentarios de Compañeros",
          element: "#peerFeedback",
          intro: "Aquí puedes encontrar los comentarios que dejaron otros estudiantes y mentores en el tablero de tu propuesta. Ten en cuenta que los revisores también tienen acceso a tu estudio.",
          position: "auto",
          disableInteraction: false
        },
        {
          title: "Comentarios sobre el Informe del Proyecto",
          element: "#projectReportFeedback",
          intro: "Aquí puedes encontrar los comentarios que dejaron otros estudiantes y mentores.",
          position: "auto",
          disableInteraction: false
        },
        {
          title: "Área de Comentarios",
          element: "#feedbackArea",
          intro: "Aquí puedes encontrar los comentarios que dejaron otros estudiantes y mentores para cada una de las pestañas anteriores.",
          position: "auto",
          disableInteraction: false
        },
      ]
    },
  };
  