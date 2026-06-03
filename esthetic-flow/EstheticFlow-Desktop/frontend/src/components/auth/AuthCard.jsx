import {
  Sparkles,
} from "lucide-react";

export function AuthCard({
  children,
  footer,
}) {

  return (
    <div className="
      relative
      z-10
      w-full
      max-w-md
      animate-[fadeUp_0.8s_ease-out]
    ">

      <div className="
        absolute
        -inset-1
        rounded-[2rem]
        bg-gradient-to-br
        from-rose-200/40
        via-white/20
        to-amber-100/30
        blur-xl
        opacity-70
      " />

      <div className="
        relative
        overflow-hidden
        rounded-3xl
        border
        border-white/70
        bg-white/72
        px-8
        py-10
        shadow-[0_12px_40px_rgba(190,24,93,0.12)]
        backdrop-blur-xl
        sm:px-10
        sm:py-12
      ">

        <div className="
          pointer-events-none
          absolute
          inset-0
          bg-gradient-to-b
          from-white/50
          via-rose-50/20
          to-pink-50/30
        " />

        <div className="
          pointer-events-none
          absolute
          -right-16
          -top-16
          h-40
          w-40
          rounded-full
          bg-rose-200/25
          blur-3xl
        " />

        <div className="
          pointer-events-none
          absolute
          -bottom-12
          -left-10
          h-36
          w-36
          rounded-full
          bg-amber-100/30
          blur-3xl
        " />

        <div className="relative">
          {children}
        </div>

        {footer && (
          <p className="
            relative
            mt-8
            border-t
            border-rose-100
            pt-6
            text-center
            text-xs
            font-light
            italic
            leading-relaxed
            tracking-wide
            text-zinc-500
          ">
            {footer}
          </p>
        )}

      </div>

    </div>
  );
}

export function AuthHeader({
  title = "EstheticFlow",
  subtitle = "Luxury Beauty Management",
  icon: Icon,
}) {

  return (
    <div className="
      relative
      mb-8
      flex
      flex-col
      items-center
      text-center
    ">

      <div className="relative mb-6">

        <div className="
          absolute
          inset-0
          scale-150
          rounded-full
          bg-rose-300/30
          blur-2xl
        " />

        <div className="
          relative
          flex
          h-20
          w-20
          items-center
          justify-center
          rounded-full
          border
          border-rose-100
          bg-white/80
          shadow-md
          shadow-rose-100/60
          backdrop-blur-sm
        ">

          {Icon && (
            <Icon
              size={32}
              className="text-rose-600"
              strokeWidth={1.5}
            />
          )}

          <Sparkles
            size={14}
            className="
              absolute
              -right-1
              -top-1
              text-amber-500/80
            "
          />

        </div>

      </div>

      <h1 className="
        font-serif
        text-3xl
        font-light
        tracking-[0.18em]
        text-zinc-800
      ">
        {title}
      </h1>

      {subtitle && (
        <p className="
          mt-3
          text-[11px]
          font-medium
          uppercase
          tracking-[0.32em]
          text-rose-500/80
        ">
          {subtitle}
        </p>
      )}

    </div>
  );
}

export function AuthSubmitButton({
  children,
  disabled,
  type = "submit",
}) {

  return (
    <button
      type={type}
      disabled={disabled}
      className="
        group
        relative
        mt-2
        w-full
        overflow-hidden
        rounded-full
        border
        border-amber-200/50
        bg-gradient-to-r
        from-rose-500
        via-rose-400
        to-pink-400
        px-6
        py-3.5
        text-sm
        font-semibold
        uppercase
        tracking-[0.2em]
        text-white
        shadow-lg
        shadow-rose-300/40
        transition-all
        duration-300
        hover:scale-[1.02]
        hover:border-amber-200/70
        hover:shadow-xl
        hover:shadow-rose-300/50
        active:scale-[0.98]
        disabled:cursor-not-allowed
        disabled:opacity-50
        disabled:hover:scale-100
      "
    >

      <span className="
        pointer-events-none
        absolute
        inset-0
        bg-gradient-to-r
        from-transparent
        via-white/20
        to-transparent
        opacity-0
        transition-opacity
        duration-300
        group-hover:opacity-100
      " />

      <span className="relative">
        {children}
      </span>

    </button>
  );
}
