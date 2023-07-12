import styled from "styled-components";

export const StyledChat = styled.div`
  .chatsHeader {
    display: grid;
    margin: 1rem 0rem;
    padding: 1rem;
    grid-template-columns: 1fr 2fr 1fr;
    cursor: pointer;
    font-weight: bold;
  }
  .wrapper {
    display: grid;
    grid-gap: 2rem;
    grid-template-columns: 1fr auto;
    align-items: center;
    .controlBtns {
      display: grid;
      align-content: space-around;
      height: 100%;
    }
    .addMembersBtn {
      cursor: pointer;
    }
  }
  .chatRow {
    display: grid;
    grid-gap: 2rem;
    margin: 1rem 0rem;
    padding: 1rem;
    grid-template-columns: 1fr 2fr 1fr;
    background: white;
    cursor: pointer;
    align-items: center;
    .members {
      display: grid;
      width: 100%;
      justify-content: start;
      .title {
        padding: 1px;
        margin: 0px 5px 0px 0px;
        border-radius: 5px;
        border: 1px solid #007c70;
      }
      .item {
        background: white;
        padding: 0px 5px 0px 0px;
      }
      .member {
        display: grid;
        background: white;
        border: 1px solid #007c70;
        width: max-content;
        padding: 0.7rem;
        border-radius: 2rem;
        justify-content: center;
        align-content: center;
      }
    }
  }

  .chatTitle {
    display: grid;
    input,
    textarea,
    select {
      background: #f6f9f8;
      width: 100%;
      border: 0px solid #e6e6e6;
      border-radius: 4px;
      &:focus {
        outline: 0;
        background: white;
        border-color: mintcream;
      }
    }
    button {
      background: #007c70;
      color: white;
      max-width: 256px;
      border-radius: 3px;
      cursor: pointer;
    }
    .title {
      font-family: Lato;
      font-size: 36px;
      font-style: normal;
      font-weight: 400;
      line-height: 56px;
      letter-spacing: 0em;
      text-align: left;
      color: #1a1a1a;
      margin-bottom: 23px;
    }
  }

  .chatRoom {
    display: grid;
    grid-gap: 1px;
    margin: 0px 0px;
    .chatHeader {
      display: grid;
      grid-template-columns: auto 1fr;
      grid-column-gap: 1rem;
      align-items: center;
      button {
        padding: 10px 24px 10px 24px;
        background: #007c70;
        border: 2px solid #007c70;
        box-sizing: border-box;
        border-radius: 4px;
        color: white;
        cursor: pointer;
        font-family: "Lato";
      }
    }
    .members {
      display: grid;
      width: 100%;
      justify-content: end;
      .title {
        padding: 1px;
        margin: 0px 5px 0px 0px;
        border-radius: 5px;
        border: 1px solid #007c70;
      }
      .item {
        padding: 0px 5px 0px 0px;
      }
      .member {
        display: grid;
        background: white;
        border: 1px solid #007c70;
        width: max-content;
        padding: 0.7rem;
        border-radius: 2rem;
        justify-content: center;
        align-content: center;
      }
    }
    .comments {
      position: relative;
      display: grid;
      grid-template-columns: 1fr;
      align-items: baseline;
      .content {
        min-height: 40px;
      }
      .replyBtn {
        right: 0px;
        top: 5px;
        position: absolute;
        display: grid;
        margin-bottom: 5px;
        button {
          padding: 3px 10px 3px 10px;
          background: #007c70;
          border: 1px solid #007c70;
          box-sizing: border-box;
          border-radius: 4px;
          color: white;
          cursor: pointer;
          font-size: 14px;
          font-family: "Lato";
        }
      }
    }
    .header {
      display: grid;
      grid-gap: 10px;
      align-items: center;
      grid-template-columns: 1fr;
      padding: 5px 0px 0px 0px;
      .title {
        font-size: 20px;
      }
      .nameDate {
        font-size: 14px;
        display: grid;
        grid-gap: 5px;
        grid-template-columns: 1fr auto;
        text-align: start;
        .date {
          color: grey;
        }
        .editLinks {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-gap: 1px;
        }
      }
    }
    .modalWrapper {
      display: grid;
      padding: 2rem;
    }
  }
  .message {
    display: grid;
    background: white;
    margin: 15px 0px 0px 0px;
    padding: 0px 15px;
    .content {
      display: grid;
      margin: 1rem 0rem;
    }
  }
  .comment {
    display: grid;
    background: white;
    padding: 0px 0px 0px 30px;
    border-top: 1px solid lightgrey;
    .content {
      display: grid;
      padding: 0px 0px 0px 0px;
      margin: 0px 0px 0px 0px;
    }
  }
  .deleteButton {
    color: red;
    cursor: pointer;
  }
  .editButton  {
    color: tile;
    cursor: pointer;
  }
`;
