export default function Card({ children, className = '', padding = true, ...rest }) {
  return (
    <div className={`card ${padding ? 'p-5' : ''} ${className}`} {...rest}>
      {children}
    </div>
  );
}
