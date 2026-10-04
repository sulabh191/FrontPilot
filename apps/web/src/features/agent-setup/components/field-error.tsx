export function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="text-destructive mt-1 text-sm">{errors[0]}</p>;
}
