#!/usr/bin/env bash
# Zet de gebouwde site (dist/) via SSH in public_html op de cPanel-hosting.
# Op de server is alleen een shell met tar nodig (standaard bij cPanel).
#
# Nodig (omgevingsvariabelen):
#   SSH_HOST       servernaam, bijv. adaptxs.com of de servernaam uit cPanel
#   SSH_USER       cPanel-gebruikersnaam
#   SSH_KEY_FILE   pad naar de private sleutel (zonder wachtwoord)
# Optioneel:
#   SSH_PORT       standaard 22
#   REMOTE_DIR     standaard public_html (ten opzichte van de thuismap)
#   KNOWN_HOSTS    bestand met de vingerafdruk van de server (standaard ~/.ssh/known_hosts)
#   DIST_DIR       standaard dist
set -euo pipefail

: "${SSH_HOST:?SSH_HOST ontbreekt}"
: "${SSH_USER:?SSH_USER ontbreekt}"
: "${SSH_KEY_FILE:?SSH_KEY_FILE ontbreekt}"
SSH_PORT="${SSH_PORT:-22}"
REMOTE_DIR="${REMOTE_DIR:-public_html}"
KNOWN_HOSTS="${KNOWN_HOSTS:-$HOME/.ssh/known_hosts}"
DIST_DIR="${DIST_DIR:-dist}"

for nodig in index.html 404.html .htaccess api/intake.php; do
  [ -e "$DIST_DIR/$nodig" ] || { echo "::error::$DIST_DIR/$nodig ontbreekt. Is de site gebouwd?"; exit 1; }
done

ssh_cmd=(ssh -i "$SSH_KEY_FILE" -p "$SSH_PORT"
  -o BatchMode=yes -o ConnectTimeout=30 -o ServerAliveInterval=15
  -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile="$KNOWN_HOSTS"
  "$SSH_USER@$SSH_HOST")

echo "Verbinding testen met $SSH_USER@$SSH_HOST:$SSH_PORT ..."
"${ssh_cmd[@]}" "test -d \"\$HOME/$REMOTE_DIR\"" || {
  echo "::error::Inloggen gelukt, maar de map ~/$REMOTE_DIR bestaat niet op de server."
  exit 1
}

echo "Bestanden uploaden naar ~/$REMOTE_DIR ..."
# Alleen de inhoud van dist/ (geen '.'-regel), zodat de rechten van public_html zelf niet veranderen.
mapfile -t inhoud < <(cd "$DIST_DIR" && ls -A)
tar -C "$DIST_DIR" -czf - "${inhoud[@]}" \
  | "${ssh_cmd[@]}" "set -e; cd \"\$HOME/$REMOTE_DIR\" && tar -xzf - --no-same-owner"

echo "Oude bestanden in _astro opruimen ..."
# Elke versie krijgt nieuwe bestandsnamen in _astro; verwijder alleen wat niet meer bij deze versie hoort.
(cd "$DIST_DIR/_astro" && ls -1A) \
  | "${ssh_cmd[@]}" "set -e; lijst=\$(mktemp); cat > \"\$lijst\"; cd \"\$HOME/$REMOTE_DIR/_astro\"; \
      for f in * .[!.]*; do [ -f \"\$f\" ] || continue; grep -qxF -- \"\$f\" \"\$lijst\" || rm -f -- \"\$f\"; done; \
      rm -f \"\$lijst\""

echo "Klaar: de site staat in ~/$REMOTE_DIR."
