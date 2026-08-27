import styled from "styled-components";

export const StyledResource = styled.div`
  display: grid;
  grid-gap: 2rem;
  padding: 1rem;
  width: 100%;
  box-sizing: border-box;
  margin: 0 auto;
  position: relative;

  h1 {
    font: var(--MH-Type-Heading-Base, 600 36px/44px "Inter", sans-serif);
    letter-spacing: 0;
    margin-bottom: 0.5rem;
  }

  h2 {
    font: var(--MH-Type-Heading-Small, 600 28px/36px "Inter", sans-serif);
    letter-spacing: 0;
    margin-bottom: 0.5rem;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    .menu {
      display: flex;
      gap: 1rem;
      .menuTitle {
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        transition: background 0.2s;
        &:hover {
          background: #f0f0f0;
        }
      }
      .selectedMenuTitle {
      }
    }
    button {
      padding: 0.75rem 1.5rem;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.2s;
      &:hover {
        background: #0056b3;
      }
    }
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
    gap: 1rem;
    width: 100%;
    input {
      flex: 1;
      padding: 0.75rem;
      border: 1px solid #ced4da;
      border-radius: 4px;
      font: var(--MH-Type-Body-Base, 400 16px/24px "Inter", sans-serif);
      letter-spacing: 0;
    }
    select {
      padding: 0.75rem;
      border: 1px solid #ced4da;
      border-radius: 4px;
      font: var(--MH-Type-Body-Base, 400 16px/24px "Inter", sans-serif);
      letter-spacing: 0;
    }
  }

  .board {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    grid-gap: 2rem;
    width: 100%;
  }

  .card {
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 2rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s, box-shadow 0.2s;
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    .card-title {
      font: var(--MH-Type-Title-Base, 600 16px/24px "Inter", sans-serif);
      letter-spacing: 0;
      margin: 0;
    }
    .card-meta {
      font: var(--MH-Type-Body-Small, 400 12px/16px "Inter", sans-serif);
      letter-spacing: 0;
      color: #6c757d;
      margin: 0;
    }
    .card-collaborators {
      font: var(--MH-Type-Body-Small, 400 12px/16px "Inter", sans-serif);
      letter-spacing: 0;
      color: #495057;
      margin: 0;
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      span {
        background: #e9ecef;
        padding: 0.3rem 0.6rem;
        border-radius: 4px;
      }
    }
    .card-actions {
      display: flex;
      gap: 1rem;
      margin-top: auto;
      .action-icon {
        font-size: 2rem;
        width: 2rem;
        height: 2rem;
        cursor: pointer;
        transition: color 0.2s;
        &.preview {
          color: #007bff;
        }
        &.edit {
          color: #ffc107;
        }
        &.copy {
          color: #28a745;
        }
        &.share {
          color: #17a2b8;
        }
        &.delete {
          color: #dc3545;
        }
        &:hover {
          filter: brightness(80%);
        }
      }
    }
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
      font: var(--MH-Type-Title-Large, 600 22px/28px "Inter", sans-serif);
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
          font: var(--MH-Type-Body-Base, 400 16px/24px "Inter", sans-serif);
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
            font: var(--MH-Type-Body-Base, 400 16px/24px "Inter", sans-serif);
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
        font: var(--MH-Type-Title-Base, 600 16px/24px "Inter", sans-serif);
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
          font: var(--MH-Type-Label-Base, 500 14px/20px "Inter", sans-serif);
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
        font: var(--MH-Type-Label-Base, 500 14px/20px "Inter", sans-serif);
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
        font: var(--MH-Type-Label-Base, 500 14px/20px "Inter", sans-serif);
        letter-spacing: 0;
        &:hover {
          background: #5a6268;
        }
      }
    }
    .error {
      color: #dc3545;
      font: var(--MH-Type-Body-Base, 400 16px/24px "Inter", sans-serif);
      letter-spacing: 0;
      margin-top: 1rem;
    }
  }
`;

export default StyledResource;
