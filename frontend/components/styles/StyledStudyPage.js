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
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
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
