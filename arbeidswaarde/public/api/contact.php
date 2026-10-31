<?php
/**
 * Verwerking van het contactformulier van Arbeidswaarde (PHP 7.4 en hoger, hosting in de EU).
 *
 * Privacy by design:
 * - er wordt niets opgeslagen: het bericht gaat alleen als e-mail naar MAIL_TO;
 * - er wordt niets gelogd met persoonsgegevens;
 * - alleen de velden uit het formulier worden geaccepteerd, met harde lengtegrenzen;
 * - tegen misbruik onthouden we hooguit een uur een gehashte code van het IP-adres.
 *
 * Verstuurt met de mailfunctie van de hosting (mail()). "Verzonden" volgt alleen als mail() slaagt.
 */

// ===== Instellingen =====
// [NOG TE CONTROLEREN] Nog leeg: de eigenaar levert het adres aan bij het definitief maken.
// Zolang MAIL_TO leeg is, verstuurt het formulier niets en meldt het dat eerlijk.
const MAIL_TO = '';
// Afzender van de mail. Moet een adres op het eigen domein zijn (anders belandt de mail in spam).
const MAIL_FROM = '';
// Maximaal aantal berichten per bezoeker per uur.
const MAX_PER_UUR = 5;
// ========================

const ONDERWERPEN = ['' => 'Bericht via de website', 'afspraak' => 'Verzoek om een afspraak'];

function fout_algemeen(): string
{
    $tekst = 'Het versturen is niet gelukt. Probeer het later opnieuw';
    return MAIL_TO !== '' ? $tekst . ' of mail naar ' . MAIL_TO . '.' : $tekst . '.';
}

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

/**
 * Stuurt het antwoord. Met JavaScript (Accept: application/json) een JSON-object,
 * zonder JavaScript een doorverwijzing (succes) of een eenvoudige foutpagina.
 */
function antwoord(int $status, ?string $fout = null, array $velden = []): void
{
    $wilJson = strpos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false;
    http_response_code($status);
    header('Cache-Control: no-store');
    header('X-Robots-Tag: noindex');
    if ($wilJson) {
        header('Content-Type: application/json; charset=utf-8');
        $data = $fout === null ? ['ok' => true] : ['ok' => false, 'fout' => $fout, 'velden' => (object) $velden];
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }
    if ($fout === null) {
        http_response_code(303);
        header('Location: /contact/verzonden/');
        exit;
    }
    header('Content-Type: text/html; charset=utf-8');
    $regels = array_map(function ($t) { return '<li>' . htmlspecialchars($t, ENT_QUOTES, 'UTF-8') . '</li>'; }, array_values($velden));
    $lijst = $regels ? '<ul>' . implode('', $regels) . '</ul>' : '';
    $melding = htmlspecialchars($fout, ENT_QUOTES, 'UTF-8');
    echo "<!doctype html><html lang=\"nl\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">"
        . "<meta name=\"robots\" content=\"noindex\"><title>Bericht niet verstuurd · Arbeidswaarde</title></head>"
        . "<body style=\"font-family:system-ui,sans-serif;max-width:36rem;margin:3rem auto;padding:0 1rem;line-height:1.5;color:#2F3033;background:#F7F4EF\">"
        . "<h1 style=\"color:#0E3A2F\">Uw bericht is niet verstuurd</h1><p>{$melding}</p>{$lijst}"
        . "<p><a style=\"color:#0E3A2F\" href=\"/contact/\">Terug naar het contactformulier</a></p>"
        . "</body></html>";
    exit;
}

/** Eenvoudige limiet per bezoeker. Lukt opslaan niet, dan gaat het formulier gewoon door. */
function teVaak(): bool
{
    $map = rtrim(sys_get_temp_dir(), '/\\') . DIRECTORY_SEPARATOR . 'arbeidswaarde-contact';
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
// Alleen berichten vanaf de eigen website.
$herkomst = $_SERVER['HTTP_ORIGIN'] ?? '';
$eigenHost = preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'] ?? '');
if ($herkomst !== '' && preg_replace('/:\d+$/', '', (string) parse_url($herkomst, PHP_URL_HOST)) !== $eigenHost) {
    antwoord(403, 'Gebruik het formulier op de website.');
}

// Honeypot: bots vullen dit verborgen veld in. Er wordt niets verstuurd; de bot krijgt een neutraal antwoord.
// De naam is bewust geen herkenbaar veld (zoals "website"), zodat de automatische invulfunctie van
// een browser het niet vult en een echte bezoeker nooit ten onrechte "Verzonden" ziet.
if (regel($_POST['hp_controle'] ?? '', 200) !== '') {
    antwoord(200);
}

$a = [
    'naam' => regel($_POST['naam'] ?? '', 100),
    'telefoon' => regel($_POST['telefoon'] ?? '', 30),
    'email' => regel($_POST['email'] ?? '', 150),
    'bericht' => tekstvak($_POST['bericht'] ?? '', 2000),
    'onderwerp' => regel($_POST['onderwerp'] ?? '', 20),
];

$velden = [];
if ($a['naam'] === '') $velden['naam'] = 'Vul uw naam in.';
if ($a['email'] === '') $velden['email'] = 'Vul uw e-mailadres in.';
elseif (!filter_var($a['email'], FILTER_VALIDATE_EMAIL)) $velden['email'] = 'Vul een geldig e-mailadres in, bijvoorbeeld naam@bedrijf.nl.';
if ($a['telefoon'] !== '' && !preg_match('/^\+?[0-9 ()\-]{8,20}$/', $a['telefoon'])) {
    $velden['telefoon'] = 'Vul een geldig telefoonnummer in, of laat dit veld leeg.';
}
if ($a['bericht'] === '') $velden['bericht'] = 'Schrijf een bericht.';
if ($velden) {
    antwoord(422, 'Controleer de gemarkeerde velden.', $velden);
}
if (!isset(ONDERWERPEN[$a['onderwerp']])) $a['onderwerp'] = '';

if (MAIL_TO === '' || MAIL_FROM === '') {
    antwoord(503, 'Het formulier is nog niet ingesteld. Uw bericht is niet verstuurd.');
}
if (teVaak()) {
    antwoord(429, 'U heeft al een paar berichten verstuurd. Probeer het over een uur opnieuw' . (MAIL_TO !== '' ? ' of mail naar ' . MAIL_TO : '') . '.');
}

$regels = [
    ONDERWERPEN[$a['onderwerp']],
    '',
    'Naam:      ' . $a['naam'],
    'E-mail:    ' . $a['email'],
    'Telefoon:  ' . ($a['telefoon'] !== '' ? $a['telefoon'] : '-'),
    '',
    'Bericht:',
    $a['bericht'],
    '',
    '-- ',
    'Bewaar dit bericht niet langer dan nodig (zie privacyverklaring).',
];

$onderwerp = koptekst(mb_substr_veilig(ONDERWERPEN[$a['onderwerp']] . ': ' . $a['naam'], 150));
$tekst = quoted_printable_encode(implode("\r\n", str_replace("\n", "\r\n", $regels)));
$koppen = implode("\r\n", [
    'From: ' . koptekst('Website Arbeidswaarde') . ' <' . MAIL_FROM . '>',
    'Reply-To: ' . $a['email'],
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: quoted-printable',
]);

if (!@mail(MAIL_TO, $onderwerp, $tekst, $koppen, '-f' . MAIL_FROM)) {
    antwoord(500, fout_algemeen());
}
antwoord(200);
