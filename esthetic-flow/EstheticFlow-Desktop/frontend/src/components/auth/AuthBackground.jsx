const BACKGROUND_IMAGE =
  "/images/login-background.png";

export function AuthBackground() {

  return (
    <div className="
      pointer-events-none
      fixed
      inset-0
      overflow-hidden
    ">

      <img
        src={BACKGROUND_IMAGE}
        alt=""
        className="
          h-full
          w-full
          scale-105
          object-cover
          object-center
        "
      />

      <div className="
        absolute
        inset-0
        bg-gradient-to-br
        from-white/25
        via-rose-50/10
        to-pink-100/20
      " />

      <div className="
        absolute
        inset-0
        backdrop-blur-[1px]
      " />

      <div className="
        absolute
        inset-0
        bg-gradient-to-t
        from-rose-200/15
        via-transparent
        to-white/20
      " />

      <div className="
        absolute
        -left-20
        top-1/4
        h-64
        w-64
        rounded-full
        bg-rose-300/20
        blur-3xl
      " />

      <div className="
        absolute
        -right-16
        bottom-1/4
        h-72
        w-72
        rounded-full
        bg-amber-200/15
        blur-3xl
      " />

    </div>
  );
}
