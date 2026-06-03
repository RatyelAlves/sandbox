export function GlassInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  icon: Icon,
  trailing,
  autoComplete,
}) {

  return (
    <div className="group relative">

      <label
        htmlFor={id}
        className="
          mb-2
          block
          text-[10px]
          font-medium
          uppercase
          tracking-[0.28em]
          text-zinc-500
        "
      >
        {label}
      </label>

      <div className="relative flex items-center">

        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="
            w-full
            border-0
            border-b
            border-zinc-300/70
            bg-transparent
            px-1
            py-3
            pb-3.5
            pr-12
            text-base
            text-zinc-800
            placeholder:text-zinc-400
            outline-none
            transition-all
            duration-300
            focus:border-rose-400
            focus:shadow-[0_6px_20px_-10px_rgba(244,63,94,0.45)]
          "
        />

        {trailing || (
          Icon && (
            <Icon
              size={18}
              className="
                pointer-events-none
                absolute
                right-1
                text-zinc-400
                transition-colors
                duration-300
                group-focus-within:text-rose-500
              "
            />
          )
        )}

      </div>

    </div>
  );
}
