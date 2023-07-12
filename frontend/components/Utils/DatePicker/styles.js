import styled from "styled-components";

export const StyledDatePicker = styled.div`
  margin: 1rem 0rem 2rem 0rem;
  .react-date-picker {
    display: inline-flex;
    position: relative;
  }
  .react-date-picker,
  .react-date-picker *,
  .react-date-picker *:before,
  .react-date-picker *:after {
    -moz-box-sizing: border-box;
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
    margin: 0rem;
  }
  .react-date-picker--disabled {
    background-color: #42d8c9;
    color: white;
  }
  .react-date-picker__wrapper {
    display: grid;
    grid-template-columns: 1fr auto;
    grid-gap: 1rem;
  }
  .react-date-picker__inputGroup {
    display: grid;
    grid-template-columns: repeat(3, auto);
    align-content: center;
    font-size: 16px;
  }
  .react-date-picker__inputGroup__divider {
    display: none;
  }
  .react-date-picker__inputGroup__input {
    position: relative;
    border: 0;
    background: none;
    font: inherit;
    box-sizing: content-box;
    -moz-appearance: textfield;
    border: 1px solid #cccccc;
    width: 92px !important;
    text-align: center;
    margin-bottom: 0rem;
    padding: 0rem;
  }
  .react-date-picker__inputGroup__input::-webkit-outer-spin-button,
  .react-date-picker__inputGroup__input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .react-date-picker__inputGroup__input:invalid {
    background: rgba(255, 0, 0, 0.1);
  }
  .react-date-picker__inputGroup__input--hasLeadingZero {
    margin-left: -0.54em;
    padding-left: calc(1px + 0.54em);
  }
  .react-date-picker__button {
    border: 0;
    background: transparent;
  }
  .react-date-picker__button:enabled {
    cursor: pointer;
  }
  .react-date-picker__button:enabled:hover .react-date-picker__button__icon,
  .react-date-picker__button:enabled:focus .react-date-picker__button__icon {
    stroke: #0078d7;
  }
  .react-date-picker__button:disabled .react-date-picker__button__icon {
    stroke: #6d6d6d;
  }
  .react-date-picker__button svg {
    display: inherit;
  }
  .react-date-picker__calendar {
    width: 350px;
    max-width: 100vw;
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 1;
  }
  .react-date-picker__calendar--closed {
    display: none;
  }
  .react-date-picker__calendar .react-calendar {
    border-width: thin;
  }
  .react-calendar {
    width: 350px;
    max-width: 100%;
    background: #007c70;
    border: 1px solid #607980;
    font-family: Arial, Helvetica, sans-serif;
    line-height: 1.125em;
  }
  .react-calendar--doubleView {
    width: 700px;
  }
  .react-calendar--doubleView .react-calendar__viewContainer {
    display: flex;
    margin: -0.5em;
  }
  .react-calendar--doubleView .react-calendar__viewContainer > * {
    width: 50%;
    margin: 0.5em;
  }
  .react-calendar,
  .react-calendar *,
  .react-calendar *:before,
  .react-calendar *:after {
    -moz-box-sizing: border-box;
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
  }
  .react-calendar button {
    margin: 0;
    border: 0;
    outline: none;
  }
  .react-calendar button:enabled:hover {
    cursor: pointer;
  }
  .react-calendar__navigation {
    /* height: 44px; */
    /* margin-bottom: 1em; */
    display: grid;
    /* grid-template-columns: 1fr 1fr 4fr 1fr 1fr; */
    justify-content: center;
    grid-template-columns: repeat(5, auto);
  }
  .react-calendar__navigation button {
    min-width: 44px;
    background: none;
    color: white;
  }
  .react-calendar__navigation button:enabled:hover,
  .react-calendar__navigation button:enabled:focus {
    background-color: #00bcd4;
  }
  .react-calendar__navigation button[disabled] {
    background-color: #42d8c9;
  }
  .react-calendar__month-view__weekdays {
    text-align: center;
    text-transform: uppercase;
    font-weight: bold;
    font-size: 0.75em;
    color: white;
  }
  .react-calendar__month-view__weekdays__weekday {
    padding: 0.5em;
  }
  .react-calendar__month-view__weekNumbers {
    font-weight: bold;
  }
  .react-calendar__month-view__weekNumbers .react-calendar__tile {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75em;
    padding: calc(0.75em / 0.75) calc(0.5em / 0.75);
  }
  .react-calendar__month-view__days__day--weekend {
    color: white;
  }
  .react-calendar__month-view__days__day--neighboringMonth {
    color: white;
  }
  .react-calendar__year-view .react-calendar__tile,
  .react-calendar__decade-view .react-calendar__tile,
  .react-calendar__century-view .react-calendar__tile {
    padding: 2em 0.5em;
  }
  .react-calendar__tile {
    max-width: 100%;
    text-align: center;
    padding: 0.75em 0.5em;
    background: none;
    color: white;
  }
  .react-calendar__tile:disabled {
    background-color: #42d8c9;
  }
  .react-calendar__tile:enabled:hover,
  .react-calendar__tile:enabled:focus {
    background-color: #00bcd4;
  }
  .react-calendar__tile--now {
  }
  .react-calendar__tile--now:enabled:hover,
  .react-calendar__tile--now:enabled:focus {
    background: #00bcd4;
  }
  .react-calendar__tile--hasActive {
    background: #76baff;
  }
  .react-calendar__tile--hasActive:enabled:hover,
  .react-calendar__tile--hasActive:enabled:focus {
    background: #a9d4ff;
  }
  .react-calendar__tile--active {
    background: #006edc;
    color: white;
  }
  .react-calendar__tile--active:enabled:hover,
  .react-calendar__tile--active:enabled:focus {
    background: #10ff7c;
  }
  .react-calendar--selectRange .react-calendar__tile--hover {
    background-color: #00bcd4;
  }
`;
