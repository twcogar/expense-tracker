var AppService = (function() {
  function getInitialContext() {
    BootstrapService.setup();
    var user = AuthService.requireViewer();
    var articles = ArticleService.list({});
    var reviewQueue = articles.filter(function(article) {
      return article.status === 'In Review' || article.status === 'Needs Review';
    });
    return {
      user: user,
      settings: SettingsService.getClientSettings(),
      taxonomy: {
        types: CFKH.TYPES,
        statuses: CFKH.STATUSES,
        systems: CFKH.SYSTEMS
      },
      articles: articles,
      reviewQueue: reviewQueue,
      generatedAt: new Date().toISOString()
    };
  }

  return { getInitialContext: getInitialContext };
})();
