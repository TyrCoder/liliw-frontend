import type { Metadata } from 'next';
import PageBanner from '@/components/liliw/PageBanner';

/**
 * Terms of Use and the Privacy Notice.
 *
 * Written against what the system actually does, not from a template. Every
 * claim here was checked in the code: the check-in route keeps a distance in
 * metres and not the coordinates, the avatar is screened in the browser, the
 * chat goes to Groq, search indexes published content only, and there is no
 * self-service account deletion — so this says to email for it rather than
 * promising a button that does not exist.
 *
 * If a feature changes, this page is part of the change.
 */

const HL = 'var(--font-heading), Outfit, sans-serif';
const BL = 'var(--font-body), Inter, sans-serif';

const NAVY = '#0B3D91';
const INK = '#1A1A2E';
const GOLD = '#F5C518';

export const metadata: Metadata = {
  title: 'Terms & Privacy | Liliw Virtual Guide',
  description:
    'The terms of use for the Liliw Virtual Guide and the privacy notice covering the personal information it collects.',
};

const UPDATED = '14 August 2026';

const OFFICE = 'Culture, History, Arts and Tourism Office (CHATO), Municipality of Liliw, Laguna';
const EMAIL = 'info@liliwtourism.com';
const PHONE = '+63 (49) 501-1234';

function Section({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="scroll-mt-24" id={`s${n}`}>
      <div className="flex items-baseline gap-3 mb-3">
        <span
          className="text-xs font-black tabular-nums"
          style={{ color: GOLD, fontFamily: HL }}
        >
          {n.padStart(2, '0')}
        </span>
        <h2 className="text-xl sm:text-2xl font-bold" style={{ color: INK, fontFamily: HL }}>
          {title}
        </h2>
      </div>
      <div
        className="w-8 h-0.5 rounded-full mb-4"
        style={{ backgroundColor: GOLD }}
      />
      <div className="space-y-3 text-[15px] leading-relaxed text-gray-700" style={{ fontFamily: BL }}>
        {children}
      </div>
    </section>
  );
}

/** A definition row for the data tables — what is held, and why. */
function Row({ what, why }: { what: string; why: string }) {
  return (
    <div className="grid sm:grid-cols-[minmax(0,13rem)_1fr] gap-1 sm:gap-4 py-2.5 border-b border-gray-100 last:border-0">
      <div className="font-semibold text-sm" style={{ color: NAVY }}>{what}</div>
      <div className="text-sm text-gray-600">{why}</div>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl bg-white px-5 py-2 my-4 border"
      style={{ borderColor: 'rgba(11,61,145,0.12)' }}
    >
      {children}
    </div>
  );
}

export default function TermsPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F6F0' }}>
      <PageBanner
        title="Terms &amp; Privacy"
        subtitle="How the Liliw Virtual Guide may be used, and what it does with your information"
      />

      <div className="max-w-3xl mx-auto px-4 py-12">
        <p className="text-sm text-gray-500 mb-10" style={{ fontFamily: BL }}>
          Last updated {UPDATED}. This page covers both the terms of use and the privacy notice for
          the Liliw Virtual Guide, operated by the {OFFICE}. Using the site means accepting what is
          written here.
        </p>

        <div className="space-y-12">
          <Section n="1" title="What this service is">
            <p>
              The Liliw Virtual Guide is the official tourism website and progressive web app of the
              Municipality of Liliw, Laguna. It lists attractions, heritage sites, dining, events,
              stories and itineraries; it lets visitors plan trips, check in at attractions by
              scanning a QR poster, earn points, and contact the tourism office.
            </p>
            <p>
              Browsing does not require an account. Points, saved trips, favourites, stamps and
              rewards do.
            </p>
          </Section>

          <Section n="2" title="Accounts">
            <p>
              Registration asks for an email address, a username and a password, and confirms the
              email with a one-time code. Your profile may also hold your full name, an avatar, your
              gender, and whether you are a Liliw resident, from elsewhere in Laguna, from another
              province, or an international visitor.
            </p>
            <p>
              Keep your password to yourself; anything done through your account is treated as done
              by you. Register with an email you actually control — password resets, one-time codes
              and replies from the tourism office all go there.
            </p>
            <p>
              Staff accounts (tourism officers, editors, administrators) and local business accounts
              are issued by the tourism office. They cannot be self-registered, and they are for
              official use only.
            </p>
          </Section>

          <Section n="3" title="Check-ins, points and rewards">
            <p>
              Attractions carry a QR poster. Scanning it inside the app records a visit and awards
              points. This is how it works, in detail, because it involves your location:
            </p>
            <Panel>
              <Row
                what="Your location"
                why="Asked for at the moment you scan, so the distance between you and the attraction can be measured. The coordinates are used for that calculation and are not stored."
              />
              <Row
                what="What is kept"
                why="The attraction, the date and time, the distance in metres, and whether the scan was close enough to count as verified."
              />
              <Row
                what="If you decline"
                why="The visit is still recorded, marked unverified. It will not award points."
              />
              <Row
                what="Points"
                why="Awarded once per attraction, per account. Re-scanning the same poster does not award again."
              />
            </Panel>
            <p>
              Points and badges have no cash value, cannot be transferred or sold, and are not a
              form of currency or credit. Rewards are limited in number and are handed over at the
              tourism office once staff verify the redemption. The office may adjust or withdraw a
              reward, and may cancel points obtained by defeating the location check, using multiple
              accounts, or any other manipulation.
            </p>
            <p>
              Stamps in your passport come from QR check-ins at the poster. Opening an attraction
              page on the web does not stamp it.
            </p>
          </Section>

          <Section n="4" title="What you post">
            <p>
              Reviews, ratings, photographs, event sign-ups, community submissions and messages you
              send through the site are published or handled by the tourism office. Post only what
              is yours to post, and only what is true.
            </p>
            <p>
              By submitting content you allow the Municipality of Liliw to display and reproduce it
              for tourism purposes, with attribution where a name was given. You keep ownership of
              your own work.
            </p>
            <p>
              Content is moderated. Anything unlawful, misleading, abusive, or infringing someone
              else&apos;s rights may be removed without notice. Avatar images are checked for
              explicit content in your browser before upload, and rejected images are not sent to
              the server.
            </p>
          </Section>

          <Section n="5" title="Local business accounts">
            <p>
              Businesses may apply for an account to manage their own listing. An application
              includes business details and supporting documents, which are reviewed by the tourism
              office before approval. Documents are stored in the system&apos;s private storage and
              are seen by tourism staff.
            </p>
            <p>
              An approved business is responsible for the accuracy of what appears on its listing —
              hours, prices, contact details and photographs. Changes to key details go through the
              office as a change request. A listing may be suspended if the information is found to
              be false.
            </p>
          </Section>

          <Section n="6" title="Acceptable use">
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1.5 marker:text-gray-400">
              <li>falsify a check-in, or attempt to earn points without being at the place;</li>
              <li>use another person&apos;s account, or hold several accounts to collect rewards;</li>
              <li>attempt to reach staff, editor, administrator or business functions you were not granted;</li>
              <li>probe, scan or overload the service, or extract its data in bulk by automated means;</li>
              <li>upload anything containing malicious code, or impersonate any person or office.</li>
            </ul>
          </Section>

          <Section n="7" title="Accuracy and availability">
            <p>
              Listings, opening hours, fares, prices and event schedules are provided in good faith
              by the tourism office and by the businesses themselves, and can change without the
              site being updated the same day. Confirm anything you are relying on before you
              travel. Visits to natural sites, trails and festivals are undertaken at your own risk.
            </p>
            <p>
              The app keeps some pages available offline, so what you see without a connection may
              be an older copy. The service is provided as it is, and may be interrupted for
              maintenance, hosting problems, or reasons outside the office&apos;s control.
            </p>
            <p>
              Links and embedded content from third parties — maps, videos, social pages, external
              reviews — are not under the office&apos;s control and are not endorsed by it.
            </p>
          </Section>

          <Section n="8" title="Privacy notice">
            <p>
              The Municipality of Liliw, through the {OFFICE}, is the personal information
              controller for this service. Personal information is processed under the Data Privacy
              Act of 2012 (Republic Act No. 10173) and its implementing rules.
            </p>

            <h3 className="text-base font-bold pt-2" style={{ color: INK, fontFamily: HL }}>
              What is collected
            </h3>
            <Panel>
              <Row
                what="Account details"
                why="Email, username, password (stored encrypted, never in readable form), full name, avatar, gender, and resident or visitor type."
              />
              <Row
                what="Your activity"
                why="Attractions checked into, points, badges, saved trips, favourites and ratings — so your passport and rewards work."
              />
              <Row
                what="Forms you send"
                why="Name, email, phone number and message from contact, participation, event sign-up and community submission forms, so the office can reply."
              />
              <Row
                what="Business applications"
                why="Business details and the supporting documents you upload, for review and approval."
              />
              <Row
                what="Usage statistics"
                why="Page visited, device type and a random session identifier. Not tied to your name, and used to count visitors and see which pages are used."
              />
              <Row
                what="Chat with Lilio"
                why="What you type to the assistant, plus the page you are on if you turn that option on."
              />
            </Panel>

            <h3 className="text-base font-bold pt-2" style={{ color: INK, fontFamily: HL }}>
              Why, and on what basis
            </h3>
            <p>
              To operate your account and the rewards programme, to answer what you send the office,
              to publish tourism content, to review business applications, and to produce visitor
              statistics that inform tourism planning. The basis is your consent when you register
              or submit a form, the performance of the service you asked for, and the
              municipality&apos;s mandate to promote and manage local tourism.
            </p>
            <p>
              Your information is not sold, and it is not used for advertising. Statistics shown to
              staff and to local businesses — visitor counts, where visitors come from, gender
              breakdown — are aggregated totals, not individual records.
            </p>

            <h3 className="text-base font-bold pt-2" style={{ color: INK, fontFamily: HL }}>
              Who else handles it
            </h3>
            <p>
              The service runs on providers that necessarily process data on the
              municipality&apos;s behalf: Supabase (database, sign-in and file storage), Vercel
              (website hosting), Cloudinary (images and video), Algolia (search — published tourism
              content only, no accounts), Mapbox (maps), Groq (the Lilio assistant, which receives
              your message in order to answer it), and an email service for one-time codes and
              office replies. Some of these operate outside the Philippines. Information may also be
              disclosed where a law, subpoena or lawful government order requires it.
            </p>

            <h3 className="text-base font-bold pt-2" style={{ color: INK, fontFamily: HL }}>
              How long it is kept
            </h3>
            <p>
              Account and activity records are kept while the account exists. Form submissions and
              business applications are kept as municipal records. Usage statistics are kept in
              aggregate. Ask for deletion at any time and it will be carried out unless a record has
              to be retained by law.
            </p>

            <h3 className="text-base font-bold pt-2" style={{ color: INK, fontFamily: HL }}>
              Your rights
            </h3>
            <p>
              Under the Data Privacy Act you may be informed about, access, correct, object to the
              processing of, and request the erasure or blocking of your personal information, ask
              for a copy of it, and be indemnified for damage from its inaccurate or unauthorised
              use.
            </p>
            <p>
              Name, username, avatar, gender and visitor type can be corrected yourself in Edit
              Profile, and your email and password changed in account settings. For a copy of your
              data or to have your account deleted, email{' '}
              <a href={`mailto:${EMAIL}`} className="font-semibold underline" style={{ color: NAVY }}>
                {EMAIL}
              </a>{' '}
              from your registered address — deletion is handled by the office and is not yet a
              button in the app. A complaint may be brought to the National Privacy Commission.
            </p>

            <h3 className="text-base font-bold pt-2" style={{ color: INK, fontFamily: HL }}>
              Cookies and storage
            </h3>
            <p>
              A cookie keeps you signed in, and your browser&apos;s local storage remembers small
              preferences such as a dismissed message and a random session identifier for the
              visitor count. There are no advertising or cross-site tracking cookies.
            </p>

            <h3 className="text-base font-bold pt-2" style={{ color: INK, fontFamily: HL }}>
              Security, and children
            </h3>
            <p>
              Traffic is encrypted, passwords are hashed by the authentication provider, and access
              to staff and business functions is restricted by role. No system is perfectly secure,
              so tell the office promptly if you believe your account has been used by someone else.
            </p>
            <p>
              The service is intended for general audiences. Anyone under 18 should register and
              submit information only with the consent of a parent or guardian.
            </p>
          </Section>

          <Section n="9" title="Content ownership">
            <p>
              The name, seal, photographs, written material and design of this site belong to the
              Municipality of Liliw or to those who licensed them to it, except for content
              submitted by users and material credited to others. Reproducing it for commercial
              purposes requires written permission from the tourism office. Sharing a page, or
              quoting it with credit, is welcome.
            </p>
          </Section>

          <Section n="10" title="Suspension, changes and governing law">
            <p>
              An account may be suspended or removed for breaching these terms, particularly for
              falsified check-ins or misuse of the rewards programme. You may stop using the service
              at any time and ask for your account to be deleted.
            </p>
            <p>
              These terms may be updated as the service changes; the date at the top of this page
              shows when it was last revised, and continued use after a revision means accepting it.
              Philippine law governs these terms, and the courts of Laguna have jurisdiction over
              any dispute.
            </p>
          </Section>

          <Section n="11" title="Contact">
            <p>
              For any question about these terms, your personal information, or a listing on this
              site:
            </p>
            <Panel>
              <Row what="Office" why={OFFICE} />
              <Row what="Email" why={EMAIL} />
              <Row what="Telephone" why={PHONE} />
              <Row what="Address" why="Liliw, Laguna 4002, Philippines" />
            </Panel>
          </Section>
        </div>
      </div>
    </div>
  );
}
