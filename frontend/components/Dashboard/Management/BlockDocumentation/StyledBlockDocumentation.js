import styled from "styled-components";

const StyledBlockDocumentation = styled.div`
  display: grid;
  grid-gap: 20px;
  padding: 20px 0;

  .pageHeader {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 16px;
    
    .headerIcon {
      width: 56px;
      height: 56px;
      background: #336F8A;
      border-radius: 50%;
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      
      img {
        width: 28px;
        height: 28px;
        filter: brightness(0) invert(1);
      }
    }

    h1 {
      font-size: 30px;
      font-weight: 800;
      margin: 10px 0;
      color: #1b1c1d;
    }

    .description {
      color: #767676;
      max-width: 600px;
      margin: 0 auto;
      font-size: 14px;
    }
  }

  .warningBanner {
    background: #fffaf0;
    border: 1px solid #F2BE42;
    border-left: 4px solid #F2BE42;
    padding: 16px;
    margin-bottom: 16px;
    border-radius: 8px;
    display: grid;
    grid-template-columns: auto 1fr;
    grid-gap: 12px;
    align-items: start;

    .icon {
      color: #F2BE42;
      font-size: 20px;
    }

    .content {
      .title {
        font-weight: bold;
        margin-bottom: 4px;
        color: #573a08;
      }

      .message {
        font-size: 14px;
        color: #946c00;
      }
    }
  }

  .configSection {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    grid-gap: 12px;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }

    input,
    select {
      padding: 12px;
      border: 1px solid #d4d4d5;
      border-radius: 8px;
      font-size: 14px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

      &:focus {
        outline: none;
        border-color: #336F8A;
        box-shadow: 0 0 0 3px rgba(100, 53, 201, 0.1);
      }

      &:disabled {
        background: #f3f4f5;
        cursor: not-allowed;
        opacity: 0.6;
      }
    }

    button {
      padding: 12px 16px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      background: #336F8A;
      color: white;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      &.openSheetButton {
        background: transparent;
        border: 1px solid #336F8A;
        color: #336F8A;

        &:hover:not(:disabled) {
          background: #D8D3E7;
          color: #434343;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
      }

      &:hover:not(:disabled) {
        background: #5829bb;
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }

      .spinner {
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    }
  }

  .errorBanner {
    background: #fff6f6;
    border-left: 4px solid #db2828;
    padding: 16px;
    border-radius: 8px;
    
    .title {
      font-weight: bold;
      margin-bottom: 4px;
      color: #912d2b;
      font-size: 14px;
    }

    .message {
      font-size: 12px;
      color: #991b1a;
    }
  }

  .languageSection {
    display: grid;
    grid-gap: 16px;
    padding-top: 16px;
    border-top: 1px solid #e0e1e2;

    .languagePills {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;

      .label {
        font-size: 14px;
        font-weight: 600;
        color: #1b1c1d;
        margin-right: 8px;
        white-space: nowrap;
      }

      button {
        padding: 6px 12px;
        font-size: 12px;
        border-radius: 16px;
        border: none;
        cursor: pointer;
        font-weight: 500;
        white-space: nowrap;
        transition: all 0.15s;
        display: flex;
        align-items: center;
        gap: 4px;

        &.selected {
          background: #336F8A;
          color: white;
          box-shadow: 0 2px 4px rgba(100, 53, 201, 0.3);
        }

        &:not(.selected) {
          background: #e0e1e2;
          color: #1b1c1d;

          &:hover:not(:disabled) {
            background: #cacbcd;
          }
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }

    .searchBox {
      position: relative;

      input {
        width: 100%;
        padding: 12px 12px 12px 40px;
        border: 1px solid #d4d4d5;
        border-radius: 8px;
        font-size: 14px;
        box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);

        &:focus {
          outline: none;
          border-color: #336F8A;
          box-shadow: 0 0 0 3px rgba(100, 53, 201, 0.1);
        }
      }

      .searchIcon {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: #767676;
        font-size: 16px;
      }
    }
  }

  .resultsSection {
    display: grid;
    grid-gap: 8px;

    .sectionTitle {
      font-size: 20px;
      font-weight: bold;
      color: #1b1c1d;
      padding-top: 16px;
      border-top: 1px solid #e0e1e2;
    }

    .tableContainer {
      background: white;
      border: 1px solid #d4d4d5;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

      .tableWrapper {
        overflow-x: auto;
        max-height: 40vh;
        
        table {
          width: 100%;
          border-collapse: collapse;
          
          thead {
            background: #f9fafb;
            position: sticky;
            top: 0;
            z-index: 10;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

            th {
              padding: 12px 24px;
              text-align: left;
              font-size: 12px;
              font-weight: 600;
              color: #767676;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              white-space: nowrap;
              border-bottom: 1px solid #d4d4d5;

              &:first-child {
                width: 25%;
              }

              &:last-child {
                width: 75%;
              }
            }
          }

          tbody {
            tr {
              transition: background 0.15s;
              border-bottom: 1px solid #f3f4f5;

              &:hover {
                background: #D3E0E3;
              }

              td {
                padding: 12px 24px;
                vertical-align: top;

                &:first-child {
                  font-family: 'Courier New', monospace;
                  font-size: 12px;
                  color: #1b1c1d;
                  width: 25%;
                }

                &:last-child {
                  font-size: 14px;
                  color: #1b1c1d;
                  white-space: pre-wrap;
                  width: 75%;
                }
              }
            }
          }
        }
      }

      .tableFooter {
        text-align: right;
        font-size: 12px;
        color: #767676;
        padding: 8px 16px;
        border-top: 1px solid #d4d4d5;
        background: #f9fafb;

        strong {
          color: #1b1c1d;
        }
      }
    }

    .emptyState {
      text-align: center;
      padding: 48px;
      color: #767676;
    }
  }

  .jsonSection {
    display: grid;
    grid-gap: 16px;
    padding-top: 16px;
    padding-bottom: 128px;
    border-top: 1px solid #e0e1e2;

    .sectionHeader {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 16px;
      .headerIcon { 
      width: 30px;
      height: 30px;
      background: #336F8A;
      border-radius: 50%;
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      
      img {
        width: 16px;
        height: 16px;
        filter: brightness(0) invert(1);
      }
    }

      h2 {
        font-size: 20px;
        font-weight: bold;
        color: #1b1c1d;
        margin: 0;
      }

      .icon {
        color: #336F8A;
        width: 20px;
        height: 20px;
      }
    }

    .description {
      font-size: 14px;
      color: #767676;

      strong {
        color: #1b1c1d;
      }
    }

    .jsonError {
      background: #fff6f6;
      border-left: 4px solid #db2828;
      padding: 12px;
      border-radius: 8px;
      font-size: 14px;
      color: #991b1a;
    }

    .jsonTextarea {
      width: 100%;
      height: 320px;
      padding: 16px;
      font-family: 'Courier New', monospace;
      font-size: 16px;
      // border: 1px solid #d4d4d5;
      border-radius: 8px;
      background: #171717;
      color: #F3F3F3;
      resize: none;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);

      &:focus {
        outline: none;
        border-color: #336F8A;
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 0 0 3px rgba(100, 53, 201, 0.1);
      }
    }

    .actionButtons {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 12px;
      padding-top: 8px;

      button {
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 12px;

        &.sendButton {
          background: #274E5B;
          color: white;

          &:hover:not(:disabled) {
            background: #F9D978;
            color: #434343;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
          }
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      }
    }
  }

  .noDataMessage {
    text-align: center;
    padding: 48px;
    color: #767676;
    font-size: 14px;
  }
`;

export default StyledBlockDocumentation;

