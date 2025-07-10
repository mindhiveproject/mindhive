import { Dropdown } from "semantic-ui-react";
import useTranslation from 'next-translate/useTranslation';

export default function CardType({ type, handleChange }) {
  const { t } = useTranslation('classes');
  const options = [
    { key: "collective", text: t('board.collective', 'Collective'), value: "COLLECTIVE" },
    { key: "individual", text: t('board.individual', 'Individual'), value: "INDIVIDUAL" },
  ];

  return (
    <Dropdown
      placeholder={t('board.selectType', 'Select type')}
      fluid
      selection
      options={options}
      onChange={(e, data) => {
        handleChange({ target: { name: "shareType", value: data?.value } });
      }}
      value={type}
    />
  );
}
