// ===== KOLONNER =====
const TABELL_KOLONNER = [
    { id: 'ticker', navn: 'Ticker', fast: true, standard: true, format: 'ticker' },
    { id: 'navn', navn: 'Navn', fast: true, standard: true, format: 'tekst' },
    { id: 'sektor', navn: 'Sektor', fast: false, standard: true, format: 'tekst' },
    { id: 'kurs', navn: 'Kurs', fast: false, standard: true, format: 'kurs', tall: true },
    { id: 'pe', navn: 'P/E', fast: false, standard: true, format: 'ratio', tall: true },
    { id: 'forwardPe', navn: 'Fwd P/E', fast: false, standard: false, format: 'ratio', tall: true },
    { id: 'dividendeYield', navn: 'Dir.avk.', fast: false, standard: true, format: 'prosent', tall: true },
    { id: 'dividendePerAksje', navn: 'Utb./aksje', fast: false, standard: false, format: 'kurs', tall: true },
    { id: 'utbetalingsgrad', navn: 'Utbet.grad', fast: false, standard: false, format: 'prosent', tall: true },
    { id: 'eps', navn: 'EPS', fast: false, standard: false, format: 'kurs', tall: true },
    { id: 'roe', navn: 'ROE', fast: false, standard: true, format: 'prosent', tall: true },
    { id: 'prisPerBok', navn: 'P/B', fast: false, standard: false, format: 'ratio', tall: true },
    { id: 'beta', navn: 'Beta', fast: false, standard: false, format: 'ratio', tall: true },
    { id: 'markedsverdi', navn: 'Mrd. NOK', fast: false, standard: true, format: 'mrd', tall: true },
    { id: 'inntektsVekst', navn: 'Vekst', fast: false, standard: false, format: 'prosent', tall: true },
    { id: 'gjeldTilEk', navn: 'Gjeld/EK', fast: false, standard: false, format: 'ratio', tall: true },
    { id: 'ebitda', navn: 'EBITDA', fast: false, standard: false, format: 'mrd', tall: true },
    { id: 'prisTilSalg', navn: 'P/S', fast: false, standard: false, format: 'ratio', tall: true },
    { id: 'epsVekst', navn: 'EPS-vekst', fast: false, standard: false, format: 'prosent', tall: true },
    { id: 'peg', navn: 'PEG', fast: false, standard: false, format: 'ratio', tall: true },
];

const HURTIGFILTER = [
    { id: 'utbytte', navn: 'Utbytteaksjer', test: a => a.dividendeYield != null && a.dividendeYield > 0.03 },
    { id: 'billig', navn: 'Billige (lav P/E)', test: a => a.pe != null && a.pe > 0 && a.pe <= 15 },
    { id: 'hoeyRoe', navn: 'Høy ROE', test: a => a.roe != null && a.roe > 0.15 },
    { id: 'favoritter', navn: 'Mine favoritter', test: a => tilstand.favoritter.includes(a.ticker) },
];

// ===== TILSTAND =====
const tilstand = {
    aktivTab: 'oversikt',
    alleAksjer: ALLE_AKSJER,
    sammenligningsListe: [],
    synligeKolonner: JSON.parse(localStorage.getItem('synligeKolonner')) || TABELL_KOLONNER.filter(k => k.standard).map(k => k.id),
    favoritter: JSON.parse(localStorage.getItem('favoritter')) || [],
    lagredeFilter: JSON.parse(localStorage.getItem('lagredeFilter')) || [],
    filter: {
        sektor: '',
        soketekst: '',
        hurtigfilter: null,
        peMin: null, peMax: null,
        roeMin: null, roeMax: null,
        dividendeYieldMin: null, dividendeYieldMax: null,
        markedsverdiMin: null, markedsverdiMax: null,
    },
};
let sortering = { kolonne: 'markedsverdi', retning: 'desc' };
let filtrerteAksjer = [];

// ===== PREMIUM =====
const premiumTilstand = {
    erPremium: JSON.parse(localStorage.getItem('premiumAktiv') || 'false'),
};

function sjekkPremium() { return premiumTilstand.erPremium; }

function togglePremium() {
    premiumTilstand.erPremium = !premiumTilstand.erPremium;
    localStorage.setItem('premiumAktiv', JSON.stringify(premiumTilstand.erPremium));
    oppdaterPremiumUI();
}

function visPremiumModal() {
    const modal = document.getElementById('premium-modal');
    if (modal) modal.classList.add('aktiv');
}

function lukkPremiumModal() {
    const modal = document.getElementById('premium-modal');
    if (modal) modal.classList.remove('aktiv');
}

function oppdaterPremiumUI() {
    const toggleBtn = document.getElementById('premium-dev-toggle');
    if (toggleBtn) {
        toggleBtn.textContent = sjekkPremium() ? 'Premium: ON' : 'Premium: OFF';
        toggleBtn.classList.toggle('premium-aktiv', sjekkPremium());
    }
    document.querySelectorAll('.premium-badge').forEach(b => {
        b.style.display = sjekkPremium() ? 'none' : 'inline-flex';
    });
}

// ===== SEKTORPROFILER =====
const SEKTOR_PROFILER = {
    'Energi': {
        beskrivelse: 'olje-, gass- og energiselskap',
        forretningsmodell: 'Inntektene drives av r\u00e5varepriser, produksjonsvolum og langsiktige kontrakter.',
        makro: 'Sterk avhengighet av oljeprisen, geopolitikk og globale energimarkeder.',
        muligheter: [
            { kort: 'Energitransisjon og gr\u00f8nn posisjonering', lang: 'EUs Green Deal og globalt skifte mot fornybar energi skaper nye inntektsstr\u00f8mmer innen havvind, hydrogen og CCS. Norsk kompetanse gir konkurransefortrinn.' },
            { kort: 'H\u00f8y oljepris styrker kontantstr\u00f8m', lang: 'Oljepriser over 70 USD/fat gir sterk fri kontantstr\u00f8m som kan anvendes til utbytte, tilbakekj\u00f8p eller strategiske investeringer.' },
        ],
        trusler: [
            { kort: 'Fallende oljepris ved global nedkj\u00f8ling', lang: 'En global resesjon eller \u00f8kt OPEC-produksjon kan presse oljeprisen ned, med direkte innvirkning p\u00e5 inntjening og kontantstr\u00f8m.' },
            { kort: 'Regulatorisk press og CO2-avgifter', lang: '\u00d8kende karbonpriser og strengere klimakrav kan redusere l\u00f8nnsomheten i tradisjonell olje- og gassproduksjon over tid.' },
        ],
    },
    'Finans': {
        beskrivelse: 'bank- og finansselskap',
        forretningsmodell: 'Inntektene genereres gjennom rentemarginer, provisjoner og kapitalforvaltning.',
        makro: 'Sterkt p\u00e5virket av renteniv\u00e5, kredittap og regulatoriske kapitalkrav.',
        muligheter: [
            { kort: 'H\u00f8yere rentemarginer', lang: 'Et h\u00f8yere rentemilj\u00f8 styrker netto renteinntekter, som er hovedinntektskilden for norske banker.' },
            { kort: 'Digitalisering og kostnadseffektivisering', lang: 'Automatisering av bankprosesser og digitale kundetjenester gir potensial for lavere kostnad-til-inntekt-ratio.' },
        ],
        trusler: [
            { kort: '\u00d8kte kredittap ved lavkonjunktur', lang: 'Svakere \u00f8konomi og fallende eiendomspriser kan \u00f8ke mislighold og tapsavsetninger i utl\u00e5nsportefoljen.' },
            { kort: 'Regulatoriske kapitalkrav', lang: 'Strengere kapitalkrav fra myndigheter kan begrense utbytte og vekstkapasitet.' },
        ],
    },
    'Industri': {
        beskrivelse: 'industriselskap',
        forretningsmodell: 'Inntektene drives av ordreinngang, prosjektleveranser og industriell produksjon.',
        makro: 'Konjunkturf\u00f8lsomt med avhengighet av global industriell aktivitet og investeringssykluser.',
        muligheter: [
            { kort: 'Infrastrukturinvesteringer globalt', lang: 'Massive infrastrukturprogrammer i USA, EU og Asia \u00f8ker etterspørselen etter industrielle l\u00f8sninger og utstyr.' },
            { kort: 'Automatisering og Industry 4.0', lang: 'Digitalisering av industrielle prosesser skaper etterspørsel etter nye l\u00f8sninger og oppgraderinger.' },
        ],
        trusler: [
            { kort: 'Syklisk nedgang i ordreinngang', lang: 'Industriselskaper er eksponert mot konjunktursvingninger. Fallende investeringsvilje blant kunder kan f\u00f8re til lavere ordreb\u00f8ker.' },
            { kort: 'R\u00e5varepris- og l\u00f8nnsinflasjon', lang: 'Stigende innsatskostnader kan presse marginene dersom prisene ikke kan veltes over p\u00e5 kundene.' },
        ],
    },
    'Konsumvarer': {
        beskrivelse: 'konsumvareselskap',
        forretningsmodell: 'Inntektene drives av forbrukernes kj\u00f8pekraft, merkevarelojalitet og distribusjonsnettverk.',
        makro: 'Mer defensivt enn sykliske sektorer, men p\u00e5virkes av inflasjon og forbrukertillit.',
        muligheter: [
            { kort: 'Stabil etterspørsel i usikre tider', lang: 'Konsumvarer har defensiv karakter og opprettholder volum selv i nedgangstider, noe som gir forutsigbar inntjening.' },
            { kort: 'Vekst gjennom merkevarebygging', lang: 'Sterke merkevarers prissettingsmakt beskytter marginer og muliggj\u00f8r organisk vekst.' },
        ],
        trusler: [
            { kort: 'Inflasjon og marginspress', lang: 'Stigende r\u00e5vare- og transportkostnader kan presse marginene dersom priser ikke kan justeres tilsvarende.' },
            { kort: 'Endrede forbrukerm\u00f8nstre', lang: 'Digitalisering og bærekraftsfokus endrer kj\u00f8psm\u00f8nstre, noe som kan utfordre tradisjonelle distribusjonskanlaler.' },
        ],
    },
    'Kommunikasjon': {
        beskrivelse: 'medie- og kommunikasjonsselskap',
        forretningsmodell: 'Inntektene genereres gjennom abonnement, annonsering og tjenesteleveranser.',
        makro: 'P\u00e5virkes av annonsemarkedet, digitale trender og konkurranseintensitet.',
        muligheter: [
            { kort: 'Digital transformasjon og 5G-utrulling', lang: 'Utbygging av 5G-nettverk og \u00f8kende datatrafkk gir vekstmuligheter for telekomoperatorer og innholdsleverandorer.' },
            { kort: 'Abonnementsbasert inntektsmodell', lang: 'Gjentakende inntekter fra abonnement gir forutsigbar kontantstr\u00f8m og h\u00f8y kundelojalitet.' },
        ],
        trusler: [
            { kort: 'Fallende annonseinntekter', lang: '\u00d8konomisk usikkerhet kan redusere annonsekj\u00f8p, spesielt fra sykliske bransjer.' },
            { kort: 'Intens konkurranse fra globale akt\u00f8rer', lang: 'Store internasjonale plattformer tar markedsandeler fra norske medier og telekomselskaper.' },
        ],
    },
    'Materialer': {
        beskrivelse: 'material- og r\u00e5vareselskap',
        forretningsmodell: 'Inntektene drives av r\u00e5varepriser, produksjonsvolum og global etterspørsel.',
        makro: 'H\u00f8y eksponering mot globale r\u00e5varemarkeder, valutakurser og handelspolitikk.',
        muligheter: [
            { kort: 'Gr\u00f8nn omstilling \u00f8ker r\u00e5varebehov', lang: 'Elektrifisering, batteriproduksjon og fornybar energi krever store mengder aluminium, kobber og andre metaller.' },
            { kort: 'Stram tilbudsside st\u00f8tter prisene', lang: 'Begrenset ny kapasitet og h\u00f8ye energikostnader for konkurrenter kan holde r\u00e5vareprisene h\u00f8ye.' },
        ],
        trusler: [
            { kort: 'R\u00e5varprissyklus', lang: 'Materialselskaper er direkte eksponert mot sykliske r\u00e5varepriser. Et fall i globale priser kan dramatisk redusere marginer.' },
            { kort: 'H\u00f8ye energikostnader i produksjonen', lang: 'Kraftintensiv produksjon gj\u00f8r selskapene s\u00e5rbare for stigende energipriser, spesielt aluminium og ferrolegeringer.' },
        ],
    },
    'Teknologi': {
        beskrivelse: 'teknologiselskap',
        forretningsmodell: 'Inntektene drives av programvarelisenser, SaaS-abonnement, konsulentoppdrag og teknologil\u00f8sninger.',
        makro: 'P\u00e5virkes av digitale investeringsbudsjetter, men har generelt defensiv karakter som vekstsektor.',
        muligheter: [
            { kort: 'AI-adopsjon og digital transformasjon', lang: 'Kunstig intelligens, skymigrering og automatisering driver \u00f8kt IT-etterspørsel globalt. Norske techselskaper kan dra nytte av nisjekompetanse.' },
            { kort: 'Skaleringspotensial i SaaS-modeller', lang: 'Abonnementsbaserte programvaretjenester gir gjentakende inntekter med h\u00f8ye marginer ved skalering.' },
        ],
        trusler: [
            { kort: 'Verdsettelses-kompresjon ved renteoppgang', lang: 'Vekstaksjer er f\u00f8lsomme for h\u00f8yere renter som reduserer n\u00e5verdien av fremtidig inntjening.' },
            { kort: 'Konkurranse og kundechurn', lang: 'Rask teknologisk utvikling gj\u00f8r at markedsposisjoner kan endre seg raskt. Tap av n\u00f8kkelkunder kan p\u00e5virke inntektene betydelig.' },
        ],
    },
    'Shipping': {
        beskrivelse: 'shipping- og maritimselskap',
        forretningsmodell: 'Inntektene drives av fraktrater, utnyttelsesgrad og kontraktsstruktur (spot vs. langtid).',
        makro: 'Sterkt syklisk med avhengighet av global handel, tonnasjetilbud og geopolitikk.',
        muligheter: [
            { kort: 'Begrenset nybyggingskapasitet', lang: 'Verftene har fulle ordreb\u00f8ker, noe som begrenser ny tonnasje og st\u00f8tter fraktratene p\u00e5 mellomlang sikt.' },
            { kort: 'Gr\u00f8nn omstilling i fl\u00e5ten', lang: 'Nye milj\u00f8krav (IMO 2030/2050) favoriserer redere med moderne, energieffektive skip og tilgang p\u00e5 alternativt drivstoff.' },
        ],
        trusler: [
            { kort: 'Syklisk fall i fraktrater', lang: 'Shipping er en av de mest sykliske sektorene. Overkapasitet eller global handelssvikt kan f\u00f8re til dramatiske ratefall.' },
            { kort: 'Geopolitisk handelsforstyrrelse', lang: 'Handelsrestriksjoner, havneblokader eller endrede handelsruter kan skape usikkerhet og \u00f8ke kostnader.' },
        ],
    },
    'Sjoemat': {
        beskrivelse: 'sj\u00f8mat- og havbrukselskap',
        forretningsmodell: 'Inntektene drives av laksepriser, produksjonsvolum, konsesjoner og eksportetterspørsel.',
        makro: 'P\u00e5virkes av biologiske forhold, regulering (grunnrenteskatt) og global proteinetterspørsel.',
        muligheter: [
            { kort: 'Voksende global proteinetterspørsel', lang: 'Middelklassevekst i Asia og \u00f8kt fokus p\u00e5 b\u00e6rekraftig protein driver etterspørselen etter norsk laks. Tilbudssiden er biologisk begrenset.' },
            { kort: 'Norsk konkurransefortrinn i akvakultur', lang: 'Norske fjorder gir ideelle oppdrettsforhold. Kompetanse innen teknologi og b\u00e6rekraft gir globalt ledende posisjon.' },
        ],
        trusler: [
            { kort: 'Grunnrenteskatt og regulering', lang: 'Norsk politisk debatt om skattlegging av havbruk skaper usikkerhet om fremtidig l\u00f8nnsomhet og investeringsvilje i sektoren.' },
            { kort: 'Biologisk risiko og sykdom', lang: 'Luseangrep, algeoppblomstring og sykdomsutbrudd kan redusere produksjonsvolum og \u00f8ke kostnader betydelig.' },
        ],
    },
    'Helse': {
        beskrivelse: 'helse- og bioteknologiselskap',
        forretningsmodell: 'Inntektene drives av produktsalg, lisensavtaler, milepælsbetalinger eller klinisk utvikling.',
        makro: 'Relativt defensiv sektor med langsiktig strukturell vekst drevet av aldring og medisinsk innovasjon.',
        muligheter: [
            { kort: 'Aldrende befolkning \u00f8ker helseutgifter', lang: 'Demografiske endringer i vestlige \u00f8konomier driver \u00f8kte offentlige og private helsebudsjetter over tid.' },
            { kort: 'Medisinsk innovasjon og presisjonsmedisin', lang: 'Nye behandlingsmetoder, genteknologi og digital helse skaper muligheter for selskaper med nisjekompetanse.' },
        ],
        trusler: [
            { kort: 'Klinisk utviklingsrisiko', lang: 'Bioteknologiselskaper har h\u00f8y bin\u00e6r risiko: kliniske studier kan mislykkes, med potensielt katastrofal kurseffekt.' },
            { kort: 'Prisregulering og godkjenningsbarrierer', lang: 'Offentlige helsebudsjetter setter tak p\u00e5 legemiddelpriser. Langvarige godkjenningsprosesser forsinker kommersialisering.' },
        ],
    },
    'Eiendom': {
        beskrivelse: 'eiendomsselskap',
        forretningsmodell: 'Inntektene genereres gjennom leieinntekter, eiendomsutvikling og verdistigning i portefoljen.',
        makro: 'Direkte p\u00e5virket av renteniv\u00e5, eiendomsmarkedet og utleiegrad.',
        muligheter: [
            { kort: 'Rentekutt kan l\u00f8fte eiendomsverdier', lang: 'Lavere renter reduserer finanskostnader og \u00f8ker n\u00e5verdien av eiendomsportefoljen, noe som typisk gir kursoppgang.' },
            { kort: 'Lav nybygging styrker leiepriser', lang: 'H\u00f8ye byggekostnader og regulering begrenser nybygging, noe som st\u00f8tter leieprisvekst for eksisterende porteføljer.' },
        ],
        trusler: [
            { kort: 'H\u00f8yere renter presser yield og verdier', lang: 'Stigende renter \u00f8ker finanskostnader og presser ned eiendomsverdier gjennom h\u00f8yere avkastningskrav (cap rates).' },
            { kort: '\u00d8kt hjemmekontor reduserer kontorbehovet', lang: 'Strukturell endring i arbeidsm\u00f8nstre kan redusere etterspørselen etter kontorlokaler p\u00e5 sikt.' },
        ],
    },
    'Forsyning': {
        beskrivelse: 'forsynings- og fornybar energi-selskap',
        forretningsmodell: 'Inntektene genereres gjennom kraftproduksjon, str\u00f8msalg, nettleie eller fornybar prosjektutvikling.',
        makro: 'P\u00e5virkes av kraftpriser, v\u00e6rforhold, regulering og subsidieordninger for fornybar energi.',
        muligheter: [
            { kort: 'Global energiomstilling og subsidier', lang: 'Politiske incentiver for sol, vind og batterier gir vekstmuligheter. EUs taksonomi og IRA i USA driver kapital til gr\u00f8nn energi.' },
            { kort: 'Elektrifisering \u00f8ker str\u00f8metterspørselen', lang: 'Overgang til elbiler, varmepumper og industriell elektrifisering \u00f8ker kraftforbruket strukturelt.' },
        ],
        trusler: [
            { kort: 'Volatile kraftpriser', lang: 'Fornybarselskaper er eksponert mot kraftpriser som kan svinge kraftig med v\u00e6r, hydrologi og regulering.' },
            { kort: 'Endring i subsidier og st\u00f8tteordninger', lang: 'Politiske endringer i st\u00f8tteordninger kan redusere l\u00f8nnsomheten i nye fornybarprosjekter.' },
        ],
    },
};

const SEKTOR_PROFILER_DEFAULT = {
    beskrivelse: 'b\u00f8rsnotert selskap',
    forretningsmodell: 'Varierende forretningsmodell.',
    makro: 'P\u00e5virkes av generelle makro\u00f8konomiske forhold.',
    muligheter: [],
    trusler: [],
};

// ===== ANALYSE MOTOR =====
const SWOT_REGLER = {
    styrker: [
        { test: a => a.roe != null && a.roe > 0.2, kort: 'Eksepsjonell kapitalavkastning', lang: a => 'Egenkapitalavkastning (ROE) p\u00e5 ' + formaterTall(a.roe, 'prosent') + ' plasserer selskapet blant de mest l\u00f8nnsomme p\u00e5 Oslo B\u00f8rs. H\u00f8y ROE indikerer at ledelsen skaper betydelig merverdi per investert krone.' },
        { test: a => a.roe != null && a.roe > 0.12 && a.roe <= 0.2, kort: 'God kapitalavkastning', lang: a => 'ROE p\u00e5 ' + formaterTall(a.roe, 'prosent') + ' viser at selskapet genererer tilfredsstillende avkastning p\u00e5 egenkapitalen \u2014 over det de fleste investorer krever som minimumskrav.' },
        { test: a => a.bruttoMargin != null && a.bruttoMargin > 0.5, kort: 'H\u00f8y bruttomargin', lang: a => 'Bruttomargin p\u00e5 ' + formaterTall(a.bruttoMargin, 'prosent') + ' gir sterk prissettingsmakt og god buffer mot kostnads\u00f8kninger. Selskaper med marginer over 50% har typisk varige konkurransefortrinn.' },
        { test: a => a.bruttoMargin != null && a.bruttoMargin > 0.3 && a.bruttoMargin <= 0.5, kort: 'Solid bruttomargin', lang: a => 'Bruttomargin p\u00e5 ' + formaterTall(a.bruttoMargin, 'prosent') + ' indikerer en sunn kostnadsstruktur og akseptabel prissettingsevne i markedet.' },
        { test: a => a.epsVekst != null && a.epsVekst > 0.15, kort: 'Sterk inntjeningsvekst', lang: a => 'EPS-vekst p\u00e5 ' + formaterTall(a.epsVekst, 'prosent') + ' viser at fortjenesten per aksje vokser raskt. Akselererende inntjening er en av de sterkeste driverne for kursstigelse.' },
        { test: a => a.gjeldTilEk != null && a.gjeldTilEk < 0.3, kort: 'Sv\u00e6rt lav gjeld', lang: a => 'Gjeld/EK p\u00e5 kun ' + formaterTall(a.gjeldTilEk, 'ratio') + ' gir selskapet ekstraordin\u00e6r finansiell fleksibilitet. Lav gjeld reduserer konkursrisiko og gir handlefrihet i nedgangstider.' },
        { test: a => a.gjeldTilEk != null && a.gjeldTilEk >= 0.3 && a.gjeldTilEk < 0.7, kort: 'Sunn balanse', lang: a => 'Moderat gjeldsgrad (' + formaterTall(a.gjeldTilEk, 'ratio') + ') balanserer finansiell risiko med kapitaleffektivitet. Selskapet har tilstrekkelig finansiell buffer.' },
        { test: a => a.friKontantstroem != null && a.markedsverdi != null && a.markedsverdi > 0 && a.friKontantstroem / a.markedsverdi > 0.08, kort: 'Sterk kontantgenerering', lang: a => 'Fri kontantstr\u00f8m-yield p\u00e5 ' + formaterTall(a.friKontantstroem / a.markedsverdi, 'prosent') + ' er h\u00f8y. Sterk kontantgenerering er grunnlaget for b\u00e6rekraftig utbytte, gjeldsnedbygging og strategiske investeringer.' },
        { test: a => a.markedsverdi != null && a.markedsverdi > 50e9, kort: 'Stor, likvid markedsposisjon', lang: a => 'Med markedsverdi p\u00e5 ' + formaterTall(a.markedsverdi, 'mrd') + ' er dette blant de st\u00f8rste selskapene p\u00e5 Oslo B\u00f8rs. Stor markedsverdi gir h\u00f8y likviditet, lave spreads og bredt analytiker-dekke.' },
        { test: a => a.dividendeYield != null && a.dividendeYield > 0.04 && a.utbetalingsgrad != null && a.utbetalingsgrad < 0.7, kort: 'B\u00e6rekraftig h\u00f8yt utbytte', lang: a => 'Direkteavkastning p\u00e5 ' + formaterTall(a.dividendeYield, 'prosent') + ' med utbetalingsgrad p\u00e5 ' + formaterTall(a.utbetalingsgrad, 'prosent') + '. Kombinasjonen av h\u00f8y yield og moderat utbetalingsgrad tyder p\u00e5 at utbyttet er b\u00e6rekraftig og kan vokse.' },
        { test: a => a.inntektsVekst != null && a.inntektsVekst > 0.15, kort: 'Sterk omsetningsvekst', lang: a => 'Inntektsvekst p\u00e5 ' + formaterTall(a.inntektsVekst, 'prosent') + ' indikerer at selskapet tar markedsandeler eller ekspanderer inn i nye segmenter. Vedvarende topplinje-vekst er fundamentet for langsiktig verdiskaping.' },
        { test: a => a.beta != null && a.beta < 0.8, kort: 'Lav markedsrisiko', lang: a => 'Beta p\u00e5 ' + formaterTall(a.beta, 'ratio') + ' betyr at aksjen svinger mindre enn markedet. Lav beta gir portefoljebeskyttelse i volatile markeder og passer defensive investorer.' },
        { test: a => a.pe != null && a.pe > 0 && a.pe < 12 && a.roe != null && a.roe > 0.08, kort: 'Attraktiv verdsettelse', lang: a => 'P/E p\u00e5 ' + formaterTall(a.pe, 'ratio') + ' kombinert med positiv l\u00f8nnsomhet (ROE ' + formaterTall(a.roe, 'prosent') + ') gir et verdicase. Aksjen prises lavt relativt til inntjeningen.' },
        { test: a => a.prisTilSalg != null && a.prisTilSalg < 1.0, kort: 'Lav P/S-multippel', lang: a => 'Pris/salg p\u00e5 ' + formaterTall(a.prisTilSalg, 'ratio') + ' indikerer at aksjen prises til under \u00e9n gang omsetningen. Dette kan representere en undervurdering, s\u00e6rlig dersom marginene forbedres.' },
    ],
    svakheter: [
        { test: a => a.pe != null && a.pe > 35, kort: 'H\u00f8y verdsettelse relativt til inntjening', lang: a => 'P/E p\u00e5 ' + formaterTall(a.pe, 'ratio') + ' priser inn vesentlige vekstforventninger. H\u00f8y multippel gir begrenset oppsidepotensial og \u00f8kt nedsiderisiko ved resultatskuffelser.' },
        { test: a => a.prisTilSalg != null && a.prisTilSalg > 8, kort: 'H\u00f8y P/S indikerer ambisi\u00f8s prising', lang: a => 'Pris/salg p\u00e5 ' + formaterTall(a.prisTilSalg, 'ratio') + ' er h\u00f8yt. Aksjen prises til mange ganger omsetningen, noe som krever eksepsjonell vekst for \u00e5 rettferdiggj\u00f8res.' },
        { test: a => a.gjeldTilEk != null && a.gjeldTilEk > 2, kort: 'H\u00f8y gjeldsbelastning', lang: a => 'Gjeld/EK p\u00e5 ' + formaterTall(a.gjeldTilEk, 'ratio') + ' inneb\u00e6rer h\u00f8y finansiell risiko. Renteendringer f\u00e5r forsterket effekt p\u00e5 bunnlinjen, og selskapet har begrenset handlefrihet i nedgangstider.' },
        { test: a => a.friKontantstroem != null && a.friKontantstroem < 0, kort: 'Negativ fri kontantstr\u00f8m', lang: () => 'Selskapet brenner kontanter. Negativ FCF betyr at driften ikke genererer nok kapital til \u00e5 finansiere investeringer, noe som kan n\u00f8dvendiggj\u00f8re emisjoner eller \u00f8kt gjeld.' },
        { test: a => a.beta != null && a.beta > 1.5, kort: 'H\u00f8y kursvolatilitet', lang: a => 'Beta p\u00e5 ' + formaterTall(a.beta, 'ratio') + ' betyr at aksjen svinger vesentlig mer enn markedet. I en bred korreksjon kan denne aksjen falle betydelig mer enn indeksen.' },
        { test: a => a.roe != null && a.roe < 0.05 && a.roe >= 0, kort: 'Svak kapitalavkastning', lang: a => 'ROE p\u00e5 ' + formaterTall(a.roe, 'prosent') + ' er under de fleste investorers minstekrav. Selskapet sliter med \u00e5 generere tilfredsstillende avkastning p\u00e5 investert kapital.' },
        { test: a => a.roe != null && a.roe < 0, kort: 'Negativ l\u00f8nnsomhet', lang: a => 'Negativ ROE (' + formaterTall(a.roe, 'prosent') + ') betyr at selskapet t\u00e6rer p\u00e5 egenkapitalen. Vedvarende tap reiser sp\u00f8rsm\u00e5l om langsiktig overlevelsesevne.' },
        { test: a => a.inntektsVekst != null && a.inntektsVekst < -0.05, kort: 'Fallende topplinje', lang: a => 'Inntektsvekst p\u00e5 ' + formaterTall(a.inntektsVekst, 'prosent') + ' viser at selskapet mister omsetning. Fallende inntekter kan indikere tap av markedsandeler eller strukturell nedgang i markedet.' },
        { test: a => a.epsVekst != null && a.epsVekst < -0.1, kort: 'Fallende inntjening', lang: a => 'EPS-vekst p\u00e5 ' + formaterTall(a.epsVekst, 'prosent') + ' viser forverret l\u00f8nnsomhet. Vedvarende nedgang i fortjeneste per aksje er et r\u00f8dt flagg for investorer.' },
        { test: a => a.utbetalingsgrad != null && a.utbetalingsgrad > 0.9, kort: 'Ikke-b\u00e6rekraftig utbetalingsgrad', lang: a => 'Med utbetalingsgrad p\u00e5 ' + formaterTall(a.utbetalingsgrad, 'prosent') + ' betaler selskapet ut nesten alt overskudd som utbytte. Dette gir lite rom for reinvestering og gj\u00f8r utbyttet s\u00e5rbart for inntjeningsfall.' },
        { test: a => a.bruttoMargin != null && a.bruttoMargin < 0.15, kort: 'Tynn margin gir liten buffer', lang: a => 'Bruttomargin p\u00e5 ' + formaterTall(a.bruttoMargin, 'prosent') + ' er lav. Sm\u00e5 endringer i kostnader eller priser kan ha dramatisk effekt p\u00e5 bunnlinjen.' },
        { test: a => a.markedsverdi != null && a.markedsverdi < 500e6, kort: 'Micro-cap med lav likviditet', lang: () => 'Sv\u00e6rt lav markedsverdi medf\u00f8rer lav handelsvolum og h\u00f8ye spreads. Vanskelig \u00e5 bygge eller selge posisjoner uten \u00e5 p\u00e5virke kursen.' },
    ],
    muligheter: [
        { test: a => a.forwardPe != null && a.pe != null && a.pe > 0 && a.forwardPe < a.pe * 0.8, kort: 'Forventet resultatforbedring', lang: a => 'Forward P/E (' + formaterTall(a.forwardPe, 'ratio') + ') er vesentlig lavere enn trailing P/E (' + formaterTall(a.pe, 'ratio') + '). Analytikerne forventer \u00f8kt inntjening, noe som kan trigge en positiv reprising av aksjen.' },
        { test: a => a.friKontantstroem != null && a.markedsverdi != null && a.markedsverdi > 0 && a.friKontantstroem / a.markedsverdi > 0.08, kort: 'H\u00f8y fri kontantstr\u00f8m-yield', lang: a => 'FCF-yield p\u00e5 ' + formaterTall(a.friKontantstroem / a.markedsverdi, 'prosent') + ' gir kapital til aksjon\u00e6rvennlige tiltak som tilbakekj\u00f8p, \u00f8kt utbytte eller gjeldsnedbygging \u2014 alle verdiskapende kataylsatorer.' },
        { test: a => a.inntektsVekst != null && a.inntektsVekst > 0.1, kort: 'Sterk vekstbane', lang: a => 'Omsetningsvekst p\u00e5 ' + formaterTall(a.inntektsVekst, 'prosent') + ' indikerer at selskapet tar markedsandeler eller ekspanderer. Vedvarende topplinje-vekst er en sterk driver for multippelekspansjon.' },
        { test: a => a.markedsverdi != null && a.markedsverdi < 5e9 && a.roe != null && a.roe > 0.1, kort: 'Oppkj\u00f8pskandidat', lang: () => 'Sm\u00e5, l\u00f8nnsomme selskaper p\u00e5 Oslo B\u00f8rs er attraktive oppkj\u00f8psm\u00e5l for nordiske PE-fond og internasjonale industriakt\u00f8rer. Premien ved oppkj\u00f8p har historisk ligget p\u00e5 20\u201340% over markedskurs.' },
        { test: a => a.gjeldTilEk != null && a.gjeldTilEk < 0.5 && a.inntektsVekst != null && a.inntektsVekst > 0, kort: 'Finansiell handlefrihet for vekst', lang: () => 'Lav gjeldsgrad kombinert med positiv vekst gir mulighet til \u00e5 akselerere gjennom oppkj\u00f8p eller organisk ekspansjon uten \u00e5 belaste balansen.' },
        { test: a => a.anbefaling === 'buy' || a.anbefaling === 'strong_buy', kort: 'Positiv analytikerkonsensus', lang: () => 'Flertallet av analytikerne anbefaler kj\u00f8p. Positiv konsensus kan tiltrekke institusjonell kapital og st\u00f8tte kursen p\u00e5 kort til mellomlang sikt.' },
        { test: a => a.femtiToUkerHoey != null && a.femtiToUkerLav != null && a.kurs != null && a.femtiToUkerHoey > a.femtiToUkerLav && (a.kurs - a.femtiToUkerLav) / (a.femtiToUkerHoey - a.femtiToUkerLav) < 0.3, kort: 'N\u00e6r 52-ukers bunn', lang: a => 'Aksjen handles n\u00e6r 52-ukers lav (' + formaterTall(a.femtiToUkerLav, 'kurs') + ' NOK). Dersom de underliggende fundamentalene er intakte, kan dette representere en attraktiv inngangsverdi.' },
        { test: a => a.epsVekst != null && a.epsVekst > 0.1 && a.pe != null && a.pe < 20, kort: 'Vekst til rimelig pris', lang: a => 'EPS-vekst p\u00e5 ' + formaterTall(a.epsVekst, 'prosent') + ' med moderat P/E (' + formaterTall(a.pe, 'ratio') + ') gir et GARP-case (Growth at Reasonable Price). Markedet priser ikke inn vekstpotensialet fullt ut.' },
    ],
    trusler: [
        { test: a => a.beta != null && a.beta > 1.3, kort: 'Forsterket markedsrisiko', lang: a => 'Med beta p\u00e5 ' + formaterTall(a.beta, 'ratio') + ' vil aksjen typisk falle mer enn markedet i nedgangstider. I perioder med \u00f8kt geopolitisk usikkerhet eller renteuro kan kurssvingningene bli betydelige.' },
        { test: a => a.gjeldTilEk != null && a.gjeldTilEk > 1.5, kort: 'Refinansieringsrisiko', lang: a => 'Gjeld/EK p\u00e5 ' + formaterTall(a.gjeldTilEk, 'ratio') + ' gj\u00f8r selskapet s\u00e5rbart for endringer i sentralbankenes rentebane. Refinansiering av gjeld ved forfall kan bli vesentlig dyrere.' },
        { test: a => a.pe != null && a.pe > 40, kort: 'Verdsettelsesrisiko', lang: a => 'P/E p\u00e5 ' + formaterTall(a.pe, 'ratio') + ' priser inn sv\u00e6rt h\u00f8ye vekstforventninger. Selv sm\u00e5 skuffelser i kvartalstall kan utl\u00f8se kraftig kursnedgang. Historisk har aksjer med P/E over 40 hatt h\u00f8yere nedsiderisiko.' },
        { test: a => a.markedsverdi != null && a.markedsverdi < 1e9, kort: 'Likviditetsrisiko', lang: () => 'Sm\u00e5 selskaper p\u00e5 Oslo B\u00f8rs har ofte lav handelsvolum. Store posisjoner kan v\u00e6re vanskelige \u00e5 avhende uten vesentlig kursp\u00e5virkning.' },
        { test: a => a.bruttoMargin != null && a.bruttoMargin < 0.2, kort: 'Marginspress', lang: a => 'Bruttomargin p\u00e5 ' + formaterTall(a.bruttoMargin, 'prosent') + ' gir liten buffer. R\u00e5varepris\u00f8kninger, l\u00f8nnsvekst eller fraktkostnader kan raskt erodere l\u00f8nnsomheten.' },
        { test: a => a.epsVekst != null && a.epsVekst < -0.1, kort: 'Negativ inntjeningstrend', lang: a => 'EPS-vekst p\u00e5 ' + formaterTall(a.epsVekst, 'prosent') + ' viser at fortjenesten per aksje faller. Vedvarende nedgang i l\u00f8nnsomhet kan signalisere strukturelle problemer.' },
        { test: a => a.anbefaling === 'sell' || a.anbefaling === 'underperform', kort: 'Negativ analytikerkonsensus', lang: () => 'Analytikerne anbefaler salg eller underperform. Negativ konsensus kan f\u00f8re til institusjonelt salgspress og begrenset kursoppside p\u00e5 kort sikt.' },
        { test: a => a.femtiToUkerHoey != null && a.femtiToUkerLav != null && a.kurs != null && a.femtiToUkerHoey > a.femtiToUkerLav && (a.kurs - a.femtiToUkerLav) / (a.femtiToUkerHoey - a.femtiToUkerLav) > 0.9, kort: 'N\u00e6r 52-ukers topp', lang: () => 'Aksjen handles n\u00e6r 52-ukers h\u00f8y. Teknisk motstand og profitttaking kan begrense videre oppside p\u00e5 kort sikt.' },
    ],
};

function genererSWOT(aksje, detaljert) {
    const swot = { styrker: [], svakheter: [], muligheter: [], trusler: [] };
    const profil = SEKTOR_PROFILER[aksje.sektor] || SEKTOR_PROFILER_DEFAULT;
    ['styrker', 'svakheter', 'muligheter', 'trusler'].forEach(kat => {
        SWOT_REGLER[kat].forEach(r => {
            if (r.test(aksje)) {
                swot[kat].push({ kort: r.kort, lang: detaljert ? (typeof r.lang === 'function' ? r.lang(aksje) : r.lang) : null });
            }
        });
        // Injiser sektorspesifikke muligheter/trusler
        if (kat === 'muligheter' && profil.muligheter) {
            profil.muligheter.forEach(m => {
                swot.muligheter.push({ kort: m.kort, lang: detaljert ? m.lang : null });
            });
        }
        if (kat === 'trusler' && profil.trusler) {
            profil.trusler.forEach(t => {
                swot.trusler.push({ kort: t.kort, lang: detaljert ? t.lang : null });
            });
        }
        if (swot[kat].length === 0) {
            const fallbacks = { styrker: 'Etablert akt\u00f8r p\u00e5 Oslo B\u00f8rs', svakheter: 'Begrenset datagrunnlag for full vurdering', muligheter: 'Generell markedsvekst kan l\u00f8fte aksjen', trusler: 'Makro\u00f8konomisk usikkerhet' };
            swot[kat].push({ kort: fallbacks[kat], lang: detaljert ? fallbacks[kat] + '.' : null });
        }
    });
    return swot;
}

// ===== SELSKAPSPROFIL =====
function genererSelskapsprofil(aksje) {
    const profil = SEKTOR_PROFILER[aksje.sektor] || SEKTOR_PROFILER_DEFAULT;

    let klassifisering, klasseNavn;
    if (aksje.dividendeYield != null && aksje.dividendeYield > 0.04 && aksje.utbetalingsgrad != null && aksje.utbetalingsgrad < 0.8) {
        klassifisering = 'utbytteaksje'; klasseNavn = 'Utbytteaksje';
    } else if ((aksje.inntektsVekst != null && aksje.inntektsVekst > 0.15) || (aksje.pe != null && aksje.pe > 25 && aksje.epsVekst != null && aksje.epsVekst > 0.1)) {
        klassifisering = 'vekstaksje'; klasseNavn = 'Vekstaksje';
    } else if (aksje.pe != null && aksje.pe > 0 && aksje.pe < 15 && aksje.roe != null && aksje.roe > 0.08) {
        klassifisering = 'verdiaksje'; klasseNavn = 'Verdiaksje';
    } else if ((aksje.epsVekst != null && aksje.epsVekst < -0.2) || (aksje.eps != null && aksje.eps < 0)) {
        klassifisering = 'turnaround'; klasseNavn = 'Turnaround-case';
    } else {
        klassifisering = 'balansert'; klasseNavn = 'Balansert aksje';
    }

    let stoerrelse;
    if (aksje.markedsverdi != null && aksje.markedsverdi > 50e9) stoerrelse = 'large-cap';
    else if (aksje.markedsverdi != null && aksje.markedsverdi > 5e9) stoerrelse = 'mid-cap';
    else stoerrelse = 'small-cap';

    const stoerrelseNavn = { 'large-cap': 'et stort, etablert', 'mid-cap': 'et mellomstort', 'small-cap': 'et mindre' };

    let tekst = aksje.navn + ' er ' + stoerrelseNavn[stoerrelse] + ' norsk ' + profil.beskrivelse +
        ' notert p\u00e5 Oslo B\u00f8rs. ' + profil.forretningsmodell;

    if (aksje.markedsverdi) {
        tekst += ' Selskapet har en markedsverdi p\u00e5 ' + formaterTall(aksje.markedsverdi, 'mrd') + '.';
    }

    tekst += ' ' + profil.makro;

    return { tekst, klassifisering, klasseNavn, stoerrelse };
}

// ===== MARKEDSFASE =====
function beregnMarkedsfase(aksje) {
    const harData = aksje.femtiToUkerHoey != null && aksje.femtiToUkerLav != null && aksje.kurs != null;
    if (!harData) return { fase: 'ukjent', posisjon: null, tekst: 'Utilstrekkelig data for \u00e5 vurdere markedsfase.' };

    const range52 = aksje.femtiToUkerHoey - aksje.femtiToUkerLav;
    const posisjon = range52 > 0 ? (aksje.kurs - aksje.femtiToUkerLav) / range52 : 0.5;
    const overFemtiDag = aksje.femtiDagersSnitt != null && aksje.kurs > aksje.femtiDagersSnitt;
    const overToHundre = aksje.toHundreDagersSnitt != null && aksje.kurs > aksje.toHundreDagersSnitt;

    let fase, tekst;
    if (posisjon > 0.8 && overFemtiDag && overToHundre) {
        fase = 'opptrend';
        tekst = 'Aksjen er i en etablert opptrend og handles n\u00e6r 52-ukers h\u00f8y (' + formaterTall(aksje.femtiToUkerHoey, 'kurs') + ' NOK). Kursen ligger over b\u00e5de 50- og 200-dagers glidende gjennomsnitt, noe som bekrefter positiv momentum.';
    } else if (posisjon < 0.2 && !overFemtiDag && !overToHundre) {
        fase = 'bunn';
        tekst = 'Aksjen handles n\u00e6r 52-ukers bunn (' + formaterTall(aksje.femtiToUkerLav, 'kurs') + ' NOK) og ligger under b\u00e5de 50- og 200-dagers gjennomsnitt. Teknisk bilde er svakt, men kan representere en inngangsverdi for langsiktige investorer dersom fundamentalene er intakte.';
    } else if (!overFemtiDag && !overToHundre && posisjon < 0.5) {
        fase = 'nedtrend';
        tekst = 'Aksjen er i en nedadg\u00e5ende trend, under b\u00e5de kortsiktig og langsiktig glidende gjennomsnitt. 52-ukers lav er ' + formaterTall(aksje.femtiToUkerLav, 'kurs') + ' NOK. Det anbefales \u00e5 vente p\u00e5 tegn til stabilisering f\u00f8r inngang.';
    } else if (overFemtiDag && !overToHundre) {
        fase = 'tidlig_oppgang';
        tekst = 'Aksjen viser tegn til bedring og har krysset over 50-dagers gjennomsnitt, men ligger fortsatt under 200-dagers snitt. Dette kan indikere en tidlig trendvending, men det er for tidlig \u00e5 bekrefte varig oppgang.';
    } else {
        fase = 'konsolidering';
        tekst = 'Aksjen konsoliderer i midten av 52-ukers range (lav: ' + formaterTall(aksje.femtiToUkerLav, 'kurs') + ', h\u00f8y: ' + formaterTall(aksje.femtiToUkerHoey, 'kurs') + ' NOK). Markedet avventer katalysatorer for neste retningsbestemt bevegelse.';
    }

    return { fase, posisjon, overFemtiDag, overToHundre, tekst };
}

// ===== HVORFOR VURDERE N\u00c5? =====
function genererHvorforNaa(aksje, markedsfase) {
    const argumenter = [];

    if (aksje.forwardPe != null && aksje.pe != null && aksje.pe > 0 && aksje.forwardPe < aksje.pe * 0.85) {
        argumenter.push({ tittel: 'Forventet resultatforbedring', tekst: 'Forward P/E (' + formaterTall(aksje.forwardPe, 'ratio') + ') er betydelig lavere enn trailing P/E (' + formaterTall(aksje.pe, 'ratio') + '). Analytikerne ser bedring i inntjeningen, noe som kan trigge positiv reprising.' });
    }
    if (aksje.friKontantstroem != null && aksje.markedsverdi != null && aksje.markedsverdi > 0 && aksje.friKontantstroem / aksje.markedsverdi > 0.06) {
        argumenter.push({ tittel: 'Attraktiv fri kontantstr\u00f8m', tekst: 'FCF-yield p\u00e5 ' + formaterTall(aksje.friKontantstroem / aksje.markedsverdi, 'prosent') + ' er over markedssnittet. Sterk kontantgenerering gir kapasitet til utbytte\u00f8kninger, tilbakekj\u00f8p eller verdi\u00f8kende oppkj\u00f8p.' });
    }
    if (markedsfase.posisjon != null && markedsfase.posisjon < 0.3) {
        argumenter.push({ tittel: 'N\u00e6r 52-ukers bunn', tekst: 'Aksjen handles i nedre del av 52-ukers range. Dersom de underliggende fundamentalene er intakte, kan n\u00e5v\u00e6rende prisniv\u00e5 representere en attraktiv inngangsverdi med asymmetrisk risiko/avkastning.' });
    }
    if (aksje.dividendeYield != null && aksje.dividendeYield > 0.04 && aksje.utbetalingsgrad != null && aksje.utbetalingsgrad < 0.7) {
        argumenter.push({ tittel: 'B\u00e6rekraftig h\u00f8yt utbytte', tekst: 'Direkteavkastning p\u00e5 ' + formaterTall(aksje.dividendeYield, 'prosent') + ' med moderat utbetalingsgrad (' + formaterTall(aksje.utbetalingsgrad, 'prosent') + '). Utbyttet fremst\u00e5r b\u00e6rekraftig med rom for fremtidige \u00f8kninger.' });
    }
    if (aksje.anbefaling === 'buy' || aksje.anbefaling === 'strong_buy') {
        argumenter.push({ tittel: 'Positiv analytikerkonsensus', tekst: 'Analytikerkonsensus er kj\u00f8p, noe som kan tiltrekke institusjonell kapital og st\u00f8tte kursen.' });
    }
    if (aksje.epsVekst != null && aksje.epsVekst > 0.1) {
        argumenter.push({ tittel: 'Sterk inntjeningsvekst', tekst: 'EPS-vekst p\u00e5 ' + formaterTall(aksje.epsVekst, 'prosent') + ' viser at selskapet \u00f8ker l\u00f8nnsomheten. Akselererende inntjening er en av de sterkeste driverne for kursstigelse.' });
    }
    if (aksje.pe != null && aksje.pe > 0 && aksje.pe < 12 && aksje.roe != null && aksje.roe > 0.1) {
        argumenter.push({ tittel: 'Undervurdert kvalitetsselskap', tekst: 'Lav P/E (' + formaterTall(aksje.pe, 'ratio') + ') kombinert med solid ROE (' + formaterTall(aksje.roe, 'prosent') + ') gir et verdicase. Markedet kan undervurdere selskapets inntjeningskraft.' });
    }
    if (markedsfase.fase === 'tidlig_oppgang') {
        argumenter.push({ tittel: 'Mulig trendvending', tekst: 'Aksjen har krysset over 50-dagers glidende gjennomsnitt, noe som kan signalisere en tidlig trendvending. Historisk har slike kryss ofte varslet en lengre oppgangsperiode.' });
    }

    if (argumenter.length === 0) {
        argumenter.push({ tittel: 'Ingen sterke katalysatorer identifisert', tekst: 'Basert p\u00e5 tilgjengelige data er det ingen tydelige kortsiktige triggere for aksjen. Langsiktige investorer b\u00f8r vurdere fundamentalene og sektortrender.' });
    }

    return argumenter.slice(0, 5);
}

// ===== INVESTORVURDERING =====
function genererInvestorVurdering(aksje) {
    let type, risiko;
    if (aksje.dividendeYield > 0.05 && aksje.roe > 0.12) type = 'Denne aksjen passer best for utbytteinvestorer som s\u00f8ker stabil inntekt kombinert med moderat vekst.';
    else if (aksje.inntektsVekst > 0.15 && aksje.pe > 20) type = 'Denne aksjen egner seg for vekstinvestorer med h\u00f8y risikotoleranse og lang tidshorisont.';
    else if (aksje.pe != null && aksje.pe > 0 && aksje.pe < 15 && aksje.roe > 0.1) type = 'Denne aksjen passer verdiinvestorer som s\u00f8ker undervurderte kvalitetsselskaper med solid fundament.';
    else if (aksje.eps != null && aksje.eps < 0) type = 'Denne aksjen er en spekulativ posisjon og passer investorer med h\u00f8y risikotoleranse som ser et turnaround-potensial.';
    else type = 'Denne aksjen egner seg for balanserte investorer med moderat risikotoleranse.';

    if (aksje.beta > 1.5 || (aksje.gjeldTilEk != null && aksje.gjeldTilEk > 2)) risiko = ' Risikoprofilen er h\u00f8y grunnet volatilitet og/eller gjeldsbelastning. Posisjonering b\u00f8r dimensjoneres deretter.';
    else if (aksje.beta > 1.2) risiko = ' Risikoprofilen er moderat. Aksjen krever aktiv overv\u00e5king og posisjonering tilpasset portefoljen.';
    else risiko = ' Risikoprofilen er akseptabel for langsiktige investorer med diversifisert portefolje.';
    return type + risiko;
}

// ===== FULL ANALYSE =====
function genererFullAnalyse(aksje) {
    const profil = genererSelskapsprofil(aksje);
    const swot = genererSWOT(aksje, true);
    const markedsfase = beregnMarkedsfase(aksje);
    const hvorforNaa = genererHvorforNaa(aksje, markedsfase);
    const investortype = genererInvestorVurdering(aksje);
    return { profil, styrker: swot.styrker, svakheter: swot.svakheter, muligheter: swot.muligheter, trusler: swot.trusler, markedsfase, hvorforNaa, investortype };
}

function visSWOTModal(ticker) {
    const aksje = tilstand.alleAksjer.find(a => a.ticker === ticker);
    if (!aksje) return;
    if (!sjekkPremium()) { visPremiumModal(); return; }
    const analyse = genererFullAnalyse(aksje);
    const faseNavn = { opptrend: 'Opptrend', bunn: 'Nær bunn', nedtrend: 'Nedtrend', tidlig_oppgang: 'Tidlig oppgang', konsolidering: 'Konsolidering', ukjent: 'Ukjent' };
    const kvadranter = [
        { kat: 'styrker', klasse: 'styrker', tittel: 'Styrker' },
        { kat: 'svakheter', klasse: 'svakheter', tittel: 'Svakheter' },
        { kat: 'muligheter', klasse: 'muligheter', tittel: 'Muligheter' },
        { kat: 'trusler', klasse: 'trusler', tittel: 'Trusler' },
    ];
    let html = '<div class="modal-overlay aktiv" id="swot-modal" onclick="if(event.target.id===\'swot-modal\')lukkSWOTModal()">' +
        '<div class="modal swot-modal-innhold" onclick="event.stopPropagation()">' +
        '<button class="modal-lukk" onclick="lukkSWOTModal()">&times;</button>' +
        '<h2>Analyse: ' + aksje.navn + '</h2>' +
        '<p class="modal-beskrivelse">' + aksje.ticker.replace('.OL','') + ' \u2022 ' + aksje.sektor + ' \u2022 ' + formaterTall(aksje.kurs, 'kurs') + ' NOK' +
        ' \u2022 <span class="analyse-klassifisering ' + analyse.profil.klassifisering + '">' + analyse.profil.klasseNavn + '</span></p>';
    // Selskapsprofil
    html += '<div class="analyse-profil"><p>' + analyse.profil.tekst + '</p></div>';
    // SWOT-grid
    html += '<div class="swot-grid">';
    kvadranter.forEach(k => {
        html += '<div class="swot-kvadrant ' + k.klasse + '"><h4>' + k.tittel + '</h4><ul class="swot-liste">';
        analyse[k.kat].forEach(p => {
            html += '<li><strong>' + p.kort + '</strong>' + (p.lang ? '<br><span class="swot-detalj">' + p.lang + '</span>' : '') + '</li>';
        });
        html += '</ul></div>';
    });
    html += '</div>';
    // Markedsfase
    html += '<div class="analyse-seksjon analyse-markedsfase"><h4>Markedsfase</h4>' +
        '<div class="analyse-fase-header"><span class="analyse-fase-tag ' + analyse.markedsfase.fase + '">' + (faseNavn[analyse.markedsfase.fase] || 'Ukjent') + '</span>';
    if (analyse.markedsfase.posisjon != null) {
        html += '<div class="analyse-fase-indikator"><div class="analyse-fase-bar"><div class="analyse-fase-markør" style="left:' + (analyse.markedsfase.posisjon * 100) + '%"></div></div>' +
            '<div class="analyse-fase-etiketter"><span>52-ukers lav</span><span>52-ukers høy</span></div></div>';
    }
    html += '</div><p>' + analyse.markedsfase.tekst + '</p></div>';
    // Hvorfor vurdere nå?
    html += '<div class="analyse-seksjon analyse-hvorfor-naa"><h4>Hvorfor vurdere aksjen nå?</h4><div class="analyse-argumenter">';
    analyse.hvorforNaa.forEach((arg, i) => {
        html += '<div class="analyse-argument"><div class="analyse-argument-nummer">' + (i + 1) + '</div><div><strong>' + arg.tittel + '</strong><p>' + arg.tekst + '</p></div></div>';
    });
    html += '</div></div>';
    // Investorvurdering
    html += '<div class="swot-investor-vurdering"><h5>Investorvurdering</h5><p>' + analyse.investortype + '</p></div>';
    html += '</div></div>';
    const existing = document.getElementById('swot-modal');
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', html);
}

function lukkSWOTModal() {
    const m = document.getElementById('swot-modal');
    if (m) m.remove();
}

// ===== HJELPEFUNKSJONER =====
function formaterTall(verdi, type) {
    if (verdi === null || verdi === undefined) return '\u2014';
    const formatter = new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 2 });
    switch (type) {
        case 'kurs':
            return new Intl.NumberFormat('nb-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(verdi);
        case 'prosent':
            return (verdi * 100).toFixed(1) + '%';
        case 'ratio':
            return formatter.format(verdi);
        case 'mrd':
            if (verdi >= 1e9) return formatter.format(verdi / 1e9) + ' mrd';
            if (verdi >= 1e6) return formatter.format(verdi / 1e6) + ' mill';
            return formatter.format(verdi);
        case 'tekst':
            return verdi || '\u2014';
        case 'score':
            return verdi.toFixed(1);
        default:
            return formatter.format(verdi);
    }
}

function formaterKolonneVerdi(aksje, kolonne) {
    const def = TABELL_KOLONNER.find(k => k.id === kolonne);
    if (!def) return '\u2014';
    if (kolonne === 'ticker') {
        const erFav = tilstand.favoritter.includes(aksje.ticker);
        return '<button class="favoritt-knapp ' + (erFav ? 'favoritt-aktiv' : '') +
            '" onclick="event.stopPropagation();toggleFavoritt(\'' + aksje.ticker + '\')">' +
            (erFav ? '\u2605' : '\u2606') + '</button><strong>' + aksje.ticker.replace('.OL', '') + '</strong>';
    }
    if (kolonne === 'sektor') return '<span style="color:var(--text-secondary)">' + (aksje.sektor || '\u2014') + '</span>';
    const verdi = aksje[kolonne];
    return formaterTall(verdi, def.format);
}

// ===== NAVIGASJON =====
function byttTab(tabNavn) {
    tilstand.aktivTab = tabNavn;
    document.querySelectorAll('.visning').forEach(v => v.classList.remove('aktiv'));
    document.querySelectorAll('.tab-knapp').forEach(k => k.classList.remove('aktiv'));
    document.getElementById('visning-' + tabNavn).classList.add('aktiv');
    document.querySelector('[data-tab="' + tabNavn + '"]').classList.add('aktiv');
}

// ===== TABELL =====
function renderTabellHeader() {
    const tr = document.querySelector('#aksje-tabell thead tr');
    let html = '';
    tilstand.synligeKolonner.forEach(kolId => {
        const def = TABELL_KOLONNER.find(k => k.id === kolId);
        if (!def) return;
        const erTall = def.tall ? ' tall' : '';
        html += '<th data-kolonne="' + kolId + '" class="sorterbar' + erTall + '">' + def.navn + '</th>';
    });
    html += '<th class="handling-kolonne">Handling</th>';
    tr.innerHTML = html;
    oppdaterSorteringsUI();
    tr.querySelectorAll('th.sorterbar').forEach(th => {
        th.addEventListener('click', () => sorterTabell(th.dataset.kolonne));
    });
}

function renderTabell(aksjer) {
    const tbody = document.getElementById('aksje-tbody');
    const infoEl = document.getElementById('tabell-teller');
    if (infoEl) infoEl.textContent = aksjer.length + ' av ' + tilstand.alleAksjer.length + ' aksjer';
    if (aksjer.length === 0) {
        tbody.innerHTML = '<tr><td colspan="' + (tilstand.synligeKolonner.length + 1) +
            '" style="text-align:center;padding:40px;color:var(--text-secondary)">Ingen aksjer funnet</td></tr>';
        return;
    }
    tbody.innerHTML = aksjer.map(a => {
        const erLagtTil = tilstand.sammenligningsListe.includes(a.ticker);
        let rader = '';
        tilstand.synligeKolonner.forEach(kolId => {
            const def = TABELL_KOLONNER.find(k => k.id === kolId);
            const erTall = def && def.tall ? ' class="tall"' : '';
            rader += '<td' + erTall + '>' + formaterKolonneVerdi(a, kolId) + '</td>';
        });
        rader += '<td class="handling-kolonne"><button class="swot-knapp" onclick="visSWOTModal(\'' + a.ticker + '\')">Analyse</button>' +
            '<button class="sammenlign-rad-knapp ' + (erLagtTil ? 'lagt-til' : '') +
            '" data-ticker="' + a.ticker + '" onclick="toggleSammenligning(\'' + a.ticker + '\')">' +
            (erLagtTil ? '&#10003;' : '+') + '</button></td>';
        return '<tr>' + rader + '</tr>';
    }).join('');
}

function sorterTabell(kolonne) {
    if (sortering.kolonne === kolonne) {
        sortering.retning = sortering.retning === 'asc' ? 'desc' : 'asc';
    } else {
        sortering.kolonne = kolonne;
        sortering.retning = ['ticker', 'navn', 'sektor'].includes(kolonne) ? 'asc' : 'desc';
    }
    oppdaterSorteringsUI();
    appliserFilter();
}

function oppdaterSorteringsUI() {
    document.querySelectorAll('#aksje-tabell th.sorterbar').forEach(th => {
        th.classList.remove('aktiv-sort', 'sort-asc', 'sort-desc');
        if (th.dataset.kolonne === sortering.kolonne) {
            th.classList.add('aktiv-sort', 'sort-' + sortering.retning);
        }
    });
}

// ===== FILTER =====
function appliserFilter() {
    const f = tilstand.filter;
    let aksjer = tilstand.alleAksjer;

    // Sektor
    if (f.sektor) aksjer = aksjer.filter(a => a.sektor === f.sektor);

    // Søk
    if (f.soketekst) {
        const s = f.soketekst.toLowerCase();
        aksjer = aksjer.filter(a => a.navn.toLowerCase().includes(s) || a.ticker.toLowerCase().includes(s));
    }

    // Hurtigfilter
    if (f.hurtigfilter) {
        const hf = HURTIGFILTER.find(h => h.id === f.hurtigfilter);
        if (hf) aksjer = aksjer.filter(hf.test);
    }

    // Range-filter
    if (f.peMin != null) aksjer = aksjer.filter(a => a.pe != null && a.pe >= f.peMin);
    if (f.peMax != null) aksjer = aksjer.filter(a => a.pe != null && a.pe <= f.peMax);
    if (f.roeMin != null) aksjer = aksjer.filter(a => a.roe != null && a.roe * 100 >= f.roeMin);
    if (f.roeMax != null) aksjer = aksjer.filter(a => a.roe != null && a.roe * 100 <= f.roeMax);
    if (f.dividendeYieldMin != null) aksjer = aksjer.filter(a => a.dividendeYield != null && a.dividendeYield * 100 >= f.dividendeYieldMin);
    if (f.dividendeYieldMax != null) aksjer = aksjer.filter(a => a.dividendeYield != null && a.dividendeYield * 100 <= f.dividendeYieldMax);
    if (f.markedsverdiMin != null) aksjer = aksjer.filter(a => a.markedsverdi != null && a.markedsverdi / 1e9 >= f.markedsverdiMin);
    if (f.markedsverdiMax != null) aksjer = aksjer.filter(a => a.markedsverdi != null && a.markedsverdi / 1e9 <= f.markedsverdiMax);

    // Sortering
    filtrerteAksjer = [...aksjer];
    if (sortering.kolonne) {
        filtrerteAksjer.sort((a, b) => {
            let va = a[sortering.kolonne], vb = b[sortering.kolonne];
            if (va === null || va === undefined) return 1;
            if (vb === null || vb === undefined) return -1;
            if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase(); }
            let r = va < vb ? -1 : va > vb ? 1 : 0;
            return sortering.retning === 'desc' ? -r : r;
        });
    }

    renderTabell(filtrerteAksjer);
    oppdaterFilterChips();
}

function oppdaterFilterChips() {
    const container = document.getElementById('aktive-filter-chips');
    if (!container) return;
    const f = tilstand.filter;
    let chips = [];

    if (f.sektor) chips.push({ tekst: 'Sektor: ' + f.sektor, fjern: () => { f.sektor = ''; document.getElementById('sektor-filter').value = ''; } });
    if (f.soketekst) chips.push({ tekst: 'Søk: ' + f.soketekst, fjern: () => { f.soketekst = ''; document.getElementById('sok-input').value = ''; } });
    if (f.hurtigfilter) {
        const hf = HURTIGFILTER.find(h => h.id === f.hurtigfilter);
        chips.push({ tekst: hf ? hf.navn : f.hurtigfilter, fjern: () => { f.hurtigfilter = null; document.querySelectorAll('.hurtigfilter-knapp').forEach(k => k.classList.remove('aktiv')); } });
    }
    if (f.peMin != null) chips.push({ tekst: 'P/E min: ' + f.peMin, fjern: () => { f.peMin = null; const el = document.getElementById('pe-min'); if (el) el.value = ''; } });
    if (f.peMax != null) chips.push({ tekst: 'P/E max: ' + f.peMax, fjern: () => { f.peMax = null; const el = document.getElementById('pe-max'); if (el) el.value = ''; } });
    if (f.roeMin != null) chips.push({ tekst: 'ROE min: ' + f.roeMin + '%', fjern: () => { f.roeMin = null; const el = document.getElementById('roe-min'); if (el) el.value = ''; } });
    if (f.roeMax != null) chips.push({ tekst: 'ROE max: ' + f.roeMax + '%', fjern: () => { f.roeMax = null; const el = document.getElementById('roe-max'); if (el) el.value = ''; } });
    if (f.dividendeYieldMin != null) chips.push({ tekst: 'Dir.avk. min: ' + f.dividendeYieldMin + '%', fjern: () => { f.dividendeYieldMin = null; const el = document.getElementById('dy-min'); if (el) el.value = ''; } });
    if (f.dividendeYieldMax != null) chips.push({ tekst: 'Dir.avk. max: ' + f.dividendeYieldMax + '%', fjern: () => { f.dividendeYieldMax = null; const el = document.getElementById('dy-max'); if (el) el.value = ''; } });
    if (f.markedsverdiMin != null) chips.push({ tekst: 'Mrd min: ' + f.markedsverdiMin, fjern: () => { f.markedsverdiMin = null; const el = document.getElementById('mv-min'); if (el) el.value = ''; } });
    if (f.markedsverdiMax != null) chips.push({ tekst: 'Mrd max: ' + f.markedsverdiMax, fjern: () => { f.markedsverdiMax = null; const el = document.getElementById('mv-max'); if (el) el.value = ''; } });

    if (chips.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = chips.map((c, i) =>
        '<span class="filter-chip">' + c.tekst +
        '<button class="chip-fjern" data-idx="' + i + '">&times;</button></span>'
    ).join('') + '<button class="nullstill-knapp" onclick="nullstillAlleFilter()">Nullstill alle</button>';

    container.querySelectorAll('.chip-fjern').forEach(btn => {
        btn.addEventListener('click', () => {
            chips[parseInt(btn.dataset.idx)].fjern();
            appliserFilter();
        });
    });
}

function nullstillAlleFilter() {
    tilstand.filter = {
        sektor: '', soketekst: '', hurtigfilter: null,
        peMin: null, peMax: null, roeMin: null, roeMax: null,
        dividendeYieldMin: null, dividendeYieldMax: null,
        markedsverdiMin: null, markedsverdiMax: null,
    };
    document.getElementById('sektor-filter').value = '';
    document.getElementById('sok-input').value = '';
    document.querySelectorAll('.hurtigfilter-knapp').forEach(k => k.classList.remove('aktiv'));
    document.querySelectorAll('.range-inputs input').forEach(inp => { inp.value = ''; });
    appliserFilter();
}

function toggleHurtigfilter(id) {
    if (tilstand.filter.hurtigfilter === id) {
        tilstand.filter.hurtigfilter = null;
    } else {
        tilstand.filter.hurtigfilter = id;
    }
    document.querySelectorAll('.hurtigfilter-knapp').forEach(k => {
        k.classList.toggle('aktiv', k.dataset.id === tilstand.filter.hurtigfilter);
    });
    appliserFilter();
}

function initRangeFilter() {
    const felter = [
        { min: 'pe-min', max: 'pe-max', filterMin: 'peMin', filterMax: 'peMax' },
        { min: 'roe-min', max: 'roe-max', filterMin: 'roeMin', filterMax: 'roeMax' },
        { min: 'dy-min', max: 'dy-max', filterMin: 'dividendeYieldMin', filterMax: 'dividendeYieldMax' },
        { min: 'mv-min', max: 'mv-max', filterMin: 'markedsverdiMin', filterMax: 'markedsverdiMax' },
    ];
    let timer;
    felter.forEach(f => {
        const minEl = document.getElementById(f.min);
        const maxEl = document.getElementById(f.max);
        if (minEl) minEl.addEventListener('input', () => {
            clearTimeout(timer);
            timer = setTimeout(() => { tilstand.filter[f.filterMin] = minEl.value ? parseFloat(minEl.value) : null; appliserFilter(); }, 400);
        });
        if (maxEl) maxEl.addEventListener('input', () => {
            clearTimeout(timer);
            timer = setTimeout(() => { tilstand.filter[f.filterMax] = maxEl.value ? parseFloat(maxEl.value) : null; appliserFilter(); }, 400);
        });
    });
}

// ===== KOLONNE-VELGER =====
function initKolonneVelger() {
    const knapp = document.getElementById('kolonne-velger-knapp');
    const dropdown = document.getElementById('kolonne-dropdown');
    if (!knapp || !dropdown) return;

    knapp.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('skjult');
        if (!dropdown.classList.contains('skjult')) renderKolonneDropdown();
    });
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.filter-gruppe.kolonne-velger-gruppe')) dropdown.classList.add('skjult');
    });
}

function renderKolonneDropdown() {
    const dropdown = document.getElementById('kolonne-dropdown');
    dropdown.innerHTML = TABELL_KOLONNER.map(k => {
        const checked = tilstand.synligeKolonner.includes(k.id) ? 'checked' : '';
        const disabled = k.fast ? 'disabled' : '';
        return '<label><input type="checkbox" value="' + k.id + '" ' + checked + ' ' + disabled +
            ' onchange="toggleKolonne(\'' + k.id + '\')">' + k.navn + '</label>';
    }).join('');
}

function toggleKolonne(id) {
    const idx = tilstand.synligeKolonner.indexOf(id);
    if (idx > -1) tilstand.synligeKolonner.splice(idx, 1);
    else tilstand.synligeKolonner.push(id);
    localStorage.setItem('synligeKolonner', JSON.stringify(tilstand.synligeKolonner));
    renderTabellHeader();
    renderTabell(filtrerteAksjer);
}

// ===== FAVORITTER =====
function toggleFavoritt(ticker) {
    const idx = tilstand.favoritter.indexOf(ticker);
    if (idx > -1) tilstand.favoritter.splice(idx, 1);
    else {
        if (!sjekkPremium() && tilstand.favoritter.length >= 3) { visPremiumModal(); return; }
        tilstand.favoritter.push(ticker);
    }
    localStorage.setItem('favoritter', JSON.stringify(tilstand.favoritter));
    renderTabell(filtrerteAksjer);
}

// ===== LAGREDE FILTER =====
function initLagredeFilter() {
    oppdaterLagredeFilterUI();
}

function oppdaterLagredeFilterUI() {
    const sel = document.getElementById('lagrede-filter-select');
    if (!sel) return;
    sel.innerHTML = '<option value="">Lagrede filter...</option>' +
        tilstand.lagredeFilter.map((f, i) =>
            '<option value="' + i + '">' + f.navn + '</option>'
        ).join('');
}

function lagreNaaverendeFilter() {
    if (!sjekkPremium() && tilstand.lagredeFilter.length >= 2) { visPremiumModal(); return; }
    const navn = prompt('Gi filteret et navn:');
    if (!navn) return;
    tilstand.lagredeFilter.push({ navn, filter: JSON.parse(JSON.stringify(tilstand.filter)), dato: new Date().toISOString() });
    localStorage.setItem('lagredeFilter', JSON.stringify(tilstand.lagredeFilter));
    oppdaterLagredeFilterUI();
}

function lastLagretFilter(idx) {
    if (idx === '' || idx == null) return;
    const lagret = tilstand.lagredeFilter[parseInt(idx)];
    if (!lagret) return;
    tilstand.filter = JSON.parse(JSON.stringify(lagret.filter));
    // Synk UI
    document.getElementById('sektor-filter').value = tilstand.filter.sektor || '';
    document.getElementById('sok-input').value = tilstand.filter.soketekst || '';
    document.querySelectorAll('.hurtigfilter-knapp').forEach(k => {
        k.classList.toggle('aktiv', k.dataset.id === tilstand.filter.hurtigfilter);
    });
    const rangeMap = { 'pe-min': 'peMin', 'pe-max': 'peMax', 'roe-min': 'roeMin', 'roe-max': 'roeMax', 'dy-min': 'dividendeYieldMin', 'dy-max': 'dividendeYieldMax', 'mv-min': 'markedsverdiMin', 'mv-max': 'markedsverdiMax' };
    Object.entries(rangeMap).forEach(([elId, key]) => {
        const el = document.getElementById(elId);
        if (el) el.value = tilstand.filter[key] != null ? tilstand.filter[key] : '';
    });
    appliserFilter();
}

function slettLagretFilter(idx) {
    tilstand.lagredeFilter.splice(idx, 1);
    localStorage.setItem('lagredeFilter', JSON.stringify(tilstand.lagredeFilter));
    oppdaterLagredeFilterUI();
}

// ===== SAMMENLIGNING =====
function toggleSammenligning(ticker) {
    if (tilstand.sammenligningsListe.includes(ticker)) {
        tilstand.sammenligningsListe = tilstand.sammenligningsListe.filter(t => t !== ticker);
    } else if (tilstand.sammenligningsListe.length < 5) {
        tilstand.sammenligningsListe.push(ticker);
    }
    oppdaterSammenligningUI();
    oppdaterSammenligningKnapper();
}

function oppdaterSammenligningKnapper() {
    document.querySelectorAll('.sammenlign-rad-knapp').forEach(k => {
        const t = k.dataset.ticker;
        if (tilstand.sammenligningsListe.includes(t)) {
            k.classList.add('lagt-til'); k.innerHTML = '&#10003;';
        } else {
            k.classList.remove('lagt-til'); k.textContent = '+';
        }
    });
}

// ===== RANGERING =====
const NOKKELTAL_DEF = [
    { id: 'dividendeYield', navn: 'Direkteavkastning', retning: 1, format: 'prosent' },
    { id: 'pe', navn: 'P/E-forhold', retning: -1, format: 'ratio' },
    { id: 'forwardPe', navn: 'Forward P/E', retning: -1, format: 'ratio' },
    { id: 'roe', navn: 'Egenkapitalavkastning (ROE)', retning: 1, format: 'prosent' },
    { id: 'eps', navn: 'Fortjeneste per aksje (EPS)', retning: 1, format: 'kurs' },
    { id: 'prisPerBok', navn: 'Pris/Bok (P/B)', retning: -1, format: 'ratio' },
    { id: 'beta', navn: 'Beta (risiko)', retning: -1, format: 'ratio' },
    { id: 'inntektsVekst', navn: 'Inntektsvekst', retning: 1, format: 'prosent' },
    { id: 'bruttoMargin', navn: 'Bruttomargin', retning: 1, format: 'prosent' },
    { id: 'markedsverdi', navn: 'Markedsverdi', retning: 1, format: 'mrd' },
    { id: 'dividendePerAksje', navn: 'Utbytte per aksje', retning: 1, format: 'kurs' },
    { id: 'utbetalingsgrad', navn: 'Utbetalingsgrad', retning: -1, format: 'prosent' },
    { id: 'gjeldTilEk', navn: 'Gjeld/Egenkapital', retning: -1, format: 'ratio' },
    { id: 'ebitda', navn: 'EBITDA', retning: 1, format: 'mrd' },
    { id: 'prisTilSalg', navn: 'Pris/Salg (P/S)', retning: -1, format: 'ratio' },
    { id: 'epsVekst', navn: 'EPS-vekst', retning: 1, format: 'prosent' },
    { id: 'peg', navn: 'PEG-ratio', retning: -1, format: 'ratio' },
];
let valgteNokkeltal = {};

function initRangering() {
    const container = document.getElementById('nokkeltal-velger');
    container.innerHTML = NOKKELTAL_DEF.map(d => {
        const rtekst = d.retning > 0 ? '\u2191 H\u00f8yere er bedre' : '\u2193 Lavere er bedre';
        const rkl = d.retning > 0 ? 'hoey' : 'lav';
        return '<div class="nokkeltal-item" data-id="' + d.id + '" onclick="toggleNokkeltal(\'' + d.id + '\')">' +
            '<input type="checkbox" id="nok-' + d.id + '">' +
            '<span class="nokkeltal-label">' + d.navn + '</span>' +
            '<button class="retning-toggle ' + rkl + '" data-id="' + d.id +
            '" onclick="event.stopPropagation();byttRetning(\'' + d.id + '\')">' + rtekst + '</button></div>';
    }).join('');
    NOKKELTAL_DEF.forEach(d => { valgteNokkeltal[d.id] = { valgt: false, retning: d.retning }; });
    document.getElementById('ranger-knapp').addEventListener('click', utfoerRangering);
}

function toggleNokkeltal(id) {
    const item = document.querySelector('.nokkeltal-item[data-id="' + id + '"]');
    const cb = document.getElementById('nok-' + id);
    valgteNokkeltal[id].valgt = !valgteNokkeltal[id].valgt;
    cb.checked = valgteNokkeltal[id].valgt;
    item.classList.toggle('valgt', valgteNokkeltal[id].valgt);
}

function byttRetning(id) {
    valgteNokkeltal[id].retning *= -1;
    const knapp = document.querySelector('.retning-toggle[data-id="' + id + '"]');
    if (valgteNokkeltal[id].retning > 0) {
        knapp.textContent = '\u2191 H\u00f8yere er bedre'; knapp.className = 'retning-toggle hoey';
    } else {
        knapp.textContent = '\u2193 Lavere er bedre'; knapp.className = 'retning-toggle lav';
    }
}

function utfoerRangering() {
    if (!sjekkPremium()) { visPremiumModal(); return; }
    const valgte = Object.entries(valgteNokkeltal).filter(([_, v]) => v.valgt).map(([id]) => id);
    if (valgte.length === 0) { alert('Velg minst \u00e9tt n\u00f8kkeltall.'); return; }
    const vekter = {};
    valgte.forEach(id => { vekter[id] = valgteNokkeltal[id].retning; });
    const sektorV = document.getElementById('rangering-sektor').value;
    let aksjer = tilstand.alleAksjer;
    if (sektorV) aksjer = aksjer.filter(a => a.sektor === sektorV);

    const medData = []; const utenData = [];
    aksjer.forEach(a => {
        if (valgte.every(n => a[n] != null)) medData.push({...a});
        else utenData.push(a);
    });

    if (medData.length === 0) {
        alert('Ingen aksjer har data for alle valgte n\u00f8kkeltall.'); return;
    }

    valgte.forEach(n => {
        const verdier = medData.map(a => a[n]);
        const minV = Math.min(...verdier), maxV = Math.max(...verdier);
        const spenn = maxV !== minV ? maxV - minV : 1;
        medData.forEach(a => {
            let norm = (a[n] - minV) / spenn * 100;
            if (vekter[n] < 0) norm = 100 - norm;
            a['_' + n + '_score'] = Math.round(norm * 10) / 10;
        });
    });
    medData.forEach(a => {
        const total = valgte.reduce((s, n) => s + (a['_' + n + '_score'] || 0), 0);
        a.totalScore = Math.round(total / valgte.length * 10) / 10;
    });
    medData.sort((a, b) => b.totalScore - a.totalScore);
    medData.forEach((a, i) => { a.rang = i + 1; });

    visRangeringResultat(medData, valgte, utenData.length);
}

function visRangeringResultat(aksjer, valgte, ekskludert) {
    const container = document.getElementById('rangering-resultat');
    const info = document.getElementById('rangering-info');
    const thead = document.getElementById('rangering-thead-rad');
    const tbody = document.getElementById('rangering-tbody');
    container.classList.remove('skjult');

    const vektProsent = Math.round(100 / valgte.length);
    info.textContent = aksjer.length + ' aksjer rangert \u2022 ' + valgte.length + ' n\u00f8kkeltall, lik vekting (' + vektProsent + '% hver)' +
        (ekskludert > 0 ? ' \u2022 ' + ekskludert + ' ekskludert pga. manglende data' : '');

    let hdr = '<th>Rang</th><th>Ticker</th><th>Navn</th><th class="tall">Poeng</th>';
    valgte.forEach(id => {
        const d = NOKKELTAL_DEF.find(x => x.id === id);
        hdr += '<th class="tall">' + (d ? d.navn : id) + '</th>';
    });
    thead.innerHTML = hdr;
    tbody.innerHTML = aksjer.map(a => {
        const sc = a.totalScore >= 70 ? 'var(--accent-groenn)' : a.totalScore >= 40 ? 'var(--accent-gul)' : 'var(--accent-roed)';
        const bw = Math.max(a.totalScore, 2);
        // Build score breakdown for title
        const breakdown = valgte.map(id => {
            const d = NOKKELTAL_DEF.find(x => x.id === id);
            return (d ? d.navn : id) + ': ' + (a['_' + id + '_score'] || 0).toFixed(1);
        }).join('\n');
        let r = '<td><strong>#' + a.rang + '</strong></td><td>' + a.ticker.replace('.OL','') +
            '</td><td>' + a.navn + '</td><td class="tall" title="' + breakdown.replace(/"/g, '&quot;') + '">' + formaterTall(a.totalScore, 'score') +
            '<div class="score-bar-container"><div class="score-bar" style="width:' + bw + '%;background:' + sc + '"></div></div></td>';
        valgte.forEach(id => {
            const d = NOKKELTAL_DEF.find(x => x.id === id);
            const scoreVal = a['_' + id + '_score'] != null ? a['_' + id + '_score'].toFixed(1) : '';
            r += '<td class="tall" title="Score: ' + scoreVal + '">' + formaterTall(a[id], d ? d.format : 'ratio') + '</td>';
        });
        return '<tr>' + r + '</tr>';
    }).join('');

    // Show explanation for #1
    if (aksjer.length > 0) {
        visRangeringForklaring(aksjer[0], valgte);
    }
}

function visRangeringForklaring(aksje, valgte) {
    const container = document.getElementById('rangering-forklaring-container');
    if (!container) return;
    let html = '<div class="rangering-forklaring kort">';
    html += '<h3>Hvorfor er ' + aksje.navn + ' #1?</h3>';
    html += '<p class="kort-beskrivelse">Score per n\u00f8kkeltall (0\u2013100), normalisert med min\u2013max-metoden. Lik vekting p\u00e5 alle valgte n\u00f8kkeltall.</p>';
    valgte.forEach(id => {
        const d = NOKKELTAL_DEF.find(x => x.id === id);
        const score = aksje['_' + id + '_score'] || 0;
        const retning = d && d.retning > 0 ? 'H\u00f8yere er bedre' : 'Lavere er bedre';
        const barColor = score >= 70 ? 'var(--accent-groenn)' : score >= 40 ? 'var(--accent-gul)' : 'var(--accent-roed)';
        html += '<div class="forklaring-rad">' +
            '<span class="forklaring-etikett">' + (d ? d.navn : id) + '</span>' +
            '<span class="forklaring-verdi">' + formaterTall(aksje[id], d ? d.format : 'ratio') + '</span>' +
            '<div class="score-bar-container" style="width:120px"><div class="score-bar" style="width:' + Math.max(score, 2) + '%;background:' + barColor + '"></div></div>' +
            '<span class="forklaring-poeng">' + score.toFixed(1) + '</span>' +
            '<span class="forklaring-retning">' + retning + '</span></div>';
    });
    html += '</div>';
    container.innerHTML = html;
}

// ===== SAMMENLIGNING =====
const SAMM_FELTER = [
    { id: 'kurs', navn: 'Kurs', format: 'kurs', retning: 0 },
    { id: 'markedsverdi', navn: 'Markedsverdi', format: 'mrd', retning: 1 },
    { id: 'pe', navn: 'P/E', format: 'ratio', retning: -1 },
    { id: 'forwardPe', navn: 'Forward P/E', format: 'ratio', retning: -1 },
    { id: 'dividendeYield', navn: 'Direkteavkastning', format: 'prosent', retning: 1 },
    { id: 'eps', navn: 'EPS', format: 'kurs', retning: 1 },
    { id: 'roe', navn: 'ROE', format: 'prosent', retning: 1 },
    { id: 'prisPerBok', navn: 'P/B', format: 'ratio', retning: -1 },
    { id: 'beta', navn: 'Beta', format: 'ratio', retning: -1 },
    { id: 'inntektsVekst', navn: 'Inntektsvekst', format: 'prosent', retning: 1 },
    { id: 'bruttoMargin', navn: 'Bruttomargin', format: 'prosent', retning: 1 },
    { id: 'dividendePerAksje', navn: 'Utbytte/aksje', format: 'kurs', retning: 1 },
    { id: 'utbetalingsgrad', navn: 'Utbetalingsgrad', format: 'prosent', retning: 0 },
    { id: 'exDividendeDato', navn: 'Ex-utbytte dato', format: 'tekst', retning: 0 },
    { id: 'gjeldTilEk', navn: 'Gjeld/EK', format: 'ratio', retning: -1 },
    { id: 'ebitda', navn: 'EBITDA', format: 'mrd', retning: 1 },
    { id: 'prisTilSalg', navn: 'P/S', format: 'ratio', retning: -1 },
    { id: 'peg', navn: 'PEG', format: 'ratio', retning: -1 },
    { id: 'femtiToUkerHoey', navn: '52-ukers h\u00f8y', format: 'kurs', retning: 0 },
    { id: 'femtiToUkerLav', navn: '52-ukers lav', format: 'kurs', retning: 0 },
];

function initSammenligning() {
    const sokInput = document.getElementById('sammenligning-sok');
    let timer;
    sokInput.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => visSokForslag(sokInput.value), 200);
    });
    sokInput.addEventListener('focus', () => { if (sokInput.value.trim()) visSokForslag(sokInput.value); });
    document.addEventListener('click', e => {
        if (!e.target.closest('.sammenligning-sok-container')) skjulForslag();
    });
    document.getElementById('sammenlign-knapp').addEventListener('click', utfoerSammenligning);
}

function visSokForslag(tekst) {
    const container = document.getElementById('sammenligning-forslag');
    const s = tekst.toLowerCase().trim();
    if (!s) { skjulForslag(); return; }
    const treff = tilstand.alleAksjer.filter(a =>
        !tilstand.sammenligningsListe.includes(a.ticker) &&
        (a.navn.toLowerCase().includes(s) || a.ticker.toLowerCase().includes(s))
    ).slice(0, 8);
    if (!treff.length) { container.classList.add('skjult'); return; }
    container.innerHTML = treff.map(a =>
        '<div class="forslag-item" onclick="velgFraForslag(\'' + a.ticker + '\')">' +
        '<span>' + a.navn + '</span><span class="ticker">' + a.ticker.replace('.OL','') + '</span></div>'
    ).join('');
    container.classList.remove('skjult');
}

function skjulForslag() { document.getElementById('sammenligning-forslag').classList.add('skjult'); }

function velgFraForslag(ticker) {
    toggleSammenligning(ticker);
    document.getElementById('sammenligning-sok').value = '';
    skjulForslag();
}

function oppdaterSammenligningUI() {
    const container = document.getElementById('valgte-aksjer');
    const knapp = document.getElementById('sammenlign-knapp');
    container.innerHTML = tilstand.sammenligningsListe.map(ticker => {
        const a = tilstand.alleAksjer.find(x => x.ticker === ticker);
        return '<div class="chip"><span>' + (a ? a.navn : ticker) +
            '</span><button class="chip-fjern" onclick="toggleSammenligning(\'' + ticker + '\')">&times;</button></div>';
    }).join('');
    knapp.disabled = tilstand.sammenligningsListe.length < 2;
}

function utfoerSammenligning() {
    if (!sjekkPremium()) { visPremiumModal(); return; }
    if (tilstand.sammenligningsListe.length < 2) return;
    const aksjer = tilstand.sammenligningsListe.map(t => tilstand.alleAksjer.find(a => a.ticker === t)).filter(Boolean);
    visSammenligningResultat(aksjer);
}

function visSammenligningResultat(aksjer) {
    const res = document.getElementById('sammenligning-resultat');
    const kort = document.getElementById('sammenligning-kort-container');
    res.classList.remove('skjult');
    const beste = {}, darligste = {};
    SAMM_FELTER.forEach(f => {
        if (f.retning === 0) return;
        const v = aksjer.map(a => ({ ticker: a.ticker, verdi: a[f.id] })).filter(x => x.verdi != null);
        if (v.length < 2) return;
        v.sort((a, b) => a.verdi - b.verdi);
        if (f.retning > 0) { beste[f.id] = v[v.length-1].ticker; darligste[f.id] = v[0].ticker; }
        else { beste[f.id] = v[0].ticker; darligste[f.id] = v[v.length-1].ticker; }
    });
    kort.innerHTML = aksjer.map(a => {
        const rader = SAMM_FELTER.map(f => {
            let kl = '';
            if (beste[f.id] === a.ticker) kl = 'beste-verdi';
            else if (darligste[f.id] === a.ticker) kl = 'darligste-verdi';
            return '<div class="sammenligning-rad"><span class="etikett">' + f.navn +
                '</span><span class="verdi ' + kl + '">' + formaterTall(a[f.id], f.format) + '</span></div>';
        }).join('');
        return '<div class="sammenligning-kort"><div class="sammenligning-kort-header"><h3>' + a.navn +
            '</h3><span class="ticker-label">' + a.ticker.replace('.OL','') + ' \u00B7 ' + a.sektor +
            '</span><div class="kurs-stor">' + formaterTall(a.kurs, 'kurs') + ' NOK</div></div>' + rader + '</div>';
    }).join('');

    document.getElementById('anbefaling-container').innerHTML = lagAnbefaling(aksjer, beste, darligste);
}

// ===== ANBEFALINGSMOTOR =====
function lagAnbefaling(aksjer, beste, darligste) {
    if (aksjer.length < 2) return '';

    const scoreFelter = SAMM_FELTER.filter(f => f.retning !== 0);

    const poeng = aksjer.map(a => {
        let antallBest = 0, antallDarligst = 0;
        const styrker = [], svakheter = [];
        scoreFelter.forEach(f => {
            if (a[f.id] == null) return;
            if (beste[f.id] === a.ticker) {
                antallBest++;
                styrker.push({ felt: f, verdi: a[f.id] });
            }
            if (darligste[f.id] === a.ticker) {
                antallDarligst++;
                svakheter.push({ felt: f, verdi: a[f.id] });
            }
        });
        return { aksje: a, antallBest, antallDarligst, styrker, svakheter, score: antallBest - antallDarligst };
    });

    poeng.sort((a, b) => b.score - a.score);
    const vinner = poeng[0];

    function fmtV(felt, verdi) {
        return formaterTall(verdi, felt.format);
    }

    let html = '<div class="anbefaling-boks">';
    html += '<h3>Analyse og anbefaling</h3>';

    html += '<div class="anbefaling-vinner">' + vinner.aksje.navn + ' scorer best totalt (' +
        vinner.antallBest + ' av ' + scoreFelter.length + ' n\u00f8kkeltall med best verdi)</div>';

    poeng.forEach(p => {
        html += '<div class="anbefaling-aksje">';
        html += '<h4>' + p.aksje.navn + ' (' + p.aksje.ticker.replace('.OL','') + ')</h4>';

        if (p.styrker.length > 0) {
            p.styrker.forEach(s => {
                const retTekst = s.felt.retning > 0 ? 'h\u00f8yest' : 'lavest';
                html += '<div class="anbefaling-punkt styrke">Best p\u00e5 ' + s.felt.navn.toLowerCase() +
                    ': ' + fmtV(s.felt, s.verdi) + ' (' + retTekst + ' er best)</div>';
            });
        }
        if (p.svakheter.length > 0) {
            p.svakheter.forEach(s => {
                const retTekst = s.felt.retning > 0 ? 'lavest' : 'h\u00f8yest';
                html += '<div class="anbefaling-punkt svakhet">Svakest p\u00e5 ' + s.felt.navn.toLowerCase() +
                    ': ' + fmtV(s.felt, s.verdi) + ' (' + retTekst + ' blant de valgte)</div>';
            });
        }
        if (p.styrker.length === 0 && p.svakheter.length === 0) {
            html += '<div class="anbefaling-punkt">Midt p\u00e5 treet p\u00e5 de fleste n\u00f8kkeltall</div>';
        }
        html += '</div>';
    });

    html += '<div class="anbefaling-tekst" style="margin-top:16px;border-top:1px solid var(--border-color);padding-top:16px;">';
    if (vinner.antallBest > vinner.antallDarligst) {
        const hovedStyrker = vinner.styrker.slice(0, 3).map(s => s.felt.navn.toLowerCase()).join(', ');
        html += '<strong>Konklusjon:</strong> Basert p\u00e5 n\u00f8kkeltallene er <strong>' + vinner.aksje.navn +
            '</strong> det sterkeste valget, spesielt innen ' + hovedStyrker + '. ';
    } else {
        html += '<strong>Konklusjon:</strong> Aksjene er relativt jevne. <strong>' + vinner.aksje.navn +
            '</strong> har en liten fordel totalt sett. ';
    }

    const medUtbytte = aksjer.filter(a => a.dividendeYield != null && a.dividendeYield > 0);
    if (medUtbytte.length > 0) {
        const besteUtbytte = medUtbytte.reduce((a, b) => (a.dividendeYield || 0) > (b.dividendeYield || 0) ? a : b);
        html += 'For utbytteinvestorer er <strong>' + besteUtbytte.navn +
            '</strong> mest interessant med ' + formaterTall(besteUtbytte.dividendeYield, 'prosent') + ' dividendegrad';
        if (besteUtbytte.dividendePerAksje) {
            html += ' (' + formaterTall(besteUtbytte.dividendePerAksje, 'kurs') + ' NOK per aksje)';
        }
        html += '. ';
    }

    const medBeta = aksjer.filter(a => a.beta != null);
    if (medBeta.length >= 2) {
        const lavBeta = medBeta.reduce((a, b) => a.beta < b.beta ? a : b);
        const hoyBeta = medBeta.reduce((a, b) => a.beta > b.beta ? a : b);
        if (lavBeta.ticker !== hoyBeta.ticker) {
            html += 'Risikomessig er <strong>' + lavBeta.navn + '</strong> (beta ' +
                formaterTall(lavBeta.beta, 'ratio') + ') mer stabil enn <strong>' + hoyBeta.navn +
                '</strong> (beta ' + formaterTall(hoyBeta.beta, 'ratio') + ').';
        }
    }

    html += '</div></div>';
    return html;
}

// ===== N\u00d8KKELTALL-FORKLARINGER =====
const FORKLARINGER = [
    { tittel: 'P/E (Pris/Fortjeneste)', beskrivelse: 'Pris delt p\u00e5 fortjeneste per aksje. Viser hvor mange \u00e5r det tar \u00e5 \u00abtjene inn\u00bb aksjekursen med dagens overskudd. En P/E p\u00e5 15 betyr at du betaler 15 kr for hver krone selskapet tjener.', hint: 'Lavere er ofte bedre', hintType: 'lav' },
    { tittel: 'Forward P/E', beskrivelse: 'Samme som P/E, men bruker analytikernes forventede fremtidige fortjeneste i stedet for historisk. Nyttig for \u00e5 se om markedet forventer vekst eller nedgang.', hint: 'Lavere er ofte bedre', hintType: 'lav' },
    { tittel: 'Direkteavkastning', beskrivelse: 'Hvor mye utbytte du f\u00e5r i prosent av aksjekursen. Hvis en aksje koster 100 kr og betaler 5 kr i utbytte, er direkteavkastningen 5%. H\u00f8yere betyr mer penger tilbake til deg.', hint: 'H\u00f8yere er bedre', hintType: 'hoey' },
    { tittel: 'Utbytte per aksje', beskrivelse: 'Hvor mange kroner selskapet betaler i utbytte per aksje per \u00e5r. Dette er den faktiske utbetalingen du mottar som aksjon\u00e6r.', hint: 'H\u00f8yere er bedre', hintType: 'hoey' },
    { tittel: 'Utbetalingsgrad', beskrivelse: 'Hvor stor andel av overskuddet som betales ut som utbytte. 50% betyr at halvparten av overskuddet g\u00e5r til aksjon\u00e6rene. For h\u00f8y (over 80-90%) kan tyde p\u00e5 at utbyttet ikke er b\u00e6rekraftig.', hint: 'Moderat er best (30-70%)', hintType: 'noytral' },
    { tittel: 'EPS (Fortjeneste per aksje)', beskrivelse: 'Hvor mye overskudd selskapet genererer per aksje du eier. H\u00f8yere EPS betyr at selskapet er mer l\u00f8nnsomt per aksje.', hint: 'H\u00f8yere er bedre', hintType: 'hoey' },
    { tittel: 'ROE (Egenkapitalavkastning)', beskrivelse: 'M\u00e5ler hvor flinke selskapet er til \u00e5 tjene penger p\u00e5 egenkapitalen (pengene de har). En ROE p\u00e5 15% betyr at selskapet tjener 15 \u00f8re for hver krone i egenkapital.', hint: 'H\u00f8yere er bedre (over 10%)', hintType: 'hoey' },
    { tittel: 'P/B (Pris/Bok)', beskrivelse: 'Aksjekursen delt p\u00e5 bokf\u00f8rt verdi per aksje. Under 1 kan bety at aksjen er billig i forhold til eiendelene. Over 3 kan bety at markedet har h\u00f8ye forventninger.', hint: 'Lavere er ofte bedre', hintType: 'lav' },
    { tittel: 'Beta', beskrivelse: 'M\u00e5ler hvor mye aksjen svinger sammenlignet med markedet. Beta 1.0 = svinger like mye som markedet. Over 1 = mer volatil. Under 1 = mer stabil. H\u00f8y beta betyr h\u00f8yere risiko, men ogs\u00e5 potensielt h\u00f8yere avkastning.', hint: 'Lavere er tryggere', hintType: 'lav' },
    { tittel: 'Markedsverdi', beskrivelse: 'Samlet verdi av alle utst\u00e5ende aksjer i selskapet. Store selskaper (over 10 mrd) er typisk tryggere og mer likvide enn sm\u00e5.', hint: 'Avhenger av strategi', hintType: 'noytral' },
    { tittel: 'Inntektsvekst', beskrivelse: 'Hvor mye selskapets inntekter har vokst det siste \u00e5ret i prosent. Positiv vekst betyr at selskapet selger mer enn f\u00f8r.', hint: 'Positiv vekst er bra', hintType: 'hoey' },
    { tittel: 'Bruttomargin', beskrivelse: 'Hvor mye selskapet sitter igjen med etter varekostnader, i prosent av inntektene. H\u00f8yere margin betyr bedre l\u00f8nnsomhet p\u00e5 det de selger.', hint: 'H\u00f8yere er bedre', hintType: 'hoey' },
    { tittel: 'Gjeld/EK', beskrivelse: 'Gjeld delt p\u00e5 egenkapital. Viser hvor mye selskapet er bel\u00e5nt. En verdi p\u00e5 1 betyr like mye gjeld som egenkapital. Over 2 kan tyde p\u00e5 h\u00f8y risiko.', hint: 'Lavere er tryggere', hintType: 'lav' },
    { tittel: 'EBITDA', beskrivelse: 'Driftsresultat f\u00f8r renter, skatt og avskrivninger. Viser den underliggende l\u00f8nnsomheten i driften, uten at finansiering og regnskapsregler p\u00e5virker. Nyttig for \u00e5 sammenligne selskaper.', hint: 'H\u00f8yere er bedre', hintType: 'hoey' },
    { tittel: 'P/S (Pris/Salg)', beskrivelse: 'Aksjekursen delt p\u00e5 selskapets omsetning per aksje. Nyttig for \u00e5 verdsette selskaper som enn\u00e5 ikke er l\u00f8nnsomme. Lavere P/S betyr at du betaler mindre per krone i omsetning.', hint: 'Lavere er ofte bedre', hintType: 'lav' },
    { tittel: 'EPS-vekst', beskrivelse: 'Hvor mye fortjeneste per aksje har vokst i prosent. Positiv EPS-vekst betyr at selskapet tjener mer enn tidligere perioder \u2014 et tegn p\u00e5 forbedret l\u00f8nnsomhet.', hint: 'Positiv vekst er bra', hintType: 'hoey' },
    { tittel: 'PEG-ratio', beskrivelse: 'P/E delt p\u00e5 forventet vekstrate. En PEG under 1 antyder at aksjen er rimelig priset i forhold til veksten. Over 2 kan tyde p\u00e5 at du betaler for mye for veksten.', hint: 'Under 1 er attraktivt', hintType: 'lav' },
];

function initForklaringer() {
    const grid = document.getElementById('forklaring-grid');
    grid.innerHTML = FORKLARINGER.map(f =>
        '<div class="forklaring-kort">' +
        '<h3>' + f.tittel + '</h3>' +
        '<p>' + f.beskrivelse + '</p>' +
        '<span class="forklaring-hint ' + f.hintType + '">' + f.hint + '</span>' +
        '</div>'
    ).join('');
}

// ===== SWOT TAB =====
function initSWOTTab() {
    const sokInput = document.getElementById('swot-sok');
    if (!sokInput) return;
    let timer;
    sokInput.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => visSWOTSokForslag(sokInput.value), 200);
    });
    sokInput.addEventListener('focus', () => { if (sokInput.value.trim()) visSWOTSokForslag(sokInput.value); });
    document.addEventListener('click', e => {
        if (!e.target.closest('.swot-sok-container')) skjulSWOTForslag();
    });
}

function visSWOTSokForslag(tekst) {
    const container = document.getElementById('swot-forslag');
    const s = tekst.toLowerCase().trim();
    if (!s) { skjulSWOTForslag(); return; }
    const treff = tilstand.alleAksjer.filter(a =>
        a.navn.toLowerCase().includes(s) || a.ticker.toLowerCase().includes(s)
    ).slice(0, 8);
    if (!treff.length) { container.classList.add('skjult'); return; }
    container.innerHTML = treff.map(a =>
        '<div class="forslag-item" onclick="velgSWOTAksje(\'' + a.ticker + '\')">' +
        '<span>' + a.navn + '</span><span class="ticker">' + a.ticker.replace('.OL', '') + '</span></div>'
    ).join('');
    container.classList.remove('skjult');
}

function skjulSWOTForslag() {
    const el = document.getElementById('swot-forslag');
    if (el) el.classList.add('skjult');
}

function velgSWOTAksje(ticker) {
    document.getElementById('swot-sok').value = '';
    skjulSWOTForslag();
    visSWOTInline(ticker);
}

function visSWOTInline(ticker) {
    const aksje = tilstand.alleAksjer.find(a => a.ticker === ticker);
    if (!aksje) return;
    const erPremium = sjekkPremium();
    const analyse = genererFullAnalyse(aksje);
    const container = document.getElementById('swot-inline-resultat');
    const faseNavn = { opptrend: 'Opptrend', bunn: 'Nær bunn', nedtrend: 'Nedtrend', tidlig_oppgang: 'Tidlig oppgang', konsolidering: 'Konsolidering', ukjent: 'Ukjent' };

    const nokkeltal = [
        { etikett: 'Kurs', verdi: formaterTall(aksje.kurs, 'kurs') + ' NOK' },
        { etikett: 'P/E', verdi: formaterTall(aksje.pe, 'ratio') },
        { etikett: 'ROE', verdi: formaterTall(aksje.roe, 'prosent') },
        { etikett: 'Dir.avk.', verdi: formaterTall(aksje.dividendeYield, 'prosent') },
        { etikett: 'Beta', verdi: formaterTall(aksje.beta, 'ratio') },
        { etikett: 'Gjeld/EK', verdi: formaterTall(aksje.gjeldTilEk, 'ratio') },
    ];

    // Header med nøkkeltall
    let html = '<div class="swot-aksje-header"><h3>' + aksje.navn +
        ' <span class="analyse-klassifisering ' + analyse.profil.klassifisering + '">' + analyse.profil.klasseNavn + '</span></h3>' +
        '<p class="swot-aksje-meta">' + aksje.ticker.replace('.OL', '') + ' \u2022 ' + aksje.sektor + ' \u2022 ' + analyse.profil.stoerrelse + '</p>' +
        '<div class="swot-nokkeltal-bar">' +
        nokkeltal.map(n => '<div class="swot-nokkeltal-item"><div class="swot-nokkeltal-verdi">' + n.verdi + '</div><div class="swot-nokkeltal-etikett">' + n.etikett + '</div></div>').join('') +
        '</div></div>';

    // Selskapsprofil (alltid synlig)
    html += '<div class="analyse-profil"><p>' + analyse.profil.tekst + '</p></div>';

    // SWOT-grid
    const kvadranter = [
        { kat: 'styrker', klasse: 'styrker', tittel: 'Styrker' },
        { kat: 'svakheter', klasse: 'svakheter', tittel: 'Svakheter' },
        { kat: 'muligheter', klasse: 'muligheter', tittel: 'Muligheter' },
        { kat: 'trusler', klasse: 'trusler', tittel: 'Trusler' },
    ];
    html += '<div class="swot-grid">';
    kvadranter.forEach(k => {
        const punkter = erPremium ? analyse[k.kat] : analyse[k.kat].slice(0, 3);
        html += '<div class="swot-kvadrant ' + k.klasse + '"><h4>' + k.tittel + '</h4><ul class="swot-liste">';
        punkter.forEach(p => {
            html += '<li><strong>' + p.kort + '</strong>';
            if (erPremium && p.lang) html += '<br><span class="swot-detalj">' + p.lang + '</span>';
            html += '</li>';
        });
        html += '</ul></div>';
    });
    html += '</div>';

    if (erPremium) {
        // Markedsfase
        html += '<div class="analyse-seksjon analyse-markedsfase"><h4>Markedsfase</h4>' +
            '<div class="analyse-fase-header"><span class="analyse-fase-tag ' + analyse.markedsfase.fase + '">' + (faseNavn[analyse.markedsfase.fase] || 'Ukjent') + '</span>';
        if (analyse.markedsfase.posisjon != null) {
            html += '<div class="analyse-fase-indikator"><div class="analyse-fase-bar"><div class="analyse-fase-markør" style="left:' + (analyse.markedsfase.posisjon * 100) + '%"></div></div>' +
                '<div class="analyse-fase-etiketter"><span>52-ukers lav</span><span>52-ukers høy</span></div></div>';
        }
        html += '</div><p>' + analyse.markedsfase.tekst + '</p></div>';
        // Hvorfor vurdere nå?
        html += '<div class="analyse-seksjon analyse-hvorfor-naa"><h4>Hvorfor vurdere aksjen nå?</h4><div class="analyse-argumenter">';
        analyse.hvorforNaa.forEach((arg, i) => {
            html += '<div class="analyse-argument"><div class="analyse-argument-nummer">' + (i + 1) + '</div><div><strong>' + arg.tittel + '</strong><p>' + arg.tekst + '</p></div></div>';
        });
        html += '</div></div>';
        // Investorvurdering
        html += '<div class="swot-investor-vurdering"><h5>Investorvurdering</h5><p>' + analyse.investortype + '</p></div>';
    } else {
        html += '<div class="swot-premium-hint kort">' +
            '<p>Oppgrader til Premium for detaljert analyse, markedsfase, investeringsargumenter og investorvurdering.</p>' +
            '<button class="primaer-knapp" onclick="visPremiumModal()" style="margin-top:12px">Oppgrader til Premium</button></div>';
    }

    container.innerHTML = html;
}

// ===== ONBOARDING =====
function visOnboardingHvisForstegang() {
    if (localStorage.getItem('harSettOnboarding')) return;
    visOnboardingModal();
}

function visOnboardingModal() {
    const m = document.getElementById('onboarding-modal');
    if (m) m.classList.add('aktiv');
}

function lukkOnboarding() {
    const m = document.getElementById('onboarding-modal');
    if (m) m.classList.remove('aktiv');
    localStorage.setItem('harSettOnboarding', 'true');
}

// ===== ENDRINGSDETEKSJON =====
function detekterEndringer() {
    const forrigeRaw = localStorage.getItem('forrigeAksjedata');
    if (forrigeRaw) {
        try {
            const forrige = JSON.parse(forrigeRaw);
            const forrigeMap = {};
            forrige.forEach(a => { forrigeMap[a.ticker] = a.kurs; });
            tilstand.alleAksjer.forEach(a => {
                if (forrigeMap[a.ticker] != null && a.kurs != null && forrigeMap[a.ticker] !== a.kurs) {
                    a._endret = true;
                    a._forrigeKurs = forrigeMap[a.ticker];
                }
            });
        } catch (e) { /* ignorer */ }
    }
    localStorage.setItem('forrigeAksjedata', JSON.stringify(tilstand.alleAksjer.map(a => ({ ticker: a.ticker, kurs: a.kurs }))));
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    // Navigasjon
    document.querySelectorAll('.tab-knapp').forEach(k => {
        k.addEventListener('click', () => byttTab(k.dataset.tab));
    });

    // Hero-knapper
    const heroStartBtn = document.getElementById('hero-start-knapp');
    if (heroStartBtn) heroStartBtn.addEventListener('click', () => byttTab('oversikt'));
    const heroMetodikkBtn = document.getElementById('hero-metodikk-knapp');
    if (heroMetodikkBtn) heroMetodikkBtn.addEventListener('click', () => byttTab('nokkeltal'));

    // Sektorer
    ['sektor-filter', 'rangering-sektor'].forEach(id => {
        const el = document.getElementById(id);
        SEKTORER.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s; opt.textContent = s; el.appendChild(opt);
        });
    });

    // Sektor-filter
    document.getElementById('sektor-filter').addEventListener('change', (e) => {
        tilstand.filter.sektor = e.target.value;
        appliserFilter();
    });

    // Søk
    let debounce;
    document.getElementById('sok-input').addEventListener('input', (e) => {
        clearTimeout(debounce);
        debounce = setTimeout(() => {
            tilstand.filter.soketekst = e.target.value.toLowerCase().trim();
            appliserFilter();
        }, 200);
    });

    // Hurtigfiltre
    document.querySelectorAll('.hurtigfilter-knapp').forEach(k => {
        k.addEventListener('click', () => toggleHurtigfilter(k.dataset.id));
    });

    // Range-filter
    initRangeFilter();

    // Kolonne-velger
    initKolonneVelger();

    // Lagrede filter
    initLagredeFilter();
    const lagreFilterKnapp = document.getElementById('lagre-filter-knapp');
    if (lagreFilterKnapp) lagreFilterKnapp.addEventListener('click', lagreNaaverendeFilter);
    const lagredeFilterSelect = document.getElementById('lagrede-filter-select');
    if (lagredeFilterSelect) lagredeFilterSelect.addEventListener('change', (e) => lastLagretFilter(e.target.value));

    // Endringsdeteksjon
    detekterEndringer();

    // Tabell
    renderTabellHeader();
    appliserFilter();

    // Rangering + Sammenligning + SWOT + Forklaringer
    initRangering();
    initSammenligning();
    initSWOTTab();
    initForklaringer();

    // Premium
    oppdaterPremiumUI();
    const premiumModal = document.getElementById('premium-modal');
    if (premiumModal) {
        premiumModal.addEventListener('click', (e) => { if (e.target.id === 'premium-modal') lukkPremiumModal(); });
        premiumModal.querySelectorAll('[data-lukk-modal]').forEach(btn => btn.addEventListener('click', lukkPremiumModal));
    }
    const devToggle = document.getElementById('premium-dev-toggle');
    if (devToggle) devToggle.addEventListener('click', togglePremium);

    // Onboarding
    visOnboardingHvisForstegang();
    const onboardingModal = document.getElementById('onboarding-modal');
    if (onboardingModal) {
        onboardingModal.addEventListener('click', (e) => { if (e.target.id === 'onboarding-modal') lukkOnboarding(); });
        onboardingModal.querySelectorAll('[data-lukk-onboarding]').forEach(btn => btn.addEventListener('click', lukkOnboarding));
    }
});
