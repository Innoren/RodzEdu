"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/format";
import type { Course } from "@/lib/types";

type CourseRow = Course & { averageRating: number; reviewCount: number };

export function CatalogFilters({ courses }: { courses: CourseRow[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [credits, setCredits] = useState("all");
  const [price, setPrice] = useState("all");
  const [sort, setSort] = useState("featured");

  const categories = useMemo(
    () => [...new Set(courses.map((c) => c.category))].sort(),
    [courses],
  );

  const filtered = useMemo(() => {
    let list = courses.filter((course) => {
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        course.title.toLowerCase().includes(q) ||
        course.description.toLowerCase().includes(q) ||
        course.category.toLowerCase().includes(q);
      const matchesCategory =
        category === "all" || course.category === category;
      const matchesCredits =
        credits === "all" ||
        (credits === "1-3" && course.credits <= 3) ||
        (credits === "4-6" && course.credits >= 4 && course.credits <= 6) ||
        (credits === "7+" && course.credits >= 7);
      const matchesPrice =
        price === "all" ||
        (price === "under50" && course.priceCents < 5000) ||
        (price === "50to75" &&
          course.priceCents >= 5000 &&
          course.priceCents <= 7500) ||
        (price === "over75" && course.priceCents > 7500);
      return matchesQuery && matchesCategory && matchesCredits && matchesPrice;
    });

    list = [...list].sort((a, b) => {
      if (sort === "price-asc") return a.priceCents - b.priceCents;
      if (sort === "price-desc") return b.priceCents - a.priceCents;
      if (sort === "credits") return b.credits - a.credits;
      if (sort === "rating") return b.averageRating - a.averageRating;
      // featured first, then title
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return a.title.localeCompare(b.title);
    });
    return list;
  }, [courses, query, category, credits, price, sort]);

  return (
    <div>
      <div className="mt-10 grid gap-3 border border-line bg-white p-4 md:grid-cols-2 lg:grid-cols-5">
        <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-teal lg:col-span-2">
          Search
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Modality, title, keyword…"
            className="mt-1 w-full border border-line px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink"
          />
        </label>
        <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-teal">
          Modality
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 w-full border border-line px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink"
          >
            <option value="all">All</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-teal">
          Credits
          <select
            value={credits}
            onChange={(e) => setCredits(e.target.value)}
            className="mt-1 w-full border border-line px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink"
          >
            <option value="all">All</option>
            <option value="1-3">1–3</option>
            <option value="4-6">4–6</option>
            <option value="7+">7+</option>
          </select>
        </label>
        <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-teal">
          Price
          <select
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="mt-1 w-full border border-line px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink"
          >
            <option value="all">All</option>
            <option value="under50">Under $50</option>
            <option value="50to75">$50–$75</option>
            <option value="over75">Over $75</option>
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Showing {filtered.length} of {courses.length} courses
        </p>
        <label className="flex items-center gap-2 text-sm text-navy">
          Sort
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border border-line px-2 py-1.5"
          >
            <option value="featured">Featured</option>
            <option value="rating">Highest rated</option>
            <option value="credits">Most credits</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </label>
      </div>

      <div className="mt-6 divide-y divide-line border-y border-line">
        {filtered.length === 0 && (
          <p className="py-10 text-muted">
            No courses match these filters. Try clearing search or modality.
          </p>
        )}
        {filtered.map((course) => (
          <article
            key={course.id}
            className="grid gap-5 py-8 md:grid-cols-[1fr_auto] md:items-center"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-teal">
                {course.featured ? "Featured · " : ""}
                {course.category} · {course.credits} CE credits ·{" "}
                {course.modules?.length || 0} modules
                {course.reviewCount > 0
                  ? ` · ${course.averageRating}★ (${course.reviewCount})`
                  : ""}
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl text-navy md:text-3xl">
                {course.title}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted md:text-base">
                {course.description}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 md:flex-col md:items-end">
              <p className="text-2xl font-semibold text-navy">
                {formatMoney(course.priceCents)}
              </p>
              <Link
                href={`/courses/${course.slug}`}
                className="btn btn-navy !px-4 !py-2.5 text-sm"
              >
                Review & enroll
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
