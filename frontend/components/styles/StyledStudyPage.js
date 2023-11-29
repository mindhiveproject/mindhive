import styled from "styled-components";

export const StyledStudyPage = styled.div`
  display: grid;
  grid-template-columns: 8fr 4fr;
  grid-template-areas:
    "description image"
    "description time"
    "description tags"
    "tasks tags"
    "info tags";
  grid-gap: 15px;
  max-width: 1200px;
  min-height: 800px;

  hr {
    height: 2px;
    border-width: 0;
    color: lightgray;
    background-color: lightgray;
  }

  .studyContent {
    display: grid;
    width: 100%;
    grid-gap: 10px;
    margin: 10px;
    padding: 10px;
    .guestMessage {
      p {
        padding: 10px;
        border-radius: 7px;
        background: orange;
        color: black;
      }
    }
  }

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
    grid-template-areas:
      "image"
      "description"
      "tasks"
      "time"
      "info"
      "tags";
  }
  @media (max-width: 375px) {
    padding: 1rem;
  }
  button {
    height: 56px;
    width: 266px;
    background: ${(props) => props.theme.darkgreen};
    border: 2px solid ${(props) => props.theme.darkgreen};
    box-sizing: border-box;
    border-radius: 4px;
    color: ${(props) => props.theme.white};
    font-family: "Lato";
    font-size: 18px;
    letter-spacing: 0.05em;
    cursor: pointer;
    margin-top: 20px;
    margin-bottom: 20px;
  }
  a {
    text-decoration-line: underline;
    cursor: pointer;
  }
  img {
    max-width: 100%;
    object-fit: cover;
  }

  .studyImage {
  }

  .studyImage,
  .studyTitleDescriptionBtns,
  .studyInfoTimePartners,
  .studyWhatWhoHow,
  .studyTagsContacts {
    padding: 10px;
    @media (max-width: 375px) {
      padding: 0px;
    }
  }

  .studyImage {
    grid-area: image;
  }
  .studyTitleDescriptionBtns {
    grid-area: description;
  }
  .studyInfoTimePartners {
    display: grid;
    grid-area: time;
    grid-gap: 20px;
  }
  .studyWhatWhoHow {
    grid-area: info;
    margin-top: 34px;
  }
  .studyTagsContacts {
    display: grid;
    grid-gap: 20px;
    align-content: baseline;
    grid-area: tags;
  }

  .studyDescription {
    margin-bottom: 49px;
  }

  .descriptionMenu {
    margin-bottom: 20px;
    .item {
      font-family: Lato;
      font-style: normal;
      font-weight: normal;
      font-size: 18px;
      line-height: 23px;
      color: #1a1a1a;
    }
  }
  .details {
    margin: 3rem;
    font-size: 2rem;
  }
  .timeFrequency {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  .studyInformationHeader {
    font-family: Lato;
    font-style: normal;
    font-weight: normal;
    font-size: 14px;
    line-height: 28px;
    margin-bottom: 7px;
  }
  .studyTags {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, auto));
    grid-column-gap: 8px;
  }
  .studyTag {
    background: #ffffff;
    border: 2px solid #28619e;
    border-radius: 100px;
    font-family: Lato;
    font-style: normal;
    font-weight: bold;
    font-size: 12px;
    line-height: 100%;
    letter-spacing: 0.03em;
    color: #28619e;
    padding: 8px;
    text-align: center;
  }
  .partnersInfo {
    display: grid;
    grid-template-columns: 1fr;
    grid-column-gap: 10px;
    align-items: center;
  }

  .controlBtns {
    display: grid;
    grid-gap: 5px;
    margin-bottom: 34px;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    button {
      width: auto;
      margin: 0;
    }
    .secondaryBtn {
      border: 2px solid #007c70;
      color: #007c70;
      background: #f7f9f8;
    }
  }
`;

export const StyledTaskCard = styled.div`
  height: 100%;
  background: #ffffff;
  border-radius: 4px;
  border-top: 14px solid;
  border-top-color: ${(props) =>
    props.taskType === "TASK"
      ? "#64c9e2"
      : props.taskType === "SURVEY"
      ? "#28619e"
      : "#ffc7c3"};

  box-shadow: 0px 2px 4px 0px #00000026;
  transition: box-shadow 300ms ease-out;
  cursor: pointer;

  :hover {
    box-shadow: 0px 2px 24px 0px #0000001a;
  }

  img {
    width: 100%;
    height: 166px;
    object-fit: cover;
  }
  .cardInfo {
    padding: 16px;
    .title {
      display: grid;
      grid-template-columns: 1fr auto;
      grid-gap: 1rem;
      font-family: Roboto;
      font-style: normal;
      font-weight: normal;
      font-size: 24px;
      line-height: 30px;
      margin-bottom: 20px;
      .rightSide {
        display: grid;
        grid-gap: 1rem;
        grid-template-columns: auto 1fr;
        align-items: center;
        justify-items: center;
      }
    }
  }
  a {
    letter-spacing: 0.04em;
    text-decoration-line: underline;
    color: #007c70;
  }
  h2 {
    font-family: Roboto;
    font-style: normal;
    font-weight: normal;
    font-size: 24px;
    line-height: 30px;
    color: #1a1a1a;
    margin-bottom: 20px;
  }
  p {
    font-family: Roboto;
    font-size: 16px;
    font-style: normal;
    font-weight: 400;
    line-height: 16px;
    letter-spacing: 0.04em;
    text-align: left;
  }
  .actionLinks {
    margin-top: 24px;
    button {
      background: #ffffff;
      color: #007c70;
      max-width: 200px;
    }
    p {
      font-family: Lato;
      font-size: 18px;
      font-style: normal;
      font-weight: 400;
      line-height: 18px;
      letter-spacing: 0.05em;
      text-align: center;
    }
  }
  .studyLink {
    display: grid;
    grid-template-columns: 1fr auto;
    align-self: end;
    margin-bottom: 10px;
    align-items: end;
  }
`;

export const StyledStudyPreview = styled.div`
  display: grid;
  margin-top: 20px;
  height: 100%;
`;

export const StyledStudyRun = styled.div`
  display: grid;
  .prompt {
    display: grid;
    max-width: 800px;
    margin: 0 auto;
    margin-top: 30px;
    padding: 20px;
    h1 {
      font-family: Lato;
      font-style: normal;
      font-weight: normal;
      font-size: 36px;
      line-height: 56px;
    }
    h3 {
      font-family: Lato;
      font-style: normal;
      font-weight: normal;
      font-size: 24px;
      line-height: 32px;
    }
    p {
      font-family: Lato;
      font-style: normal;
      font-weight: normal;
      font-size: 18px;
      line-height: 20px;
    }
    input {
      max-width: 500px;
      font-family: Lato;
      margin-bottom: 1rem;
      height: 48px;
      border: 1px solid #cccccc;
      border-radius: 4px;
      /* width: 100%; */
      font-size: 16px;
      line-height: 24px;
      padding: 12px;
      &:focus {
        outline: 0;
        border-color: ${(props) => props.theme.red};
      }
    }
    button {
      max-width: 500px;
      font-family: Lato;
      margin-top: 3rem;
      margin-bottom: 3rem;
      width: 100%;
      background: #007c70;
      color: white;
      padding: 1.5rem 0.5rem;
      font-style: normal;
      font-weight: normal;
      font-size: 18px;
      line-height: 100%;
      border: 2px solid #007c70;
      border-radius: 4px;
      cursor: pointer;
    }
    .checkboxField {
      font-family: Lato;
      font-style: normal;
      font-weight: normal;
      font-size: 18px;
      line-height: 24px;
      display: grid;
      grid-gap: 10px;
      grid-template-columns: 1fr 14fr;
      align-items: center;
      input {
        margin-bottom: 0rem;
        width: 40%;
        color: #666666;
      }
    }
    .buttonsHolder {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-column-gap: 20px;
    }
    .emailInput {
      width: 300px;
    }
    .questionTitle {
      font-size: 20px;
      margin-top: 20px;
    }
    .message {
      padding: 1rem;
      background: #007c70;
      color: white;
      border-radius: 8px;
      text-align: center;
    }
  }
`;
