import styled from "styled-components";

export const StyledResource = styled.div`
  display: grid;
  grid-gap: 2rem;
  padding: 1rem;
  width: 100%;
  box-sizing: border-box;
  margin: 0 auto;
  position: relative;
  
  .headerEdit {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
    width: 100%;
    max-width: 900px;
    border: 1px solid var(--MH-Theme-Neutrals-Light, #d1d1d1);
    border-radius: 8px;
    position: sticky;
    top: 0;
    z-index: 100;
    padding: 16px 24px;
    background: var(--MH-Theme-Neutrals-White, #ffffff);
  }

  h1 {
    font: var(--MH-Type-Heading-Base);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Black, #171717);
    margin-bottom: 0.5rem;
  }

  h2 {
    font: var(--MH-Type-Heading-Small);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Black, #171717);
    margin-bottom: 0.5rem;
  }

  p {
    font: var(--MH-Type-Body-Base);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
    margin: 0;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .goBackBtn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: #6c757d;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.2s;
    &:hover {
      background: #5a6268;
    }
  }

  .searchBar {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    align-items: center;
    gap: 1rem;
    width: 100%;
  }

  .resourceSearch {
    flex: 1;
    min-width: 200px;
    max-width: 400px;
    min-height: 40px;
    padding: 8px 14px;
    box-sizing: border-box;
    border: 1px solid var(--MH-Theme-Neutrals-Medium, #a1a1a1);
    border-radius: 8px;
    background: var(--MH-Theme-Neutrals-White, #ffffff);
    color: var(--MH-Theme-Neutrals-Black, #171717);
    font: var(--MH-Type-Body-Base);
    letter-spacing: 0;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .resourceSearch::placeholder {
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }

  .resourceSearch:hover {
    border-color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }

  .resourceSearch:focus {
    outline: none;
    border-color: var(--MH-Theme-Primary-Dark, #336f8a);
    box-shadow: 0 0 0 2px rgba(51, 111, 138, 0.2);
  }

  .board {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    grid-gap: 1.5rem;
    width: 100%;
    align-items: stretch;
  }

  .previewModalWrapper,
  .shareModalWrapper {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
    z-index: 2000;
    
    /* Ensure Semantic UI Popups appear above the modal */
    :global(.ui.popup),
    :global(.ui.popup.visible) {
      z-index: 3000 !important;
    }
  }

  .previewModal,
  .shareModal {
    position: relative;
    top: 10%;
    left: 100px;
    max-width: 80%;
    max-height: 90vh;
    background: white;
    padding: 2.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    overflow: auto;
    width: 100%;
    box-sizing: border-box;
    h2 {
      font: var(--MH-Type-Title-Large);
      letter-spacing: 0;
      margin-bottom: 1rem;
    }
    .closeBtn {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: none;
      border: none;
      font-size: 1.8rem;
      cursor: pointer;
      color: #6c757d;
      &:hover {
        color: #343a40;
      }
    }
  }

  .shareModal {
    .searchSection {
      margin-bottom: 1.5rem;
      .searchInputWrapper {
        position: relative;
        display: flex;
        align-items: center;
        input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font: var(--MH-Type-Body-Base);
          letter-spacing: 0;
        }
        .clearSearchBtn {
          position: absolute;
          right: 0.5rem;
          background: none;
          border: none;
          font-size: 1.2rem;
          color: #6c757d;
          cursor: pointer;
          &:hover {
            color: #343a40;
          }
        }
      }
      .userList {
        margin-top: 1rem;
        max-height: 200px;
        overflow-y: auto;
        .userItem {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          border-bottom: 1px solid #e9ecef;
          span {
            font: var(--MH-Type-Body-Base);
            letter-spacing: 0;
            color: #495057;
          }
          .actionBtn {
            background: none;
            border: none;
            font-size: 1.2rem;
            cursor: pointer;
            &.add {
              color: #28a745;
            }
            &.remove {
              color: #dc3545;
            }
            &:hover {
              filter: brightness(80%);
            }
          }
        }
      }
    }
    .collaboratorsSection,
    .selectedSection {
      margin-bottom: 1.5rem;
      h3 {
        font: var(--MH-Type-Title-Base);
        letter-spacing: 0;
        margin-bottom: 0.5rem;
      }
      .collaboratorsList {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        .collaboratorTag {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #e9ecef;
          padding: 0.3rem 0.6rem;
          border-radius: 4px;
          font: var(--MH-Type-Label-Base);
          letter-spacing: 0;
          span {
            color: #495057;
          }
          .actionBtn {
            background: none;
            border: none;
            font-size: 1rem;
            cursor: pointer;
            color: #dc3545;
            &:hover {
              color: #a71d2a;
            }
          }
        }
      }
    }
    .modalActions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      .saveBtn {
        padding: 0.75rem 1.5rem;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font: var(--MH-Type-Label-Base);
        letter-spacing: 0;
        &:hover {
          background: #0056b3;
        }
      }
      .cancelBtn {
        padding: 0.75rem 1.5rem;
        background: #6c757d;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font: var(--MH-Type-Label-Base);
        letter-spacing: 0;
        &:hover {
          background: #5a6268;
        }
      }
    }
    .error {
      color: #dc3545;
      font: var(--MH-Type-Body-Base);
      letter-spacing: 0;
      margin-top: 1rem;
    }
  }
`;

export default StyledResource;
