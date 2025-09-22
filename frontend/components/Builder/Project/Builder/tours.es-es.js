export const builderTours = {
  overview: {
    title: "Resumen del Constructor de Estudios",
    description: "Aprende lo básico de la interfaz del Constructor de Estudios",
    steps: [
      {
        element: '#menue',
        title: "¡Vamos a explorar el Constructor de Estudios!",
        intro: "Usa este menú para cambiar entre los distintos componentes de tu proyecto.",
        position: "auto",
        disableInteraction: false
      },
      {
        element: '#canvas',
        title: "Lienzo del Constructor de Estudios",
        intro: "Este es el lienzo de tu estudio. Aquí puedes arrastrar y soltar bloques para crear tu estudio.",
        position: "auto",
        disableInteraction: false
      },
      {
        element: '#commentButton',
        title: "Botón de Comentarios",
        intro: "Aquí puedes añadir comentarios a tu estudio.<br><br> Úsalo para debatir tu estudio con tus colaboradores, profesores y mentores.",
        position: "auto",
        disableInteraction: false
      },
      {
        element: '#sidepanel',
        title: "Panel Lateral",
        intro: "Este panel lateral contiene todo lo necesario para construir tu estudio.<br><br>Explora cada sección con sus respectivos recorridos.",
        position: "auto",
        disableInteraction: false,
      }
    ]
  },
  addBlock: {
    title: "Explora la pestaña 'Añadir un bloque'",
    description: "Asegúrate de seleccionar la pestaña 'Añadir un bloque' antes de comenzar.",
    steps: [
      {
        element: '#addBlock',
        intro: "Haz clic aquí para ver los bloques que puedes usar en tu estudio.",
        position: "auto",
        disableInteraction: false,
      },
      {
        element: '#search',
        intro: "Puedes buscar bloques aquí...",
        position: "auto",
        disableInteraction: false
      },
      {
        element: '#createdBy',
        intro: "... y filtrar los bloques por creador aquí.<br><br>Asegúrate de seleccionar 'Propiedad mía' para ver los bloques que has creado tú mismo.",
        position: "auto",
        disableInteraction: false
      },
      {
        element: '#sidepanel',
        intro: "Este es el menú de bloques que puedes usar en tu estudio.<ul><li><strong>Bloques básicos:</strong> Ofrecen una experiencia completamente personalizable para tus participantes.</li><li><strong>Tareas:</strong> Úsalas para medir el comportamiento de los participantes.</li><li><strong>Encuestas:</strong> Utiliza estos cuestionarios para recopilar datos de los participantes.</li><li><strong>Diseño del estudio:</strong> Usa un bloque de esta categoría para controlar el diseño de tu estudio, por ejemplo, al crear un diseño entre sujetos.</li><li><strong>Plantillas:</strong> Aquí encontrarás los mismos estudios predefinidos que están en el Área de Descubrimiento.</li></ul>",
        position: "auto",
        disableInteraction: false
      },
      {
        element: '#board',
        title: "¡Vamos a probar!",
        intro: "Añade un bloque a tu lienzo:<br><img src='/assets/develop/add-block-to-study-builder.gif' alt='añadir bloque al lienzo' style='max-width: 100%; height: auto;'><br><br>Presiona 'Siguiente' una vez que hayas añadido un bloque.",
        position: "auto",
        disableInteraction: false
      },
      {
        element: '#block',
        intro: "¡Bien! Ahora que has añadido un bloque, puedes realizar las siguientes acciones...<br>Si no lo has hecho, vuelve un paso atrás y añade un bloque de nuevo.",
        position: "top",
        disableInteraction: false
      },
      {
        element: '#blockSettings',
        intro: "Puedes hacer clic en este botón de engranaje para cambiar los ajustes de tu bloque (idioma mostrado y otros parámetros).",
        position: "top",
        disableInteraction: false
      },
      {
        element: '#blockInfo',
        intro: "Puedes hacer clic en este botón de exclamación para:<ul><li>Aprender más sobre para qué puedes usar este bloque</li><li>Ver qué variables recoge y qué representan</li><li>Encontrar recursos adicionales</li></ul>",
        position: "top",
        disableInteraction: false
      },
      {
        element: '#blockPlay',
        intro: "Puedes hacer clic en este botón de reproducción para previsualizar el bloque (consejo: ¡asegúrate de probar el bloque después de cambiar su configuración!).",
        position: "top",
        disableInteraction: false
      }
    ]
  },
  studyFlow: {
    title: "Explora la pestaña 'Flujo del estudio'",
    description: "Asegúrate de seleccionar la pestaña 'Flujo del estudio' antes de comenzar.",
    steps: [
      {
        element: '#flow',
        intro: "La pestaña 'Flujo del estudio' es donde puedes verificar que la estructura de tu estudio es la que esperas.<br><br>Si no estás satisfecho con la estructura, siempre puedes volver al lienzo y modificarla.",
        position: "auto",
        disableInteraction: false
      },
      {
        element: '#studyFlow',
        intro: "Aquí puedes ver cada una de las condiciones que has creado.<br><br>Debajo de cada columna de condición puedes ver los bloques que forman parte de ella.",
        position: "auto",
        disableInteraction: false
      },
      {
        element: '#firstLine',
        intro: "Aquí puedes ver la probabilidad de que cada condición sea seleccionada.<br><br>Pasa el ratón por encima de la condición para leer una explicación sobre la probabilidad.",
        position: "auto",
        disableInteraction: false
      },
      {
        element: '#taskBlocks',
        intro: "Aquí puedes encontrar los bloques que forman parte de la condición.",
        position: "auto",
        disableInteraction: false
      }
    ]
  },
  studySettings: {
    title: "Explora la pestaña 'Configuración del estudio'",
    description: "Asegúrate de seleccionar la pestaña 'Configuración del estudio' antes de comenzar.",
    steps: [
      {
        element: '#studySettings',
        intro: "La pestaña 'Configuración del estudio' es donde puedes configurar los ajustes de tu estudio.",
        position: "left",
        disableInteraction: false
      },
      {
        element: '#studyStatus',
        intro: "Cambia el estado de tu estudio aquí.",
        position: "left",
        disableInteraction: false,
      },
      {
        element: '#studyVersion',
        intro: "Cambia la versión de tu estudio aquí.",
        position: "left",
        disableInteraction: false,
      },
      {
        element: '.studyDescription',
        intro: "Importa la descripción de tu estudio desde tu propuesta aquí.",
        position: "left",
        disableInteraction: false,
      },
      {
        element: '#studyTags',
        intro: "Añade etiquetas a tu estudio aquí.",
        position: "left",
        disableInteraction: false,
      }
    ]
  }
};
