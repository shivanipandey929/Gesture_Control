import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const NotFound: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6 shadow-soft">
        <Compass className="w-10 h-10 animate-spin" />
      </div>

      <h1 className="font-heading font-extrabold text-5xl sm:text-7xl text-foreground mb-2">
        {t('notFound.code', '404')}
      </h1>
      <h2 className="font-heading font-bold text-xl sm:text-2xl text-muted mb-4">
        {t('notFound.title', 'Destination Not Found')}
      </h2>
      <p className="text-sm text-muted max-w-md mb-8">
        {t('notFound.desc', 'The requested spatial interface route does not exist. Use the gesture control nav to return safely home.')}
      </p>

      <Link
        to="/"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-heading font-semibold text-sm transition-colors shadow-card"
      >
        <Home className="w-4 h-4" />
        <span>{t('notFound.returnHome', 'Return to Home')}</span>
      </Link>
    </div>
  );
};

export default NotFound;
