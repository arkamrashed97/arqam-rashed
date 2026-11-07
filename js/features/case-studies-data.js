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
      // Arabic version
      ar: {
        index: '01 / دراسة المعمارية الفنية',
        title: 'SEQUOIA TRAVEL',
        type: 'إدارة سياحية سحابية ومحرك حجوزات فوري / منصة حية',
        desc: 'بوابات تفاعلية للعملاء ولوحة تحكم متقدمة للإدارة، محرك حجوزات فوري متعدد العملات، محادثة إدارية لحظية، ومساعد ذكاء اصطناعي مرتبط بالبيانات والأسعار الحية.',
        metrics: [
          { val: '<120ms', label: 'زمن الاستجابة السحابي' },
          { val: '99.98%', label: 'نسبة التوافر والجاهزية' },
          { val: '100%', label: 'عزل الصلاحيات المحكم' }
        ],
        archTitle: 'القرارات المعمارية والهندسية',
        archText: 'معمارية سحابية كاملة تعتمد على Next.js App Router وSupabase PostgreSQL مع قواعد Row Level Security لعزل بيانات كل مستخدم بدقة متناهية. مساعد الذكاء الاصطناعي يستعلم لحظياً عن التوافر والأسعار الفعلية عبر Edge Functions لضمان موثوقية بنسبة 100% وبدون أي تخمين.',
        btnText: 'زيارة المنصة الحية ↗'
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
      link: 'https://github.com/arkamrashed97/arko-click',
      btnText: 'VIEW GITHUB REPOSITORY ↗',
      // Arabic version
      ar: {
        index: '02 / دراسة المعمارية الفنية',
        title: 'ARKO CLICK',
        type: 'أتمتة سطح المكتب لنظام Windows / مفتوح المصدر / MIT',
        desc: 'أداة أصلية خفيفة لنظام Windows توجه النقرات والإدخال إلى النوافذ الخلفية أو المخفية دون تحريك الماوس الفعلي ودون سحب التركيز من المستخدم.',
        metrics: [
          { val: '0.00%', label: 'استهلاك المعالج بالخمول' },
          { val: 'μs', label: 'دقة توقيت بالميكروثانية' },
          { val: 'SHA-256', label: 'تحقق مشفر للتحديثات' }
        ],
        archTitle: 'هندسة Win32 وجدولة المعالج',
        archText: 'توجيه الإدخال المباشر للنوافذ المستهدفة عبر دوال PostMessage وSendMessage على مستوى نظام Windows. استخدام خوارزمية Min-Heap عالية الدقة في جدولة العمليات دون أي استهلاك يُذكر للطاقة في وضع الخمول، مع نظام فحص أمني مشفر للتحديثات التلقائية.',
        btnText: 'مستودع الكود على GitHub ↗'
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
      // Arabic version
      ar: {
        index: '03 / دراسة المعمارية الفنية',
        title: 'RT SUPPLEMENTS',
        type: 'إدارة مبيعات ومخازن المكملات الغذائية / منصة إنتاجية حية',
        desc: 'نظام متكامل لإدارة المخازن، فواتير المبيعات، ومراقبة المخزون لمحلات المكملات الغذائية مع وضع تجريبي محاكي لتدريب الموظفين دون التأثير على البيانات الحقيقية.',
        metrics: [
          { val: '<50ms', label: 'استعلام الباركود' },
          { val: '100%', label: 'دقة جرد المخزون' },
          { val: 'محاكاة', label: 'بيئة تدريب معزولة' }
        ],
        archTitle: 'معمارية البيانات ومنع التعارض',
        archText: 'معالجة ذرية (Atomic Transactions) لحركات الصرف والبيع لمنع تضارب المخزون عند تسجيل المبيعات السريعة. يتضمن النظام وضع تدريب افتراضي يعزل الحركات التجريبية تماماً عن جداول الأرباح والمخازن الحقيقية.',
        btnText: 'استعراض النظام الحي ↗'
      }
    }
  ];
