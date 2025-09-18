export const projectBoardTours = {
    overview: {
      title: "Resumen del Panel del Proyecto",
      description: "Aprende a navegar y usar la interfaz del panel del proyecto",
      steps: [
        {
          element: '#menue',
          intro: "Usa este menú para cambiar entre los diferentes componentes de tu proyecto.",
          position: "bottom",
          disableInteraction: false
        },
        {
          element: '#switchMode',
          intro: "Usa este interruptor para cambiar entre modo edición (columnas y tarjetas) y modo vista previa (formato largo; aún puedes editar el contenido allí).<br><br>También aquí puedes descargar tu propuesta en formato PDF.",
          position: "bottom",
          disableInteraction: false
        },
        {
          element: '#section',
          intro: "Las columnas te ayudan a organizar tu propuesta de proyecto. Cada columna contiene tarjetas con estados individuales en los que puedes hacer clic.",
          position: "bottom",
          disableInteraction: false
        },
        {
          element: '#card',
          intro: "Cada tarjeta contiene instrucciones para completar tu propuesta. Puedes hacer clic en la tarjeta para ver las instrucciones y cambiar su estado.",
          position: "bottom",
          disableInteraction: false
        },
        {
          element: '#cardWithTag',
          intro: "Las tarjetas con esta etiqueta enviarán su contenido para revisión en el Centro de Feedback una vez las hayas enviado.<br><br>Cada tarjeta contiene etiquetas que indican en qué etapa del proceso de feedback debe añadirse su contenido.<br><br>Las etiquetas amarillas indican que la tarjeta aún no ha sido enviada, mientras que las etiquetas azules indican que ya ha sido enviada.",
          position: "bottom",
          disableInteraction: false
        },
        {
          element: '#submitCard',
          intro: "Este botón te permite enviar las tarjetas asociadas a cada etapa de revisión en el Centro de Feedback.",
          position: "bottom",
          disableInteraction: false
        },
        {
          element: '#connectArea',
          intro: "Haz clic aquí para añadir colaboradores a tu proyecto y conectarlo a una clase.",
          position: "bottom",
          disableInteraction: false
        }
      ]
    }
  };
  