export const CASE_STUDIES = [
    {
      index: '01 / ARCHITECTURE CASE STUDY',
      title: 'TAWFEEK TOURS',
      type: 'TOURISM PLATFORM & SANITY CMS DASHBOARD / PRODUCTION',
      desc: 'Full Luxor tourism & travel booking platform powered by Astro and Sanity CMS. Supports private excursions, sunrise hot air balloons, Nile cruises, hotel stays, flight inquiries, and live multi-currency switching (USD / EGP / EUR).',
      metrics: [
        { val: '0ms JS', label: 'Astro Static Edge Shell' },
        { val: '3 Currencies', label: 'USD · EGP · EUR Sync' },
        { val: 'Sanity CMS', label: 'Structured Studio Admin' }
      ],
      archTitle: 'CORE ARCHITECTURAL DECISIONS',
      archText: 'Engineered on Astro for ultra-fast static & edge delivery paired with a custom Sanity Studio CMS dashboard (/studio) so the operations team edits tours, seasonal pricing, cruise schedules, and categories in real time without touching code. Structured Schema.org metadata, zero-bloat filtering, and direct WhatsApp conversion routing keep booking friction near zero.',
      link: 'https://tawfeektours.com',
      btnText: 'VISIT TAWFEEKTOURS.COM ↗',
      images: [
        { src: 'assets/img/project-tawfeek.webp', label: 'Landing & Multi-Currency Entry', labelAr: 'الواجهة الرئيسية ومحول العملات' },
        { src: 'assets/img/project-tawfeek-tours.webp', label: 'Interactive Tours Catalog & Filters', labelAr: 'دليل الجولات والتصفية الفورية' },
        { src: 'assets/img/project-tawfeek-booking.webp', label: 'Nile Cruise Detail & Direct Booking', labelAr: 'تفاصيل الباخرة النيلية ومسار الحجز' },
        { src: 'assets/img/project-tawfeek-studio.webp', label: 'Sanity CMS Operations Dashboard', labelAr: 'لوحة تحكم إدارة المحتوى Sanity Studio' }
      ],
      // Arabic version
      ar: {
        index: '01 / دراسة معمارية النظام',
        title: 'TAWFEEK TOURS',
        type: 'منصة سياحية متكاملة ولوحة تحكم Sanity CMS / نظام إنتاجي حي',
        desc: 'منصة سياحية متكاملة لشركة توفيق تورز في الأقصر، مصممة بـ Astro مع لوحة تحكم إدارة محتوى كاملة عبر Sanity CMS. تغطي حجز الجولات الخاصة، رحلات المنطاد، البواخر النيلية، الفنادق، وتذاكر الطيران مع تبديل فوري للأسعار بثلاث عملات (دولار / جنيه / يورو).',
        metrics: [
          { val: 'أداء فوري', label: 'توليد صفحات Astro فائق السرعة' },
          { val: '3 عملات', label: 'تسعير لحظي USD · EGP · EUR' },
          { val: 'Sanity CMS', label: 'لوحة تحكم شاملة للفريق' }
        ],
        archTitle: 'القرارات المعمارية والتقنية',
        archText: 'تم بناء المنصة باستخدام Astro لتقديم صفحات خفيفة وفائقة السرعة على Cloudflare، مع ربطها بلوحة تحكم مخصصة عبر Sanity Studio (/studio) تتيح لفريق السياحة تحديث الرحلات، الأسعار الموسمية، مواعيد البواخر، والفنادق لحظياً بدون تدخل برمجي، بالإضافة لربط مباشر لطلبات الحجز عبر واتساب وتضمين بيانات منظمة لمحركات البحث.',
        btnText: 'معاينة المنصة الحية ↗'
      }
    },
    {
      index: '02 / ARCHITECTURE CASE STUDY',
      title: 'ARKO CLICK',
      type: 'NATIVE WINDOWS AUTOMATION / OPEN SOURCE / MIT',
      desc: 'Native lightweight Windows automation tool designed to interact with background, occluded, or minimized windows without hijacking the physical mouse or keyboard.',
      metrics: [
        { val: '0.00%', label: 'Idle CPU Usage' },
        { val: 'μs', label: 'Microsecond Precision' },
        { val: 'SHA-256', label: 'Encrypted Integrity' }
      ],
      archTitle: 'LOW-LEVEL WIN32 & SCHEDULER DESIGN',
      archText: 'Implemented via direct Win32 API PostMessage and SendMessage dispatch. Rather than relying on standard busy-wait polling loops, a calibrated min-heap priority scheduler allows the application to sleep with 0.00% CPU overhead between events. Binary auto-updates are cryptographically verified with SHA-256 signatures before staging.',
      link: 'https://github.com/arkamrashed97/ArkoClick',
      btnText: 'VIEW GITHUB REPOSITORY ↗',
      images: [
        { src: 'assets/img/project-arko-dark.webp', label: 'Dark Mode (Arabic UI)', labelAr: 'الوضع الداكن (الواجهة العربية)' },
        { src: 'assets/img/project-arko-light.webp', label: 'Light Mode (English UI)', labelAr: 'الوضع الفاتح (الواجهة الإنجليزية)' }
      ],
      // Arabic version
      ar: {
        index: '02 / دراسة معمارية النظام',
        title: 'ARKO CLICK',
        type: 'برمجيات أتمتة ويندوز خفيفة / مفتوح المصدر (MIT)',
        desc: 'برنامج خفيف وأصيل لنظام Windows يرسل النقرات والإدخال بدقة إلى النوافذ المفتوحة في الخلفية أو المصغرة دون تحريك مؤشر الماوس الحقيقي ودون تعطيل استخدام الجهاز.',
        metrics: [
          { val: '0.00%', label: 'استهلاك المعالج أثناء الخمول' },
          { val: 'μs', label: 'دقة الاستجابة بالميكروثانية' },
          { val: 'SHA-256', label: 'تحقق وتشفير التحديثات' }
        ],
        archTitle: 'معمارية Win32 وإدارة الموارد',
        archText: 'اعتمدت الأداة على توجيه الأحداث المباشرة عبر دوال Win32 API كـ PostMessage وSendMessage بدلاً من حلقات الانتظار المرهقة للمعالج. تم بناء مجدول مهام دقيق بخوارزمية Min-Heap يتيح للنظام الدخول في سكون تام باستهلاك 0.00% من المعالج بين النقرات، مع فحص أمني مشفر للتحديثات بتوقيعات SHA-256.',
        btnText: 'استعراض الكود على GitHub ↗'
      }
    },
    {
      index: '03 / ARCHITECTURE CASE STUDY',
      title: 'RT SUPPLEMENTS',
      type: 'RETAIL & INVENTORY MANAGEMENT / PRODUCTION',
      desc: 'Complete inventory management, sales auditing, and point-of-sale system for dietary supplement retail stores with real-time analytics and simulated sandbox training.',
      metrics: [
        { val: '<50ms', label: 'Barcode Lookup' },
        { val: '100%', label: 'Stock Integrity' },
        { val: 'SANDBOX', label: 'Safe Demo Simulation' }
      ],
      archTitle: 'DATA CONSISTENCY & AUDIT LOGGING',
      archText: 'Designed for high reliability in retail point-of-sale environments. Features atomic transaction handling for inventory depletion, preventing duplicate checkout or phantom stock. A sandboxed Demo Mode initializes mock memory state, permitting staff training without altering production financial or stock tables.',
      link: 'https://rtsupplements.vercel.app',
      btnText: 'VISIT RTSUPPLEMENTS.VERCEL.APP ↗',
      images: [
        { src: 'assets/img/project-rt.webp', label: 'Production Dashboard', labelAr: 'لوحة التحكم الحية' }
      ],
      // Arabic version
      ar: {
        index: '03 / دراسة معمارية النظام',
        title: 'RT SUPPLEMENTS',
        type: 'منظومة إدارة المخازن ونقاط البيع (ERP) / نظام إنتاجي حي',
        desc: 'نظام تجاري سحابي شامل لإدارة المخزون وفواتير المبيعات ونقاط البيع لمحلات المكملات الغذائية، مزود بتقارير أرباح فورية وبيئة تجريبية تفاعلية (Sandbox) لتدريب الموظفين دون التأثير على الحسابات الحقيقية.',
        metrics: [
          { val: '<50ms', label: 'سرعة قراءة الباركود' },
          { val: '100%', label: 'دقة ومطابقة الجرد' },
          { val: 'Sandbox', label: 'بيئة تدريب محاكية ومعزولة' }
        ],
        archTitle: 'معمارية البيانات ومنع التعارض',
        archText: 'صُمم النظام لبيئات التجزئة السريعة، حيث يعتمد على المعاملات الذرية (Atomic Transactions) لخصم المخزون فورياً ومنع حدوث أي تعارض أو بيع لكميات غير متوفرة. كما تم تضمين وضع محاكاة افتراضي (Demo Mode) لتدريب فريق العمل بأمان تام ودون أي تأثير على حركة المخازن أو الأرباح الفعلية.',
        btnText: 'تجربة النظام التجريبي ↗'
      }
    }
  ];
