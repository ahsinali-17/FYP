import React from 'react';
import { Helmet } from 'react-helmet-async';

const MetaData = ({ title, description }) => {
  const siteName = "ScreenSense AI";
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const defaultDesc = "Enterprise AI inspection and batch processing dashboard.";

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description || defaultDesc} />

      {/* Open Graph (Facebook, LinkedIn, Slack) */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || defaultDesc} />
      <meta property="og:type" content="website" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description || defaultDesc} />
    </Helmet>
  );
};

export default MetaData;