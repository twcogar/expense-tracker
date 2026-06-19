var CFKH = Object.freeze({
  APP_NAME: 'Content Filtering Knowledge Hub',
  PROPERTY_SPREADSHEET_ID: 'CFKH_SPREADSHEET_ID',
  PROPERTY_BANNER_FILE_ID: 'CFKH_APPROVED_BANNER_FILE_ID',
  PROPERTY_ADMIN_EMAILS: 'CFKH_ADMIN_EMAILS',
  PROPERTY_EDITOR_EMAILS: 'CFKH_EDITOR_EMAILS',
  SHEETS: Object.freeze({
    ARTICLES: 'Articles',
    SETTINGS: 'Settings',
    AUDIT: 'Audit Log'
  }),
  ARTICLE_HEADERS: [
    'ArticleID', 'Type', 'Title', 'System', 'Status', 'Audience', 'Owner',
    'Summary', 'Tags', 'SourceReference', 'ProcedureNotes', 'LastReviewed',
    'NextReview', 'UpdatedAt', 'UpdatedBy', 'CreatedAt', 'CreatedBy',
    'Revision', 'IsArchived'
  ],
  AUDIT_HEADERS: ['Timestamp', 'Actor', 'Action', 'ArticleID', 'Before', 'After', 'Note'],
  DEFAULT_SETTINGS: Object.freeze({
    AppTitle: 'Content Filtering Knowledge Hub',
    ReviewDays: '180',
    AllowedDomain: '',
    RequireAuthenticatedEmail: 'TRUE',
    DefaultAudience: 'Help Desk · School Tech',
    DefaultOwner: 'Content Filtering',
    BannerFileId: ''
  }),
  TYPES: ['SOP', 'Troubleshooting Guide', 'Knowledge Article', 'Governance Standard', 'Known Error', 'Service Request'],
  STATUSES: ['Draft', 'In Review', 'Approved', 'Needs Review', 'Archived'],
  SYSTEMS: ['Lightspeed Filter', 'SmartShield', 'ChromeOS', 'Chrome Browser', 'Admin Console']
});

function getScriptProperties_() {
  return PropertiesService.getScriptProperties();
}
