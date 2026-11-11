export const CASE_STUDIES = [
    {
      index: '01 / ARCHITECTURE CASE STUDY',
      title: 'SEQUOIA TRAVEL',
      type: 'TOURISM MANAGEMENT & BOOKING ENGINE / PRODUCTION',
      desc: 'Customer and administrative booking portal, real-time staff chat, multi-currency payment pipeline, and an AI concierge grounded in live inventories and reservation records.',
      metrics: [
        { val: '<120ms', label: 'Global Edge TTFB' },
        { val: '99.98%', label: 'Verified Uptime' },
        { val: '100%', label: 'RBAC Strict Isolation' }
      ],
      archTitle: 'CORE ARCHITECTURAL DECISIONS',
      archText: 'Built on Next.js App Router with Supabase PostgreSQL. Row Level Security (RLS) ensures strict tenant data separation across customer, agent, and super-admin portals. AI context injection fetches live hotel availability, dynamic seasonal pricing, and active bookings via transactional edge functions with zero hallucinations.',
      link: 'https://sequoiatravel.com',
      btnText: 'VISIT SEQUOIATRAVEL.COM ↗',
      images: [
        { src: 'assets/img/project-sequoia.jpg', label: 'Production Platform', labelAr: 'واجهة المنصة الحية' }
      ],
      // Arabic version
      ar: {
        index: '01 / دراسة معمارية النظام',
        title: 'SEQUOIA TRAVEL',
        type: 'منصة إدارة سياحية وحجوزات متكاملة / نظام إنتاجي حي',
        desc: 'منظومة سياحية متكاملة تضم بوابات تفاعلية للمسافرين، لوحة تحكم مركزية للعمليات، محرك حجز فوري متعدد العملات، محادثة إدارية لحظية، ومساعد ذكاء اصطناعي مربوط مباشرة بتوافر الغرف والأسعار الحية.',
        metrics: [
          { val: '<120ms', label: 'سرعة الاستجابة السحابية' },
          { val: '99.98%', label: 'استقرار وجاهزية النظام' },
          { val: '100%', label: 'عزل تام لصلاحيات البيانات' }
        ],
        archTitle: 'القرارات المعمارية والتقنية',
        archText: 'معمارية سحابية متقدمة تعتمد على Next.js App Router وSupabase PostgreSQL مع تطبيق حماية البيانات على مستوى السجلات (RLS) لعزل بيانات العملاء والوكلاء والإدارة بإحكام. يستعلم مساعد الذكاء الاصطناعي لحظياً عن الأسعار والتوافر الفعلي عبر Edge Functions فورية تمنع أي احتمالية للمعلومات الخاطئة.',
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
        { src: 'assets/img/project-arko-dark.jpg', label: 'Dark Mode (Arabic UI)', labelAr: 'الوضع الداكن (الواجهة العربية)' },
        { src: 'assets/img/project-arko-light.jpg', label: 'Light Mode (English UI)', labelAr: 'الوضع الفاتح (الواجهة الإنجليزية)' }
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
        { src: 'assets/img/project-rt.jpg', label: 'Production Dashboard', labelAr: 'لوحة التحكم الحية' }
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
