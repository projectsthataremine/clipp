"use client";

const updates = [
  {
    date: "June 9, 2025",
    title: "Preparing for Public Beta (v0.1.0)",
    description: (
      <>
        <p className="text-sm">
          Website is functional. Performing final tests of the app, with a focus
          on performance and stability.{" "}
          <strong>The public beta will be available soon.</strong>
        </p>
        <p className="text-sm">
          Next phase will be on marketing and user acquisition, with a focus on
          building a community around the app. Gathering feedback from early
          users to improve the app and fix any issues that arise.
        </p>
        <p className="text-sm">
          Once the public beta is stable, I will start working on the{" "}
          <strong>v1.0.0</strong> release, which will include improvements based
          on user feedback and maybe new features.
        </p>
      </>
    ),
  },
];

export default function UpdatesPage() {
  return (
    <section className="px-6 py-16 max-w-[1000px] mx-auto">
      {updates.map((update, i) => (
        <div key={i} className="mb-10">
          <div className="flex justify-between align-center">
            <h2 className="text-lg font-semibold text-gray-800 pb-2">
              {update.title}
            </h2>
            <p className="text-sm text-gray-500 mb-2">{update.date}</p>
          </div>
          <div className="text-base text-gray-800 flex flex-col gap-4 leading-6">
            {update.description}
          </div>
          {i < updates.length - 1 && (
            <hr className="mt-8 border-t border-gray-200" />
          )}
        </div>
      ))}
    </section>
  );
}
