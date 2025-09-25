import styled from "styled-components";

export const StyledDatasetView = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
  padding: 24px;

  .dataset-view-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: #f8fafc;
    border-bottom: 1px solid #e0e0e0;
    border-radius: 12px 12px 0 0;
    margin-bottom: 24px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

    h2 {
      font-family: "Nunito", sans-serif;
      font-size: 24px;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }
  }

  .dataset-content {
    display: flex;
    flex: 1;
    width: 100%;
    gap: 24px;
    overflow: hidden;
    background: #ffffff;
    border-radius: 0 0 12px 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  }

  .left-panel {
    width: 40%;
    min-width: 320px;
    max-width: 480px;
    background: #f8fafc;
    border-radius: 12px 0 0 12px;
    padding: 24px;
    overflow-y: auto;
    border-right: 1px solid #e0e0e0;

    .database {
      display: flex;
      flex-direction: column;
      gap: 20px;

      .header {
        display: flex;
        align-items: center;
        gap: 12px;
        font-family: "Nunito", sans-serif;
        font-size: 18px;
        font-weight: 700;
        color: #1e293b;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid #e0e0e0;

        img {
          width: 24px;
          height: 24px;
        }

        .header-actions {
          margin-left: auto;
          display: flex;
          gap: 8px;
          align-items: center;

          .save-icon,
          .refresh-icon {
            background: #ffffff;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background-color 0.2s ease;

            &:hover {
              background: #f1f5f9;
            }

            .ui.icon {
              color: #666666;
              font-size: 16px;
            }
          }

          .dataButtonPart {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            border-radius: 4px;
            font-family: "Nunito", sans-serif;
            font-size: 14px;
            color: #28619e;
            cursor: pointer;
            transition: background-color 0.2s ease;

            &.blueFrame {
              background: #ecf8fb;
              border: 1px solid #28619e;

              &:hover {
                background: #d6eef2;
              }
            }

            img {
              width: 16px;
              height: 16px;
            }

            a {
              color: #28619e;
              text-decoration: none;
            }
          }
        }
      }

      .options {
        display: grid;
        grid-template-columns: 1fr 5fr;
        flex-wrap: wrap;
        gap: 12px;
        margin-bottom: 20px;

        .optionsFrame {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          flex-wrap: wrap;

          .optionsButtonGreen,
          .optionsButtonYellow {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 14px;
            border-radius: 4px;
            font-family: "Nunito", sans-serif;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s ease;

            &.optionsButtonGreen {
              background: #f4f8f7;
              color: #1e293b;

              &:hover {
                background: #e0e6e5;
              }
            }

            &.optionsButtonYellow {
              background: #fdf2d0;
              color: #1e293b;

              &:hover {
                background: #f0e5b0;
              }
            }

            img,
            .ui.icon {
              width: 16px;
              height: 16px;
              color: #666666;
            }
          }
        }
      }

      .variables-section {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .section-header {
          font-family: "Nunito", sans-serif;
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 8px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e0e0e0;
        }

        .variables {
          display: flex;
          flex-direction: column;
          gap: 12px;

          .variable {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            background: #ffffff;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            transition: background-color 0.2s ease;

            &:hover {
              background: #f8fafc;
            }

            &.hidden {
              opacity: 0.7;
              background: #f8fafc;
            }

            .name {
              display: flex;
              align-items: center;
              gap: 8px;
              cursor: pointer;

              label {
                font-family: "Nunito", sans-serif;
                font-size: 14px;
                font-weight: 500;
                color: #1e293b;
                margin: 0;
              }
            }

            .icons {
              display: flex;
              gap: 8px;

              .visibilityIcon {
                cursor: pointer;
                padding: 6px;
                border-radius: 4px;
                transition: background-color 0.2s ease;

                &:hover {
                  background: #e0e0e0;
                }

                .ui.icon {
                  width: 16px;
                  height: 16px;
                  color: #666666;
                }
              }

              .ui.dropdown {
                .icon {
                  width: 16px;
                  height: 16px;
                  color: #666666;
                }

                &:hover {
                  .icon {
                    color: #1e293b;
                  }
                }
              }
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
    padding: 24px;
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
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
  }

  .dataset-footer {
    padding: 16px 24px;
    background: #f8fafc;
    border-top: 1px solid #e0e0e0;
    border-radius: 0 0 12px 12px;
    font-family: "Nunito", sans-serif;
    font-size: 13px;
    color: #666666;
    margin-top: 24px;
  }

  /* Responsive design */
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
