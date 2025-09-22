export const developTours = {
  overview: {
    title: "Resumen del Área de Desarrollo",
    description: "Aprende cómo navegar y utilizar el área de Desarrollo",
    steps: [
      {
        element: '#developNewBtn',
        intro: "Haz clic aquí para comenzar a desarrollar un nuevo estudio, tarea, encuesta o bloque.",
        position: "bottom",
        disableInteraction: false
      },
      {
        element: '#myPanel', // este id está en el componente Panels
        intro: "Haz clic en la pestaña de abajo para ver los proyectos, estudios, tareas, encuestas y bloques que has creado.",
        position: "auto",
        disableInteraction: false,
      }
    ]
  }
};