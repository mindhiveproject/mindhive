import styled from "styled-components";

const StyledProject = styled.div`
  display: grid;
  height: 100vh;
  align-content: baseline;
  grid-template-rows: auto 1fr;
  .navigation {
    display: grid;
    align-items: center;
    padding: 6px 9px;
    grid-template-columns: 1fr 1fr auto;
    grid-gap: 20px;
    .left {
      display: grid;
      .selector {
        display: grid;
        grid-template-columns: auto 1fr;
        grid-gap: 10px;
        align-items: center;
        background: #f3f5f6;
        border-radius: 25px;
        width: 225px;
        height: 42px;
        .icon {
          display: grid;
          justify-items: center;
          align-items: center;
          border: 1px solid #c0c0c0;
          border-radius: 25px;
          height: 42px;
          width: 42px;
        }
        .option {
          display: grid;
          grid-template-columns: 25px 1fr;
          grid-gap: 10px;
          align-items: center;
          padding: 10px 9px;
          width: 225px;
        }
      }
    }
    .right {
      display: grid;
      grid-template-columns: 1fr auto;
      grid-gap: 10px;
      .connectArea {
        display: grid;
        grid-template-columns: 1fr auto;
        grid-gap: 5px;
        align-items: center;
      }
    }
  }
`;

export default StyledProject;
