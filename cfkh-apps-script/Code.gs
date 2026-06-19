function doGet() {
  bootstrapKnowledgeHub_();
  var template = HtmlService.createTemplateFromFile('Index');
  template.initialContext = JSON.stringify(AppService.getInitialContext());
  template.bannerDataUri = AssetService.getBannerDataUri();
  return template.evaluate()
    .setTitle('Content Filtering Knowledge Hub')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function setupKnowledgeHub() {
  return BootstrapService.setup();
}

function setApprovedBannerFileId(fileId) {
  return AssetService.setBannerFileId(fileId);
}

function getInitialContext() { return AppService.getInitialContext(); }
function listArticles(filters) { return ArticleService.list(filters || {}); }
function createArticle(payload) { return ArticleService.create(payload || {}); }
function updateArticle(articleId, patch) { return ArticleService.update(articleId, patch || {}); }
function transitionArticle(articleId, status, note) { return ArticleService.transition(articleId, status, note || ''); }
function archiveArticle(articleId, note) { return ArticleService.archive(articleId, note || ''); }
function getReviewQueue() { return ArticleService.getReviewQueue(); }
function getSettings() { return SettingsService.getClientSettings(); }
function updateSettings(patch) { return SettingsService.update(patch || {}); }
function getAuditTrail(articleId) { return AuditService.list(articleId || ''); }
