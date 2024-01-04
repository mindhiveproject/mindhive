import styled from "styled-components";

export const StyledDataViz = styled.div`
  display: grid;
  margin: 27px 17px;
  grid-template-columns: 1fr 2fr;
  grid-gap: 19px;
  height: 100%;
  .vizMenu {
    display: grid;
    grid-template-columns: 24px auto;
    grid-gap: 34px;
  }
  .buttons {
    display: grid;
    grid-gap: 30px;
    align-content: baseline;
    justify-content: center;
  }
  .overview {
    display: grid;
    padding: 12px;
    border-radius: 8px;
    background: #fcfdfc;
    box-shadow: 0px 2px 20px 0px rgba(0, 0, 0, 0.07);
    .contents {
      .chapter {
        padding: 10px 10px;
        .title {
          border: 1px solid grey;
          cursor: pointer;
        }
      }
      .section {
        border: 1px solid grey;
        padding: 10px 20px;
      }
    }
    .database {
      display: grid;
      align-content: baseline;
      grid-gap: 28px;
      .task {
        display: grid;
        grid-gap: 20px;
      }
      .variable {
        display: grid;
        padding: 0px 10px;
      }
    }
  }
  .document {
    display: grid;
    align-content: baseline;
    padding: 10px 32px;
    border-radius: 8px;
    background: #fcfdfc;
    box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.07);
    height: 100%;
    .section {
      display: grid;
      padding: 10px 0px;
      border: 1px solid grey;
    }
  }
`;
