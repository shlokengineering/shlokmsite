import ComboBox from "./ComboBox";
import { INSURERS } from "../constants/insurers";

interface InsurerAutocompleteProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

/** Free-text input with case-insensitive substring suggestions from the known insurer list. */
export default function InsurerAutocomplete({
  id = "insurer-name",
  value,
  onChange,
  required,
}: InsurerAutocompleteProps) {
  return (
    <ComboBox
      id={id}
      value={value}
      onChange={onChange}
      options={INSURERS}
      required={required}
      placeholder="Type insurer name…"
    />
  );
}
