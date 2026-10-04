const WHY_US = [
  "Licensed surveyors",
  "A team of mechanical and civil engineers",
  "Nationwide service",
  "Impartial reporting",
  "Timely delivery",
  "In-house chartered accountant and technical analyst",
];

const SERVICES = [
  "Motor claims",
  "Contractors Plant and Machinery (CPM) insurance",
  "Contractors All Risk (CAR) insurance",
  "Fire and property insurance",
  "Marine insurance",
  "Machinery breakdown insurance",
  "Electronic equipment insurance",
  "Engineering valuation",
  "Risk inspection",
  "Property valuation for banks and financial institutions",
  "Engineering design and cost estimation",
  "Detailed project design and report preparation",
];

const TEAM = [
  {
    name: "Er. Nishan Timilsina",
    role: "Director, Mechanical Engineer (MSc. Renewable Energy Engineering), Class D Surveyor",
  },
  { name: "Er. Sandeep Dhakal", role: "Civil Engineer, Licensed Surveyor" },
  { name: "CA Suresh Pyatha", role: "Chartered Accountant" },
  { name: "Er. Bibas KC", role: "Mechanical Engineer" },
  { name: "Er. Bibek Adhikari", role: "Mechanical Engineer" },
  { name: "Er. Sudip Adhikari", role: "Mechanical Engineer" },
  { name: "Srijan Lama", role: "Technical Analyst" },
];

const INSURANCE_CLIENTS = [
  "Siddhartha Premier",
  "Prabhu",
  "NLG",
  "IGI Prudential",
  "Shikhar",
  "Nepal Insurance",
  "Protective Micro",
  "Star Micro",
  "Nepal Micro Insurance",
];

const OTHER_CLIENTS = ["Bottlers Nepal", "Nepal Youth Foundation", "Division Forest Office, Hattisar, Lalitpur"];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-16 pb-16">
      <header className="border-b border-slate-200 pb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Shlok Engineering Pvt. Ltd.</h1>
        <p className="mt-2 text-base text-slate-500">
          Engineering Survey · Loss Assessment · Risk Consulting · Established 2078 B.S. (2021)
        </p>
      </header>

      <section id="about" className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-800">About us</h2>
          <p className="text-justify leading-7 text-slate-600">
            Shlok Engineering Pvt. Ltd. is an independent engineering consulting and insurance surveying firm. We
            provide engineering surveys, claim investigation, loss assessment, valuation and technical consulting.
          </p>
          <p className="text-justify leading-7 text-slate-600">
            Our goal is to be Nepal&apos;s most trusted engineering survey and loss assessment consultancy. We keep
            every assignment independent, confidential and professional.
          </p>
          <p className="text-justify leading-7 text-slate-600">
            Our work includes heavy equipment fire, accident and landslide assessments.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="mb-3 text-lg font-semibold text-slate-800">Why clients choose us</h3>
          <ul className="divide-y divide-slate-200">
            {WHY_US.map((reason) => (
              <li key={reason} className="py-3 text-slate-600">
                {reason}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="services" className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-800">What we do</h2>
        <p className="text-justify leading-7 text-slate-500">
          Engineering survey, loss assessment and consulting across insurance, banking and construction.
        </p>
        <ul className="grid list-inside list-disc gap-x-12 gap-y-2 leading-7 text-slate-600 lg:grid-cols-2">
          {SERVICES.map((service) => (
            <li key={service}>{service}</li>
          ))}
        </ul>
      </section>

      <section id="team" className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-800">Our team</h2>
        <p className="text-justify leading-7 text-slate-500">
          Engineers, a chartered accountant and a licensed surveyor working together on every assignment.
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          {TEAM.map((person) => (
            <div key={person.name} className="rounded-lg border border-slate-200 bg-white p-5">
              <p className="font-semibold text-slate-900">{person.name}</p>
              <p className="mt-1 leading-6 text-slate-500">{person.role}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="clients" className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-800">Who we work with</h2>
        <p className="text-justify leading-7 text-slate-500">
          We serve insurance companies and organisations across Nepal.
        </p>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Insurance companies</h3>
          <ul className="flex flex-wrap gap-2">
            {INSURANCE_CLIENTS.map((client) => (
              <li
                key={client}
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600"
              >
                {client}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Other clients</h3>
          <ul className="flex flex-wrap gap-2">
            {OTHER_CLIENTS.map((client) => (
              <li
                key={client}
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600"
              >
                {client}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="contact" className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-800">Contact us</h2>
        <p className="text-justify leading-7 text-slate-500">
          Tell us about your claim, valuation or inspection and we will get back to you.
        </p>
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-slate-600">
          <p>
            <span className="block text-sm text-slate-500">Phone</span>
            <a className="underline" href="tel:+9779845178567">
              +977-9845178567
            </a>
          </p>
          <p className="mt-2">
            <span className="block text-sm text-slate-500">Email</span>
            <a className="underline" href="mailto:shlokengineering78@gmail.com">
              shlokengineering78@gmail.com
            </a>
          </p>
          <p className="mt-2">
            <span className="block text-sm text-slate-500">Offices</span>
            Shankamul, Lalitpur
            <br />
            Bharatpur, Chitwan
          </p>
        </div>
      </section>

      <footer className="border-t border-slate-200 pt-6 text-sm leading-6 text-slate-500">
        Company Regd. No. 267500/078/079. PAN 610051816. Licensed by the Nepal Insurance
        Authority.
      </footer>
    </div>
  );
}
