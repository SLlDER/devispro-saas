export default function LegalPage({ page, onBack }) {
  const isPrivacy = page === 'privacy';
  const isTerms = page === 'terms';

  return (
    <main className="legal-page">
      <section className="content legal-content">
        <button className="ghost compact" onClick={onBack}>
          Retour
        </button>

        {!isPrivacy && !isTerms && (
          <>
            <h1>Mentions legales</h1>
            <p>Editeur du service: DevisPro.</p>
            <p>Service SaaS de creation de devis et documents commerciaux pour artisans.</p>
            <p>Hebergement: Railway.</p>
            <p>Contact: a completer par l'editeur avant commercialisation publique.</p>
          </>
        )}

        {isPrivacy && (
          <>
            <h1>Politique de confidentialite</h1>
            <p>DevisPro collecte les donnees necessaires au fonctionnement du service: compte utilisateur, clients, devis, factures et abonnement.</p>
            <p>Les donnees sont utilisees pour fournir le service, securiser l'acces, gerer l'abonnement et permettre l'export ou la suppression du compte.</p>
            <p>Les paiements sont traites par Stripe. L'authentification et la base de donnees sont fournies par Supabase.</p>
            <p>L'utilisateur peut exporter ses donnees et demander la suppression de son compte depuis l'application.</p>
          </>
        )}

        {isTerms && (
          <>
            <h1>Conditions d'utilisation</h1>
            <p>DevisPro fournit un outil de preparation de documents commerciaux. L'utilisateur reste responsable de la verification juridique, fiscale et comptable des documents emis.</p>
            <p>Le plan gratuit permet de creer un nombre limite de devis. Le plan Pro debloque l'usage illimite selon les conditions affichees lors du paiement Stripe.</p>
            <p>L'abonnement peut etre gere via le portail client Stripe.</p>
            <p>Avant une commercialisation publique, ces conditions doivent etre relues et adaptees par un professionnel du droit.</p>
          </>
        )}
      </section>
    </main>
  );
}
