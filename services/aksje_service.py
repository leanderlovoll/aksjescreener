import yfinance as yf
from datetime import datetime, timedelta
from data.aksjer_oslo import OSLO_AKSJER, SEKTORER
import threading
import time

CACHE_TTL_MINUTTER = 15
BATCH_STORRELSE = 10


class AksjeService:
    def __init__(self):
        self._cache = {}
        self._laster = False
        self._sist_oppdatert = None
        self._lock = threading.Lock()
        self._start_bakgrunnshenting()

    def _start_bakgrunnshenting(self):
        thread = threading.Thread(target=self._hent_alle_i_bakgrunn, daemon=True)
        thread.start()

    def _hent_alle_i_bakgrunn(self):
        self._laster = True
        alle_tickers = [a["ticker"] for a in OSLO_AKSJER]

        for i in range(0, len(alle_tickers), BATCH_STORRELSE):
            batch = alle_tickers[i:i + BATCH_STORRELSE]
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
                        self._oppdater_cache(ticker_symbol, info)
                    except Exception as e:
                        print(f"Feil ved henting av {ticker_symbol}: {e}")
            except Exception as e:
                print(f"Batch-feil: {e}")
            time.sleep(1)

        self._laster = False
        self._sist_oppdatert = datetime.now()
        print(f"Ferdig med å laste {len(self._cache)}/{len(alle_tickers)} aksjer")

    def _oppdater_cache(self, ticker, raw_info):
        statisk = next((a for a in OSLO_AKSJER if a["ticker"] == ticker), {})
        kurs = raw_info.get("currentPrice") or raw_info.get("regularMarketPrice")
        dy = self._beregn_dividend_yield(raw_info, kurs)
        raw_dte = raw_info.get("debtToEquity")

        data = {
            "ticker": ticker,
            "navn": statisk.get("navn", raw_info.get("shortName", ticker)),
            "sektor": statisk.get("sektor", self._oversett_sektor(raw_info.get("sector", "Ukjent"))),
            "kurs": kurs,
            "valuta": raw_info.get("currency", "NOK"),
            "markedsverdi": raw_info.get("marketCap"),
            "pe": raw_info.get("trailingPE"),
            "forwardPe": raw_info.get("forwardPE"),
            "dividendeYield": dy,
            "dividendePerAksje": raw_info.get("dividendRate") or raw_info.get("trailingAnnualDividendRate"),
            "eps": raw_info.get("trailingEps"),
            "roe": raw_info.get("returnOnEquity"),
            "beta": raw_info.get("beta"),
            "prisPerBok": raw_info.get("priceToBook"),
            "gjeldTilEk": raw_dte / 100 if raw_dte is not None else None,
            "femtiToUkerHoey": raw_info.get("fiftyTwoWeekHigh"),
            "femtiToUkerLav": raw_info.get("fiftyTwoWeekLow"),
            "femtiDagersSnitt": raw_info.get("fiftyDayAverage"),
            "toHundreDagersSnitt": raw_info.get("twoHundredDayAverage"),
            "inntektsVekst": raw_info.get("revenueGrowth"),
            "bruttoMargin": raw_info.get("grossMargins"),
            "ebitda": raw_info.get("ebitda"),
            "friKontantstroem": raw_info.get("freeCashflow"),
            "anbefaling": raw_info.get("recommendationKey"),
        }

        with self._lock:
            self._cache[ticker] = {
                "data": data,
                "tidspunkt": datetime.now()
            }

    def _beregn_dividend_yield(self, raw_info, kurs):
        """Beregn direkteavkastning med pålitelig prioritering."""
        dividend_rate = raw_info.get("dividendRate")
        if kurs and dividend_rate:
            return dividend_rate / kurs
        if raw_info.get("dividendYield") is not None:
            return raw_info.get("dividendYield") / 100
        if raw_info.get("trailingAnnualDividendYield"):
            return raw_info.get("trailingAnnualDividendYield")
        return None

    def _oversett_sektor(self, eng_sektor):
        oversettelser = {
            "Energy": "Energi",
            "Financial Services": "Finans",
            "Industrials": "Industri",
            "Consumer Defensive": "Konsumvarer",
            "Consumer Cyclical": "Konsumvarer",
            "Communication Services": "Kommunikasjon",
            "Basic Materials": "Materialer",
            "Technology": "Teknologi",
            "Healthcare": "Helse",
            "Real Estate": "Eiendom",
            "Utilities": "Forsyning",
        }
        return oversettelser.get(eng_sektor, eng_sektor)

    def _er_utdatert(self, ticker):
        if ticker not in self._cache:
            return True
        alder = datetime.now() - self._cache[ticker]["tidspunkt"]
        return alder > timedelta(minutes=CACHE_TTL_MINUTTER)

    def hent_alle_aksjer(self, sektor_filter=None):
        resultat = []
        for aksje_def in OSLO_AKSJER:
            ticker = aksje_def["ticker"]
            if ticker in self._cache:
                data = self._cache[ticker]["data"]
                if sektor_filter and data.get("sektor") != sektor_filter:
                    continue
                resultat.append(data)
            else:
                if sektor_filter and aksje_def.get("sektor") != sektor_filter:
                    continue
                resultat.append({
                    "ticker": ticker,
                    "navn": aksje_def["navn"],
                    "sektor": aksje_def["sektor"],
                    "kurs": None,
                })
        return {
            "aksjer": resultat,
            "laster": self._laster,
            "antall": len(resultat)
        }

    def hent_aksje_detaljer(self, ticker):
        if self._er_utdatert(ticker):
            try:
                t = yf.Ticker(ticker)
                self._oppdater_cache(ticker, t.info)
            except Exception:
                pass
        if ticker in self._cache:
            return self._cache[ticker]["data"]
        return None

    def hent_sektorer(self):
        return SEKTORER

    def ranger_aksjer(self, nokkeltal, vekter, sektor_filter=None):
        alle = self.hent_alle_aksjer(sektor_filter)["aksjer"]

        med_data = []
        uten_data = []
        for aksje in alle:
            har_alle = all(aksje.get(n) is not None for n in nokkeltal)
            if har_alle:
                med_data.append(aksje)
            else:
                uten_data.append(aksje)

        if not med_data:
            return {"aksjer": [], "antall": 0, "ekskludert": len(uten_data)}

        for n in nokkeltal:
            verdier = [a[n] for a in med_data]
            min_v = min(verdier)
            max_v = max(verdier)
            spenn = max_v - min_v if max_v != min_v else 1

            for aksje in med_data:
                normalisert = (aksje[n] - min_v) / spenn * 100
                retning = vekter.get(n, 1)
                if retning < 0:
                    normalisert = 100 - normalisert
                aksje[f"_{n}_score"] = round(normalisert, 1)

        for aksje in med_data:
            total = sum(aksje.get(f"_{n}_score", 0) for n in nokkeltal)
            aksje["totalScore"] = round(total / len(nokkeltal), 1)

        med_data.sort(key=lambda a: a["totalScore"], reverse=True)

        for i, aksje in enumerate(med_data):
            aksje["rang"] = i + 1

        return {
            "aksjer": med_data,
            "antall": len(med_data),
            "ekskludert": len(uten_data)
        }

    def sammenlign_aksjer(self, tickers):
        resultat = []
        for ticker in tickers[:5]:
            aksje = self.hent_aksje_detaljer(ticker)
            if aksje:
                resultat.append(aksje)
        return {"aksjer": resultat}

    def hent_status(self):
        return {
            "laster": self._laster,
            "antallCachet": len(self._cache),
            "antallTotalt": len(OSLO_AKSJER),
            "sistOppdatert": self._sist_oppdatert.isoformat() if self._sist_oppdatert else None
        }
