import styled from "styled-components";

export const StyledDatasetView = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;

  .dataset-content {
    display: flex;
    flex: 1;
    width: 100%;
    gap: 12px;
    overflow: hidden;
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  }

  .left-panel {
    width: 40%;
    min-width: 320px;
    max-width: 480px;
    background: #ffffff;
    border-radius: 12px 0 0 12px;
    padding: 12px;
    overflow-y: auto;
    border-right: 1px solid #e0e0e0;

    .database {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .header {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 12px;
        padding-bottom: 12px;
        border-bottom: 1px solid #e0e0e0;

        .header-icon {
          width: 24px;
          height: 24px;
          flex-shrink: 0;
        }

        .header-title {
          font-family: "Nunito", sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .metaStrip {
          grid-column: 1 / -1;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 6px;
          margin-top: 2px;
          font-family: Inter, sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: #6a6a6a;
        }
      }

      .primaryAction {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 14px;
        border-radius: 8px;
        border: 1px solid var(--MH-Theme-Primary-Dark, #336f8a);
        background: var(--MH-Theme-Primary-Dark, #336f8a);
        color: #ffffff;
        font-family: Inter, sans-serif;
        font-size: 14px;
        font-weight: 600;
        line-height: 1;
        cursor: pointer;
        transition: background-color 0.15s ease, box-shadow 0.15s ease,
          opacity 0.15s ease;

        img {
          width: 16px;
          height: 16px;
          filter: brightness(0) invert(1);
        }

        &:hover:not(:disabled) {
          background: #285775;
          border-color: #285775;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }

      .toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
        margin-bottom: 8px;

        .toolbarChip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
          background: #ffffff;
          color: #1e293b;
          font-family: Inter, sans-serif;
          font-size: 14px;
          font-weight: 500;
          line-height: 1;
          cursor: pointer;
          transition: background-color 0.15s ease, border-color 0.15s ease;

          img {
            width: 16px;
            height: 16px;
          }

          &:hover {
            background: #f4f8f7;
            border-color: #c4c4c4;
          }

          &.toolbarChip--primary {
            border-color: var(--MH-Theme-Primary-Dark, #336f8a);
            color: var(--MH-Theme-Primary-Dark, #336f8a);

            &:hover {
              background: #ecf3f5;
            }
          }
        }
      }

      .variables-global-search {
        margin-top: 0;
        margin-bottom: 2px;
      }

      .variables-global-search__input {
        width: 100%;
        box-sizing: border-box;
        padding: 8px 12px;
        border-radius: 8px;
        border: 1.5px solid #e0e0e0;
        background: #ffffff;
        color: #1e293b;
        font-family: Inter, sans-serif;
        font-size: 14px;
        font-weight: 400;
        line-height: 1.4;
        min-width: 0;
        transition: border-color 0.15s ease, box-shadow 0.15s ease;

        &::placeholder {
          color: #A1A1A1;
        }

        &:focus {
          outline: none;
          border-color: var(--MH-Theme-Primary-Dark, #336f8a);
          box-shadow: 0 0 0 2px rgba(51, 111, 138, 0.15);
        }
      }

      .variables-section {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .section-header {
          font-family: "Nunito", sans-serif;
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 4px;
          padding-bottom: 6px;
          border-bottom: 1px solid #e0e0e0;
        }

        .variables {
          display: grid;
          gap: 0.5rem;
          min-width: 0;
        }

        .variables-section__searchEmpty {
          font-family: Inter, sans-serif;
          font-size: 13px;
          line-height: 1.4;
          color: #64748b;
          padding: 8px 4px;
        }

        .variableRow {
          border: 1px solid #e6e6e6;
          border-radius: 10px;
          padding: 0.65rem 0.75rem;
          background: #ffffff;
          box-sizing: border-box;
          min-width: 0;
          width: 100%;
          transition: background-color 0.15s ease, border-color 0.15s ease;

          &.hidden {
            opacity: 0.7;
            background: #f8fafc;
          }
        }

        .variableRowHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          min-width: 0;
          width: 100%;
        }

        .variableRowLabel {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0;
          min-width: 0;
          flex: 1 1 auto;
        }

        .variableRowName {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-family: Inter, sans-serif;
          font-weight: 300;
          font-size: 14px;
          line-height: 1.5;
          color: #000000;
        }

        .variableEyeBtn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          padding: 4px;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.15s ease;

          img {
            width: 16px;
            height: 16px;
          }

          &:hover {
            background: #f1f5f9;
          }
        }

        .variableRowActions {
          display: flex;
          align-items: center;
          gap: 4px;
          flex: 0 0 auto;

          .ui.dropdown {
            display: inline-flex;
            align-items: center;
            padding: 4px;
            border-radius: 6px;
            cursor: pointer;
            transition: background-color 0.15s ease;

            img {
              width: 16px;
              height: 16px;
            }

            &:hover {
              background: #f1f5f9;
            }
          }

          .ui.dropdown .menu > .item {
            padding: 8px 12px !important;

            .menuItem {
              display: inline-flex;
              align-items: center;
              gap: 8px;
              color: #000;
              font-family: Inter, sans-serif;
              font-size: 14px;
              font-weight: 400;
              line-height: 1;
              white-space: nowrap;
              cursor: pointer;
            }

            .menuItem img {
              width: 16px;
              height: 16px;
              flex-shrink: 0;
            }
          }
        }
      }

      .ui.accordion {
        .title {
          .task {
            display: flex;
            align-items: center;
            gap: 8px;
            font-family: "Nunito", sans-serif;
            font-size: 14px;
            color: #1e293b;

            .ui.icon {
              color: #666666;
            }

            .title {
              font-weight: 600;
            }

            .subtitle {
              font-size: 12px;
              color: #666666;
            }
          }
        }

        .content {
          padding: 12px;
        }
      }
    }
  }

  .right-panel {
    flex: 1;
    padding: 8px;
    overflow-y: auto;
    border-radius: 0 12px 12px 0;

    .ag-theme-quartz {
      --ag-font-family: "Nunito", sans-serif;
      --ag-font-size: 14px;
      --ag-header-background-color: #f8fafc;
      --ag-header-foreground-color: #1e293b;
      --ag-border-color: #e0e0e0;
      --ag-row-hover-color: #f1f5f9;
      --ag-background-color: #ffffff;
      height: 100%;
      width: 100%;
      border-radius: 4px;
    }
  }

  @media (max-width: 1200px) {
    .left-panel {
      width: 35%;
      min-width: 280px;
    }
  }

  @media (max-width: 1024px) {
    padding: 16px;

    .dataset-content {
      flex-direction: column;
      gap: 0;
    }

    .left-panel {
      width: 100%;
      max-width: none;
      border-radius: 12px 12px 0 0;
      border-right: none;
      border-bottom: 1px solid #e0e0e0;
      max-height: 40vh;
    }

    .right-panel {
      border-radius: 0 0 12px 12px;
    }
  }
`;
