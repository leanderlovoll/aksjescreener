from flask import Flask, jsonify, request, render_template
from services.aksje_service import AksjeService

app = Flask(__name__)
service = AksjeService()


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/aksjer')
def hent_aksjer():
    sektor = request.args.get('sektor', None)
    aksjer = service.hent_alle_aksjer(sektor_filter=sektor)
    return jsonify(aksjer)


@app.route('/api/aksjer/<path:ticker>')
def hent_aksje(ticker):
    aksje = service.hent_aksje_detaljer(ticker)
    if aksje is None:
        return jsonify({'feil': 'Aksje ikke funnet'}), 404
    return jsonify(aksje)


@app.route('/api/sektorer')
def hent_sektorer():
    sektorer = service.hent_sektorer()
    return jsonify(sektorer)


@app.route('/api/rangering', methods=['POST'])
def ranger_aksjer():
    data = request.get_json()
    nokkeltal = data.get('nokkeltal', [])
    vekter = data.get('vekter', {})
    sektor = data.get('sektor', None)
    resultat = service.ranger_aksjer(nokkeltal, vekter, sektor_filter=sektor)
    return jsonify(resultat)


@app.route('/api/sammenlign', methods=['POST'])
def sammenlign_aksjer():
    data = request.get_json()
    tickers = data.get('tickers', [])
    resultat = service.sammenlign_aksjer(tickers)
    return jsonify(resultat)


@app.route('/api/status')
def status():
    return jsonify(service.hent_status())


if __name__ == '__main__':
    app.run(debug=True, port=5001)
