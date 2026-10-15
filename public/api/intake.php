<?php
/**
 * Verwerking van het intakeformulier (PHP, voor hosting met cPanel).
 *
 * Privacy by design:
 * - er wordt niets opgeslagen: het bericht gaat alleen als e-mail naar MAIL_TO;
 * - er wordt niets gelogd met persoonsgegevens;
 * - alleen de velden uit het formulier worden geaccepteerd, met harde lengtegrenzen;
 * - tegen misbruik onthouden we hooguit een uur een gehashte code van het IP-adres.
 *
 * Werkt met PHP 7.4 en hoger. Verstuurt met de mailfunctie van de hosting (mail()).
 */

// ===== Instellingen =====
// Adres waar aanvragen binnenkomen.
const MAIL_TO = 'info@adaptxs.com';
// Afzender van de mail. Moet een adres op je eigen domein zijn.
const MAIL_FROM = 'info@adaptxs.com';
// Maximaal aantal aanvragen per bezoeker per uur.
const MAX_PER_UUR = 5;
// ========================

const DIENSTEN = [
    'jobcoaching' => 'Jobcoaching',
    're-integratie' => 'Re-integratie',
    'arbeidsdeskundig-onderzoek' => 'Arbeidsdeskundig onderzoek',
    'coaching-voor-ondernemers' => 'Coaching voor ondernemers',
    'anders' => 'Iets anders / weet ik nog niet',
];
const ROLLEN = [
    'werkgever' => 'Werkgever',
    'medewerker' => 'Medewerker',
    'ondernemer' => "Ondernemer of zzp'er",
];
const FOUT_ALGEMEEN = 'Er ging iets mis bij het versturen. Probeer het later opnieuw of mail naar info@adaptxs.com.';

/** Eén regel tekst: zonder stuurtekens of regeleinden (voorkomt header-injectie). */
function regel($waarde, int $max): string
{
    $tekst = is_string($waarde) ? $waarde : '';
    $tekst = preg_replace('/[\x00-\x1F\x7F]/u', ' ', $tekst) ?? '';
    return mb_substr_veilig(trim($tekst), $max);
}

/** Meerdere regels tekst (het bericht): regeleinden blijven, andere stuurtekens niet. */
function tekstvak($waarde, int $max): string
{
    $tekst = is_string($waarde) ? $waarde : '';
    $tekst = str_replace("\r\n", "\n", $tekst);
    $tekst = preg_replace('/[\x00-\x08\x0B-\x1F\x7F]/u', '', $tekst) ?? '';
    return mb_substr_veilig(trim($tekst), $max);
}

/** Inkorten op tekens (niet bytes), ook als de mbstring-extensie ontbreekt. */
function mb_substr_veilig(string $tekst, int $max): string
{
    if (function_exists('mb_substr')) return mb_substr($tekst, 0, $max, 'UTF-8');
    preg_match('/^.{0,' . $max . '}/us', $tekst, $m);
    return $m[0] ?? '';
}

function antwoord(int $status, ?string $fout = null): void
{
    $wilJson = strpos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false;
    http_response_code($status);
    header('Cache-Control: no-store');
    header('X-Robots-Tag: noindex');
    if ($wilJson) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($fout === null ? ['ok' => true] : ['ok' => false, 'fout' => $fout], JSON_UNESCAPED_UNICODE);
        exit;
    }
    // Zonder JavaScript: bij succes naar de bedankpagina, bij een fout een eenvoudige melding.
    if ($fout === null) {
        http_response_code(303);
        header('Location: /bedankt');
        exit;
    }
    header('Content-Type: text/html; charset=utf-8');
    $melding = htmlspecialchars($fout, ENT_QUOTES, 'UTF-8');
    echo "<!doctype html><html lang=\"nl\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">"
        . "<meta name=\"robots\" content=\"noindex\"><title>Aanvraag niet verstuurd | AdaptXS</title></head>"
        . "<body style=\"font-family:system-ui,sans-serif;max-width:36rem;margin:3rem auto;padding:0 1rem;line-height:1.5\">"
        . "<h1>Je aanvraag is niet verstuurd</h1><p>{$melding}</p>"
        . "<p><a href=\"javascript:history.back()\">Terug naar het formulier</a> of <a href=\"/contact\">naar de contactpagina</a>.</p>"
        . "</body></html>";
    exit;
}

/** Eenvoudige limiet per bezoeker. Lukt opslaan niet, dan gaat het formulier gewoon door. */
function teVaak(): bool
{
    $map = rtrim(sys_get_temp_dir(), '/\\') . DIRECTORY_SEPARATOR . 'adaptxs-intake';
    if (!is_dir($map) && !@mkdir($map, 0700, true)) return false;
    if (!is_writable($map)) return false;

    $zoutBestand = $map . DIRECTORY_SEPARATOR . 'zout';
    $zout = @file_get_contents($zoutBestand);
    if (!$zout) {
        $zout = bin2hex(random_bytes(32));
        if (@file_put_contents($zoutBestand, $zout, LOCK_EX) === false) return false;
    }

    $nu = time();
    // Oude sporen opruimen: niets wordt langer dan een uur bewaard.
    foreach (glob($map . DIRECTORY_SEPARATOR . 'ip-*') ?: [] as $oud) {
        if (@filemtime($oud) < $nu - 3600) @unlink($oud);
    }

    $code = hash_hmac('sha256', $_SERVER['REMOTE_ADDR'] ?? '', $zout);
    $bestand = $map . DIRECTORY_SEPARATOR . 'ip-' . $code;
    $tijden = array_filter(
        array_map('intval', explode("\n", (string) @file_get_contents($bestand))),
        function ($t) use ($nu) { return $t > $nu - 3600; }
    );
    if (count($tijden) >= MAX_PER_UUR) return true;
    $tijden[] = $nu;
    @file_put_contents($bestand, implode("\n", $tijden), LOCK_EX);
    return false;
}

function koptekst(string $tekst): string
{
    return '=?UTF-8?B?' . base64_encode($tekst) . '?=';
}

// ----- Verwerking -----

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    antwoord(405, 'Gebruik het formulier op de website.');
}
if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 20000) {
    antwoord(413, 'Het bericht is te groot.');
}
// Alleen aanvragen vanaf de eigen website.
$herkomst = $_SERVER['HTTP_ORIGIN'] ?? '';
$eigenHost = preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'] ?? '');
if ($herkomst !== '' && parse_url($herkomst, PHP_URL_HOST) !== $eigenHost) {
    antwoord(403, 'Gebruik het formulier op de website.');
}

// Honeypot: bots vullen dit verborgen veld in. Doe alsof het gelukt is.
if (regel($_POST['website'] ?? '', 200) !== '') {
    antwoord(200);
}

$a = [
    'rol' => regel($_POST['rol'] ?? '', 20),
    'naam' => regel($_POST['naam'] ?? '', 100),
    'email' => regel($_POST['email'] ?? '', 150),
    'telefoon' => regel($_POST['telefoon'] ?? '', 30),
    'dienst' => regel($_POST['dienst'] ?? '', 40),
    'organisatie' => regel($_POST['organisatie'] ?? '', 120),
    'medewerkers' => regel($_POST['medewerkers'] ?? '', 20),
    'postcode' => regel($_POST['postcode'] ?? '', 40),
    'bericht' => tekstvak($_POST['bericht'] ?? '', 500),
];

if ($a['naam'] === '') antwoord(400, 'Vul je naam in.');
if (!filter_var($a['email'], FILTER_VALIDATE_EMAIL)) antwoord(400, 'Vul een geldig e-mailadres in.');
if (!isset(DIENSTEN[$a['dienst']])) antwoord(400, 'Kies een dienst.');
if (!isset(ROLLEN[$a['rol']])) $a['rol'] = '';
if ($a['rol'] !== 'werkgever') {
    $a['organisatie'] = '';
    $a['medewerkers'] = '';
}
if ($a['dienst'] !== 'arbeidsdeskundig-onderzoek') $a['postcode'] = '';

if (teVaak()) {
    antwoord(429, 'Je hebt al een paar aanvragen verstuurd. Probeer het over een uur opnieuw of mail naar info@adaptxs.com.');
}

$regels = [
    'Nieuwe aanvraag via de website',
    '',
    'Dienst:       ' . DIENSTEN[$a['dienst']],
    'Rol:          ' . ($a['rol'] !== '' ? ROLLEN[$a['rol']] : '-'),
    'Naam:         ' . $a['naam'],
    'E-mail:       ' . $a['email'],
    'Telefoon:     ' . ($a['telefoon'] !== '' ? $a['telefoon'] : '-'),
];
if ($a['rol'] === 'werkgever') {
    $regels[] = 'Organisatie:  ' . ($a['organisatie'] !== '' ? $a['organisatie'] : '-');
    $regels[] = 'Medewerkers:  ' . ($a['medewerkers'] !== '' ? $a['medewerkers'] : '-');
}
if ($a['dienst'] === 'arbeidsdeskundig-onderzoek') {
    $regels[] = 'Werkplek:     ' . ($a['postcode'] !== '' ? $a['postcode'] : '-');
}
array_push($regels, '', 'Bericht:', $a['bericht'] !== '' ? $a['bericht'] : '-', '', '—',
    'Bewaar deze aanvraag niet langer dan nodig (zie privacyverklaring).');

$onderwerp = koptekst(mb_substr_veilig('Aanvraag ' . DIENSTEN[$a['dienst']] . ': ' . $a['naam'], 150));
$tekst = quoted_printable_encode(implode("\r\n", str_replace("\n", "\r\n", $regels)));
$koppen = implode("\r\n", [
    'From: ' . koptekst('Website AdaptXS') . ' <' . MAIL_FROM . '>',
    'Reply-To: ' . $a['email'],
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: quoted-printable',
]);

$verstuurd = @mail(MAIL_TO, $onderwerp, $tekst, $koppen, '-f' . MAIL_FROM);
if (!$verstuurd) {
    // Sommige servers staan het eigen afzenderadres (-f) niet toe.
    $verstuurd = @mail(MAIL_TO, $onderwerp, $tekst, $koppen);
}
if (!$verstuurd) {
    error_log('AdaptXS intake: versturen mislukt (mail() gaf false)');
    antwoord(502, FOUT_ALGEMEEN);
}
antwoord(200);
