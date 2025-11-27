# ###############################################################################
### Programme d'affichage de page Web via Flask
###
### Utiliser l'outil "Explorer" ou "voir le code source" du navigateur pour
### vérifier le contenu de la page web envoyée par le serveur
###
### Une bonne habitude à prendre est d'intenter le code HTML pour faciliter sa
### lecture. Ceci est réalisé grâce aux triples quotes qui permettent
### d'interpréter les chaines de caractères telles qu'elles sont écrites dans
### le programme python. A défaut, on peut aussi utiliser les caractères
### spéciaux comme \n (saut de ligne) ou \t (tabulation)
################################################################################

################################################################################
# Module flask permettant de gérer un serveur et des pages web
# Note: les fichiers html doivent impérativement se trouver dans un répertoire "templates"

from flask import Flask, render_template, request

app = Flask(__name__)

@app.route('/', methods=['GET', 'POST'])  # Page d’accueil
def index():
    return render_template("index.html")

@app.route('/resultat', methods=['POST'])  # Page de résultats
def resultat():
    # Récupération des données du formulaire dans un dictionnaire
    result = request.form

    # Par sécurité on gère les champs attendus avec des valeurs par défaut
    nom = result.get('nom', '').strip()
    os_choice = result.get('os', '')  # 'windows' | 'macos' | 'linux'
    q1 = result.get('q1', '')
    q2 = result.get('q2', '')
    q3 = result.get('q3', '')
    q4 = result.get('q4', '')
    q5 = result.get('q5', '')

    # Si pas de nom -> on renvoie l’index (cas d'accès direct ou formulaire incomplet)
    if nom == '':
        return render_template("index.html", error="Merci d’indiquer votre nom.")

    # Clés de correction pour les 4 premières questions (générales)
    # On stocke en "clé:réponse_attendue"
    corrections_generales = {
        'q1': 'b',  # VPN = chiffrer et protéger la connexion
        'q2': 'a',  # Firewall = filtrer le trafic entrant/sortant
        'q3': 'c',  # HTTPS = chiffrement + certificat
        'q4': 'b',  # Phishing = message urgent demandant infos sensibles
    }

    # Correction de la question 5 (personnalisée selon l’OS)
    # On choisit la bonne réponse attendue en fonction de os_choice
    # On garde les valeurs de réponses ('a'/'b'/'c') cohérentes avec index.html
    if os_choice == 'windows':
        q5_correct = 'a'  # Paramètres > Windows Update pour se mettre à jour
        q5_label = "Windows"
    elif os_choice == 'macos':
        q5_correct = 'b'  # Réglages Système > Mise à jour de logiciels
        q5_label = "macOS"
    elif os_choice == 'linux':
        q5_correct = 'c'  # Mettre à jour via le gestionnaire de paquets (ex: apt)
        q5_label = "Linux"
    else:
        # OS non précisé: on pénalise Q5 en la marquant fausse et on étiquette "Inconnu"
        q5_correct = None
        q5_label = "Inconnu"

    # Calcul du score
    score = 0
    details = []  # pour afficher correction question par question

    # Q1..Q4
    for q_key, correct in corrections_generales.items():
        rep = locals()[q_key]  # récupère q1/q2/q3/q4
        est_juste = (rep == correct)
        score += 4 if est_juste else 0
        details.append({
            'numero': q_key.upper(),
            'votre_reponse': rep if rep else "—",
            'bonne_reponse': correct,
            'explication': explication(q_key)
        })

    # Q5
    if q5_correct is not None:
        est_juste = (q5 == q5_correct)
        score += 4 if est_juste else 0
    else:
        est_juste = False

    details.append({
        'numero': 'Q5 (' + q5_label + ')',
        'votre_reponse': q5 if q5 else "—",
        'bonne_reponse': q5_correct if q5_correct else "—",
        'explication': explication_q5(os_choice)
    })

    # Score sur 20
    return render_template("resultat.html",
                           nom=nom,
                           score=score,
                           total=20,
                           details=details)

def explication(q_key):
    """Brèves explications affichées sur la page de résultat pour Q1..Q4."""
    texts = {
        'q1': "Un VPN chiffre la connexion et masque l’adresse IP : pratique sur Wi-Fi publics.",
        'q2': "Un pare-feu filtre le trafic réseau entrant/sortant selon des règles.",
        'q3': "Le cadenas/HTTPS signifie que la page utilise un certificat et un chiffrement.",
        'q4': "Le phishing use de l’urgence ou d’un prétexte pour voler des infos sensibles.",
    }
    return texts.get(q_key, "")

def explication_q5(os_choice):
    if os_choice == 'windows':
        return "Sur Windows, passe par Paramètres > Windows Update pour appliquer les mises à jour de sécurité."
    if os_choice == 'macos':
        return "Sur macOS, utilise Réglages Système > Général > Mise à jour de logiciels."
    if os_choice == 'linux':
        return "Sous Linux, on met à jour via le gestionnaire de paquets (ex. apt, dnf, pacman)."
    return "Sélectionnez votre système d’exploitation pour une correction adaptée."

if __name__ == "__main__":
    # Accès: http://127.0.0.1:5000
    app.run(debug=True)
