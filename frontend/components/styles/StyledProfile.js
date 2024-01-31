import styled from "styled-components";

const StyledProfile = styled.div`
  display: grid;
  .headerProfile {
    display: grid;
    grid-template-columns: 1fr auto;
    grid-gap: 20px;
    img {
      max-height: 200px;
    }
  }
  .pageProfile {
    display: grid;
    grid-gap: 10px;
  }
  .empty {
    display: grid;
    padding: 10px;
    grid-template-columns: 1fr;
    background: white;
    grid-gap: 1rem;
    text-align: center;
    align-content: center;
    height: 100%;
  }
  .headerParticipatedStudies {
    display: grid;
    grid-gap: 10px;
    grid-template-columns: 50px 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
    padding: 10px;
    font-weight: bold;
    grid-gap: 1rem;
  }
  .rowParticipatedStudies {
    display: grid;
    padding: 10px;
    grid-template-columns: 50px 1fr;
    background: white;
    grid-gap: 1rem;
    border-bottom: 1px solid lightGrey;
    .title {
      display: grid;
      grid-template-columns: 1fr;
      align-content: center;
      grid-gap: 1rem;
      align-content: baseline;
    }
    .conditionName {
      display: grid;
      align-content: baseline;
    }
    li {
      font-size: 1.3rem;
    }
  }
  .rowTasks {
    display: grid;
    padding: 0rem 1rem;
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
    grid-gap: 5px;
    align-items: center;
    background: ${(props) => (props.odd ? "#f0f0f0" : "white")};
    border-radius: 5px;
    align-content: baseline;
  }
  .headerCreatedStudies {
    display: grid;
    grid-template-columns: 3fr 1fr 250px 250px;
    padding: 10px;
    font-weight: bold;
    grid-gap: 1rem;
  }
  .rowCreatedStudies {
    display: grid;
    padding: 10px;
    grid-template-columns: 3fr 1fr 250px 250px;
    background: white;
    grid-gap: 1rem;
    .title {
      display: grid;
      grid-template-columns: auto 1fr;
      grid-gap: 1rem;
      align-items: center;
    }
  }

  .headerReviewedStudies {
    display: grid;
    grid-gap: 1rem;
    grid-template-columns: 300px 70px 70px 100px 200px auto;
    padding: 10px;
    font-weight: bold;
  }
  .rowReviewedStudies {
    display: grid;
    padding: 10px;
    grid-template-columns: 300px 70px 70px 100px 200px auto;
    background: white;
    grid-gap: 1rem;
    .title {
      display: grid;
      grid-template-columns: auto 1fr;
      grid-gap: 1rem;
      align-items: center;
    }
    margin: 1rem 0rem;
  }
  .reviewOverview {
    display: grid;
    grid-gap: 1rem;
    font-family: Lato;
    font-size: 1.4rem;
    font-style: normal;
    font-weight: 400;
    line-height: 21px;
    letter-spacing: 0em;
    .section {
      display: grid;
      grid-gap: 1rem;
      min-width: 300px;
      background: white;
      padding: 20px;
      text-align: left;
      align-content: baseline;
      .title {
        font-weight: bold;
        font-size: 1.3rem;
      }
      .answer {
        display: grid;
        grid-template-columns: 1fr auto;
        grid-gap: 1rem;
        background-color: #f6f9f8;
        padding: 1rem;
        border-radius: 5px;
      }
      .averageRating {
        display: grid;
        grid-template-columns: 1fr;
        align-items: start;
        justify-self: start;
      }
    }
  }

  .journalWrapperLine {
    display: grid;
    grid-template-columns: 1fr 50px;
    align-items: center;
  }
  .journalListHeader {
    display: grid;
    margin: 5px;
    padding: 10px;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    cursor: pointer;
    font-weight: bold;
  }
  .journalRow {
    display: grid;
    margin: 5px;
    padding: 10px;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    background: white;
    cursor: pointer;
  }
`;

export default StyledProfile;
