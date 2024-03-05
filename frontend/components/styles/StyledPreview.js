import styled from "styled-components";

export const StyledPreview = styled.div`
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 5;

  button {
    color: revert;
    background: revert;
  }

  .frame {
    /* position: absolute;
    top: 0px;
    left: 0px;
    border: 25px solid var(--green);
    height: 100%;
    width: 100%;
    z-index: 10; */
  }
  .message {
    position: absolute;
    top: 0px;
    left: 0px;
    color: black;
    display: grid;
    width: 100%;
    height: 25px;
    justify-content: center;
    align-content: center;
    z-index: 15;
    font-weight: bold;
    background-color: #ffc107;
  }
  .closeBtn {
    position: absolute;
    background-color: white;
    top: 6px;
    right: 6px;
    width: 3.5rem;
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
  .preview {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: white;
    width: 100%;
    height: 100%;
    overflow-y: auto;
    z-index: 10;
  }
`;

// import styled from "styled-components";

// export const StyledPreview = styled.div`
//   .frame {
//     position: absolute;
//     top: 0px;
//     left: 0px;
//     border: 25px solid var(--green);
//     height: 100%;
//     width: 100%;
//     z-index: 10;
//   }
//   .message {
//     position: absolute;
//     top: 0px;
//     left: 0px;
//     color: white;
//     display: grid;
//     width: 100%;
//     height: 25px;
//     justify-content: center;
//     align-content: center;
//   }
//   .closeBtn {
//     position: absolute;
//     background-color: white;
//     top: 6px;
//     right: 6px;
//     width: 3.5rem;
//     line-height: 3rem;
//     text-align: center;
//     cursor: pointer;
//     border-radius: 2.25rem;
//     border: 2px solid #5f6871;
//     color: #5f6871;
//     padding-bottom: 5px;
//     font-size: 2rem;
//     :hover {
//       transform: scale(1.1);
//       transition: transform 0.5s;
//     }
//   }
//   .previewContainer {
//     position: fixed;
//     left: 0;
//     top: 0;
//     width: 100%;
//     height: 100%;
//     background-color: rgba(0, 0, 0, 0.5);
//     z-index: 5;
//   }
//   .preview {
//     position: absolute;
//     top: 50%;
//     left: 50%;
//     transform: translate(-50%, -50%);
//     background-color: white;
//     width: 100%;
//     height: 100%;
//     overflow-y: auto;
//   }
// `;
