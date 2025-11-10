import styled from "styled-components";

const StyledResearch = styled.div`
  display: grid;
  gap: 24px;
  padding: 24px 0 120px;

  .pageHeader {
    display: flex;
    align-items: center;
    gap: 16px;

    .headerIcon {
      width: 56px;
      height: 56px;
      background: #336f8a;
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
  }

  .intro {
    max-width: 720px;
    color: #4a4a4a;
    font-size: 15px;
    line-height: 1.6;
  }

  .filtersCard {
    background: #ffffff;
    border: 1px solid #d4d4d5;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
    display: grid;
    gap: 24px;

    .cardHeader {
      display: flex;
      flex-direction: column;
      gap: 4px;

      h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 700;
        color: #1b1c1d;
      }

      span {
        color: #6f6f6f;
        font-size: 14px;
      }
    }

    .fieldGroup {
      display: grid;
      gap: 16px;

      label {
        font-size: 13px;
        font-weight: 600;
        color: #3a3a3a;
      }

      input[type="text"] {
        width: 100%;
        padding: 12px 14px;
        border: 1px solid #d4d4d5;
        border-radius: 12px;
        font-size: 15px;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;

        &:focus {
          outline: none;
          border-color: #336f8a;
          box-shadow: 0 0 0 3px rgba(51, 111, 138, 0.15);
        }
      }
    }

    .checkboxGroup {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;

      label {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 10px 16px;
        border: 1px solid #d4d4d5;
        border-radius: 999px;
        background: #f6f7f8;
        cursor: pointer;
        font-size: 14px;
        color: #333333;
        transition: all 0.2s ease;

        input {
          width: 16px;
          height: 16px;
        }

        &.active {
          border-color: #336f8a;
          background: rgba(51, 111, 138, 0.1);
          color: #265568;
          box-shadow: 0 2px 6px rgba(51, 111, 138, 0.25);
        }
      }
    }

    .radioGroup {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;

      label {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 10px 18px;
        border: 1px solid #d4d4d5;
        border-radius: 12px;
        background: #ffffff;
        cursor: pointer;
        font-size: 14px;
        color: #333333;
        transition: all 0.2s ease;

        input {
          width: 18px;
          height: 18px;
        }

        &.active {
          border-color: #336f8a;
          box-shadow: 0 2px 6px rgba(51, 111, 138, 0.25);
        }

        &:has(input:disabled) {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }

    .chipGroup {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;

      button {
        padding: 8px 14px;
        border-radius: 999px;
        border: 1px solid #d4d4d5;
        background: #ffffff;
        color: #4a4a4a;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;

        &.active {
          border-color: #336f8a;
          background: #336f8a;
          color: #ffffff;
          box-shadow: 0 2px 6px rgba(51, 111, 138, 0.3);
        }

        &:hover {
          border-color: #336f8a;
        }
      }
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      flex-wrap: wrap;

      button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border: none;
        border-radius: 999px;
        padding: 12px 24px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;

        &.secondary {
          background: #f1f2f3;
          color: #333333;

          &:hover:not(:disabled) {
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
            transform: translateY(-1px);
          }
        }

        &.primary {
          background: #336f8a;
          color: #ffffff;

          &:hover:not(:disabled) {
            box-shadow: 0 6px 12px rgba(51, 111, 138, 0.25);
            transform: translateY(-1px);
          }
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
      }
    }
  }

  .statusPanel {
    display: grid;
    gap: 12px;
    padding: 16px 20px;
    border: 1px dashed #c7d2d9;
    border-radius: 16px;
    background: rgba(51, 111, 138, 0.05);

    h3 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: #2c4f5f;
    }

    ul {
      margin: 0;
      padding-left: 18px;
      color: #3a4b56;
      font-size: 14px;
      line-height: 1.5;
    }
  }

  .toast {
    padding: 14px 18px;
    border-radius: 12px;
    font-size: 14px;
    display: flex;
    gap: 12px;
    align-items: center;

    &.error {
      background: #fff6f6;
      border: 1px solid #f5c2c7;
      color: #a94442;
    }

    &.success {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #166534;
    }
  }

  @media (max-width: 768px) {
    .filtersCard {
      padding: 18px;
    }

    .actions {
      justify-content: stretch;

      button {
        width: 100%;
      }
    }
  }
`;

export default StyledResearch;


