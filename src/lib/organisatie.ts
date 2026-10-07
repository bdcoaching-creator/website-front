import site from "../data/site.json";

/** Gegevens van AdaptXS voor structured data (schema.org). Alleen echte, aangeleverde gegevens. */
export function organisatieSchema(basis: URL | undefined, diensten: { titel: string; url: string }[] = []) {
  const url = basis?.toString();
  return {
    "@type": "ProfessionalService",
    "@id": url ? `${url}#organisatie` : undefined,
    name: site.bedrijfsnaam,
    description:
      "AdaptXS is een team met kennis van werk, wetgeving en mensen. Arbeidsdeskundige en jobcoach voor werkgevers en medewerkers: jobcoaching, re-integratiebegeleiding, arbeidsdeskundig onderzoek en coaching voor ondernemers.",
    url,
    email: site.email,
    telephone: site.telefoon,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.adres.straat,
      postalCode: site.adres.postcode,
      addressLocality: site.adres.plaats,
      addressCountry: "NL",
    },
    areaServed: [
      { "@type": "AdministrativeArea", name: "Zuid-Holland" },
      { "@type": "Country", name: "Nederland" },
    ],
    knowsAbout: ["Arbeidsdeskundig onderzoek", "Jobcoaching", "Re-integratiebegeleiding", "Coaching voor ondernemers"],
    ...(diensten.length && {
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Diensten",
        itemListElement: diensten.map((d) => ({
          "@type": "Offer",
          itemOffered: { "@type": "Service", name: d.titel, url: d.url },
        })),
      },
    }),
  };
}
