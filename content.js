/* ============================================================================
   PE BOOTH · "CONNECT YOUR VOICE" — CONTENT & RULES
   Lines marked  // UI COPY  are interface wording that still needs Stellar / BI approval.
   The consent text is copied from the brief (Consent for PE landing page).
   ========================================================================== */
window.PE_CONTENT = {
  event: 'Value Innovation Summit · Cairo, 13–14 Nov', // shown small on the start screen; saved with every record

  rules: {
    idleResetSeconds: 75,      // no touch for this long on any step → back to start; unsaved data is discarded
    thankYouSeconds: 9,        // thank-you screen, then back to start
    requireSignature: true,    // the consent says "by signing below": a finger signature is required before continuing
    staffPin: '2026',          // PIN for the staff panel (hold the top-left corner 2 seconds)
    keyboard: 'builtin',       // 'builtin' = on-screen keyboard (touch LCD); 'system' = the device's own keyboard (tablet)
  },

  // Optional online backup (each record is also POSTed here as JSON). Leave empty to keep data on this device only.
  sync: { url: '' },

  start: {
    cta: 'Choose Where to Connect Your Voice',  // from the brief
    button: 'Tap to start',                     // UI COPY
  },

  consent: {
    title: 'Your consent',                      // UI COPY
    paragraphs: [
      'Boehringer Ingelheim would like to make and use of your personal data at value innovation summit held in Cairo, 13-14 Nov.',
      'Boehringer can use your personal data, your name, email address, phone number, job title/position, company name to share with concerned parties for purposes of collaboration between patient organizations and market access stakeholders.',
      'Boehringer as the controller of personal data can forward the Personal Data to other affiliates and/or group companies of Boehringer or our service providers or third parties that act under its supervision, located in any part of the world in connection with the above or for archiving. You can request access to your personal data at any time and can request to receive this data in a common and machine-readable format. In justified cases, you may also request the deletion, correction or limitation of the processing of your data. In these cases, please contact the data protection officer. In case you request deletion of Personal Data, you may no longer be able to use all features and functions of our services. Please note that we may be required to keep some of your Personal Data for legal reasons, for instance to comply with statutory retention periods. In such cases, we will mark your Personal Data accordingly to make sure that it is not used for any other purpose than complying with the retention requirement. You can withdraw your consent at any time with future effect. In this case, please contact the data protection officer METAdataprotection.AE@boehringer-ingelheim.com.',
      'A copy of the Boehringer privacy notice can be obtained at Privacy Notice | Boehringer Ingelheim (boehringer-ingelheim.com/mea/data-privacy).',
    ],
    declarationTitle: 'Declaration:',
    declaration: [
      'I consent to this use of my personal data by signing below.',
      'I hereby release and discharge Boehringer, and its agents, representatives and assignees from any and all claims and demands arising out of or in connection with the use of my personal data, including any and all claims for invasion of privacy, right of publicity, misappropriation or misuse of image, and/or defamation. I have read the foregoing and fully understand its contents. This release shall be binding upon me, my heirs, legal representatives, and assigns.',
    ],
    check: 'I have read the consent and I agree',  // UI COPY
    sign: 'Sign here with your finger',          // UI COPY
    clear: 'Clear',                              // UI COPY
    agree: 'I agree',                            // UI COPY
    back: 'Back',                                // UI COPY
  },

  details: {
    title: 'Your details',                       // UI COPY
    name: 'Name', email: 'Email', phone: 'Phone number',
    required: 'required', optional: 'optional',  // UI COPY
    errName: 'Please enter your name',           // UI COPY
    errEmail: 'Please enter a valid email',      // UI COPY
    next: 'Next',                                // UI COPY
  },

  choose: {
    country: 'Choose Your Country',              // from the demo
    countryPlaceholder: 'Select a country',      // UI COPY
    search: 'Search',                            // UI COPY
    where: 'Choose Where To Connect Your Voice', // from the demo
    options: ['CRM', 'Stroke', 'ILD', 'Others'], // from the brief
    otherPlaceholder: 'Type your choice',        // UI COPY
    errCountry: 'Please choose your country',    // UI COPY
    errChoice: 'Please choose one',              // UI COPY
    errOther: 'Please type your choice',         // UI COPY
    submit: 'Connect my voice',                  // UI COPY
  },

  thanks: {
    title: 'Thank you, {name}',                  // UI COPY
    line: 'Your voice is connected.',            // UI COPY
  },

  // Shown first in the country list.
  topCountries: ['Egypt', 'Saudi Arabia', 'United Arab Emirates', 'Kuwait', 'Qatar', 'Bahrain', 'Oman', 'Jordan', 'Lebanon', 'Iraq', 'Morocco', 'Algeria', 'Tunisia', 'Libya', 'Sudan', 'Kenya', 'Nigeria', 'South Africa', 'Pakistan', 'Türkiye'],
  countries: ['Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Côte d’Ivoire', 'Croatia', 'Cuba', 'Cyprus', 'Czechia', 'Democratic Republic of the Congo', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Hong Kong', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kosovo', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'São Tomé and Príncipe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Türkiye', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'],
};
