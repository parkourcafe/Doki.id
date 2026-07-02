import type { Locale } from "./i18n";
import type { ScreeningQuestion } from "./career";

// Библиотека готовых вопросов скрининга для линейного персонала
// (кафе, ресторан, отель, ритейл, доставка). Работодатель добавляет их
// в вакансию в один клик и может отредактировать. Формулировки короткие,
// подходят для быстрой заявки без регистрации. Юридически «острые» вопросы
// (свой транспорт, права) вынесены в отдельную категорию — их стоит
// включать только для профильных ролей (водитель/курьер).

export type QuestionTemplate = {
  q: Record<Locale, string>;
  type: ScreeningQuestion["type"];
};

export type QuestionCategory = {
  key: string;
  label: Record<Locale, string>;
  questions: QuestionTemplate[];
};

export const QUESTION_CATEGORIES: QuestionCategory[] = [
  {
    key: "eligibility",
    label: { en: "Work eligibility", id: "Kelayakan kerja", ru: "Право на работу", uz: "Ishlash huquqi" },
    questions: [
      {
        type: "yes_no",
        q: {
          en: "Are you 18 years or older?",
          id: "Apakah Anda berusia 18 tahun atau lebih?",
          ru: "Вам есть 18 лет?",
          uz: "Yoshingiz 18 dan oshganmi?",
        },
      },
      {
        type: "yes_no",
        q: {
          en: "Are you legally allowed to work in this country?",
          id: "Apakah Anda memiliki izin untuk bekerja secara legal di negara ini?",
          ru: "У вас есть право официально работать в этой стране?",
          uz: "Bu mamlakatda rasmiy ishlash huquqingiz bormi?",
        },
      },
      {
        type: "yes_no",
        q: {
          en: "Do you have a valid work permit or visa?",
          id: "Apakah Anda memiliki izin kerja atau visa yang berlaku?",
          ru: "У вас есть действующее разрешение на работу или виза?",
          uz: "Sizda amaldagi ish ruxsatnomasi yoki vizangiz bormi?",
        },
      },
      {
        type: "yes_no",
        q: {
          en: "Can you provide a valid ID or documents if hired?",
          id: "Dapatkah Anda menunjukkan identitas atau dokumen yang sah jika diterima?",
          ru: "Сможете предоставить документы, удостоверяющие личность, если вас примут?",
          uz: "Ishga qabul qilinsangiz, shaxsingizni tasdiqlovchi hujjatlarni taqdim eta olasizmi?",
        },
      },
    ],
  },
  {
    key: "availability",
    label: { en: "Availability", id: "Ketersediaan", ru: "Доступность", uz: "Ish vaqti" },
    questions: [
      {
        type: "text",
        q: {
          en: "When can you start work?",
          id: "Kapan Anda bisa mulai bekerja?",
          ru: "Когда вы можете приступить к работе?",
          uz: "Ishga qachon kirisha olasiz?",
        },
      },
      {
        type: "yes_no",
        q: {
          en: "Are you available to work on weekends?",
          id: "Apakah Anda bersedia bekerja di akhir pekan?",
          ru: "Готовы работать по выходным?",
          uz: "Dam olish kunlari ishlay olasizmi?",
        },
      },
      {
        type: "yes_no",
        q: {
          en: "Are you available for night shifts?",
          id: "Apakah Anda bersedia bekerja shift malam?",
          ru: "Готовы работать в ночные смены?",
          uz: "Tungi smenalarda ishlay olasizmi?",
        },
      },
      {
        type: "yes_no",
        q: {
          en: "Are you available for early morning shifts?",
          id: "Apakah Anda bersedia bekerja shift pagi buta?",
          ru: "Готовы работать в ранние утренние смены?",
          uz: "Erta tongdagi smenalarda ishlay olasizmi?",
        },
      },
      {
        type: "yes_no",
        q: {
          en: "Are you looking for full-time work?",
          id: "Apakah Anda mencari pekerjaan penuh waktu?",
          ru: "Вы ищете работу на полный день?",
          uz: "To‘liq kunlik ish qidiryapsizmi?",
        },
      },
      {
        type: "text",
        q: {
          en: "How many days per week can you work?",
          id: "Berapa hari dalam seminggu Anda bisa bekerja?",
          ru: "Сколько дней в неделю вы можете работать?",
          uz: "Haftasiga necha kun ishlay olasiz?",
        },
      },
      {
        type: "text",
        q: {
          en: "Which days and hours are you usually available?",
          id: "Pada hari dan jam berapa Anda biasanya tersedia?",
          ru: "В какие дни и часы вы обычно свободны?",
          uz: "Odatda qaysi kun va soatlarda bo‘shsiz?",
        },
      },
    ],
  },
  {
    key: "experience",
    label: { en: "Experience", id: "Pengalaman", ru: "Опыт", uz: "Tajriba" },
    questions: [
      {
        type: "text",
        q: {
          en: "How many years of experience do you have in this role?",
          id: "Berapa tahun pengalaman Anda di posisi ini?",
          ru: "Сколько лет опыта у вас в этой должности?",
          uz: "Bu lavozimda necha yillik tajribangiz bor?",
        },
      },
      {
        type: "yes_no",
        q: {
          en: "Have you worked in this role before?",
          id: "Apakah Anda pernah bekerja di posisi ini sebelumnya?",
          ru: "Вы раньше работали на такой должности?",
          uz: "Ilgari shu lavozimda ishlaganmisiz?",
        },
      },
      {
        type: "text",
        q: {
          en: "What was your most recent job?",
          id: "Apa pekerjaan terakhir Anda?",
          ru: "Кем вы работали на последнем месте?",
          uz: "Oxirgi ish joyingiz qanday edi?",
        },
      },
      {
        type: "text",
        q: {
          en: "Why did you leave your last job?",
          id: "Mengapa Anda meninggalkan pekerjaan terakhir?",
          ru: "Почему вы ушли с последнего места работы?",
          uz: "Oxirgi ishingizni nega tark etdingiz?",
        },
      },
      {
        type: "yes_no",
        q: {
          en: "Can you provide a reference from a past employer?",
          id: "Dapatkah Anda memberikan referensi dari pemberi kerja sebelumnya?",
          ru: "Можете дать рекомендацию от прошлого работодателя?",
          uz: "Oldingi ish beruvchidan tavsiya bera olasizmi?",
        },
      },
    ],
  },
  {
    key: "skills",
    label: { en: "Skills", id: "Keterampilan", ru: "Навыки", uz: "Ko‘nikmalar" },
    questions: [
      {
        type: "yes_no",
        q: {
          en: "Have you used a POS or cashier system before?",
          id: "Apakah Anda pernah menggunakan sistem POS atau kasir?",
          ru: "Вы работали с кассовой системой (POS)?",
          uz: "POS yoki kassa tizimida ishlaganmisiz?",
        },
      },
      {
        type: "yes_no",
        q: {
          en: "Do you have experience handling cash?",
          id: "Apakah Anda berpengalaman menangani uang tunai?",
          ru: "У вас есть опыт работы с наличными?",
          uz: "Naqd pul bilan ishlash tajribangiz bormi?",
        },
      },
      {
        type: "yes_no",
        q: {
          en: "Do you have a food safety or hygiene certificate?",
          id: "Apakah Anda memiliki sertifikat keamanan pangan atau higiene?",
          ru: "У вас есть сертификат по пищевой безопасности или гигиене?",
          uz: "Sizda oziq-ovqat xavfsizligi yoki gigiena sertifikati bormi?",
        },
      },
      {
        type: "text",
        q: {
          en: "Do you have any relevant certificates or training?",
          id: "Apakah Anda memiliki sertifikat atau pelatihan yang relevan?",
          ru: "Есть ли у вас профильные сертификаты или обучение?",
          uz: "Sizda tegishli sertifikat yoki o‘qish bormi?",
        },
      },
    ],
  },
  {
    key: "language",
    label: { en: "Language", id: "Bahasa", ru: "Языки", uz: "Tillar" },
    questions: [
      {
        type: "text",
        q: {
          en: "What is your level of English?",
          id: "Bagaimana tingkat bahasa Inggris Anda?",
          ru: "Какой у вас уровень английского?",
          uz: "Ingliz tili darajangiz qanday?",
        },
      },
      {
        type: "yes_no",
        q: {
          en: "Can you speak English with customers?",
          id: "Dapatkah Anda berbahasa Inggris dengan pelanggan?",
          ru: "Можете общаться с гостями на английском?",
          uz: "Mijozlar bilan ingliz tilida gaplasha olasizmi?",
        },
      },
      {
        type: "text",
        q: {
          en: "What other languages do you speak?",
          id: "Bahasa lain apa yang Anda kuasai?",
          ru: "На каких ещё языках вы говорите?",
          uz: "Yana qaysi tillarda gaplasha olasiz?",
        },
      },
    ],
  },
  {
    key: "logistics",
    label: {
      en: "Logistics & transport",
      id: "Logistik & transportasi",
      ru: "Логистика и транспорт",
      uz: "Yetib borish va transport",
    },
    questions: [
      {
        type: "yes_no",
        q: {
          en: "Do you live near this location?",
          id: "Apakah Anda tinggal dekat dengan lokasi ini?",
          ru: "Вы живёте рядом с этим местом?",
          uz: "Shu joy yaqinida yashaysizmi?",
        },
      },
      {
        type: "text",
        q: {
          en: "How long is your commute to this location?",
          id: "Berapa lama perjalanan Anda ke lokasi ini?",
          ru: "Сколько времени вы добираетесь до этого места?",
          uz: "Bu joygacha qancha vaqtda yetib borasiz?",
        },
      },
      {
        type: "yes_no",
        q: {
          en: "Do you have reliable transportation to get to work?",
          id: "Apakah Anda memiliki transportasi yang dapat diandalkan untuk bekerja?",
          ru: "У вас есть надёжный способ добираться до работы?",
          uz: "Ishga borish uchun ishonchli transportingiz bormi?",
        },
      },
      {
        type: "yes_no",
        q: {
          en: "Do you have a valid driver's license? (for driver / delivery roles)",
          id: "Apakah Anda memiliki SIM yang berlaku? (untuk peran sopir / kurir)",
          ru: "У вас есть действующие водительские права? (для водителя / курьера)",
          uz: "Sizda amaldagi haydovchilik guvohnomasi bormi? (haydovchi / kuryer uchun)",
        },
      },
      {
        type: "yes_no",
        q: {
          en: "Do you have your own vehicle or motorbike? (for driver / delivery roles)",
          id: "Apakah Anda memiliki kendaraan atau motor sendiri? (untuk peran sopir / kurir)",
          ru: "У вас есть свой транспорт или мотобайк? (для водителя / курьера)",
          uz: "Shaxsiy transport yoki mototsiklingiz bormi? (haydovchi / kuryer uchun)",
        },
      },
      {
        type: "yes_no",
        q: {
          en: "Can you arrive on time for every shift?",
          id: "Dapatkah Anda datang tepat waktu untuk setiap shift?",
          ru: "Сможете приходить вовремя на каждую смену?",
          uz: "Har bir smenaga o‘z vaqtida kela olasizmi?",
        },
      },
    ],
  },
  {
    key: "motivation",
    label: { en: "Motivation & fit", id: "Motivasi & kecocokan", ru: "Мотивация", uz: "Motivatsiya" },
    questions: [
      {
        type: "text",
        q: {
          en: "Why do you want to work here?",
          id: "Mengapa Anda ingin bekerja di sini?",
          ru: "Почему вы хотите у нас работать?",
          uz: "Nega aynan shu yerda ishlamoqchisiz?",
        },
      },
      {
        type: "yes_no",
        q: {
          en: "Are you comfortable working in a team?",
          id: "Apakah Anda nyaman bekerja dalam tim?",
          ru: "Комфортно ли вам работать в команде?",
          uz: "Jamoada ishlash siz uchun qulaymi?",
        },
      },
      {
        type: "yes_no",
        q: {
          en: "Can you stay calm and polite with difficult customers?",
          id: "Dapatkah Anda tetap tenang dan sopan dengan pelanggan yang sulit?",
          ru: "Сможете сохранять спокойствие и вежливость с трудными гостями?",
          uz: "Qiyin mijozlar bilan xotirjam va xushmuomala bo‘la olasizmi?",
        },
      },
      {
        type: "yes_no",
        q: {
          en: "Are you willing to wear a uniform and follow a dress code?",
          id: "Apakah Anda bersedia mengenakan seragam dan mengikuti aturan berpakaian?",
          ru: "Готовы носить форму и соблюдать дресс-код?",
          uz: "Forma kiyib, kiyinish qoidalariga rioya qila olasizmi?",
        },
      },
      {
        type: "yes_no",
        q: {
          en: "Are you comfortable with the pay range for this job?",
          id: "Apakah Anda setuju dengan kisaran gaji untuk pekerjaan ini?",
          ru: "Вас устраивает указанная зарплата для этой вакансии?",
          uz: "Bu ish uchun ko‘rsatilgan maosh sizga maqbulmi?",
        },
      },
    ],
  },
];
