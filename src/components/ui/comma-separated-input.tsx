import { useState, useEffect } from "react";
import { Input } from "./input";
import { Label } from "./label";

interface CommaSeparatedInputProps {
  id: string;
  label: string;
  placeholder?: string;
  value: string[];
  onChange: (values: string[]) => void;
  description?: string;
  className?: string;
}

export function CommaSeparatedInput({
  id,
  label,
  placeholder,
  value,
  onChange,
  description,
  className = "",
}: CommaSeparatedInputProps) {
  const [inputValue, setInputValue] = useState(value.join(", "));

  // Update input when value changes externally
  useEffect(() => {
    setInputValue(value.join(", "));
  }, [value]);

  const handleBlur = () => {
    const values = inputValue
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    onChange(values);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur();
    }
  };

  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        placeholder={placeholder}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleBlur}
        onKeyPress={handleKeyPress}
      />
      {description && (
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      )}
    </div>
  );
}
