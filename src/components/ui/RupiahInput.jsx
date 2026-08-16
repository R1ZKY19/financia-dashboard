import { formatNumberInput, parseRupiah } from '../../utils/format';

export default function RupiahInput({ value, onChange, placeholder = '0', ...rest }) {
  return (
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-soft font-medium">Rp</span>
      <input
        type="text"
        inputMode="numeric"
        className="input pl-10"
        placeholder={placeholder}
        value={formatNumberInput(value)}
        onChange={(e) => onChange(parseRupiah(e.target.value))}
        {...rest}
      />
    </div>
  );
}
