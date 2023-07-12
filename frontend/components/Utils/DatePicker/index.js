import React, { useState } from "react";

import DatePicker from "react-date-picker";
import { StyledDatePicker } from "./styles";

export default function MyDatePicker({ onDateInput }) {
  const [value, onChange] = useState(null);

  const onInput = (e) => {
    onChange(e);
    const timestamp = Date.parse(e); // save as a timestamp
    onDateInput(timestamp);
  };

  return (
    <StyledDatePicker>
      <DatePicker
        onChange={(e) => onInput(e)}
        value={value}
        monthPlaceholder="MM"
        dayPlaceholder="DD"
        yearPlaceholder="YYYY"
        clearIcon={null}
      />
    </StyledDatePicker>
  );
}
