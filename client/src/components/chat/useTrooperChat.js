import { useState, useEffect, useCallback, useRef } from 'react';

const EMOJI = { 
  surgical: '💉', specialty: '🏥', pulmonary: '🌬️', obgyne: '👩', 
  medical: '🩺', dental: '🦷', pediatrics: '👶', ophthalmology: '👁️', 
  ent: '👂', nutrition: '🍳' 
};

const TEXT = {
  en: {
    menuTitle: 'How can I help you today?',
    menu: { schedule: 'Schedule Appointment 🕐', manage: 'Manage Appointment 🔎', inquiry: 'Inquiry ❓', contact: 'Contact Hospital 📞', records: 'View Records 📝' },
    notice: [
      'Important Notice:',
      'The details you give will be checked again at the hospital. Please make sure everything is accurate and complete. A mismatch may forfeit your slot.',
      'Please arrive early. Latecomers cannot be accommodated.'
    ],
    agree: 'I agree ✅', disagree: 'I do not agree ❌',
    who: 'Who are we assisting today?',
    classes: { veteran: 'Veteran 👮‍♂️', beneficiary: 'Beneficiary 👪', civilian: 'Civilian 🚶' },
    civilianNote: 'Kindly note that fees may apply for select services.',
    askName: { veteran: "Please provide the Veteran's name or ID:", beneficiary: "Please provide the Beneficiary's name:", civilian: "Please provide the Civilian's name:" },
    namePlaceholder: 'First Name Middle Initial Last Name',
    badName: "Please enter 2 to 80 characters. Letters, numbers, spaces and . ' - / only.",
    askPhone: 'What mobile number should I send your confirmation and reminder to?',
    badPhone: 'Please enter a valid mobile number, for example 09171234567.',
    chooseDept: 'Please select the department you wish to visit:',
    chooseClinic: 'Please select the specific clinic or service:',
    firstTime: 'Is this your first time to consult?',
    newPatient: 'Yes, this is my first consultation', returning: 'No, I am a returning patient',
    searching: 'Let me find the earliest open times for you...',
    autoIntro: 'Here are the earliest open times. I matched you with the doctors who are free soonest:',
    pickDoctor: 'Choose a specific doctor instead',
    noSlots: (n, tel) => `Sorry, there are no open times in the next ${n} days for this clinic. Please call the hospital at ${tel}.`,
    noDoctors: 'Sorry, no doctors are available for that clinic right now.',
    chooseDoctor: 'Kindly select your referring doctor:',
    noDoctorSlots: (d) => `${d} has no open times in the next few weeks. Please pick another doctor:`,
    chooseDate: (d) => `Kindly select a date for your appointment with ${d}:`,
    chooseTime: 'Please select a time:',
    left: (n) => (n <= 2 ? ` (${n} left)` : ''),
    reviewTitle: 'Please review your appointment:',
    labels: { patient: 'Patient', mobile: 'Mobile', doctor: 'Doctor', clinic: 'Clinic', when: 'When' },
    confirm: 'Confirm booking ✅', restart: 'Start over',
    booking: 'Booking your slot...',
    slotTaken: 'Sorry, that time was just taken by someone else. Here are the updated times:',
    alreadyBooked: 'This mobile number already has an appointment with this doctor on that day. Use Manage Appointment to check or cancel it.',
    success: ['Your appointment is booked! ✅', 'Your reference code:'],
    afterCode: (phone, r) => [
      'Please keep this code. You need it to check or cancel.',
      `A confirmation text is on its way to ${phone}.`,
      r?.queued ? `You will also get a reminder ${r.hoursBefore} hours before your appointment.` : 'Your appointment is soon, so no separate reminder will be sent.',
      'Please arrive 15 minutes early. You may now close this chat.'
    ],
    networkError: 'I could not reach the hospital system. Please try again.',
    serverError: 'Something went wrong on our side. Please try again in a moment.',
    retry: 'Try again', menuBtn: 'Main menu 🏠',
    askRef: 'Please enter your reference code (it looks like TRP-ABC123):',
    badRef: 'That does not look like a reference code. It starts with TRP- and has 6 more characters.',
    askPhoneManage: 'Now enter the mobile number you used for the booking:',
    notFound: 'No appointment matches that reference code and mobile number.',
    found: (a, when) => `Reference: ${a.reference}\nStatus: ${a.status === 'confirmed' ? 'Confirmed' : 'Cancelled'}\nPatient: ${a.patientName}\nDoctor: ${a.doctor}\nClinic: ${a.clinic || a.department}\nWhen: ${when}`,
    cancelIt: 'Cancel this appointment',
    confirmCancel: 'Are you sure? Your slot will be released for other patients.',
    yesCancel: 'Yes, cancel it', noKeep: 'No, keep it',
    cancelled: 'Your appointment is cancelled and the slot was released. A confirmation text is on its way.',
    alreadyCancelled: 'This appointment is already cancelled.',
    cannotCancel: 'This appointment can no longer be cancelled online.',
    kept: 'Okay, your appointment is unchanged.',
    inquiryTitle: 'Here are some things I can help you with:',
    inquiryLinks: { about: 'Discover more about Trooper', faq: 'View FAQs', site: 'Visit the hospital website' },
    contact: (h) => ['Thanks for your response.', 'For any inquiries or emergencies, you can contact us here:', `Trunkline: ${h?.trunkline || 'N/A'}`, `Emergency Direct Line: ${h?.emergencyLine || 'N/A'}`, `Email: ${h?.email || 'N/A'}`, 'You may also visit us on Facebook:'],
    facebook: 'Visit Facebook Page',
    records: ['Thanks for your response.', 'You can find your laboratory records by logging in to the website below:'],
    recordsLink: 'Visit Laboratory Records Website',
    loadError: 'Trooper cannot reach the hospital system right now. Please try again later.'
  },
  fil: {
    menuTitle: 'Paano kita matutulungan?',
    menu: { schedule: 'Mag-iskedyul ng Appointment 🕐', manage: 'Ayusin ang Appointment 🔎', inquiry: 'Magtanong ❓', contact: 'Makipag-ugnayan sa Ospital 📞', records: 'Tingnan ang mga Rekord 📝' },
    notice: [
      'Mahalagang Paalala:',
      'Muling beberipikahin sa ospital ang impormasyong ibibigay mo. Pakitiyak na tama at kumpleto ang lahat ng detalye. Ang anumang pagkakamali ay maaaring magresulta sa pagkawala ng iyong slot.',
      'Inaanyayahan ka naming dumating nang maaga dahil hindi na maaaring tanggapin ang mga mahuhuli.'
    ],
    agree: 'Sumasang-ayon ako ✅', disagree: 'Hindi ako sumasang-ayon ❌',
    who: 'Sino ang aming tutulungan ngayon?',
    classes: { veteran: 'Beterano 👮‍♂️', beneficiary: 'Benepisyaryo 👪', civilian: 'Sibilian 🚶' },
    civilianNote: 'Paalala: maaaring may bayad ang ilang serbisyo.',
    askName: { veteran: 'Ibigay ang pangalan o ID ng Beterano:', beneficiary: 'Ibigay ang pangalan ng Benepisyaryo:', civilian: 'Ibigay ang pangalan ng Sibilian:' },
    namePlaceholder: 'Pangalan, Gitnang Inisyal, Apelyido',
    badName: "Maglagay ng 2 hanggang 80 karakter. Letra, numero, espasyo at . ' - / lamang.",
    askPhone: 'Anong mobile number ang pagpapadalhan ko ng kumpirmasyon at paalala?',
    badPhone: 'Maglagay ng tamang mobile number, halimbawa 09171234567.',
    chooseDept: 'Paki-pili ang departamento na nais mong bisitahin:',
    chooseClinic: 'Paki-pili ang klinika o serbisyo:',
    firstTime: 'Ito ba ang iyong unang beses na kumonsulta?',
    newPatient: 'Oo, ito ang aking unang konsultasyon', returning: 'Hindi, ako ay bumabalik na pasyente',
    searching: 'Hahanapin ko ang pinakamaagang bakanteng oras para sa iyo...',
    autoIntro: 'Narito ang pinakamaagang bakanteng oras. Itinugma kita sa mga doktor na unang magkakaroon ng bakante:',
    pickDoctor: 'Pumili ng partikular na doktor',
    noSlots: (n, tel) => `Paumanhin, walang bakanteng oras sa susunod na ${n} araw para sa klinikang ito. Pakitawagan ang ospital sa ${tel}.`,
    noDoctors: 'Paumanhin, walang magagamit na doktor para sa klinikang iyon ngayon.',
    chooseDoctor: 'Paki-pili ang iyong referring doctor:',
    noDoctorSlots: (d) => `Walang bakanteng oras si ${d} sa susunod na mga linggo. Pumili ng ibang doktor:`,
    chooseDate: (d) => `Paki-pili ang petsa ng appointment mo kay ${d}:`,
    chooseTime: 'Paki-pili ang oras:',
    left: (n) => (n <= 2 ? ` (${n} na lang)` : ''),
    reviewTitle: 'Pakisuri ang iyong appointment:',
    labels: { patient: 'Pasyente', mobile: 'Mobile', doctor: 'Doktor', clinic: 'Klinika', when: 'Kailan' },
    confirm: 'Kumpirmahin ang booking ✅', restart: 'Magsimulang muli',
    booking: 'Ibo-book ang iyong slot...',
    slotTaken: 'Paumanhin, kakakuha lang ng iba ng oras na iyon. Narito ang mga bagong bakante:',
    alreadyBooked: 'May appointment na ang mobile number na ito sa doktor na ito sa araw na iyon. Gamitin ang Ayusin ang Appointment para tingnan o kanselahin.',
    success: ['Naka-book na ang iyong appointment! ✅', 'Ang iyong reference code:'],
    afterCode: (phone, r) => [
      'Itago ang code na ito. Kakailanganin ito para tingnan o kanselahin.',
      `Papunta na ang confirmation text sa ${phone}.`,
      r?.queued ? `Makakatanggap ka rin ng paalala ${r.hoursBefore} oras bago ang appointment.` : 'Malapit na ang appointment mo kaya hindi na magpapadala ng hiwalay na paalala.',
      'Pumunta nang 15 minuto bago ang oras. Maaari mo nang isara ang chat na ito.'
    ],
    networkError: 'Hindi ko maabot ang sistema ng ospital. Pakisubukang muli.',
    serverError: 'May problema sa aming panig. Pakisubukang muli mamaya.',
    retry: 'Subukan muli', menuBtn: 'Pangunahing menu 🏠',
    askRef: 'Ilagay ang iyong reference code (hal. TRP-ABC123):',
    badRef: 'Hindi ito mukhang reference code. Nagsisimula ito sa TRP- at may 6 pang karakter.',
    askPhoneManage: 'Ilagay ngayon ang mobile number na ginamit sa booking:',
    notFound: 'Walang appointment na tumutugma sa reference code at mobile number na iyon.',
    found: (a, when) => `Reference: ${a.reference}\nStatus: ${a.status === 'confirmed' ? 'Kumpirmado' : 'Kanselado'}\nPasyente: ${a.patientName}\nDoktor: ${a.doctor}\nKlinika: ${a.clinic || a.department}\nKailan: ${when}`,
    cancelIt: 'Kanselahin ang appointment na ito',
    confirmCancel: 'Sigurado ka ba? Mabibitawan ang iyong slot para sa ibang pasyente.',
    yesCancel: 'Oo, kanselahin', noKeep: 'Hindi, ituloy',
    cancelled: 'Kanselado na ang iyong appointment at nabitawan na ang slot. Papunta na ang confirmation text.',
    alreadyCancelled: 'Kanselado na ang appointment na ito.',
    cannotCancel: 'Hindi na maaaring kanselahin online ang appointment na ito.',
    kept: 'Sige, hindi nagbago ang iyong appointment.',
    inquiryTitle: 'Narito ang ilan sa mga matutulungan ko:',
    inquiryLinks: { about: 'Alamin ang tungkol sa Trooper', faq: 'Tingnan ang mga FAQ', site: 'Bisitahin ang website ng ospital' },
    contact: (h) => ['Salamat sa iyong tugon.', 'Para sa anumang katanungan o emerhensiya, makipag-ugnayan dito:', `Trunkline: ${h?.trunkline || 'N/A'}`, `Emergency Direct Line: ${h?.emergencyLine || 'N/A'}`, `Email: ${h?.email || 'N/A'}`, 'Maaari mo rin kaming bisitahin sa Facebook:'],
    facebook: 'Bisitahin ang Facebook Page',
    records: ['Salamat sa iyong tugon.', 'Makikita mo ang iyong laboratory records sa pag-login sa website sa ibaba:'],
    recordsLink: 'Bisitahin ang Laboratory Records Website',
    loadError: 'Hindi maabot ng Trooper ang sistema ng ospital ngayon. Pakisubukang muli mamaya.'
  }
};

export function useTrooperChat() {
  const [messages, setMessages] = useState([]);
  const [step, setStep] = useState('INIT');
  const [isTyping, setIsTyping] = useState(false);
  const [lang, setLang] = useState('en');
  const [config, setConfig] = useState(null);

  const langRef = useRef('en');

  const bookingData = useRef({
    patientClass: null,
    patientName: '',
    phone: '',
    department: null,
    clinic: null,
    isNewPatient: true,
    doctor: null,
    date: null,
    slot: null,
    manageRef: '',
    managePhone: '',
    appointmentToCancel: null
  });

  const t = (currentLang = langRef.current) => TEXT[currentLang];

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

  // Simulates realistic typing animation
  const simulateTyping = async (delay = 450) => {
    setIsTyping(true);
    await new Promise((r) => setTimeout(r, delay));
    setIsTyping(false);
  };

  const appendBot = async (text, options = null, typeDelay = 400) => {
    await simulateTyping(typeDelay);
    setMessages((prev) => [...prev, { id: Date.now() + Math.random(), sender: 'bot', text, options }]);
  };

  const appendUser = (text) => {
    setMessages((prev) => [...prev, { id: Date.now() + Math.random(), sender: 'user', text }]);
  };

  const showMainMenu = async (overrideLang) => {
    const activeLang = overrideLang || langRef.current;
    setStep('MAIN_MENU');
    const tx = t(activeLang);
    await appendBot(tx.menuTitle, [
      { label: tx.menu.schedule, action: 'FLOW_SCHEDULE' },
      { label: tx.menu.manage, action: 'FLOW_MANAGE' },
      { label: tx.menu.inquiry, action: 'FLOW_INQUIRY' },
      { label: tx.menu.contact, action: 'FLOW_CONTACT' },
      { label: tx.menu.records, action: 'FLOW_RECORDS' }
    ]);
  };

  const startConversation = useCallback(async () => {
    setMessages([]);
    setStep('CHOOSE_LANG');
    langRef.current = 'en';
    setLang('en');

    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch {
      setConfig({
        booking: { windowDays: 14 },
        hospital: { name: 'Veterans Memorial Medical Center', trunkline: '(02) 8927-6426' },
        departments: []
      });
    }

    await appendBot(
      'Hello 👋\nI am Trooper, your automated appointment assistant.\nPlease select your preferred language:',
      [
        { label: 'English', action: 'SET_LANG', value: 'en' },
        { label: 'Filipino', action: 'SET_LANG', value: 'fil' }
      ],
      300
    );
  }, []);

  useEffect(() => {
    startConversation();
  }, [startConversation]);

  const handleAction = async (action, value) => {
    const tx = t();

    switch (action) {
      case 'RESET':
        startConversation();
        break;

      case 'MENU':
        showMainMenu();
        break;

      case 'SET_LANG': {
        langRef.current = value;
        setLang(value);
        appendUser(value === 'fil' ? 'Filipino' : 'English');
        await showMainMenu(value);
        break;
      }

      case 'START_BOOKING':
      case 'FLOW_SCHEDULE':
        setStep('AGREEMENT');
        appendUser(tx.menu.schedule);
        for (const line of tx.notice) {
          await appendBot(line, null, 300);
        }
        await appendBot('Notice Confirmation', [
          { label: tx.agree, action: 'AGREE_NOTICE', value: true },
          { label: tx.disagree, action: 'AGREE_NOTICE', value: false }
        ]);
        break;

      case 'AGREE_NOTICE':
        if (!value) {
          appendUser(tx.disagree);
          await appendBot(tx.kept);
          showMainMenu();
          return;
        }
        appendUser(tx.agree);
        setStep('CHOOSE_CLASS');
        await appendBot(tx.who, [
          { label: tx.classes.veteran, action: 'SET_CLASS', value: 'veteran' },
          { label: tx.classes.beneficiary, action: 'SET_CLASS', value: 'beneficiary' },
          { label: tx.classes.civilian, action: 'SET_CLASS', value: 'civilian' }
        ]);
        break;

      case 'SET_CLASS':
        bookingData.current.patientClass = value;
        appendUser(tx.classes[value]);
        if (value === 'civilian') {
          await appendBot(tx.civilianNote);
        }
        setStep('AWAITING_NAME');
        await appendBot(tx.askName[value]);
        break;

      case 'SELECT_DEPT':
        bookingData.current.department = value;
        appendUser(`${deptName(value)} ${EMOJI[value.slug] || ''}`);
        if (value.clinics && value.clinics.length > 0) {
          setStep('CHOOSE_CLINIC');
          await appendBot(tx.chooseClinic, value.clinics.map((c) => ({
            label: deptName(c), action: 'SELECT_CLINIC', value: c
          })));
        } else {
          bookingData.current.clinic = null;
          askFirstTime();
        }
        break;

      case 'SELECT_CLINIC':
        bookingData.current.clinic = value;
        appendUser(deptName(value));
        askFirstTime();
        break;

      case 'SET_PATIENT_TYPE':
        bookingData.current.isNewPatient = value;
        appendUser(value ? tx.newPatient : tx.returning);
        if (value) {
          fetchAutoSlots();
        } else {
          fetchDoctors();
        }
        break;

      case 'PICK_AUTO_SLOT':
        if (value === 'manual_doctor') {
          appendUser(tx.pickDoctor);
          fetchDoctors();
          return;
        }
        bookingData.current.doctor = { id: value.doctorId, name: value.doctorName };
        bookingData.current.date = value.date;
        bookingData.current.slot = { start: value.start };
        appendUser(`${fmtDate(value.date)} · ${fmtTime(value.start)} · ${value.doctorName}`);
        reviewBooking();
        break;

      case 'SELECT_DOCTOR':
        bookingData.current.doctor = value;
        appendUser(value.name);
        fetchDoctorSlots(value);
        break;

      case 'SELECT_DATE':
        bookingData.current.date = value.date;
        appendUser(fmtDate(value.date));
        setStep('CHOOSE_TIME');
        await appendBot(tx.chooseTime, value.slots.map((s) => ({
          label: `${fmtTime(s.start)}${tx.left(s.remaining)}`,
          action: 'SELECT_TIME',
          value: s
        })));
        break;

      case 'SELECT_TIME':
        bookingData.current.slot = value;
        appendUser(fmtTime(value.start));
        reviewBooking();
        break;

      case 'SUBMIT_BOOKING':
        if (value === 'restart') {
          appendUser(tx.restart);
          showDepartmentPicker();
          return;
        }
        appendUser(tx.confirm);
        commitBooking();
        break;

      case 'FLOW_MANAGE':
        appendUser(tx.menu.manage);
        setStep('AWAITING_REF');
        await appendBot(tx.askRef);
        break;

      case 'CONFIRM_CANCEL':
        if (!value) {
          appendUser(tx.noKeep);
          await appendBot(tx.kept);
          showMainMenu();
          return;
        }
        appendUser(tx.yesCancel);
        executeCancel();
        break;

      case 'FLOW_INQUIRY':
        appendUser(tx.menu.inquiry);
        await appendBot(tx.inquiryTitle, [
          { label: tx.inquiryLinks.about, action: 'ANCHOR', value: '#About' },
          { label: tx.inquiryLinks.faq, action: 'ANCHOR', value: '#FAQ' },
          { label: tx.inquiryLinks.site, action: 'EXT_URL', value: config?.hospital?.website || 'https://vmmc.gov.ph' },
          { label: tx.menuBtn, action: 'MENU' }
        ]);
        break;

      case 'FLOW_CONTACT':
        appendUser(tx.menu.contact);
        for (const line of tx.contact(config?.hospital)) {
          await appendBot(line, null, 250);
        }
        await appendBot('Social Channels:', [
          { label: tx.facebook, action: 'EXT_URL', value: config?.hospital?.facebook || 'https://facebook.com' },
          { label: tx.menuBtn, action: 'MENU' }
        ]);
        break;

      case 'FLOW_RECORDS':
        appendUser(tx.menu.records);
        for (const line of tx.records) {
          await appendBot(line, null, 250);
        }
        await appendBot('Access Portal:', [
          { label: tx.recordsLink, action: 'EXT_URL', value: config?.hospital?.resultsUrl || 'https://vmmc.gov.ph' },
          { label: tx.menuBtn, action: 'MENU' }
        ]);
        break;

      case 'ANCHOR':
        window.location.hash = value;
        break;

      case 'EXT_URL':
        window.open(value, '_blank', 'noopener,noreferrer');
        break;

      default:
        break;
    }
  };

  const handleUserInput = async (raw) => {
    const input = raw.trim();
    const tx = t();

    if (step === 'AWAITING_NAME') {
      const valid = /^[\p{L}\p{M}\p{N} .'\/-]{2,80}$/u.test(input) ? input.replace(/\s+/g, ' ') : null;
      if (!valid) {
        appendUser(input || '...');
        await appendBot(tx.badName);
        return;
      }
      bookingData.current.patientName = valid;
      appendUser(valid);
      setStep('AWAITING_PHONE');
      await appendBot(tx.askPhone);
      return;
    }

    if (step === 'AWAITING_PHONE') {
      let clean = input.replace(/[\s()-]/g, '');
      if (clean.startsWith('+63')) clean = '0' + clean.slice(3);
      else if (/^63\d{10}$/.test(clean)) clean = '0' + clean.slice(2);
      const isOk = /^09\d{9}$/.test(clean);

      if (!isOk) {
        appendUser(input || '...');
        await appendBot(tx.badPhone);
        return;
      }
      bookingData.current.phone = clean;
      appendUser(clean);
      showDepartmentPicker();
      return;
    }

    if (step === 'AWAITING_REF') {
      const isRef = /^TRP-[A-Z0-9]{6}$/i.test(input);
      if (!isRef) {
        appendUser(input || '...');
        await appendBot(tx.badRef);
        return;
      }
      bookingData.current.manageRef = input.toUpperCase();
      appendUser(input.toUpperCase());
      setStep('AWAITING_MANAGE_PHONE');
      await appendBot(tx.askPhoneManage);
      return;
    }

    if (step === 'AWAITING_MANAGE_PHONE') {
      let clean = input.replace(/[\s()-]/g, '');
      if (clean.startsWith('+63')) clean = '0' + clean.slice(3);
      else if (/^63\d{10}$/.test(clean)) clean = '0' + clean.slice(2);
      const isOk = /^09\d{9}$/.test(clean);

      if (!isOk) {
        appendUser(input || '...');
        await appendBot(tx.badPhone);
        return;
      }
      bookingData.current.managePhone = clean;
      appendUser(clean);
      lookupAppointment();
    }
  };

  const showDepartmentPicker = async () => {
    const tx = t();
    setStep('CHOOSE_DEPT');
    await appendBot(tx.chooseDept, (config?.departments || [])
      .filter((d) => d.doctorCount > 0)
      .map((d) => ({
        label: `${deptName(d)} ${EMOJI[d.slug] || ''}`.trim(),
        action: 'SELECT_DEPT',
        value: d
      }))
    );
  };

  const askFirstTime = async () => {
    const tx = t();
    setStep('PATIENT_TYPE');
    await appendBot(tx.firstTime, [
      { label: tx.newPatient, action: 'SET_PATIENT_TYPE', value: true },
      { label: tx.returning, action: 'SET_PATIENT_TYPE', value: false }
    ]);
  };

  const fetchAutoSlots = async () => {
    const tx = t();
    await appendBot(tx.searching, null, 250);

    const { department, clinic } = bookingData.current;
    const url = `/api/availability/next?department=${department.slug}${clinic ? '&clinic=' + clinic.slug : ''}&limit=5`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok || !data.options || data.options.length === 0) {
        await appendBot(tx.noSlots(config?.booking?.windowDays || 14, config?.hospital?.trunkline || '(02) 8927-6426'));
        showMainMenu();
        return;
      }

      setStep('PICK_AUTO');
      const options = data.options.map((o) => ({
        label: `${fmtDate(o.date)} · ${fmtTime(o.start)} · ${o.doctorName}`,
        action: 'PICK_AUTO_SLOT',
        value: o
      }));
      options.push({ label: tx.pickDoctor, action: 'PICK_AUTO_SLOT', value: 'manual_doctor' });
      await appendBot(tx.autoIntro, options);
    } catch {
      await appendBot(tx.networkError);
      showMainMenu();
    }
  };

  const fetchDoctors = async () => {
    const tx = t();
    const { department, clinic } = bookingData.current;
    const url = `/api/doctors?department=${department.slug}${clinic ? '&clinic=' + clinic.slug : ''}`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok || !data.doctors || data.doctors.length === 0) {
        await appendBot(tx.noDoctors);
        showMainMenu();
        return;
      }

      setStep('CHOOSE_DOCTOR');
      await appendBot(tx.chooseDoctor, data.doctors.map((d) => ({
        label: d.name, action: 'SELECT_DOCTOR', value: d
      })));
    } catch {
      await appendBot(tx.networkError);
      showMainMenu();
    }
  };

  const fetchDoctorSlots = async (doctor) => {
    const tx = t();
    try {
      const res = await fetch(`/api/doctors/${doctor.id}/availability`);
      const data = await res.json();

      if (!res.ok || !data.dates || data.dates.length === 0) {
        await appendBot(tx.noDoctorSlots(doctor.name));
        fetchDoctors();
        return;
      }

      setStep('CHOOSE_DATE');
      await appendBot(tx.chooseDate(doctor.name), data.dates.map((d) => ({
        label: fmtDate(d.date), action: 'SELECT_DATE', value: d
      })));
    } catch {
      await appendBot(tx.networkError);
      showMainMenu();
    }
  };

  const reviewBooking = async () => {
    const tx = t();
    const L = tx.labels;
    const b = bookingData.current;

    setStep('REVIEW');
    await appendBot(tx.reviewTitle, null, 250);
    await appendBot([
      `${L.patient}: ${b.patientName}`,
      `${L.mobile}: ${b.phone}`,
      `${L.doctor}: ${b.doctor.name}`,
      `${L.clinic}: ${b.clinic ? deptName(b.clinic) : deptName(b.department)}`,
      `${L.when}: ${fmtDate(b.date)}, ${fmtTime(b.slot.start)}`
    ].join('\n'), [
      { label: tx.confirm, action: 'SUBMIT_BOOKING', value: 'confirm' },
      { label: tx.restart, action: 'SUBMIT_BOOKING', value: 'restart' }
    ]);
  };

  const commitBooking = async () => {
    const tx = t();
    await appendBot(tx.booking, null, 250);

    const b = bookingData.current;
    const payload = {
      doctorId: b.doctor.id,
      date: b.date,
      start: b.slot.start,
      patientName: b.patientName,
      patientClass: b.patientClass,
      isNewPatient: b.isNewPatient,
      phone: b.phone,
      language: langRef.current
    };

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        await appendBot(tx.success[0]);
        await appendBot(tx.success[1]);
        await appendBot(data.reference);
        for (const msg of tx.afterCode(b.phone, data.reminder)) {
          await appendBot(msg, null, 250);
        }
        await appendBot('Options:', [{ label: tx.menuBtn, action: 'MENU' }]);
        setStep('COMPLETED');
        return;
      }

      if (data.code === 'SLOT_UNAVAILABLE') {
        await appendBot(tx.slotTaken);
        fetchAutoSlots();
        return;
      }
      if (data.code === 'ALREADY_BOOKED') {
        await appendBot(tx.alreadyBooked);
        showMainMenu();
        return;
      }
      await appendBot(data.error || tx.serverError, [
        { label: tx.retry, action: 'SUBMIT_BOOKING', value: 'confirm' },
        { label: tx.menuBtn, action: 'MENU' }
      ]);
    } catch {
      await appendBot(tx.networkError, [
        { label: tx.retry, action: 'SUBMIT_BOOKING', value: 'confirm' },
        { label: tx.menuBtn, action: 'MENU' }
      ]);
    }
  };

  const lookupAppointment = async () => {
    const tx = t();
    const { manageRef, managePhone } = bookingData.current;

    try {
      const res = await fetch(`/api/appointments/${encodeURIComponent(manageRef)}?phone=${encodeURIComponent(managePhone)}`);
      const data = await res.json();

      if (res.ok) {
        bookingData.current.appointmentToCancel = data;
        await appendBot(tx.found(data, `${fmtDate(data.date)}, ${fmtTime(data.start)}`));

        if (!data.canCancel) {
          await appendBot(data.status === 'cancelled' ? tx.alreadyCancelled : tx.cannotCancel);
          showMainMenu();
          return;
        }

        setStep('MANAGE_OPTIONS');
        await appendBot('Actions:', [
          { label: tx.cancelIt, action: 'CONFIRM_CANCEL_PROMPT' },
          { label: tx.menuBtn, action: 'MENU' }
        ]);
        return;
      }

      await appendBot(res.status === 404 ? tx.notFound : (data.error || tx.serverError), [
        { label: tx.retry, action: 'FLOW_MANAGE' },
        { label: tx.menuBtn, action: 'MENU' }
      ]);
    } catch {
      await appendBot(tx.networkError, [
        { label: tx.retry, action: 'FLOW_MANAGE' },
        { label: tx.menuBtn, action: 'MENU' }
      ]);
    }
  };

  const executeCancel = async () => {
    const tx = t();
    const { manageRef, managePhone } = bookingData.current;

    try {
      const res = await fetch(`/api/appointments/${encodeURIComponent(manageRef)}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: managePhone })
      });
      const data = await res.json();

      if (res.ok) {
        await appendBot(tx.cancelled);
      } else {
        await appendBot(data.error || tx.serverError);
      }
      showMainMenu();
    } catch {
      await appendBot(tx.networkError);
      showMainMenu();
    }
  };

  return {
    messages,
    step,
    isTyping,
    lang,
    config,
    handleAction: async (act, val) => {
      if (act === 'CONFIRM_CANCEL_PROMPT') {
        const tx = t();
        await appendBot(tx.confirmCancel, [
          { label: tx.yesCancel, action: 'CONFIRM_CANCEL', value: true },
          { label: tx.noKeep, action: 'CONFIRM_CANCEL', value: false }
        ]);
      } else {
        await handleAction(act, val);
      }
    },
    handleUserInput
  };
}