import Link from "next/link";
import { Award, BookOpen } from "lucide-react";
import { formatPrice } from "@/lib/format";

type CourseCardProps = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  priceCents: number;
  credits: number;
  imageUrl?: string | null;
  lessonCount?: number;
  instructorName?: string;
};

const gradients = [
  "from-brand-500 to-brand-700",
  "from-sky-500 to-brand-700",
  "from-teal-500 to-emerald-700",
  "from-cyan-500 to-brand-800",
];

export function CourseCard(props: CourseCardProps) {
  const gradient =
    gradients[
      Math.abs(
        props.slug.split("").reduce((a, c) => a + c.charCodeAt(0), 0),
      ) % gradients.length
    ];

  return (
    <Link
      href={`/courses/${props.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div
        className={`relative flex h-36 items-center justify-center bg-gradient-to-br ${gradient}`}
      >
        {props.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={props.imageUrl}
            alt={props.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <BookOpen className="h-12 w-12 text-white/80" />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
          {props.category}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-semibold text-ink-900 group-hover:text-brand-700">
          {props.title}
        </h3>
        <p className="mt-1 line-clamp-2 flex-1 text-sm text-ink-500">
          {props.summary}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-ink-500">
            {props.credits > 0 && (
              <span className="flex items-center gap-1">
                <Award className="h-3.5 w-3.5 text-brand-600" />
                {props.credits} CE
              </span>
            )}
            {typeof props.lessonCount === "number" && (
              <span className="flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5 text-brand-600" />
                {props.lessonCount} lessons
              </span>
            )}
          </div>
          <span className="text-base font-bold text-brand-700">
            {formatPrice(props.priceCents)}
          </span>
        </div>
      </div>
    </Link>
  );
}
