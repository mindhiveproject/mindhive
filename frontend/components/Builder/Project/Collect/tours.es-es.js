export const collectTours = {
    overview: {
      title: "Pestaña de Recolección (Descarga)",
      description: "Aprende cómo explorar los datos recolectados.",
      steps: [
        {
          title: "Pestaña de Recolección",
          intro: "¡Felicidades por recolectar datos! Aquí puedes encontrar todos los datos recogidos.",
          position: "auto",
          disableInteraction: false
        },
        {
          element: ".shareStudy",
          title: "Enlaces Rápidos",
          intro: "Prueba tu estudio aquí y copia el enlace para compartirlo con los participantes.",
          position: "auto",
          disableInteraction: false
        },
        {
          element: ".downloadOptions",
          title: "Descarga",
          intro: "Aquí puedes descargar el conjunto de datos de tu estudio: <ul><li>Datos agregados (consulta los detalles de tu bloque para más información)</li><li>Datos agregados (1 participante = 1 fila)</li><li>Datos en bruto (no recomendado)</li></ul>",
          position: "auto",
          disableInteraction: false
        },
        {
          element: ".downloadByComponent",
          title: "Descarga los datos de un bloque",
          intro: "También puedes descargar los datos de un bloque específico aquí.<br>Usa el menú desplegable para seleccionar el bloque que quieres descargar y luego el tipo de descarga.",
          position: "auto",
          disableInteraction: false
        },
      ]
    },
    tableTour: {
      title: "Pestaña de Recolección (Curar)",
      description: "Aprende cómo curar los datos recolectados (filtrar participantes para incluir en el análisis).",
      steps: [
        {
          title: "Antes de continuar",
          intro: "Asegúrate de que tienes al menos un participante en tu estudio o no podrás ver la tabla que se describe en los siguientes pasos.",
          position: "auto",
          disableInteraction: false
        },
        {
          element: "#collectTable",
          title: "Tabla",
          intro: "Aquí puedes ver todos los participantes que han completado tu estudio. Puedes filtrar y ordenar las columnas haciendo clic en sus encabezados.",
          position: "auto",
          disableInteraction: false
        },
        {
          title: "Sácale el máximo provecho a la tabla",
          intro: "Gestiona / Filtra / Ordena tus columnas:<br><img src='/assets/develop/manage-ag-grid-columns.gif' alt='gestionar columnas' style='max-width: 100%; height: auto;'>.",
          position: "auto",
          disableInteraction: false
        },
        {
          title: "¡No lo olvides!",
          intro: "Solo los participantes marcados para análisis verán sus datos añadidos en tu Diario de Datos:<br><img src='/assets/develop/participant-ckecked-for-analysis.png' alt='participante marcado para análisis' style='max-width: 100%; height: auto;'>.",
          position: "auto",
          disableInteraction: false
        },
      ]
    },
  };
  