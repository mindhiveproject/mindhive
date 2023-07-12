import styled from "styled-components";

const StyledJournal = styled.div`
  display: grid;
  .addJournal {
    display: grid;
    height: 100vh;
    background: #f7f9f8;
    grid-template-rows: 0px auto;

    .header {
      display: grid;
      grid-template-columns: 1fr auto;
    }
    .closeBtn {
      width: 3.3rem;
      line-height: 3rem;
      text-align: center;
      cursor: pointer;
      border-radius: 2.25rem;
      color: #5f6871;
      padding-bottom: 5px;
      font-size: 2rem;
      :hover {
        transform: scale(1.1);
        transition: transform 0.5s;
      }
    }
  }

  .journalsList {
    .row {
      display: grid;
      grid-template-columns: 1fr 50px;
      align-items: center;
      .deleteBtn {
        color: red;
        cursor: pointer;
      }
    }

    .topHeader {
      display: grid;
      margin: 5px;
      padding: 10px;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      font-weight: bold;
    }

    .line {
      display: grid;
      margin: 5px;
      padding: 10px;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      background: white;
      cursor: pointer;
    }
  }

  .singlePost {
    display: grid;
    width: 100%;
    grid-template-rows: auto 1fr;
    background: white;
    border-radius: 1rem;
    .header {
      padding: 15px 20px 20px 20px;
      display: grid;
      grid-gap: 20px;
      grid-template-columns: 1fr;
      align-items: center;
    }
    .headerInfo {
      display: grid;
      grid-gap: 10px;
      grid-template-columns: 1fr auto auto;
      .date {
        font-size: 14px;
        color: grey;
      }
    }
    .content {
      padding: 15px 20px 20px 20px;
    }
  }
`;

export default StyledJournal;
