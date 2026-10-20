import cardImg from "../../../public/assets/cards.png";

interface Props {
  fname: string;
}

const WelcomeCard = ({ fname }: Props) => {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <section className="relative overflow-hidden rounded-3xl bg-white bg-[radial-gradient(circle_at_top_right,#dbeafe,transparent_55%),radial-gradient(circle_at_bottom_left,#ffedd5,transparent_50%)] p-6 shadow-[0_10px_40px_-12px_rgba(30,64,175,0.18)] ring-1 ring-blue-100 sm:p-8">
      {/* soft decorative rings */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full border border-blue-200/70" />
      <div className="pointer-events-none absolute -right-3 -top-3 h-24 w-24 rounded-full border border-blue-200/70" />

      <div className="relative flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
        {/* Text */}
        <div className="max-w-md">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-200">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            {today}
          </span>

          <p className="m-0 mt-4 text-sm font-medium text-gray-500">
            Welcome back
          </p>
          <h2 className="m-0 mt-1 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            {fname}
          </h2>
          <p className="m-0 mt-3 text-sm leading-relaxed text-gray-500 sm:text-base">
            Have a productive and great day ahead. Everything you need is ready
            in your dashboard.
          </p>
        </div>

        {/* Illustration */}
        <div className="relative flex h-40 w-full max-w-[260px] flex-shrink-0 items-end justify-center sm:h-48 sm:w-[260px]">
          <div className="absolute bottom-0 h-36 w-36 rounded-full bg-blue-100/70 sm:h-44 sm:w-44" />

          <img
            src={cardImg}
            alt=""
            className="absolute bottom-1 left-2 w-28 -rotate-12 opacity-90 sm:w-32"
          />

          <img
            src="https://pub-c5e31b5cdafb419fb247a8ac2e78df7a.r2.dev/public/assets/illustrations/characters/character-present.webp"
            alt=""
            className="relative z-10 h-36 sm:h-44"
          />
        </div>
      </div>
    </section>
  );
};

export default WelcomeCard;
