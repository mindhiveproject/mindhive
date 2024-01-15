import styled from "styled-components";

const StyledSlidebar = styled.div`
  display: grid;

  .overlay {
    background: white;
  }

  .slidebar {
    display: grid;
    min-width: 60%;
  }
  .chat {
    display: grid;
    padding: 10px;
    background: white;
    position: relative;
    height: 100%;
    .closeBtn {
      position: absolute;
      background-color: white;
      top: 6px;
      right: 6px;
      width: 4rem;
      line-height: 3rem;
      text-align: center;
      cursor: pointer;
      border-radius: 2.25rem;
      border: 2px solid #5f6871;
      color: #5f6871;
      padding-bottom: 5px;
      font-size: 2rem;
      z-index: 20;
      :hover {
        transform: scale(1.1);
        transition: transform 0.5s;
      }
    }
  }
`;

export default StyledSlidebar;
