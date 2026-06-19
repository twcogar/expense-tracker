var AssetService = (function() {
  function getBannerDataUri() {
    var settings = SettingsService.getAll();
    var fileId = settings.BannerFileId || getScriptProperties().getProperty(CFKH.PROPERTY_BANNER_FILE_ID);
    if (!fileId) return '';
    try {
      var blob = DriveApp.getFileById(fileId).getBlob();
      return 'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes());
    } catch (error) {
      console.log('Banner asset unavailable: ' + error.message);
      return '';
    }
  }

  function setBannerFileId(fileId) {
    var actor = AuthService.requireAdmin();
    if (!fileId) throw new Error('A Google Drive file ID is required.');
    DriveApp.getFileById(fileId).getName();
    getScriptProperties().setProperty(CFKH.PROPERTY_BANNER_FILE_ID, fileId);
    SettingsService.update({ BannerFileId: fileId });
    AuditService.write('BANNER_UPDATE', '', {}, { fileId: fileId }, 'Approved banner source updated by ' + actor.email);
    return { configured: true, fileId: fileId };
  }

  return { getBannerDataUri: getBannerDataUri, setBannerFileId: setBannerFileId };
})();
