#!/usr/bin/env python3
"""
Hent aksjedata fra Yahoo Finance og generer aksjeanalysator.html.
Bruk: python3 hent_data.py
Åpne deretter aksjeanalysator.html i nettleseren.
"""

import yfinance as yf
import json
import time
from datetime import datetime
from data.aksjer_oslo import OSLO_AKSJER, SEKTORER

BATCH_STORRELSE = 10


def hent_aksjedata():
    """Henter data for alle aksjer fra yfinance."""
    alle_tickers = [a["ticker"] for a in OSLO_AKSJER]
    resultat = []
    antall = len(alle_tickers)

    for i in range(0, antall, BATCH_STORRELSE):
        batch = alle_tickers[i:i + BATCH_STORRELSE]
        print(f"  Henter batch {i // BATCH_STORRELSE + 1}/{(antall + BATCH_STORRELSE - 1) // BATCH_STORRELSE}: {', '.join(t.replace('.OL','') for t in batch)}")

        try:
            tickers_str = " ".join(batch)
            tickers_obj = yf.Tickers(tickers_str)
            for ticker_symbol in batch:
                try:
                    ticker_key = ticker_symbol.replace(".", "-")
                    if ticker_key in tickers_obj.tickers:
                        info = tickers_obj.tickers[ticker_key].info
                    elif ticker_symbol in tickers_obj.tickers:
                        info = tickers_obj.tickers[ticker_symbol].info
                    else:
                        info = yf.Ticker(ticker_symbol).info

                    statisk = next((a for a in OSLO_AKSJER if a["ticker"] == ticker_symbol), {})
                    kurs = info.get("currentPrice") or info.get("regularMarketPrice")
                    dividend_rate = info.get("dividendRate")
                    if kurs and dividend_rate:
                        dy = dividend_rate / kurs
                    elif info.get("dividendYield") is not None:
                        dy = info.get("dividendYield") / 100
                    elif info.get("trailingAnnualDividendYield"):
                        dy = info.get("trailingAnnualDividendYield")
                    else:
                        dy = None

                    # Utbyttedata
                    ex_dato = info.get("exDividendDate")
                    if ex_dato and isinstance(ex_dato, (int, float)):
                        from datetime import datetime as dt
                        try:
                            ex_dato = dt.fromtimestamp(ex_dato).strftime("%Y-%m-%d")
                        except Exception:
                            ex_dato = None

                    data = {
                        "ticker": ticker_symbol,
                        "navn": statisk.get("navn", info.get("shortName", ticker_symbol)),
                        "sektor": statisk.get("sektor", "Ukjent"),
                        "kurs": info.get("currentPrice") or info.get("regularMarketPrice"),
                        "valuta": info.get("currency", "NOK"),
                        "markedsverdi": info.get("marketCap"),
                        "pe": info.get("trailingPE"),
                        "forwardPe": info.get("forwardPE"),
                        "dividendeYield": dy,
                        "dividendePerAksje": info.get("dividendRate") or info.get("trailingAnnualDividendRate"),
                        "utbetalingsgrad": info.get("payoutRatio"),
                        "exDividendeDato": ex_dato,
                        "eps": info.get("trailingEps"),
                        "roe": info.get("returnOnEquity"),
                        "beta": info.get("beta"),
                        "prisPerBok": info.get("priceToBook"),
                        "gjeldTilEk": info.get("debtToEquity") / 100 if info.get("debtToEquity") is not None else None,
                        "femtiToUkerHoey": info.get("fiftyTwoWeekHigh"),
                        "femtiToUkerLav": info.get("fiftyTwoWeekLow"),
                        "femtiDagersSnitt": info.get("fiftyDayAverage"),
                        "toHundreDagersSnitt": info.get("twoHundredDayAverage"),
                        "inntektsVekst": info.get("revenueGrowth"),
                        "bruttoMargin": info.get("grossMargins"),
                        "ebitda": info.get("ebitda"),
                        "friKontantstroem": info.get("freeCashflow"),
                        "anbefaling": info.get("recommendationKey"),
                        "prisTilSalg": info.get("priceToSalesTrailing12Months"),
                        "epsVekst": info.get("earningsGrowth"),
                        "peg": info.get("pegRatio"),
                    }
                    resultat.append(data)
                    print(f"    {ticker_symbol}: {data['kurs']} NOK")
                except Exception as e:
                    print(f"    {ticker_symbol}: FEIL - {e}")
                    statisk = next((a for a in OSLO_AKSJER if a["ticker"] == ticker_symbol), {})
                    resultat.append({
                        "ticker": ticker_symbol,
                        "navn": statisk.get("navn", ticker_symbol),
                        "sektor": statisk.get("sektor", "Ukjent"),
                        "kurs": None,
                    })
        except Exception as e:
            print(f"  Batch-feil: {e}")
        time.sleep(1)

    return resultat


def generer_html(aksjer, sektorer):
    """Genererer komplett HTML-fil med data innebygd, CSS og JS som eksterne filer."""

    tidspunkt = datetime.now().strftime("%d.%m.%Y kl. %H:%M")
    aksjer_json = json.dumps(aksjer, ensure_ascii=False, default=str)
    sektorer_json = json.dumps(sektorer, ensure_ascii=False)

    html = f"""<!DOCTYPE html>
<html lang="no">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aksjeanalysator - Oslo Børs</title>
    <link rel="stylesheet" href="static/css/style.css">
</head>
<body>
    <div class="app-container">
        <section class="hero">
            <div class="hero-inner">
                <h1 class="hero-tittel">Aksjeanalysator</h1>
                <p class="hero-undertittel">Analyser, filtrer og sammenlign aksjer på Oslo Børs</p>
                <ul class="hero-punkter">
                    <li>Screen {len(aksjer)} aksjer på tvers av {len(sektorer)} sektorer</li>
                    <li>Ranger etter nøkkeltall med transparent scoring</li>
                    <li>Sammenlign side om side med AI-drevet anbefaling</li>
                </ul>
                <details class="hero-guide">
                    <summary>Slik bruker du verktøyet</summary>
                    <ol class="guide-steg">
                        <li><strong>Filtrer:</strong> Bruk søk, sektorfilter og hurtigfiltre for å finne aksjer</li>
                        <li><strong>Analyser:</strong> Bruk Analyse-fanen for selskapsprofil, SWOT og investeringsargumenter</li>
                        <li><strong>Ranger:</strong> Velg nøkkeltall og ranger aksjer med transparent scoring</li>
                        <li><strong>Sammenlign:</strong> Velg 2-5 aksjer og se side-om-side med AI-anbefaling</li>
                    </ol>
                </details>
                <div class="hero-knapper">
                    <button id="hero-start-knapp" class="primaer-knapp">Start screening</button>
                    <button id="hero-metodikk-knapp" class="sekundaer-knapp">Se metodikk</button>
                </div>
            </div>
        </section>
        <header class="header">
            <p class="data-tidspunkt">Data oppdatert: {tidspunkt}</p>
            <nav class="tab-nav">
                <button class="tab-knapp aktiv" data-tab="oversikt">Oversikt</button>
                <button class="tab-knapp" data-tab="swot">Analyse <span class="premium-badge">Premium</span></button>
                <button class="tab-knapp" data-tab="rangering">Rangering <span class="premium-badge">Premium</span></button>
                <button class="tab-knapp" data-tab="sammenligning">Sammenligning <span class="premium-badge">Premium</span></button>
                <button class="tab-knapp" data-tab="nokkeltal">Nøkkeltall</button>
            </nav>
        </header>
        <main class="innhold">
            <section id="visning-oversikt" class="visning aktiv">
                <div class="lagrede-filter-bar">
                    <select id="lagrede-filter-select"><option value="">Lagrede filter...</option></select>
                    <button id="lagre-filter-knapp" class="sekundaer-knapp">Lagre nåværende</button>
                </div>
                <div class="filter-bar">
                    <div class="filter-gruppe">
                        <label for="sektor-filter">Sektor</label>
                        <select id="sektor-filter"><option value="">Alle sektorer</option></select>
                    </div>
                    <div class="filter-gruppe">
                        <label for="sok-input">Søk</label>
                        <input type="text" id="sok-input" placeholder="Søk etter aksje...">
                    </div>
                    <div class="filter-gruppe kolonne-velger-gruppe">
                        <label>Kolonner</label>
                        <button id="kolonne-velger-knapp" class="kolonne-velger-knapp">Tilpass kolonner</button>
                        <div id="kolonne-dropdown" class="kolonne-dropdown skjult"></div>
                    </div>
                </div>
                <div class="hurtigfilter-bar">
                    <button class="hurtigfilter-knapp" data-id="utbytte">Utbytteaksjer</button>
                    <button class="hurtigfilter-knapp" data-id="billig">Billige (lav P/E)</button>
                    <button class="hurtigfilter-knapp" data-id="hoeyRoe">Høy ROE</button>
                    <button class="hurtigfilter-knapp" data-id="favoritter">Mine favoritter</button>
                </div>
                <details class="avansert-filter">
                    <summary>Avanserte filter</summary>
                    <div class="range-filter-grid">
                        <div class="range-filter-gruppe">
                            <label>P/E</label>
                            <div class="range-inputs">
                                <input type="number" id="pe-min" placeholder="Min">
                                <span class="range-separator">&ndash;</span>
                                <input type="number" id="pe-max" placeholder="Max">
                            </div>
                        </div>
                        <div class="range-filter-gruppe">
                            <label>ROE (%)</label>
                            <div class="range-inputs">
                                <input type="number" id="roe-min" placeholder="Min">
                                <span class="range-separator">&ndash;</span>
                                <input type="number" id="roe-max" placeholder="Max">
                            </div>
                        </div>
                        <div class="range-filter-gruppe">
                            <label>Dir.avk. (%)</label>
                            <div class="range-inputs">
                                <input type="number" id="dy-min" placeholder="Min">
                                <span class="range-separator">&ndash;</span>
                                <input type="number" id="dy-max" placeholder="Max">
                            </div>
                        </div>
                        <div class="range-filter-gruppe">
                            <label>Markedsverdi (mrd)</label>
                            <div class="range-inputs">
                                <input type="number" id="mv-min" placeholder="Min">
                                <span class="range-separator">&ndash;</span>
                                <input type="number" id="mv-max" placeholder="Max">
                            </div>
                        </div>
                    </div>
                </details>
                <div id="aktive-filter-chips" class="aktive-filter-chips"></div>
                <div class="tabell-info"><span id="tabell-teller"></span></div>
                <div class="tabell-container">
                    <table id="aksje-tabell">
                        <thead><tr></tr></thead>
                        <tbody id="aksje-tbody"></tbody>
                    </table>
                </div>
            </section>
            <section id="visning-swot" class="visning">
                <div class="kort">
                    <h2>Aksjeanalyse</h2>
                    <p class="kort-beskrivelse">Søk etter en aksje for profesjonell analyse med selskapsprofil, SWOT, markedsfase og investeringsargumenter.</p>
                    <div class="swot-sok-container">
                        <input type="text" id="swot-sok" placeholder="Søk etter aksje...">
                        <div id="swot-forslag" class="forslag-liste skjult"></div>
                    </div>
                </div>
                <div id="swot-inline-resultat"></div>
            </section>
            <section id="visning-rangering" class="visning">
                <div class="rangering-oppsett">
                    <div class="kort">
                        <h2>Velg nøkkeltall</h2>
                        <p class="kort-beskrivelse">Velg hvilke nøkkeltall du vil rangere etter, og om høyere eller lavere verdi er best.</p>
                        <div id="nokkeltal-velger" class="nokkeltal-grid"></div>
                        <div class="rangering-filter">
                            <label for="rangering-sektor">Filtrer på sektor</label>
                            <select id="rangering-sektor"><option value="">Alle sektorer</option></select>
                        </div>
                        <button id="ranger-knapp" class="primaer-knapp">Ranger aksjer</button>
                    </div>
                </div>
                <div id="rangering-resultat" class="rangering-resultat skjult">
                    <div class="resultat-header">
                        <h2>Resultat</h2>
                        <span id="rangering-info" class="info-tekst"></span>
                    </div>
                    <div class="tabell-container">
                        <table id="rangering-tabell">
                            <thead><tr id="rangering-thead-rad"></tr></thead>
                            <tbody id="rangering-tbody"></tbody>
                        </table>
                    </div>
                    <div id="rangering-forklaring-container"></div>
                </div>
            </section>
            <section id="visning-sammenligning" class="visning">
                <div class="sammenligning-velger">
                    <div class="kort">
                        <h2>Velg aksjer å sammenligne</h2>
                        <p class="kort-beskrivelse">Velg 2-5 aksjer for side-om-side sammenligning.</p>
                        <div class="sammenligning-sok-container">
                            <input type="text" id="sammenligning-sok" placeholder="Søk etter aksje å legge til...">
                            <div id="sammenligning-forslag" class="forslag-liste skjult"></div>
                        </div>
                        <div id="valgte-aksjer" class="chip-container"></div>
                        <button id="sammenlign-knapp" class="primaer-knapp" disabled>Sammenlign</button>
                    </div>
                </div>
                <div id="sammenligning-resultat" class="sammenligning-resultat skjult">
                    <div id="sammenligning-kort-container" class="sammenligning-grid"></div>
                    <div id="anbefaling-container"></div>
                </div>
            </section>
            <section id="visning-nokkeltal" class="visning">
                <div class="forklaring-intro">
                    <h2>Hva betyr nøkkeltallene?</h2>
                    <p>Her er en enkel forklaring på de viktigste nøkkeltallene du møter når du analyserer aksjer. Bruk disse til å forstå hva tallene i oversikten, rangeringen og sammenligningen faktisk betyr.</p>
                </div>
                <div id="forklaring-grid" class="forklaring-grid"></div>
            </section>
        </main>
    </div>

<script>
const ALLE_AKSJER = {aksjer_json};
const SEKTORER = {sektorer_json};
</script>
    <div class="modal-overlay" id="premium-modal">
        <div class="modal" onclick="event.stopPropagation()">
            <button class="modal-lukk" data-lukk-modal>&times;</button>
            <h2>Oppgrader til Premium</h2>
            <p class="modal-beskrivelse">Få tilgang til avanserte analyseverktøy og ta bedre investeringsbeslutninger.</p>
            <ul class="modal-funksjoner">
                <li>&#10003; Full aksjeanalyse med SWOT, markedsfase og investorvurdering</li>
                <li>&#10003; Rangering og scoring på tvers av sektorer</li>
                <li>&#10003; Side-om-side sammenligning med anbefaling</li>
                <li>&#10003; Ubegrenset favoritter og lagrede filter</li>
                <li>&#10003; Prioritert tilgang til nye funksjoner</li>
            </ul>
            <div class="modal-pris">
                <strong>99 kr/mnd</strong>
                <span>Ingen binding</span>
            </div>
            <div class="modal-knapper">
                <button class="primaer-knapp" onclick="alert('Betaling kommer snart! Bruk dev-toggle for å teste Premium.')">Oppgrader nå</button>
                <button class="sekundaer-knapp" data-lukk-modal>Lukk</button>
            </div>
        </div>
    </div>
    <div class="modal-overlay" id="onboarding-modal">
        <div class="modal onboarding-modal" onclick="event.stopPropagation()">
            <button class="modal-lukk" data-lukk-onboarding>&times;</button>
            <h2>Velkommen til Aksjeanalysatoren</h2>
            <p class="modal-beskrivelse">Analyser og sammenlign aksjer p\u00e5 Oslo B\u00f8rs med profesjonelle verkt\u00f8y.</p>
            <div class="onboarding-steg-grid">
                <div class="onboarding-steg">
                    <div class="onboarding-nummer">1</div>
                    <h4>Filtrer og s\u00f8k</h4>
                    <p>Bruk s\u00f8k, sektorfilter og hurtigfiltre for \u00e5 finne aksjer som passer din strategi.</p>
                </div>
                <div class="onboarding-steg">
                    <div class="onboarding-nummer">2</div>
                    <h4>Aksjeanalyse</h4>
                    <p>Se selskapsprofil, SWOT, markedsfase og investeringsargumenter for hver aksje.</p>
                </div>
                <div class="onboarding-steg">
                    <div class="onboarding-nummer">3</div>
                    <h4>Ranger</h4>
                    <p>Velg n\u00f8kkeltall og ranger aksjer med transparent, vektet scoring.</p>
                </div>
                <div class="onboarding-steg">
                    <div class="onboarding-nummer">4</div>
                    <h4>Sammenlign</h4>
                    <p>Velg 2-5 aksjer for side-om-side sammenligning med AI-anbefaling.</p>
                </div>
            </div>
            <button class="primaer-knapp" onclick="lukkOnboarding()" style="margin-top:24px;width:100%">Kom i gang</button>
        </div>
    </div>
    <button id="premium-dev-toggle" class="premium-dev-toggle">Premium: OFF</button>

<script src="static/js/app.js"></script>
</body>
</html>"""

    return html


if __name__ == "__main__":
    print("Aksjeanalysator - Henter data fra Yahoo Finance...")
    print(f"Henter {len(OSLO_AKSJER)} aksjer...")
    print()

    aksjer = hent_aksjedata()
    med_data = sum(1 for a in aksjer if a.get("kurs"))
    print(f"\nFerdig! {med_data}/{len(aksjer)} aksjer med kursdata.")

    html = generer_html(aksjer, SEKTORER)
    filnavn = "index.html"
    with open(filnavn, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"\nGenerert: {filnavn}")
    print(f"Push til GitHub og aktiver GitHub Pages for å publisere.")
