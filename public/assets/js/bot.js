// Trooper chatbot. Menus, doctors and times all come from the API (and so from the database).
// Text typed by the user is always shown with textContent, so it can never run as HTML.
(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const box = $('chat-box');
  const inputBox = $('chat-input-container');
  const input = $('chat-input');
  const submitBtn = $('submit-btn');
  const backBtn = $('backButton');

  let CONFIG = null;
  let lang = 'en';
  let session = 0; // goes up on restart, close, or back. Old conversations stop when it changes.
  const STALE = new Error('stale');

  // ---------- Text ----------
  const EMOJI = { surgical: '💉', specialty: '🏥', pulmonary: '🌬️', obgyne: '👩', medical: '🩺', dental: '🦷', pediatrics: '👶', ophthalmology: '👁️', ent: '👂', nutrition: '🍳' };
  const SERVICE_IMG = { surgical: 'image1.jpg', specialty: 'image2.jpg', medical: 'image3.jpg', pulmonary: 'image4.jpg', obgyne: 'image6.jpg', dental: 'image7.jpg', pediatrics: 'image8.jpg', ophthalmology: 'image9.jpg', ent: 'image10.jpg', nutrition: 'image11.jpg' };

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
        r.queued ? `You will also get a reminder ${r.hoursBefore} hours before your appointment.` : 'Your appointment is soon, so no separate reminder will be sent.',
        'Please arrive 15 minutes early. You may now close this chat.'
      ],
      networkError: 'I could not reach the hospital system. Please try again.',
      serverError: 'Something went wrong on our side. Please try again in a moment.',
      retry: 'Try again', menuBtn: 'Main menu 🏠',
      askRef: 'Please enter your reference code (it looks like TRP-ABC123):',
      badRef: 'That does not look like a reference code. It starts with TRP- and has 6 more characters.',
      askPhoneManage: 'Now enter the mobile number you used for the booking:',
      notFound: 'No appointment matches that reference code and mobile number.',
      found: (a, when) => `Reference ${a.reference}\nStatus: ${a.status === 'confirmed' ? 'Confirmed' : 'Cancelled'}\nPatient: ${a.patientName}\nDoctor: ${a.doctor}\nClinic: ${a.clinic || a.department}\nWhen: ${when}`,
      cancelIt: 'Cancel this appointment', 
      confirmCancel: 'Are you sure? Your slot will be released for other patients.',
      yesCancel: 'Yes, cancel it', noKeep: 'No, keep it',
      cancelled: 'Your appointment is cancelled and the slot was released. A confirmation text is on its way.',
      alreadyCancelled: 'This appointment is already cancelled.',
      cannotCancel: 'This appointment can no longer be cancelled online.',
      kept: 'Okay, your appointment is unchanged.',
      inquiryTitle: 'Here are some things I can help you with:',
      inquiryLinks: { about: 'Discover more about Trooper', faq: 'View FAQs', site: 'Visit the hospital website' },
      contact: (h) => ['Thanks for your response.', 'For any inquiries or emergencies, you can contact us here:', `Trunkline: ${h.trunkline}`, `Emergency Direct Line: ${h.emergencyLine}`, `Email: ${h.email}`, 'You may also visit us on Facebook:'],
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
        r.queued ? `Makakatanggap ka rin ng paalala ${r.hoursBefore} oras bago ang appointment.` : 'Malapit na ang appointment mo kaya hindi na magpapadala ng hiwalay na paalala.',
        'Pumunta nang 15 minuto bago ang oras. Maaari mo nang isara ang chat na ito.'
      ],
      networkError: 'Hindi ko maabot ang sistema ng ospital. Pakisubukang muli.',
      serverError: 'May problema sa aming panig. Pakisubukang muli mamaya.',
      retry: 'Subukan muli', menuBtn: 'Pangunahing menu 🏠',
      askRef: 'Ilagay ang iyong reference code (hal. TRP-ABC123):',
      badRef: 'Hindi ito mukhang reference code. Nagsisimula ito sa TRP- at may 6 pang karakter.',
      askPhoneManage: 'Ilagay ngayon ang mobile number na ginamit sa booking:',
      notFound: 'Walang appointment na tumutugma sa reference code at mobile number na iyon.',
      found: (a, when) => `Reference ${a.reference}\nStatus: ${a.status === 'confirmed' ? 'Kumpirmado' : 'Kanselado'}\nPasyente: ${a.patientName}\nDoktor: ${a.doctor}\nKlinika: ${a.clinic || a.department}\nKailan: ${when}`,
      cancelIt: 'Kanselahin ang appointment na ito',
      confirmCancel: 'Sigurado ka ba? Mabibitawan ang iyong slot para sa ibang pasyente.',
      yesCancel: 'Oo, kanselahin', noKeep: 'Hindi, ituloy',
      cancelled: 'Kanselado na ang iyong appointment at nabitawan na ang slot. Papunta na ang confirmation text.',
      alreadyCancelled: 'Kanselado na ang appointment na ito.',
      cannotCancel: 'Hindi na maaaring kanselahin online ang appointment na ito.',
      kept: 'Sige, hindi nagbago ang iyong appointment.',
      inquiryTitle: 'Narito ang ilan sa mga matutulungan ko:',
      inquiryLinks: { about: 'Alamin ang tungkol sa Trooper', faq: 'Tingnan ang mga FAQ', site: 'Bisitahin ang website ng ospital' },
      contact: (h) => ['Salamat sa iyong tugon.', 'Para sa anumang katanungan o emerhensiya, makipag-ugnayan dito:', `Trunkline: ${h.trunkline}`, `Emergency Direct Line: ${h.emergencyLine}`, `Email: ${h.email}`, 'Maaari mo rin kaming bisitahin sa Facebook:'],
      facebook: 'Bisitahin ang Facebook Page',
      records: ['Salamat sa iyong tugon.', 'Makikita mo ang iyong laboratory records sa pag-login sa website sa ibaba:'],
      recordsLink: 'Bisitahin ang Laboratory Records Website',
      loadError: 'Hindi maabot ng Trooper ang sistema ng ospital ngayon. Pakisubukang muli mamaya.'
    }
  };
  const tx = () => TEXT[lang];

  // ---------- Small helpers ----------
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const scroll = () => { box.scrollTop = box.scrollHeight; };
  const safeUrl = (u) => (typeof u === 'string' && /^(https?:\/\/|#[A-Za-z0-9_-]*$)/i.test(u) ? u : '#'); // web links or page anchors only

  function fmtDate(ymd) {
    const [y, m, d] = ymd.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(lang === 'fil' ? 'fil-PH' : 'en-PH', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
  }
  function fmtTime(hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
  }
  const deptName = (d) => (lang === 'fil' ? d.nameFil : d.name);

  async function api(path, options) {
    try {
      const res = await fetch('/api' + path, options);
      let data = {};
      try { data = await res.json(); } catch (e) { /* empty */ }
      return { ok: res.ok, status: res.status, data };
    } catch (e) {
      return { ok: false, status: 0, data: { code: 'NETWORK' } };
    }
  }
  const post = (path, body) => api(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

  // ---------- Chat primitives ----------
  function alive(mine) { if (mine !== session) throw STALE; }

  async function say(text, extraClass) {
    const mine = session;
    const typing = document.createElement('p');
    typing.className = 'msg typing';
    typing.innerHTML = '<span></span><span></span><span></span>';
    box.appendChild(typing);
    scroll();
    await sleep(380);
    typing.remove();
    alive(mine);
    const p = document.createElement('p');
    p.className = 'msg' + (extraClass ? ' ' + extraClass : '');
    p.textContent = text;
    box.appendChild(p);
    scroll();
  }
  async function sayAll(lines) { for (const line of lines) await say(line); }

  function echo(text) {
    const p = document.createElement('p');
    p.className = 'test';
    const span = document.createElement('span');
    span.className = 'rep';
    span.textContent = text;
    p.appendChild(span);
    box.appendChild(p);
    scroll();
  }

  // Shows buttons. Options with a value resolve the promise. Options with an href just open a link.
  function ask(options) {
    const mine = session;
    return new Promise((resolve) => {
      const group = document.createElement('div');
      group.className = 'opts';
      options.forEach((o) => {
        const el = document.createElement(o.href ? 'a' : 'button');
        el.className = 'opt';
        el.textContent = o.label;
        if (o.href) {
          el.href = safeUrl(o.href);
          if (o.external) { el.target = '_blank'; el.rel = 'noopener noreferrer'; }
        } else {
          el.type = 'button';
          el.addEventListener('click', () => {
            if (mine !== session) return;
            group.remove();
            echo(o.label);
            resolve(o.value);
          });
        }
        group.appendChild(el);
      });
      box.appendChild(group);
      scroll();
    });
  }

  // Shows the text box. Keeps asking until the answer passes validate().
  function askText({ placeholder, validate, badMessage, mask }) {
    const mine = session;
    return new Promise((resolve) => {
      input.value = '';
      input.placeholder = placeholder || '';
      inputBox.style.display = 'block';
      input.focus();
      const submit = async () => {
        if (mine !== session) return;
        const raw = input.value.trim();
        const clean = validate(raw);
        if (clean === null) {
          echo(raw || '...');
          input.value = '';
          try { await say(badMessage); } catch (e) { /* chat was reset */ }
          return;
        }
        inputBox.style.display = 'none';
        input.onkeydown = null;
        submitBtn.onclick = null;
        echo(mask ? mask(raw) : raw);
        resolve(clean);
      };
      submitBtn.onclick = submit;
      input.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } };
    });
  }

  const validName = (v) => (/^[\p{L}\p{M}\p{N} .'\/-]{2,80}$/u.test(v) ? v.replace(/\s+/g, ' ') : null);
  function validPhone(v) {
    let d = v.replace(/[\s()-]/g, '');
    if (d.startsWith('+63')) d = '0' + d.slice(3);
    else if (/^63\d{10}$/.test(d)) d = '0' + d.slice(2);
    return /^09\d{9}$/.test(d) ? d : null;
  }
  const validRef = (v) => (/^TRP-[A-Z0-9]{6}$/i.test(v) ? v.toUpperCase() : null);

  // ---------- Flows ----------
  async function start() {
    session++;
    resetUI();
    const mine = session;
    try {
      if (!CONFIG && !(await loadConfig())) { await say(TEXT.en.loadError); return; }
      alive(mine);
      await say('Hello 👋');
      await say('I am Trooper, your automated appointment assistant.');
      await say('Please select your preferred language');
      lang = await ask([{ label: 'Filipino', value: 'fil' }, { label: 'English', value: 'en' }]);
      await mainMenu();
    } catch (e) { if (e !== STALE) console.error(e); }
  }

  async function mainMenu() {
    backBtn.style.display = 'none';
    await say(tx().menuTitle);
    const pick = await ask(Object.entries(tx().menu).map(([value, label]) => ({ label, value })));
    backBtn.style.display = 'block';
    if (pick === 'schedule') await bookingFlow();
    else if (pick === 'manage') await manageFlow();
    else if (pick === 'inquiry') await inquiryFlow();
    else if (pick === 'contact') await contactFlow();
    else await recordsFlow();
  }

  const backToMenu = async () => { await mainMenu(); };

  // Booking
  async function bookingFlow() {
    const t = tx();
    await sayAll(t.notice);
    if ((await ask([{ label: t.agree, value: true }, { label: t.disagree, value: false }])) === false) return backToMenu();

    await say(t.who);
    const patientClass = await ask(Object.entries(t.classes).map(([value, label]) => ({ label, value })));
    if (patientClass === 'civilian') await say(t.civilianNote);
    await say(t.askName[patientClass]);
    const patientName = await askText({ placeholder: t.namePlaceholder, validate: validName, badMessage: t.badName });
    await say(t.askPhone);
    const phone = await askText({ placeholder: '09XX XXX XXXX', validate: validPhone, badMessage: t.badPhone });

    for (;;) { // "Start over" comes back here
      await say(t.chooseDept);
      const departments = CONFIG.departments.filter((d) => d.doctorCount > 0);
      const dept = await ask(departments.map((d) => ({ label: `${deptName(d)} ${EMOJI[d.slug] || ''}`.trim(), value: d })));
      let clinic = null;
      if (dept.clinics.length) {
        await say(t.chooseClinic);
        clinic = await ask(dept.clinics.map((c) => ({ label: deptName(c), value: c })));
      }
      await say(t.firstTime);
      const isNew = (await ask([{ label: t.newPatient, value: true }, { label: t.returning, value: false }]));

      const choice = isNew ? await pickAutomatically(dept, clinic) : await pickByDoctor(dept, clinic);
      if (!choice) return backToMenu();

      await say(t.reviewTitle);
      const L = t.labels;
      await say([
        `${L.patient}: ${patientName}`,
        `${L.mobile}: ${phone}`,
        `${L.doctor}: ${choice.doctorName}`,
        `${L.clinic}: ${clinic ? deptName(clinic) : deptName(dept)}`,
        `${L.when}: ${fmtDate(choice.date)}, ${fmtTime(choice.start)}`
      ].join('\n'));
      const go = await ask([{ label: t.confirm, value: 'yes' }, { label: t.restart, value: 'again' }]);
      if (go === 'again') continue;

      const outcome = await submitBooking({ doctorId: choice.doctorId, date: choice.date, start: choice.start, patientName, patientClass, isNewPatient: isNew, phone, language: lang });
      if (outcome === 'retry') continue;
      return backToMenu();
    }
  }

  // New patients: Trooper picks the doctor by finding the earliest open times.
  async function pickAutomatically(dept, clinic) {
    const t = tx();
    for (;;) {
      await say(t.searching);
      const q = `/availability/next?department=${dept.slug}${clinic ? '&clinic=' + clinic.slug : ''}&limit=5`;
      const r = await api(q);
      if (!r.ok) { await say(t.networkError); return null; }
      if (!r.data.options.length) { await say(t.noSlots(CONFIG.booking.windowDays, CONFIG.hospital.trunkline)); return null; }
      await say(t.autoIntro);
      const options = r.data.options.map((o) => ({ label: `${fmtDate(o.date)} · ${fmtTime(o.start)} · ${o.doctorName}`, value: o }));
      options.push({ label: t.pickDoctor, value: 'doctor' });
      const pick = await ask(options);
      if (pick === 'doctor') return pickByDoctor(dept, clinic);
      return pick;
    }
  }

  // Returning patients: choose doctor, then date, then time.
  async function pickByDoctor(dept, clinic) {
    const t = tx();
    const r = await api(`/doctors?department=${dept.slug}${clinic ? '&clinic=' + clinic.slug : ''}`);
    if (!r.ok) { await say(t.networkError); return null; }
    if (!r.data.doctors.length) { await say(t.noDoctors); return null; }
    await say(t.chooseDoctor);
    for (;;) {
      const doctor = await ask(r.data.doctors.map((d) => ({ label: d.name, value: d })));
      const av = await api(`/doctors/${doctor.id}/availability`);
      if (!av.ok) { await say(t.networkError); return null; }
      if (!av.data.dates.length) { await say(t.noDoctorSlots(doctor.name)); continue; }
      await say(t.chooseDate(doctor.name));
      const day = await ask(av.data.dates.map((d) => ({ label: fmtDate(d.date), value: d })));
      await say(t.chooseTime);
      const slot = await ask(day.slots.map((s) => ({ label: fmtTime(s.start) + t.left(s.remaining), value: s })));
      return { doctorId: doctor.id, doctorName: doctor.name, date: day.date, start: slot.start };
    }
  }

  async function submitBooking(body) {
    const t = tx();
    for (;;) {
      await say(t.booking);
      const r = await post('/appointments', body);
      if (r.ok) {
        const d = r.data;
        await say(t.success[0]);
        await say(t.success[1]);
        await say(d.reference, 'code');
        await sayAll(t.afterCode(body.phone, d.reminder));
        return 'done';
      }
      const code = r.data.code;
      if (code === 'SLOT_UNAVAILABLE') { await say(t.slotTaken); return 'retry'; }
      if (code === 'ALREADY_BOOKED') { await say(t.alreadyBooked); return 'done'; }
      if (code === 'BAD_PHONE' || code === 'BAD_NAME') { await say(r.data.error || t.serverError); return 'done'; }
      await say(code === 'NETWORK' ? t.networkError : (r.data.error || t.serverError));
      const again = await ask([{ label: t.retry, value: true }, { label: t.menuBtn, value: false }]);
      if (!again) return 'done';
    }
  }

  // Manage (look up and cancel)
  async function manageFlow() {
    const t = tx();
    for (;;) {
      await say(t.askRef);
      const ref = await askText({ placeholder: 'TRP-ABC123', validate: validRef, badMessage: t.badRef });
      await say(t.askPhoneManage);
      const phone = await askText({ placeholder: '09XX XXX XXXX', validate: validPhone, badMessage: t.badPhone });
      const r = await api(`/appointments/${encodeURIComponent(ref)}?phone=${encodeURIComponent(phone)}`);
      if (r.ok) {
        const a = r.data;
        await say(t.found(a, `${fmtDate(a.date)}, ${fmtTime(a.start)}`));
        if (!a.canCancel) {
          await say(a.status === 'cancelled' ? t.alreadyCancelled : t.cannotCancel);
          return backToMenu();
        }
        const pick = await ask([{ label: t.cancelIt, value: 'cancel' }, { label: t.menuBtn, value: 'menu' }]);
        if (pick === 'menu') return backToMenu();
        await say(t.confirmCancel);
        if (!(await ask([{ label: t.yesCancel, value: true }, { label: t.noKeep, value: false }]))) { await say(t.kept); return backToMenu(); }
        const c = await post(`/appointments/${encodeURIComponent(ref)}/cancel`, { phone });
        await say(c.ok ? t.cancelled : (c.data.code === 'ALREADY_CANCELLED' ? t.alreadyCancelled : c.data.code === 'PAST' ? t.cannotCancel : (c.data.code === 'NETWORK' ? t.networkError : t.serverError)));
        return backToMenu();
      }
      await say(r.data.code === 'NETWORK' ? t.networkError : (r.status === 404 ? t.notFound : (r.data.error || t.serverError)));
      const again = await ask([{ label: t.retry, value: true }, { label: t.menuBtn, value: false }]);
      if (!again) return backToMenu();
    }
  }

  // Information
  async function inquiryFlow() {
    const t = tx();
    await say(t.inquiryTitle);
    await ask([
      { label: t.inquiryLinks.about, href: '#About' },
      { label: t.inquiryLinks.faq, href: '#FAQ' },
      { label: t.inquiryLinks.site, href: CONFIG.hospital.website, external: true },
      { label: t.menuBtn, value: 'menu' }
    ]);
    return backToMenu();
  }

  async function contactFlow() {
    const t = tx();
    await sayAll(t.contact(CONFIG.hospital));
    await ask([{ label: t.facebook, href: CONFIG.hospital.facebook, external: true }, { label: t.menuBtn, value: 'menu' }]);
    return backToMenu();
  }

  async function recordsFlow() {
    const t = tx();
    await sayAll(t.records);
    await ask([{ label: t.recordsLink, href: CONFIG.hospital.resultsUrl, external: true }, { label: t.menuBtn, value: 'menu' }]);
    return backToMenu();
  }

  // ---------- Window controls ----------
  function resetUI() {
    box.innerHTML = '';
    inputBox.style.display = 'none';
    input.onkeydown = null;
    submitBtn.onclick = null;
    backBtn.style.display = 'none';
  }

  const run = (fn) => fn().catch((e) => { if (e !== STALE) console.error(e); });

  function openChat(open) {
    const img = document.querySelector('#init img');
    $('test').style.display = open ? 'block' : 'none';
    img.src = open ? 'assets/images/CLOSE_BTN.png' : 'assets/images/START_BTN.png';
    img.alt = open ? 'Close chat' : 'Start chat';
    if (open) start(); else { session++; resetUI(); }
  }

  $('init').addEventListener('click', () => openChat($('test').style.display !== 'block'));
  $('exitButton').addEventListener('click', () => openChat(false));
  $('refreshButton').addEventListener('click', start);
  backBtn.addEventListener('click', () => {
    session++;
    resetUI();
    run(async () => { backBtn.style.display = 'none'; await mainMenu(); });
  });

  // ---------- Page setup ----------
  async function loadConfig() {
    const r = await api('/config');
    if (!r.ok) return false;
    CONFIG = r.data;
    renderServices();
    return true;
  }

  // The Services section is built from the same data the bot uses, so they always agree.
  function renderServices() {
    const holder = $('services-container');
    if (!holder) return;
    holder.innerHTML = '';
    CONFIG.departments.forEach((d) => {
      const block = document.createElement('div');
      block.className = 'service-block';
      const img = document.createElement('img');
      img.src = 'assets/images/' + (SERVICE_IMG[d.slug] || 'image3.jpg');
      img.alt = d.name;
      img.width = 192; img.height = 192;
      const name = document.createElement('div');
      name.className = 'service-name';
      name.textContent = d.name;
      block.append(img, name);
      if (d.clinics.length) {
        const drop = document.createElement('div');
        drop.className = 'dropdown-content';
        const ul = document.createElement('ul');
        d.clinics.forEach((c) => { const li = document.createElement('li'); li.textContent = c.name; ul.appendChild(li); });
        drop.appendChild(ul);
        block.appendChild(drop);
      }
      block.addEventListener('click', (e) => {
        e.stopPropagation();
        const wasOpen = block.classList.contains('show');
        holder.querySelectorAll('.service-block').forEach((b) => b.classList.remove('show', 'hide'));
        if (!wasOpen && d.clinics.length) block.classList.add('show', 'hide');
      });
      holder.appendChild(block);
    });
    document.addEventListener('click', () => holder.querySelectorAll('.service-block').forEach((b) => b.classList.remove('show', 'hide')));
  }

  loadConfig().then((ok) => {
    if (ok && CONFIG.hospital) {
      const note = $('demoNote');
      if (note) note.textContent = `Live demo using the ${CONFIG.hospital.name} as the example hospital.`;
    }
  });
})();
