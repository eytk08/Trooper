import { useState, useEffect, useCallback, useRef } from 'react';

// ---------------------------------------------------------------------------
// Emoji used in the chat. The rules keep the conversation uniform:
//   1. Every button has exactly one emoji, placed first.
//   2. The same action always uses the same emoji (a doctor is always a stethoscope).
//   3. A bot message only gets an emoji when it is a status: done, problem or working.
//   4. Only long-established emoji, so older phones draw them correctly.
// Change an emoji here and every button and message follows.
// ---------------------------------------------------------------------------
const I = {
  // status
  wave: '👋', ok: '✅', no: '❌', warn: '⚠️', wait: '⏳',
  // main menu
  schedule: '📅', manage: '🔍', inquiry: '❓', contact: '📞', records: '📄',
  // who is the patient
  veteran: '🎖️', beneficiary: '👪', civilian: '🚶',
  // booking steps
  newPatient: '🆕', returning: '🔁', clinic: '🏥', doctor: '🩺',
  date: '📅', time: '🕐',
  // summary lines
  patient: '👤', mobile: '📱', ref: '🔖',
  // controls
  confirm: '✅', restart: '↩️', retry: '🔄', home: '🏠', cancel: '🚫', keep: '👍',
  language: '🌐',
  // information and links
  link: '🔗', faq: '📖', about: '🤖', phone: '📞', emergency: '🚨', email: '📧'
};

// One emoji per department (used on the department buttons)
const DEPT_ICON = {
  surgical: '💉', specialty: '🏥', pulmonary: '🌬️', obgyne: '🤰',
  medical: '💊', dental: '🦷', pediatrics: '👶', ophthalmology: '👓',
  ent: '👂', nutrition: '🥗'
};



const TEXT = {
  en: {
    menuTitle: 'How can I help you today?',
    menu: { schedule: `${I.schedule} Schedule Appointment`, manage: `${I.manage} Manage Appointment`, inquiry: `${I.inquiry} Inquiry`, contact: `${I.contact} Contact Developer`, records: `${I.records} View Records` },
    notice: [
      `${I.warn} Important Notice:`,
      'The details you give will be checked again at the hospital. Please make sure everything is accurate and complete. A mismatch may forfeit your slot.',
      'Please arrive early. Latecomers cannot be accommodated.'
    ],
    agree: `${I.ok} I agree`, disagree: `${I.no} I do not agree`,
    who: 'Who are we assisting today?',
    classes: { veteran: `${I.veteran} Veteran`, beneficiary: `${I.beneficiary} Beneficiary`, civilian: `${I.civilian} Civilian` },
    civilianNote: 'Kindly note that fees may apply for select services.',
    askName: { veteran: "Please provide the Veteran's name or ID:", beneficiary: "Please provide the Beneficiary's name:", civilian: "Please provide the Civilian's name:" },
    namePlaceholder: 'First Name Middle Initial Last Name',
    badName: `${I.warn} Please enter 2 to 80 characters. Letters, numbers, spaces and . ' - / only.`,
    askPhone: 'What mobile number should I send your confirmation and reminder to?',
    badPhone: `${I.warn} Please enter a valid mobile number, for example 09171234567.`,
    chooseDept: 'Please select the department you wish to visit:',
    chooseClinic: 'Please select the specific clinic or service:',
    firstTime: 'Is this your first time to consult?',
    newPatient: `${I.newPatient} Yes, this is my first consultation`, returning: `${I.returning} No, I am a returning patient`,
    searching: `${I.wait} Let me find the earliest open times for you...`,
    autoIntro: 'Here are the earliest open times. I matched you with the doctors who are free soonest:',
    pickDoctor: `${I.doctor} Choose a specific doctor instead`,
    noSlots: (n, tel) => `${I.warn} Sorry, there are no open times in the next ${n} days for this clinic. Please call the hospital at ${tel}.`,
    noDoctors: `${I.warn} Sorry, no doctors are available for that clinic right now.`,
    chooseDoctor: 'Kindly select your referring doctor:',
    noDoctorSlots: (d) => `${I.warn} ${d} has no open times in the next few weeks. Please pick another doctor:`,
    chooseDate: (d) => `Kindly select a date for your appointment with ${d}:`,
    chooseTime: 'Please select a time:',
    left: (n) => (n <= 2 ? ` (${n} left)` : ''),
    reviewTitle: 'Please review your appointment:',
    labels: { patient: `${I.patient} Patient`, mobile: `${I.mobile} Mobile`, doctor: `${I.doctor} Doctor`, clinic: `${I.clinic} Clinic`, when: `${I.date} When` },
    confirm: `${I.confirm} Confirm booking`, restart: `${I.restart} Start over`,
    booking: `${I.wait} Booking your slot...`,
    slotTaken: `${I.warn} Sorry, that time was just taken by someone else. Here are the updated times:`,
    alreadyBooked: `${I.warn} This mobile number already has an appointment with this doctor on that day. Use Manage Appointment to check or cancel it.`,
    success: [`${I.ok} Your appointment is booked!`, 'Your reference code:'],
    afterCode: (phone, r) => [
      'Please keep this code. You need it to check or cancel.',
      `A confirmation text is on its way to ${phone}.`,
      r?.queued ? `You will also get a reminder ${r.hoursBefore} hours before your appointment.` : 'Your appointment is soon, so no separate reminder will be sent.',
      'Please arrive 15 minutes early. You may now close this chat.'
    ],
    networkError: `${I.warn} I could not reach the hospital system. Please try again.`,
    serverError: `${I.warn} Something went wrong on our side. Please try again in a moment.`,
    retry: `${I.retry} Try again`, menuBtn: `${I.home} Main menu`,
    askRef: 'Please enter your reference code (it looks like TRP-ABC123):',
    badRef: `${I.warn} That does not look like a reference code. It starts with TRP- and has 6 more characters.`,
    askPhoneManage: 'Now enter the mobile number you used for the booking:',
    notFound: `${I.warn} No appointment matches that reference code and mobile number.`,
    found: (a, when) => `${I.ref} Reference: ${a.reference}\\n${a.status === 'confirmed' ? `${I.ok} Status: Confirmed` : `${I.no} Status: Cancelled`}\\n${I.patient} Patient: ${a.patientName}\\n${I.doctor} Doctor: ${a.doctor}\\n${I.clinic} Clinic: ${a.clinic || a.department}\\n${I.date} When: ${when}`,
    cancelIt: `${I.cancel} Cancel this appointment`,
    confirmCancel: `${I.warn} Are you sure? Your slot will be released for other patients.`,
    yesCancel: `${I.ok} Yes, cancel it`, noKeep: `${I.keep} No, keep it`,
    cancelled: `${I.ok} Your appointment is cancelled and the slot was released. A confirmation text is on its way.`,
    alreadyCancelled: `${I.warn} This appointment is already cancelled.`,
    cannotCancel: `${I.warn} This appointment can no longer be cancelled online.`,
    kept: `${I.ok} Okay, your appointment is unchanged.`,
    inquiryTitle: 'Here are some things I can help you with:',
    inquiryLinks: { about: `${I.about} Discover more about Trooper`, faq: `${I.faq} View FAQs`, site: `${I.link} Visit the Portfolio website` },
    contact: (h) => ['Thanks for your response.', 'For any inquiries or emergencies, you can contact us here:', `${I.phone} Trunkline: ${h?.trunkline || 'N/A'}`, `${I.emergency} Emergency Direct Line: ${h?.emergencyLine || 'N/A'}`, `${I.email} Email: ${h?.email || 'N/A'}`, 'You may also visit us on Facebook:'],
    facebook: `${I.link} Visit Portfolio Page`,
    records: ['Thanks for your response.', 'You can find your laboratory records by logging in to the website below:'],
    recordsLink: `${I.link} Visit Laboratory Records Website`,
    loadError: `${I.warn} Trooper cannot reach the hospital system right now. Please try again later.`,
    noticeConfirm: 'Notice Confirmation',
    declined: 'No problem. You can schedule an appointment any time.',
    socialTitle: 'Social Channels:', portalTitle: 'Access Portal:', optionsTitle: 'Options:', actionsTitle: 'Actions:',
    rateLimit: `${I.warn} Too many attempts from this device. Please wait a few minutes and try again.`,
    slotGone: 'That time is no longer available.',
    placeholders: { name: 'First Name Middle Initial Last Name', phone: '09171234567', ref: 'TRP-ABC123' },
    ui: { subtitle: 'Automated Scheduling Partner', choose: 'Choose an option above to continue', typing: 'Trooper is typing', restart: 'Restart conversation', close: 'Close chat', send: 'Send', respond: 'Type your response...' }
  },
  fil: {
    menuTitle: 'Paano kita matutulungan?',
    menu: { schedule: `${I.schedule} Mag-iskedyul ng Appointment`, manage: `${I.manage} Ayusin ang Appointment`, inquiry: `${I.inquiry} Magtanong`, contact: `${I.contact} Makipag-ugnayan sa Developer`, records: `${I.records} Tingnan ang mga Rekord` },
    notice: [
      `${I.warn} Mahalagang Paalala:`,
      'Muling beberipikahin sa ospital ang impormasyong ibibigay mo. Pakitiyak na tama at kumpleto ang lahat ng detalye. Ang anumang pagkakamali ay maaaring magresulta sa pagkawala ng iyong slot.',
      'Inaanyayahan ka naming dumating nang maaga dahil hindi na maaaring tanggapin ang mga mahuhuli.'
    ],
    agree: `${I.ok} Sumasang-ayon ako`, disagree: `${I.no} Hindi ako sumasang-ayon`,
    who: 'Sino ang aming tutulungan ngayon?',
    classes: { veteran: `${I.veteran} Beterano`, beneficiary: `${I.beneficiary} Benepisyaryo`, civilian: `${I.civilian} Sibilian` },
    civilianNote: 'Paalala: maaaring may bayad ang ilang serbisyo.',
    askName: { veteran: 'Ibigay ang pangalan o ID ng Beterano:', beneficiary: 'Ibigay ang pangalan ng Benepisyaryo:', civilian: 'Ibigay ang pangalan ng Sibilian:' },
    namePlaceholder: 'Pangalan, Gitnang Inisyal, Apelyido',
    badName: `${I.warn} Maglagay ng 2 hanggang 80 karakter. Letra, numero, espasyo at . ' - / lamang.`,
    askPhone: 'Anong mobile number ang pagpapadalhan ko ng kumpirmasyon at paalala?',
    badPhone: `${I.warn} Maglagay ng tamang mobile number, halimbawa 09171234567.`,
    chooseDept: 'Paki-pili ang departamento na nais mong bisitahin:',
    chooseClinic: 'Paki-pili ang klinika o serbisyo:',
    firstTime: 'Ito ba ang iyong unang beses na kumonsulta?',
    newPatient: `${I.newPatient} Oo, ito ang aking unang konsultasyon`, returning: `${I.returning} Hindi, ako ay bumabalik na pasyente`,
    searching: `${I.wait} Hahanapin ko ang pinakamaagang bakanteng oras para sa iyo...`,
    autoIntro: 'Narito ang pinakamaagang bakanteng oras. Itinugma kita sa mga doktor na unang magkakaroon ng bakante:',
    pickDoctor: `${I.doctor} Pumili ng partikular na doktor`,
    noSlots: (n, tel) => `${I.warn} Paumanhin, walang bakanteng oras sa susunod na ${n} araw para sa klinikang ito. Pakitawagan ang ospital sa ${tel}.`,
    noDoctors: `${I.warn} Paumanhin, walang magagamit na doktor para sa klinikang iyon ngayon.`,
    chooseDoctor: 'Paki-pili ang iyong referring doctor:',
    noDoctorSlots: (d) => `${I.warn} Walang bakanteng oras si ${d} sa susunod na mga linggo. Pumili ng ibang doktor:`,
    chooseDate: (d) => `Paki-pili ang petsa ng appointment mo kay ${d}:`,
    chooseTime: 'Paki-pili ang oras:',
    left: (n) => (n <= 2 ? ` (${n} na lang)` : ''),
    reviewTitle: 'Pakisuri ang iyong appointment:',
    labels: { patient: `${I.patient} Pasyente`, mobile: `${I.mobile} Mobile`, doctor: `${I.doctor} Doktor`, clinic: `${I.clinic} Klinika`, when: `${I.date} Kailan` },
    confirm: `${I.confirm} Kumpirmahin ang booking`, restart: `${I.restart} Magsimulang muli`,
    booking: `${I.wait} Ibo-book ang iyong slot...`,
    slotTaken: `${I.warn} Paumanhin, kakakuha lang ng iba ng oras na iyon. Narito ang mga bagong bakante:`,
    alreadyBooked: `${I.warn} May appointment na ang mobile number na ito sa doktor na ito sa araw na iyon. Gamitin ang Ayusin ang Appointment para tingnan o kanselahin.`,
    success: [`${I.ok} Naka-book na ang iyong appointment!`, 'Ang iyong reference code:'],
    afterCode: (phone, r) => [
      'Itago ang code na ito. Kakailanganin ito para tingnan o kanselahin.',
      `Papunta na ang confirmation text sa ${phone}.`,
      r?.queued ? `Makakatanggap ka rin ng paalala ${r.hoursBefore} oras bago ang appointment.` : 'Malapit na ang appointment mo kaya hindi na magpapadala ng hiwalay na paalala.',
      'Pumunta nang 15 minuto bago ang oras. Maaari mo nang isara ang chat na ito.'
    ],
    networkError: `${I.warn} Hindi ko maabot ang sistema ng ospital. Pakisubukang muli.`,
    serverError: `${I.warn} May problema sa aming panig. Pakisubukang muli mamaya.`,
    retry: `${I.retry} Subukan muli`, menuBtn: `${I.home} Pangunahing menu`,
    askRef: 'Ilagay ang iyong reference code (hal. TRP-ABC123):',
    badRef: `${I.warn} Hindi ito mukhang reference code. Nagsisimula ito sa TRP- at may 6 pang karakter.`,
    askPhoneManage: 'Ilagay ngayon ang mobile number na ginamit sa booking:',
    notFound: `${I.warn} Walang appointment na tumutugma sa reference code at mobile number na iyon.`,
    found: (a, when) => `${I.ref} Reference: ${a.reference}\\n${a.status === 'confirmed' ? `${I.ok} Status: Kumpirmado` : `${I.no} Status: Kanselado`}\\n${I.patient} Pasyente: ${a.patientName}\\n${I.doctor} Doktor: ${a.doctor}\\n${I.clinic} Klinika: ${a.clinic || a.department}\\n${I.date} Kailan: ${when}`,
    cancelIt: `${I.cancel} Kanselahin ang appointment na ito`,
    confirmCancel: `${I.warn} Sigurado ka ba? Mabibitawan ang iyong slot para sa ibang pasyente.`,
    yesCancel: `${I.ok} Oo, kanselahin`, noKeep: `${I.keep} Hindi, ituloy`,
    cancelled: `${I.ok} Kanselado na ang iyong appointment at nabitawan na ang slot. Papunta na ang confirmation text.`,
    alreadyCancelled: `${I.warn} Kanselado na ang appointment na ito.`,
    cannotCancel: `${I.warn} Hindi na maaaring kanselahin online ang appointment na ito.`,
    kept: `${I.ok} Sige, hindi nagbago ang iyong appointment.`,
    inquiryTitle: 'Narito ang ilan sa mga matutulungan ko:',
    inquiryLinks: { about: `${I.about} Alamin ang tungkol sa Trooper`, faq: `${I.faq} Tingnan ang mga FAQ`, site: `${I.link} Bisitahin ang website ng ospital` },
    contact: (h) => ['Salamat sa iyong tugon.', 'Para sa anumang katanungan o emerhensiya, makipag-ugnayan dito:', `${I.phone} Trunkline: ${h?.trunkline || 'N/A'}`, `${I.emergency} Emergency Direct Line: ${h?.emergencyLine || 'N/A'}`, `${I.email} Email: ${h?.email || 'N/A'}`, 'Maaari mo rin kaming bisitahin sa Portfolio:'],
    facebook: `${I.link} Bisitahin ang Portfolio Page`,
    records: ['Salamat sa iyong tugon.', 'Makikita mo ang iyong laboratory records sa pag-login sa website sa ibaba:'],
    recordsLink: `${I.link} Bisitahin ang Laboratory Records Website`,
    loadError: `${I.warn} Hindi maabot ng Trooper ang sistema ng ospital ngayon. Pakisubukang muli mamaya.`,
    noticeConfirm: 'Kumpirmasyon ng Paalala',
    declined: 'Walang problema. Maaari kang mag-iskedyul anumang oras.',
    socialTitle: 'Mga Social Channel:', portalTitle: 'Portal ng Access:', optionsTitle: 'Mga Opsyon:', actionsTitle: 'Mga Aksyon:',
    rateLimit: `${I.warn} Napakaraming subok mula sa device na ito. Maghintay ng ilang minuto at subukang muli.`,
    slotGone: 'Hindi na available ang oras na iyon.',
    placeholders: { name: 'Pangalan, Gitnang Inisyal, Apelyido', phone: '09171234567', ref: 'TRP-ABC123' },
    ui: { subtitle: 'Awtomatikong Katuwang sa Pag-iskedyul', choose: 'Pumili ng opsyon sa itaas para magpatuloy', typing: 'Nagta-type si Trooper', restart: 'Simulan muli ang usapan', close: 'Isara ang chat', send: 'Ipadala', respond: 'I-type ang iyong sagot...' }
  }
};


// ---------------------------------------------------------------------------
// Backend helpers
// ---------------------------------------------------------------------------

// Thin fetch wrapper. It never throws: network failures and non-JSON replies (for example a
// proxy error page) come back in the same shape as normal API errors.
async function api(path, options = {}) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      ...options,
      headers: options.body ? { 'Content-Type': 'application/json' } : undefined
    });
  } catch {
    return { ok: false, status: 0, data: null, code: 'NETWORK' };
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* body was not JSON */
  }
  return { ok: res.ok, status: res.status, data, code: data?.code || null };
}

// Same rules as services/scheduling.js so the bot rejects bad input before the server has to.
const NAME_RE = /^[\p{L}\p{M}\p{N} .'/-]{2,80}$/u;
const REF_RE = /^TRP-[A-Z0-9]{6}$/i;

function normalizePhone(input) {
  let digits = String(input || '').replace(/[\s()-]/g, '');
  if (digits.startsWith('+63')) digits = '0' + digits.slice(3);
  else if (/^63\d{10}$/.test(digits)) digits = '0' + digits.slice(2);
  return /^09\d{9}$/.test(digits) ? digits : null;
}



const emptyBooking = () => ({
  patientClass: null,
  patientName: '',
  phone: '',
  department: null,
  clinic: null,
  isNewPatient: true,
  doctor: null,
  date: null,
  slot: null,
  via: 'auto', // 'auto' (earliest slots) or 'manual' (patient picked the doctor)
  manageRef: '',
  managePhone: ''
});

// Thrown inside a flow when the conversation was restarted, so the old flow stops quietly.
const STALE = Symbol('stale-conversation');

export function useTrooperChat() {
  const [messages, setMessages] = useState([]);
  const [step, setStepState] = useState('INIT');
  const [isTyping, setIsTyping] = useState(false);
  const [lang, setLangState] = useState('en');
  const [config, setConfig] = useState(null);
  const [configStatus, setConfigStatus] = useState('loading'); // 'loading' | 'ready' | 'error'

  // Refs mirror state that async flows need to read *after* an await. State captured in a
  // closure would be stale by then (this is what caused the old language-switch bug).
  const langRef = useRef('en');
  const stepRef = useRef('INIT');
  const configRef = useRef(null);
  const runRef = useRef(0); // bumps on every restart; old flows notice and stop
  const busyRef = useRef(null); // token of the flow currently running, if any
  const startedRef = useRef(false);
  const idRef = useRef(0);
  const bookingData = useRef(emptyBooking());

  const t = () => TEXT[langRef.current];
  const goStep = (s) => {
    stepRef.current = s;
    setStepState(s);
  };

  const fmtDate = (ymd) => {
    if (!ymd) return '';
    const [y, m, d] = ymd.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(langRef.current === 'fil' ? 'fil-PH' : 'en-PH', {
      weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC'
    });
  };

  const fmtTime = (hhmm) => {
    if (!hhmm) return '';
    const [h, m] = hhmm.split(':').map(Number);
    return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
  };

  const deptName = (d) => (langRef.current === 'fil' && d?.nameFil ? d.nameFil : d?.name || '');
  // Button labels are built in one place each, so a button and the patient's echoed reply always match
  const deptLabel = (d) => `${DEPT_ICON[d?.slug] || I.clinic} ${deptName(d)}`;
  const clinicLabel = (c) => `${I.clinic} ${deptName(c)}`;
  const doctorLabel = (d) => `${I.doctor} ${d.name}`;
  const dateLabel = (ymd) => `${I.date} ${fmtDate(ymd)}`;
  const timeLabel = (hhmm) => `${I.time} ${fmtTime(hhmm)}`;
  const slotLabel = (o) => `${I.date} ${fmtDate(o.date)} \u00B7 ${fmtTime(o.start)} \u00B7 ${o.doctorName}`;
  const langLabel = (code) => `${I.language} ${code === 'fil' ? 'Filipino' : 'English'}`;

  // ---------- message plumbing ----------
  const nextId = () => ++idRef.current;

  const appendBot = async (text, options = null, typeDelay = 400, variant = null) => {
    const run = runRef.current;
    setIsTyping(true);
    await new Promise((r) => setTimeout(r, typeDelay));
    if (run !== runRef.current) throw STALE;
    setIsTyping(false);
    setMessages((prev) => [...prev, { id: nextId(), sender: 'bot', text, options, variant }]);
  };

  // Choosing an option or typing an answer closes every earlier set of option buttons, so a
  // stale button (for example "Confirm booking") can never be pressed twice.
  const appendUser = (text) => {
    setMessages((prev) => [
      ...prev.map((m) => (m.options ? { ...m, options: null } : m)),
      { id: nextId(), sender: 'user', text }
    ]);
  };

  // Maps a failed API call to a message in the visitor's language.
  const errorText = (r) => {
    const tx = t();
    if (r.code === 'NETWORK') return tx.networkError;
    if (r.code === 'RATE_LIMIT' || r.status === 429) return tx.rateLimit;
    if (r.status >= 500 || !r.data?.error) return tx.serverError;
    return r.data.error; // 4xx validation message from the server (English)
  };

  // ---------- config (departments, clinics, hospital) ----------
  const loadConfig = useCallback(async () => {
    setConfigStatus('loading');
    const r = await api('/config');
    if (r.ok && Array.isArray(r.data?.departments)) {
      configRef.current = r.data;
      setConfig(r.data);
      setConfigStatus('ready');
      return true;
    }
    setConfigStatus('error');
    return false;
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const ensureConfig = async () => configRef.current || (await loadConfig());

  // ---------- flows ----------
  const showMainMenu = async () => {
    const tx = t();
    goStep('MAIN_MENU');
    await appendBot(tx.menuTitle, [
      { label: tx.menu.schedule, action: 'FLOW_SCHEDULE' },
      { label: tx.menu.manage, action: 'FLOW_MANAGE' },
      { label: tx.menu.inquiry, action: 'FLOW_INQUIRY' },
      { label: tx.menu.contact, action: 'FLOW_CONTACT' },
      { label: tx.menu.records, action: 'FLOW_RECORDS' }
    ]);
  };

  const showDepartmentPicker = async () => {
    const tx = t();
    const b = bookingData.current;
    Object.assign(b, { department: null, clinic: null, doctor: null, date: null, slot: null, via: 'auto' });

    if (!(await ensureConfig())) {
      await appendBot(tx.loadError, [
        { label: tx.retry, action: 'SUBMIT_BOOKING', value: 'restart' },
        { label: tx.menuBtn, action: 'MENU' }
      ]);
      return;
    }
    // Only departments that really have an active doctor can be booked
    const depts = configRef.current.departments.filter((d) => d.doctorCount > 0);
    if (!depts.length) {
      await appendBot(tx.noDoctors);
      await showMainMenu();
      return;
    }
    goStep('CHOOSE_DEPT');
    await appendBot(tx.chooseDept, depts.map((d) => ({
      label: deptLabel(d),
      action: 'SELECT_DEPT',
      value: d
    })));
  };

  const askFirstTime = async () => {
    const tx = t();
    goStep('PATIENT_TYPE');
    await appendBot(tx.firstTime, [
      { label: tx.newPatient, action: 'SET_PATIENT_TYPE', value: true },
      { label: tx.returning, action: 'SET_PATIENT_TYPE', value: false }
    ]);
  };

  // GET /api/availability/next: earliest open times across all doctors in the clinic
  const fetchAutoSlots = async () => {
    const tx = t();
    const { department, clinic } = bookingData.current;
    bookingData.current.via = 'auto';
    await appendBot(tx.searching, null, 250);

    const qs = new URLSearchParams({ department: department.slug, limit: '5' });
    if (clinic) qs.set('clinic', clinic.slug);
    const r = await api(`/availability/next?${qs}`);

    if (!r.ok) {
      await appendBot(errorText(r));
      await showMainMenu();
      return;
    }
    if (!r.data?.options?.length) {
      const h = configRef.current?.hospital;
      await appendBot(tx.noSlots(configRef.current?.booking?.windowDays || 14, h?.trunkline || 'the hospital'));
      await showMainMenu();
      return;
    }
    goStep('PICK_AUTO');
    const options = r.data.options.map((o) => ({
      label: slotLabel(o),
      action: 'PICK_AUTO_SLOT',
      value: o
    }));
    options.push({ label: tx.pickDoctor, action: 'PICK_AUTO_SLOT', value: 'manual_doctor' });
    await appendBot(tx.autoIntro, options);
  };

  // GET /api/doctors
  const fetchDoctors = async () => {
    const tx = t();
    const { department, clinic } = bookingData.current;
    bookingData.current.via = 'manual';

    const qs = new URLSearchParams({ department: department.slug });
    if (clinic) qs.set('clinic', clinic.slug);
    const r = await api(`/doctors?${qs}`);

    if (!r.ok) {
      await appendBot(errorText(r));
      await showMainMenu();
      return;
    }
    if (!r.data?.doctors?.length) {
      await appendBot(tx.noDoctors);
      await showMainMenu();
      return;
    }
    goStep('CHOOSE_DOCTOR');
    await appendBot(tx.chooseDoctor, r.data.doctors.map((d) => ({
      label: doctorLabel(d), action: 'SELECT_DOCTOR', value: d
    })));
  };

  // GET /api/doctors/:id/availability
  const fetchDoctorSlots = async (doctor) => {
    const tx = t();
    const r = await api(`/doctors/${doctor.id}/availability`);

    if (!r.ok) {
      await appendBot(errorText(r));
      await showMainMenu();
      return;
    }
    if (!r.data?.dates?.length) {
      await appendBot(tx.noDoctorSlots(doctor.name));
      await fetchDoctors();
      return;
    }
    goStep('CHOOSE_DATE');
    await appendBot(tx.chooseDate(doctor.name), r.data.dates.map((d) => ({
      label: dateLabel(d.date), action: 'SELECT_DATE', value: d
    })));
  };

  const reviewBooking = async () => {
    const tx = t();
    const L = tx.labels;
    const b = bookingData.current;

    goStep('REVIEW');
    await appendBot(tx.reviewTitle, null, 250);
    await appendBot([
      `${L.patient}: ${b.patientName}`,
      `${L.mobile}: ${b.phone}`,
      `${L.doctor}: ${b.doctor.name}`,
      `${L.clinic}: ${deptName(b.clinic || b.department)}`,
      `${L.when}: ${fmtDate(b.date)}, ${fmtTime(b.slot.start)}`
    ].join('\n'), [
      { label: tx.confirm, action: 'SUBMIT_BOOKING', value: 'confirm' },
      { label: tx.restart, action: 'SUBMIT_BOOKING', value: 'restart' }
    ]);
  };

  // POST /api/appointments (the server re-checks the slot inside a transaction)
  const commitBooking = async () => {
    const tx = t();
    const b = bookingData.current;
    await appendBot(tx.booking, null, 250);

    const r = await api('/appointments', {
      method: 'POST',
      body: JSON.stringify({
        doctorId: b.doctor.id,
        date: b.date,
        start: b.slot.start,
        patientName: b.patientName,
        patientClass: b.patientClass,
        isNewPatient: b.isNewPatient,
        phone: b.phone,
        language: langRef.current
      })
    });

    if (r.ok) {
      goStep('COMPLETED');
      await appendBot(tx.success[0]);
      await appendBot(tx.success[1], null, 250);
      await appendBot(r.data.reference, null, 250, 'code');
      for (const line of tx.afterCode(b.phone, r.data.reminder)) {
        await appendBot(line, null, 250);
      }
      await appendBot(tx.optionsTitle, [{ label: tx.menuBtn, action: 'MENU' }]);
      return;
    }

    if (r.code === 'SLOT_UNAVAILABLE') {
      // Someone else took it. Show fresh times the same way the patient got here.
      await appendBot(tx.slotTaken);
      if (b.via === 'manual' && b.doctor) await fetchDoctorSlots(b.doctor);
      else await fetchAutoSlots();
      return;
    }
    if (r.code === 'ALREADY_BOOKED') {
      await appendBot(tx.alreadyBooked);
      await showMainMenu();
      return;
    }
    if (r.code === 'NO_DOCTOR') {
      await appendBot(tx.noDoctors);
      await showDepartmentPicker();
      return;
    }

    const retryable = r.code === 'NETWORK' || r.code === 'RATE_LIMIT' || r.status === 429 || r.status >= 500;
    await appendBot(errorText(r), [
      retryable
        ? { label: tx.retry, action: 'SUBMIT_BOOKING', value: 'retry' }
        : { label: tx.restart, action: 'SUBMIT_BOOKING', value: 'restart' },
      { label: tx.menuBtn, action: 'MENU' }
    ]);
  };

  // GET /api/appointments/:ref?phone=
  const lookupAppointment = async () => {
    const tx = t();
    const { manageRef, managePhone } = bookingData.current;
    const r = await api(`/appointments/${encodeURIComponent(manageRef)}?phone=${encodeURIComponent(managePhone)}`);

    if (r.ok) {
      const a = r.data;
      await appendBot(tx.found(a, `${fmtDate(a.date)}, ${fmtTime(a.start)}`));
      if (!a.canCancel) {
        await appendBot(a.status === 'cancelled' ? tx.alreadyCancelled : tx.cannotCancel);
        await showMainMenu();
        return;
      }
      goStep('MANAGE_OPTIONS');
      await appendBot(tx.actionsTitle, [
        { label: tx.cancelIt, action: 'CONFIRM_CANCEL_PROMPT' },
        { label: tx.menuBtn, action: 'MENU' }
      ]);
      return;
    }

    const text = r.status === 404 ? tx.notFound : r.code === 'BAD_PHONE' ? tx.badPhone : errorText(r);
    await appendBot(text, [
      { label: tx.retry, action: 'FLOW_MANAGE' },
      { label: tx.menuBtn, action: 'MENU' }
    ]);
  };

  // POST /api/appointments/:ref/cancel
  const executeCancel = async () => {
    const tx = t();
    const { manageRef, managePhone } = bookingData.current;
    const r = await api(`/appointments/${encodeURIComponent(manageRef)}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ phone: managePhone })
    });

    if (r.ok) await appendBot(tx.cancelled);
    else if (r.code === 'ALREADY_CANCELLED') await appendBot(tx.alreadyCancelled);
    else if (r.code === 'PAST') await appendBot(tx.cannotCancel);
    else if (r.status === 404) await appendBot(tx.notFound);
    else await appendBot(errorText(r));
    await showMainMenu();
  };

  const dispatch = async (action, value) => {
    const tx = t();
    const b = bookingData.current;

    switch (action) {
      case 'MENU':
        await showMainMenu();
        break;

      case 'SET_LANG':
        langRef.current = value;
        setLangState(value);
        appendUser(langLabel(value));
        await showMainMenu();
        break;

      case 'FLOW_SCHEDULE':
        Object.assign(b, emptyBooking());
        goStep('AGREEMENT');
        appendUser(tx.menu.schedule);
        for (const line of tx.notice) await appendBot(line, null, 300);
        await appendBot(tx.noticeConfirm, [
          { label: tx.agree, action: 'AGREE_NOTICE', value: true },
          { label: tx.disagree, action: 'AGREE_NOTICE', value: false }
        ]);
        break;

      case 'AGREE_NOTICE':
        if (!value) {
          appendUser(tx.disagree);
          await appendBot(tx.declined);
          await showMainMenu();
          return;
        }
        appendUser(tx.agree);
        goStep('CHOOSE_CLASS');
        await appendBot(tx.who, [
          { label: tx.classes.veteran, action: 'SET_CLASS', value: 'veteran' },
          { label: tx.classes.beneficiary, action: 'SET_CLASS', value: 'beneficiary' },
          { label: tx.classes.civilian, action: 'SET_CLASS', value: 'civilian' }
        ]);
        break;

      case 'SET_CLASS':
        b.patientClass = value;
        appendUser(tx.classes[value]);
        if (value === 'civilian') await appendBot(tx.civilianNote);
        goStep('AWAITING_NAME');
        await appendBot(tx.askName[value]);
        break;

      case 'SELECT_DEPT':
        b.department = value;
        b.clinic = null;
        appendUser(deptLabel(value));
        if (value.clinics?.length) {
          goStep('CHOOSE_CLINIC');
          await appendBot(tx.chooseClinic, value.clinics.map((c) => ({
            label: clinicLabel(c), action: 'SELECT_CLINIC', value: c
          })));
        } else {
          await askFirstTime();
        }
        break;

      case 'SELECT_CLINIC':
        b.clinic = value;
        appendUser(clinicLabel(value));
        await askFirstTime();
        break;

      case 'SET_PATIENT_TYPE':
        b.isNewPatient = value;
        appendUser(value ? tx.newPatient : tx.returning);
        if (value) await fetchAutoSlots();
        else await fetchDoctors();
        break;

      case 'PICK_AUTO_SLOT':
        if (value === 'manual_doctor') {
          appendUser(tx.pickDoctor);
          await fetchDoctors();
          return;
        }
        b.via = 'auto';
        b.doctor = { id: value.doctorId, name: value.doctorName };
        b.date = value.date;
        b.slot = { start: value.start };
        appendUser(slotLabel(value));
        await reviewBooking();
        break;

      case 'SELECT_DOCTOR':
        b.via = 'manual';
        b.doctor = value;
        appendUser(doctorLabel(value));
        await fetchDoctorSlots(value);
        break;

      case 'SELECT_DATE':
        b.date = value.date;
        appendUser(dateLabel(value.date));
        goStep('CHOOSE_TIME');
        await appendBot(tx.chooseTime, value.slots.map((s) => ({
          label: `${timeLabel(s.start)}${tx.left(s.remaining)}`,
          action: 'SELECT_TIME',
          value: s
        })));
        break;

      case 'SELECT_TIME':
        b.slot = value;
        appendUser(timeLabel(value.start));
        await reviewBooking();
        break;

      case 'SUBMIT_BOOKING':
        if (value === 'restart') {
          appendUser(tx.restart);
          await showDepartmentPicker();
          return;
        }
        appendUser(value === 'retry' ? tx.retry : tx.confirm);
        await commitBooking();
        break;

      case 'FLOW_MANAGE':
        appendUser(tx.menu.manage);
        goStep('AWAITING_REF');
        await appendBot(tx.askRef);
        break;

      case 'CONFIRM_CANCEL_PROMPT':
        appendUser(tx.cancelIt);
        await appendBot(tx.confirmCancel, [
          { label: tx.yesCancel, action: 'CONFIRM_CANCEL', value: true },
          { label: tx.noKeep, action: 'CONFIRM_CANCEL', value: false }
        ]);
        break;

      case 'CONFIRM_CANCEL':
        if (!value) {
          appendUser(tx.noKeep);
          await appendBot(tx.kept);
          await showMainMenu();
          return;
        }
        appendUser(tx.yesCancel);
        await executeCancel();
        break;

      case 'FLOW_INQUIRY':
        appendUser(tx.menu.inquiry);
        await ensureConfig();
        await appendBot(tx.inquiryTitle, [
          { label: tx.inquiryLinks.about, action: 'ANCHOR', value: '#About' },
          { label: tx.inquiryLinks.faq, action: 'ANCHOR', value: '#FAQ' },
          { label: tx.inquiryLinks.site, action: 'EXT_URL', value: configRef.current?.hospital?.website || 'https://vmmc.gov.ph/' },
          { label: tx.menuBtn, action: 'MENU' }
        ]);
        break;

      case 'FLOW_CONTACT': {
        appendUser(tx.menu.contact);
        await ensureConfig();
        const h = configRef.current?.hospital;
        for (const line of tx.contact(h)) await appendBot(line, null, 250);
        await appendBot(tx.socialTitle, [
          { label: tx.facebook, action: 'EXT_URL', value: h?.facebook || 'https://facebook.com' },
          { label: tx.menuBtn, action: 'MENU' }
        ]);
        break;
      }

      case 'FLOW_RECORDS':
        appendUser(tx.menu.records);
        await ensureConfig();
        for (const line of tx.records) await appendBot(line, null, 250);
        await appendBot(tx.portalTitle, [
          { label: tx.recordsLink, action: 'EXT_URL', value: configRef.current?.hospital?.resultsUrl || 'https://vmmc.gov.ph/' },
          { label: tx.menuBtn, action: 'MENU' }
        ]);
        break;

      default:
        break;
    }
  };

  // Runs one flow at a time. Extra clicks while the bot is busy are ignored, and a restart
  // makes any flow still in progress stop without writing to the new conversation.
  const runFlow = async (fn) => {
    if (busyRef.current) return;
    const token = {};
    busyRef.current = token;
    try {
      await fn();
    } catch (err) {
      if (err !== STALE) console.error('[Trooper chat]', err);
    } finally {
      if (busyRef.current === token) busyRef.current = null;
    }
  };

  const startConversation = useCallback(async () => {
    runRef.current += 1; // invalidates a flow that is still running
    busyRef.current = null;
    startedRef.current = true;
    bookingData.current = emptyBooking();
    langRef.current = 'en';
    setLangState('en');
    setMessages([]);
    setIsTyping(false);
    goStep('CHOOSE_LANG');

    await runFlow(async () => {
      await ensureConfig(); // retries if the first load failed
      await appendBot(
        `Hello ${I.wave}\nI am Trooper, your automated appointment assistant.\nPlease select your preferred language:`,
        [
          { label: langLabel('en'), action: 'SET_LANG', value: 'en' },
          { label: langLabel('fil'), action: 'SET_LANG', value: 'fil' }
        ],
        300
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Called when the visitor opens the chat. The conversation only starts the first time.
  const openChat = useCallback(() => {
    if (!startedRef.current) startConversation();
  }, [startConversation]);

  const handleAction = useCallback((action, value) => {
    switch (action) {
      case 'RESET':
        return startConversation();
      case 'ANCHOR': {
        // Link buttons never lock the bot or close the chat
        document.querySelector(value)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.replaceState(null, '', value);
        return undefined;
      }
      case 'EXT_URL':
        window.open(value, '_blank', 'noopener,noreferrer');
        return undefined;
      default:
        return runFlow(() => dispatch(action, value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUserInput = useCallback((raw) => {
    return runFlow(async () => {
      const tx = t();
      const b = bookingData.current;
      const input = String(raw || '').trim().replace(/\s+/g, ' ');

      switch (stepRef.current) {
        case 'AWAITING_NAME':
          if (!NAME_RE.test(input)) {
            appendUser(input || '...');
            await appendBot(tx.badName);
            return;
          }
          b.patientName = input;
          appendUser(input);
          goStep('AWAITING_PHONE');
          await appendBot(tx.askPhone);
          return;

        case 'AWAITING_PHONE': {
          const phone = normalizePhone(input);
          if (!phone) {
            appendUser(input || '...');
            await appendBot(tx.badPhone);
            return;
          }
          b.phone = phone;
          appendUser(phone);
          await showDepartmentPicker();
          return;
        }

        case 'AWAITING_REF':
          if (!REF_RE.test(input)) {
            appendUser(input || '...');
            await appendBot(tx.badRef);
            return;
          }
          b.manageRef = input.toUpperCase();
          appendUser(b.manageRef);
          goStep('AWAITING_MANAGE_PHONE');
          await appendBot(tx.askPhoneManage);
          return;

        case 'AWAITING_MANAGE_PHONE': {
          const phone = normalizePhone(input);
          if (!phone) {
            appendUser(input || '...');
            await appendBot(tx.badPhone);
            return;
          }
          b.managePhone = phone;
          appendUser(phone);
          await lookupAppointment();
          return;
        }

        default:
          return;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // What the text box should look like for the current step (null = no text box, show buttons)
  const tx = TEXT[lang];
  const INPUTS = {
    AWAITING_NAME: { placeholder: tx.placeholders.name, inputMode: 'text', autoComplete: 'name' },
    AWAITING_PHONE: { placeholder: tx.placeholders.phone, inputMode: 'tel', autoComplete: 'tel' },
    AWAITING_REF: { placeholder: tx.placeholders.ref, inputMode: 'text', autoComplete: 'off' },
    AWAITING_MANAGE_PHONE: { placeholder: tx.placeholders.phone, inputMode: 'tel', autoComplete: 'tel' }
  };

  return {
    messages,
    step,
    isTyping,
    lang,
    config,
    configStatus,
    reloadConfig: loadConfig,
    ui: tx.ui,
    input: INPUTS[step] || null,
    openChat,
    handleAction,
    handleUserInput
  };
}
