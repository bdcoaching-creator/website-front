#!/usr/bin/env bash
# Zet de gebouwde site (dist/) via SSH in public_html op de cPanel-hosting.
# - Met shell-toegang: in één keer via tar (snel).
# - Zonder shell-toegang ("Shell access is not enabled"): bestand voor bestand via SFTP.
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
#   UPLOAD_MODE    auto (standaard), shell of sftp
set -euo pipefail

: "${SSH_HOST:?SSH_HOST ontbreekt}"
: "${SSH_USER:?SSH_USER ontbreekt}"
: "${SSH_KEY_FILE:?SSH_KEY_FILE ontbreekt}"
SSH_PORT="${SSH_PORT:-22}"
REMOTE_DIR="${REMOTE_DIR:-public_html}"
KNOWN_HOSTS="${KNOWN_HOSTS:-$HOME/.ssh/known_hosts}"
DIST_DIR="${DIST_DIR:-dist}"
UPLOAD_MODE="${UPLOAD_MODE:-auto}"

for nodig in index.html 404.html .htaccess api/intake.php; do
  [ -e "$DIST_DIR/$nodig" ] || { echo "::error::$DIST_DIR/$nodig ontbreekt. Is de site gebouwd?"; exit 1; }
done

opties=(-i "$SSH_KEY_FILE" -o BatchMode=yes -o ConnectTimeout=30 -o ServerAliveInterval=15
  -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile="$KNOWN_HOSTS")
ssh_cmd=(ssh "${opties[@]}" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST")
sftp_cmd=(sftp "${opties[@]}" -P "$SSH_PORT" -b - "$SSH_USER@$SSH_HOST")

login_mislukt() {
  echo "::error::Inloggen via SSH mislukt (zie de regel hierboven). Bij 'Permission denied': controleer SSH_USER" \
    "(de cPanel-gebruikersnaam, niet je e-mailadres) en of de sleutel in cPanel op 'authorized' staat."
  exit 1
}

# ---------- Met shell: tar ----------
upload_shell() {
  echo "Bestanden uploaden naar ~/$REMOTE_DIR (shell) ..."
  # Alleen de inhoud van dist/ (geen '.'-regel), zodat de rechten van public_html zelf niet veranderen.
  local inhoud
  mapfile -t inhoud < <(cd "$DIST_DIR" && ls -A)
  local uit
  uit=$(tar -C "$DIST_DIR" -czf - "${inhoud[@]}" \
    | "${ssh_cmd[@]}" "cd \"\$HOME/$REMOTE_DIR\" && tar -xzf - --no-same-owner && echo ADAPTXS-UPLOAD-OK") || true
  [[ "$uit" == *ADAPTXS-UPLOAD-OK* ]] || { echo "$uit"; echo "::error::Uitpakken op de server is mislukt."; exit 1; }

  echo "Oude bestanden in _astro opruimen ..."
  # Elke versie krijgt nieuwe bestandsnamen in _astro; verwijder alleen wat niet meer bij deze versie hoort.
  uit=$( (cd "$DIST_DIR/_astro" && ls -1A) \
    | "${ssh_cmd[@]}" "lijst=\$(mktemp) && cat > \"\$lijst\" && cd \"\$HOME/$REMOTE_DIR/_astro\" && \
        for f in * .[!.]*; do [ -f \"\$f\" ] || continue; grep -qxF -- \"\$f\" \"\$lijst\" || rm -f -- \"\$f\"; done; \
        rm -f \"\$lijst\"; echo ADAPTXS-OPRUIMEN-OK") || true
  [[ "$uit" == *ADAPTXS-OPRUIMEN-OK* ]] || { echo "$uit"; echo "::error::Opruimen van _astro is mislukt."; exit 1; }
}

# ---------- Zonder shell: SFTP ----------
sftp_quote() { printf '"%s"' "${1//\"/\\\"}"; }

upload_sftp() {
  echo "Bestanden uploaden naar ~/$REMOTE_DIR (SFTP) ..."
  local batch
  batch=$(mktemp)
  {
    echo "cd $(sftp_quote "$REMOTE_DIR")"
    # Mappen eerst ('-' = geen fout als de map al bestaat), daarna elk bestand.
    (cd "$DIST_DIR" && find . -mindepth 1 -type d | sed 's|^\./||' | sort) \
      | while IFS= read -r d; do echo "-mkdir $(sftp_quote "$d")"; done
    (cd "$DIST_DIR" && find . -type f | sed 's|^\./||' | sort) \
      | while IFS= read -r f; do echo "put $(sftp_quote "$DIST_DIR/$f") $(sftp_quote "$f")"; done
  } > "$batch"
  "${sftp_cmd[@]}" < "$batch" > /dev/null || { rm -f "$batch"; echo "::error::Uploaden via SFTP is mislukt."; exit 1; }
  rm -f "$batch"

  echo "Oude bestanden in _astro opruimen ..."
  local op_server
  op_server=$(printf 'cd %s\nls -1a\n' "$(sftp_quote "$REMOTE_DIR/_astro")" | "${sftp_cmd[@]}" 2> /dev/null \
    | grep -v '^sftp>' | sed 's|.*/||' | grep -vxE '\.|\.\.' || true)
  local weg
  weg=$(comm -23 <(printf '%s\n' "$op_server" | sed '/^$/d' | sort) <(cd "$DIST_DIR/_astro" && ls -1A | sort))
  if [ -n "$weg" ]; then
    {
      echo "cd $(sftp_quote "$REMOTE_DIR/_astro")"
      printf '%s\n' "$weg" | while IFS= read -r f; do echo "-rm $(sftp_quote "$f")"; done
    } | "${sftp_cmd[@]}" > /dev/null || echo "::warning::Opruimen van oude bestanden in _astro is niet gelukt (niet erg)."
  fi
}

# ---------- Verbinding testen en methode kiezen ----------
echo "Verbinding testen met $SSH_USER@$SSH_HOST:$SSH_PORT ..."
set +e
test_uit=$("${ssh_cmd[@]}" "echo ADAPTXS-SHELL-OK; test -d \"\$HOME/$REMOTE_DIR\" && echo ADAPTXS-MAP-OK" 2>&1)
status=$?
set -e
[ "$status" -eq 255 ] && { echo "$test_uit"; login_mislukt; }

methode="$UPLOAD_MODE"
if [ "$methode" = auto ]; then
  if [[ "$test_uit" == *ADAPTXS-SHELL-OK* ]]; then
    methode=shell
  else
    echo "Geen shell-toegang op de server (melding: $(echo "$test_uit" | head -n 1)). Overstappen op SFTP."
    methode=sftp
  fi
fi

if [ "$methode" = shell ]; then
  [[ "$test_uit" == *ADAPTXS-MAP-OK* ]] || { echo "::error::Inloggen gelukt, maar de map ~/$REMOTE_DIR bestaat niet op de server."; exit 1; }
  upload_shell
else
  # Controleren of SFTP werkt en de map bestaat.
  if ! printf 'cd %s\n' "$(sftp_quote "$REMOTE_DIR")" | "${sftp_cmd[@]}" > /dev/null 2>&1; then
    echo "::error::Ook SFTP werkt niet, of de map ~/$REMOTE_DIR bestaat niet. Zet bij GoDaddy SSH-toegang aan" \
      "(My Hosting → Settings → SSH Access) en wacht tot cPanel 'Terminal' toont, of vraag GoDaddy om shell-toegang."
    exit 1
  fi
  upload_sftp
fi

# ---------- Controle achteraf ----------
echo "Controleren of index.html op de server staat ..."
if ! printf 'cd %s\nls index.html\n' "$(sftp_quote "$REMOTE_DIR")" | "${sftp_cmd[@]}" > /dev/null 2>&1; then
  if ! "${ssh_cmd[@]}" "test -f \"\$HOME/$REMOTE_DIR/index.html\" && echo ADAPTXS-CHECK-OK" 2> /dev/null | grep -q ADAPTXS-CHECK-OK; then
    echo "::error::Na het uploaden staat index.html niet in ~/$REMOTE_DIR. Er is iets misgegaan."
    exit 1
  fi
fi
echo "Klaar: de site staat in ~/$REMOTE_DIR (methode: $methode)."
