import React, { useState } from 'react';
import { ChevronDown, Stethoscope } from 'lucide-react';

// Photos are picked up from src/assets/services with a glob instead of one import per file.
// A missing photo (or a missing folder) then just shows a placeholder, and can never stop
// the page from compiling.
const photos = import.meta.glob('../../assets/services/*.{jpg,jpeg,png,webp}', { eager: true, import: 'default' });

// Department slug (from the `department` table) -> photo file name
const SERVICE_FILE = {
  surgical: 'image1.jpg', specialty: 'image2.jpg', medical: 'image3.jpg', pulmonary: 'image4.jpg', obgyne: 'image6.jpg',
  dental: 'image7.jpg', pediatrics: 'image8.jpg', ophthalmology: 'image9.jpg', ent: 'image10.jpg', nutrition: 'image11.jpg',
};
const photoFor = (slug) => photos[`../../assets/services/${SERVICE_FILE[slug]}`];

/**
 * Departments and clinics come from GET /api/config, the same data the chatbot menu uses,
 * so this section can never disagree with what can actually be booked.
 */
export function Services({ config, status, onRetry }) {
  const [openSlug, setOpenSlug] = useState(null);
  const departments = config?.departments || [];

  return (
    <section
      id="services"
      className="border-t border-slate-200 bg-white px-4 py-20 transition-colors duration-200 dark:border-slate-800 dark:bg-slate-950"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-12 max-w-2xl space-y-2 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Our Services</h2>
          <p className="text-sm text-slate-500 sm:text-base dark:text-slate-400">
            Every department you can book through Trooper. Tap one to see its clinics.
          </p>
        </div>

        {status === 'loading' && !departments.length && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-900" />
            ))}
          </div>
        )}

        {status === 'error' && !departments.length && (
          <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
              The services list could not be loaded right now.
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="cursor-pointer rounded-full bg-teal-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 active:scale-95"
            >
              Try again
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2 lg:grid-cols-3" id="services-container">
          {departments.map((d) => {
            const hasClinics = d.clinics?.length > 0;
            const open = openSlug === d.slug;
            return (
              <div
                key={d.slug}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 transition duration-200 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:shadow-black/30"
              >
                {photoFor(d.slug) ? (
                  <img src={photoFor(d.slug)} alt="" loading="lazy" className="h-44 w-full object-cover dark:brightness-90" />
                ) : (
                  <div className="flex h-44 w-full items-center justify-center bg-gradient-to-br from-teal-700 to-teal-900 dark:from-teal-900 dark:to-slate-900">
                    <Stethoscope className="h-12 w-12 text-teal-100/80" aria-hidden="true" />
                  </div>
                )}
                <div className="p-5">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{d.name}</h3>
                  <p className="mt-1 text-xs text-slate-500 sm:text-sm dark:text-slate-400">
                    {d.doctorCount > 0
                      ? `${d.doctorCount} ${d.doctorCount === 1 ? 'doctor' : 'doctors'} available`
                      : 'No doctors scheduled yet'}
                  </p>

                  {hasClinics && (
                    <>
                      <button
                        type="button"
                        onClick={() => setOpenSlug(open ? null : d.slug)}
                        aria-expanded={open}
                        aria-controls={`clinics-${d.slug}`}
                        className="mt-3 flex cursor-pointer items-center gap-1 text-xs font-semibold text-teal-700 hover:underline dark:text-teal-400"
                      >
                        {d.clinics.length} {d.clinics.length === 1 ? 'clinic' : 'clinics'}
                        <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
                      </button>
                      <div
                        id={`clinics-${d.slug}`}
                        className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                      >
                        <ul className="m-0 min-h-0 list-none space-y-1.5 overflow-hidden p-0">
                          {d.clinics.map((c) => (
                            <li
                              key={c.slug}
                              className="mt-1.5 rounded-lg bg-white px-3 py-2 text-xs text-slate-700 first:mt-3 dark:bg-slate-800 dark:text-slate-200 sm:text-sm"
                            >
                              {c.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
