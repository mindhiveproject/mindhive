export const participantPageTours = {
    overview: {
      title: "Resumen de la Página de Participantes",
      description: "Diseña la experiencia de tus participantes.",
      steps: [
        {
          title: "Página de Participantes",
          intro: "La página de participantes es la que verán cuando sean invitados a tu estudio.",
          position: "auto",
          disableInteraction: false
        },
        {
          element: '.preview',
          title: "Panel de Vista Previa",
          intro: "Cambia los componentes en este panel para personalizar la página de bienvenida de los participantes.",
          position: "auto",
          disableInteraction: false
        },
        {
          element: '.uploadImageContainer',
          title: "Añadir una Imagen",
          intro: "Añade una imagen a tu página de participantes para hacerla más atractiva.",
          position: "auto",
          disableInteraction: false
        },
        {
          element: '#studyTitle',
          title: "Título del Estudio",
          intro: "Define el título de tu estudio. Atención: este será el título que verán los participantes.",
          position: "auto",
          disableInteraction: false
        },
        {
          element: '.description',
          title: "Descripción",
          intro: "Añade una descripción a tu estudio para dar a los participantes más información sobre lo que van a hacer.",
          position: "auto",
          disableInteraction: false,
        },
        {
          element: '.infoTabsContainer',
          title: "Información Adicional",
          intro: "Añade pestañas a la página de participantes para proporcionar información extra sobre tu estudio.",
          position: "auto",
          disableInteraction: false,
        },
        {
          element: '.timeInformationBlock',
          title: "Duración",
          intro: "Indica la duración de tu estudio en minutos.",
          position: "auto",
          disableInteraction: false,
          scroll: true,
        },
      ]
    },
    settings: {
      title: "Configuración del Estudio",
      description: "Personaliza la configuración de tu estudio.",
      steps: [
        {
          element: '.settings',
          title: "Ajustes Disponibles",
          intro: "Este panel te permite modificar las siguientes opciones:<ul><li>Comparte este enlace con los participantes para invitarles a tu estudio.<br>Puedes personalizar el enlace aquí (asegúrate de no incluir caracteres especiales y prueba el enlace después).</li><li>Permitir múltiples intentos.</li><li>Abrir o cerrar el estudio a participantes mostrando u ocultando el botón 'Participar'.</li><li>Pedir notificaciones por correo electrónico a los participantes.</li><li>Preguntar si el participante es estudiante en Nueva York.</li><li>Pedir el código postal del participante.</li><li>Permitir la participación como invitado.</li><li>Pedir consentimiento a los participantes (si seleccionas esta opción, debes añadir un formulario de consentimiento a tu estudio).</li><li>Omitir la página de participantes.</li><li>Añadir un dispositivo externo.</li><li>Pedir el ID de Sona a los participantes.</li><li>Preguntar si el participante es mayor de 18 años.</li></ul>",
          position: "auto",
          disableInteraction: false,
        },
      ]
    },
  };
  