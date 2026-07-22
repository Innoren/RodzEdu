import Link from "next/link";
import Image from "next/image";

export default function AboutFounderPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-[linear-gradient(165deg,#071c2e_0%,#0b2a45_42%,#1a6b7a_100%)] text-white">
        <div className="section-inner grid gap-10 px-5 py-16 md:grid-cols-[auto_1fr] md:items-end md:py-20">
          <Image
            src="/rodzedu-logo.png"
            alt="RodzEdu"
            width={140}
            height={140}
            className="h-28 w-28 rounded-full object-cover ring-2 ring-white/25 md:h-36 md:w-36"
            priority
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-bright">
              About the founder
            </p>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl leading-tight md:text-5xl lg:text-6xl">
              Pedro Rodriguez, BSRS, RT(R)(CT)(MR)
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/80 md:text-lg">
              Founder and lead instructor of RodzEdu — building practical,
              evidence-based continuing education for imaging professionals.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-inner max-w-3xl">
          <p className="eyebrow">Clinical background</p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl text-navy md:text-4xl">
            Experience grounded in real imaging floors
          </h2>
          <div className="mt-6 space-y-5 text-base leading-relaxed text-muted md:text-lg">
            <p>
              Pedro Rodriguez is a registered radiologic technologist with more
              than five years of clinical experience in magnetic resonance
              imaging (MRI), as well as experience in computed tomography (CT)
              and diagnostic radiography. He has worked in both hospital and
              outpatient imaging settings, developing expertise in patient
              safety, MRI operations, and quality patient care using GE
              Healthcare and Siemens MRI systems.
            </p>
            <p>
              Pedro earned a Bachelor of Science in Radiologic Sciences and is
              completing a Master of Healthcare Administration. His academic and
              professional background reflects a commitment to lifelong
              learning, leadership, and advancing the quality of healthcare.
            </p>
          </div>
        </div>
      </section>

      <section className="section bg-white">
        <div className="section-inner max-w-3xl">
          <p className="eyebrow">Teaching philosophy</p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl text-navy md:text-4xl">
            Mentorship shaped by patient care
          </h2>
          <div className="mt-6 space-y-5 text-base leading-relaxed text-muted md:text-lg">
            <p>
              Throughout his career, Pedro has trained radiography and MRI
              students, mentoring future healthcare professionals while
              emphasizing the importance of patient safety, professionalism, and
              critical thinking. His teaching philosophy is based on real-world
              clinical experience, believing that technical knowledge must always
              be combined with careful communication, sound judgment, and a
              commitment to protecting patients.
            </p>
            <p>
              As the founder and lead instructor of Rodz Education, Pedro is
              dedicated to developing high-quality, evidence-based continuing
              education for imaging professionals. His courses are designed to
              bridge the gap between textbook knowledge and everyday clinical
              practice by combining current professional guidelines with
              practical lessons learned from years of patient care.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-inner max-w-3xl">
          <p className="eyebrow">Mission</p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl text-navy md:text-4xl">
            MRI safety as a professional responsibility
          </h2>
          <div className="mt-6 space-y-5 text-base leading-relaxed text-muted md:text-lg">
            <p>
              Pedro believes that MRI safety is more than a checklist — it&apos;s
              a professional responsibility. His mission is to help healthcare
              professionals improve patient outcomes, strengthen their clinical
              confidence, and build a culture of safety that protects patients,
              coworkers, and the profession itself.
            </p>
            <p>
              Through Rodz Education, Pedro&apos;s vision is to provide engaging,
              practical, and evidence-based education that empowers healthcare
              professionals to deliver safe, compassionate, and high-quality care
              every day.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/courses" className="btn btn-primary">
              Browse CE courses
            </Link>
            <Link href="/contact" className="btn btn-ghost">
              Contact RodzEdu
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
