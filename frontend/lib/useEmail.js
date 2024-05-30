import { useMutation } from "@apollo/client";

import { SEND_EMAIL } from "../components/Mutations/Update";

// import translation files
// import communicationEN from "../locales/en-us/communication.json";
// import communicationDE from "../locales/de/communication.json";

// const files = {
//   EN: { ...communicationEN },
//   DE: { ...communicationDE },
// };

export default function useEmail() {
  const [
    sendEmailMutation,
    { loading: sendEmailLoading, error: sendEmailError, data: sendEmailData },
  ] = useMutation(SEND_EMAIL, {});

  async function sendEmail({ receiverId, title, message, link }) {
    const res = await sendEmailMutation({
      variables: {
        receiverId,
        title,
        message,
        link,
      },
    });
  }

  return { sendEmail };
}
